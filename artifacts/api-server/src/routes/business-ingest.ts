/**
 * POST /api/businesses/ingest
 *
 * Governed business ingestion pipeline.
 * Accepts query, URL, or image input.
 * Never blind-inserts — deduplicates, evidence-scores, and gates on 70/100.
 * Ownership claims require explicit source evidence.
 */

import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import { logger } from "../lib/logger";
import { dedupeKey, normalizeText, tokenSimilarity, sameLocation, evidenceScore } from "../lib/business-dedup";

const router = Router();

const OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "";
const PLACES_KEY = process.env.GOOGLE_PLACES_SERVER_KEY ?? "";

// ── Types ─────────────────────────────────────────────────────────────────────

type Evidence = {
  sourceType: "official_website" | "web_search" | "maps" | "directory" | "image" | "user_input";
  sourceUrl?: string;
  field: string;
  value: string;
  retrievedAt: string;
  confidence: number;
};

type Candidate = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  website?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  subcategory?: string;
  ownershipAttributes?: string[];
  sourceProvider: string;
  sourceRecordId?: string;
  sourceUrl?: string;
  evidence: Evidence[];
};

type IngestInput =
  | { kind: "query"; text: string }
  | { kind: "url"; url: string }
  | { kind: "image"; fileUrl: string };

// ── Google Places search adapter ──────────────────────────────────────────────

async function searchGooglePlaces(query: string, city?: string, state?: string): Promise<Candidate[]> {
  if (!PLACES_KEY) return [];
  const q = [query, city, state].filter(Boolean).join(", ");
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${PLACES_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json() as { results?: Record<string, unknown>[] };
    return (data.results ?? []).slice(0, 10).map((r: Record<string, unknown>) => {
      const geometry = r.geometry as { location?: { lat: number; lng: number } } | undefined;
      const lat = geometry?.location?.lat;
      const lng = geometry?.location?.lng;
      const addr = String(r.formatted_address ?? "");
      const parts = addr.split(",").map((s: string) => s.trim());
      return {
        name: String(r.name ?? ""),
        address: parts[0] ?? "",
        city: city ?? parts[1] ?? "",
        state: state ?? parts[2]?.split(" ")[0] ?? "",
        postalCode: parts[2]?.split(" ")[1] ?? "",
        latitude: lat,
        longitude: lng,
        category: (r.types as string[] | undefined)?.[0] ?? "",
        sourceProvider: "google-places",
        sourceRecordId: String(r.place_id ?? ""),
        sourceUrl: `https://maps.google.com/?place_id=${r.place_id}`,
        ownershipAttributes: [],
        evidence: [{
          sourceType: "maps",
          sourceUrl: `https://maps.google.com/?place_id=${r.place_id}`,
          field: "business_result",
          value: JSON.stringify({ name: r.name, address: r.formatted_address }),
          retrievedAt: new Date().toISOString(),
          confidence: 0.85,
        }],
      } satisfies Candidate;
    });
  } catch {
    return [];
  }
}

// ── OpenAI vision adapter ─────────────────────────────────────────────────────

async function extractFromImage(fileUrl: string): Promise<Candidate[]> {
  if (!OPENAI_KEY) return [];
  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract every visible business from this image. For each one, return JSON with fields: name, address, city, state, phone, website, category. If ownership is explicitly stated in the image (e.g. a sign saying "Black-owned"), include ownershipClaims as an array. Do not infer ownership from anything other than explicit text. Respond with a JSON array only.`,
            },
            { type: "image_url", image_url: { url: fileUrl } },
          ],
        }],
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "[]";
    const json = JSON.parse(text.replace(/```json|```/g, "").trim()) as Record<string, unknown>[];
    return json.map((r) => ({
      name: String(r.name ?? ""),
      address: String(r.address ?? ""),
      city: String(r.city ?? ""),
      state: String(r.state ?? ""),
      phone: r.phone ? String(r.phone) : undefined,
      website: r.website ? String(r.website) : undefined,
      category: r.category ? String(r.category) : undefined,
      ownershipAttributes: Array.isArray(r.ownershipClaims) ? r.ownershipClaims.map(String) : [],
      sourceProvider: "openai-vision",
      sourceUrl: fileUrl,
      evidence: [{
        sourceType: "image",
        sourceUrl: fileUrl,
        field: "image_extraction",
        value: JSON.stringify(r),
        retrievedAt: new Date().toISOString(),
        confidence: 0.6,
      }],
    } satisfies Candidate));
  } catch {
    return [];
  }
}

// ── Page scrape adapter ───────────────────────────────────────────────────────

async function extractFromUrl(pageUrl: string): Promise<Candidate[]> {
  try {
    const res = await fetch(pageUrl, {
      headers: { "user-agent": "MappingWithMelanin/1.0 Business Discovery Bot" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const jsonLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    const candidates: Candidate[] = [];
    for (const raw of jsonLd) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown> | Record<string, unknown>[];
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const r of items) {
          if (!r.name) continue;
          const addr = typeof r.address === "object" && r.address
            ? [(r.address as Record<string, string>).streetAddress, (r.address as Record<string, string>).addressLocality, (r.address as Record<string, string>).addressRegion].filter(Boolean).join(", ")
            : String(r.address ?? "");
          candidates.push({
            name: String(r.name),
            address: addr,
            city: typeof r.address === "object" && r.address ? String((r.address as Record<string, string>).addressLocality ?? "") : "",
            state: typeof r.address === "object" && r.address ? String((r.address as Record<string, string>).addressRegion ?? "") : "",
            website: r.url ? String(r.url) : pageUrl,
            phone: r.telephone ? String(r.telephone) : undefined,
            category: r.servesCuisine ? String(r.servesCuisine) : (r["@type"] ? String(r["@type"]) : undefined),
            ownershipAttributes: [],
            sourceProvider: "url-jsonld",
            sourceUrl: pageUrl,
            evidence: [{
              sourceType: "official_website",
              sourceUrl: pageUrl,
              field: "jsonld",
              value: JSON.stringify(r).slice(0, 1000),
              retrievedAt: new Date().toISOString(),
              confidence: 0.85,
            }],
          });
        }
      } catch { /* skip malformed JSON-LD */ }
    }
    return candidates;
  } catch {
    return [];
  }
}

// ── Ownership verification ────────────────────────────────────────────────────

function ownershipVerified(c: Candidate, requestedAttribute?: string): boolean {
  if (!requestedAttribute) return true;
  const wanted = normalizeText(requestedAttribute);
  const hasClaim = (c.ownershipAttributes ?? []).some((x) => normalizeText(x) === wanted);
  const hasEvidence = c.evidence.some(
    (e) =>
      normalizeText(e.field).includes("ownership") &&
      e.confidence >= 0.8 &&
      !!e.sourceUrl,
  );
  return hasClaim && hasEvidence;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function findByDedupeKey(key: string) {
  const { rows } = await pool.query<{ id: string; name: string; city: string; state: string; address: string; website: string; phone: string; latitude: number; longitude: number }>(
    `SELECT id, name, city, state, address, website, phone, latitude, longitude
     FROM businesses
     WHERE dedupe_key = $1
       AND coalesce(is_duplicate, false) = false
       AND coalesce(status, 'active') NOT IN ('duplicate','permanently_hidden')
     LIMIT 1`,
    [key],
  );
  return rows[0] ?? null;
}

async function findByTokenSimilarity(candidate: Candidate) {
  const { rows } = await pool.query<{ id: string; name: string; city: string; state: string; address: string; latitude: number; longitude: number }>(
    `SELECT id, name, city, state, address, latitude, longitude
     FROM businesses
     WHERE coalesce(is_duplicate, false) = false
       AND coalesce(status, 'active') NOT IN ('duplicate','permanently_hidden')
       AND lower(city) = lower($1)
       AND lower(state) = lower($2)
     LIMIT 200`,
    [candidate.city ?? "", candidate.state ?? ""],
  );
  return rows.find(
    (row) =>
      sameLocation(row, candidate) &&
      tokenSimilarity(row.name, candidate.name) >= 0.9,
  ) ?? null;
}

// ── Main route ────────────────────────────────────────────────────────────────

router.post("/businesses/ingest", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const body = req.body as IngestInput & { ownershipAttribute?: string };
  const { kind, ownershipAttribute } = body;

  if (!kind || !["query", "url", "image"].includes(kind)) {
    res.status(400).json({ error: "kind must be query | url | image" });
    return;
  }

  // -- Gather candidates
  let candidates: Candidate[] = [];
  let parsedCity: string | undefined;
  let parsedState: string | undefined;

  if (kind === "query") {
    const text = (body as { kind: "query"; text: string }).text;
    // Simple city/state extraction
    const cityMatch = text.match(/\bin\s+([a-zA-Z .'-]+?)(?:\s*,\s*([A-Z]{2})\b|$)/i);
    parsedCity = cityMatch?.[1]?.trim();
    parsedState = cityMatch?.[2]?.toUpperCase();
    candidates = await searchGooglePlaces(text, parsedCity, parsedState);
  } else if (kind === "url") {
    const url = (body as { kind: "url"; url: string }).url;
    candidates = await extractFromUrl(url);
    if (!candidates.length) candidates = await searchGooglePlaces(url, parsedCity, parsedState);
  } else if (kind === "image") {
    const fileUrl = (body as { kind: "image"; fileUrl: string }).fileUrl;
    candidates = await extractFromImage(fileUrl);
  }

  const results: Array<{ action: string; id?: string; name: string; reason?: string; score?: number }> = [];

  for (const candidate of candidates) {
    if (!candidate.name?.trim()) continue;

    const score = evidenceScore({
      name: candidate.name,
      address: candidate.address,
      city: candidate.city,
      state: candidate.state,
      website: candidate.website,
      phone: candidate.phone,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      sourceTypes: candidate.evidence.map((e) => e.sourceType),
    });

    const key = dedupeKey(candidate);

    // Check for existing record by exact key or token similarity
    let existing = await findByDedupeKey(key);
    if (!existing) existing = await findByTokenSimilarity(candidate);

    if (existing) {
      // Fill in missing fields on existing canonical row
      const patch: Record<string, unknown> = {};
      if (!existing.website && candidate.website) patch.website = candidate.website;
      if (!existing.phone && candidate.phone) patch.phone = candidate.phone;
      if (!existing.address && candidate.address) patch.address = candidate.address;
      if (Object.keys(patch).length) {
        patch.updated_at = new Date();
        const setClauses = Object.keys(patch).map((k, i) => `${k} = $${i + 2}`).join(", ");
        await pool.query(
          `UPDATE businesses SET ${setClauses} WHERE id = $1`,
          [existing.id, ...Object.values(patch)],
        );
      }
      results.push({ action: "UPDATED_EXISTING", id: existing.id, name: candidate.name });
      continue;
    }

    // Ownership check
    if (ownershipAttribute && !ownershipVerified(candidate, ownershipAttribute)) {
      await pool.query(
        `INSERT INTO business_review_items
          (candidate_name, candidate_address, candidate_city, candidate_state,
           candidate_website, candidate_phone, candidate_latitude, candidate_longitude,
           candidate_category, candidate_source_provider, candidate_source_url,
           evidence, score, review_type, reason, requested_attribute, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,'pending',NOW())`,
        [
          candidate.name, candidate.address ?? "", candidate.city ?? "",
          candidate.state ?? "", candidate.website ?? "", candidate.phone ?? "",
          candidate.latitude ?? null, candidate.longitude ?? null,
          candidate.category ?? "", candidate.sourceProvider,
          candidate.sourceUrl ?? "", JSON.stringify(candidate.evidence),
          score, "ownership_unverified",
          "Ownership attribute is not supported by sufficient source evidence.",
          ownershipAttribute,
        ],
      );
      results.push({
        action: "NEEDS_REVIEW",
        name: candidate.name,
        reason: "Ownership attribute is not supported by sufficient source evidence.",
        score,
      });
      continue;
    }

    // Evidence threshold
    if (score < 70) {
      await pool.query(
        `INSERT INTO business_review_items
          (candidate_name, candidate_address, candidate_city, candidate_state,
           candidate_website, candidate_phone, candidate_latitude, candidate_longitude,
           candidate_category, candidate_source_provider, candidate_source_url,
           evidence, score, review_type, reason, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,'pending',NOW())`,
        [
          candidate.name, candidate.address ?? "", candidate.city ?? "",
          candidate.state ?? "", candidate.website ?? "", candidate.phone ?? "",
          candidate.latitude ?? null, candidate.longitude ?? null,
          candidate.category ?? "", candidate.sourceProvider,
          candidate.sourceUrl ?? "", JSON.stringify(candidate.evidence),
          score, "insufficient_evidence",
          "Insufficient identity or location evidence.",
        ],
      );
      results.push({
        action: "NEEDS_REVIEW",
        name: candidate.name,
        reason: "Insufficient identity or location evidence.",
        score,
      });
      continue;
    }

    // Create new active record
    const { rows: created } = await pool.query<{ id: string }>(
      `INSERT INTO businesses
        (id, name, address, city, state, website, phone, latitude, longitude,
         category, status, listing_status, source_provider, source_url,
         retrieved_at, dedupe_key, normalized_name, evidence, created_at, updated_at)
       VALUES
        (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9,
         'active', 'active', $10, $11, NOW(), $12, $13, $14::jsonb, NOW(), NOW())
       RETURNING id`,
      [
        candidate.name, candidate.address ?? "", candidate.city ?? "",
        candidate.state ?? "", candidate.website ?? "", candidate.phone ?? "",
        candidate.latitude ?? null, candidate.longitude ?? null,
        candidate.category ?? "", candidate.sourceProvider,
        candidate.sourceUrl ?? "", key,
        normalizeText(candidate.name), JSON.stringify(candidate.evidence),
      ],
    );
    results.push({ action: "CREATED", id: created[0]?.id, name: candidate.name, score });
  }

  res.json({ results, total: results.length });
});

// ── POST /businesses/social-first ─────────────────────────────────────────────
// Social-first ingestion: accepts TikTok, Instagram, Facebook, screenshot, or
// any social-URL sourced business candidate. Enforces evidence gates, dedupes,
// and either adds a verified record, merges into an existing one, or queues for
// manual review. Requires admin or CRON_SECRET authentication.
import { ingestSocialFirstCandidate } from "../lib/social-first-ingestion";

router.post("/businesses/social-first", async (req: Request, res: Response) => {
  if (!isAdmin(req, res)) return;
  try {
    const { candidate, requestedOwnership = null } = req.body as {
      candidate: unknown;
      requestedOwnership?: string | null;
    };
    if (!candidate) {
      res.status(400).json({ error: "candidate is required" });
      return;
    }
    const result = await ingestSocialFirstCandidate(candidate, requestedOwnership);
    const statusCode = result.status === "VERIFIED_ADD" ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (err: any) {
    if (err?.name === "ZodError") {
      res.status(422).json({ error: "Invalid candidate", details: err.errors });
      return;
    }
    logger.error({ err }, "social-first ingestion failed");
    res.status(500).json({ error: err?.message ?? "Ingestion failed" });
  }
});

export default router;
