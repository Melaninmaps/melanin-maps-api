/**
 * Hotel-Stay Business Ingestion — MWM
 *
 * Accepts a hotel name + address supplied by a traveler and resolves it
 * against a geocode provider before any DB write. Evidence gates:
 *   - Provider must return a result (or → MANUAL_REVIEW)
 *   - Provider name must strongly match input name (or → MANUAL_REVIEW)
 *   - Provider address must be complete: city + state + country (or → MANUAL_REVIEW)
 *   - Resolved place must be hotel/lodging category (or → MANUAL_REVIEW)
 *   - Provider confidence score ≥ 0.85 (or → MANUAL_REVIEW)
 *
 * Ownership: non-minority. ownershipClaim is never set by this pipeline.
 *
 * All DB operations use pool.query raw SQL (not Drizzle) per the esbuild
 * bundle safety pattern used throughout this codebase.
 */

import { z } from "zod";
import { pool } from "@workspace/db";
import { logger } from "./logger";

// ── Input schema ──────────────────────────────────────────────────────────────

export const HotelInput = z.object({
  name: z.string().trim().min(2).max(240),
  address: z.string().trim().min(5).max(400),
  sourceInput: z
    .enum(["hotel_stay", "user_address", "url", "screenshot"])
    .default("hotel_stay"),
});

export type ProviderPlace = {
  providerPlaceId: string | null;
  name: string;
  formattedAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  types: string[];
  providerUrl: string | null;
};

export type GeocodeHotelFn = (
  query: string,
) => Promise<{ place: ProviderPlace | null; score: number }>;

// ── String normalization helpers ──────────────────────────────────────────────

function normalize(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function phoneKey(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

function domainOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

// ── Evidence helpers ──────────────────────────────────────────────────────────

function isHotelLike(place: ProviderPlace): boolean {
  const text = `${place.name} ${(place.types ?? []).join(" ")}`.toLowerCase();
  return /hotel|lodging|motel|resort|inn|hostel|extended stay|bed and breakfast/.test(
    text,
  );
}

function strongNameMatch(inputName: string, providerName: string): boolean {
  const a = normalize(inputName);
  const b = normalize(providerName);
  return a === b || a.includes(b) || b.includes(a);
}

function addressComplete(place: ProviderPlace): boolean {
  return Boolean(place.formattedAddress && place.city && place.state && place.country);
}

function buildEvidence(
  input: z.infer<typeof HotelInput>,
  place: ProviderPlace,
): object[] {
  const now = new Date().toISOString();
  return [
    {
      url: place.providerUrl,
      sourceType: "google_places",
      field: "identity",
      supports: true,
      excerpt: place.name,
      extractedAt: now,
    },
    {
      url: place.providerUrl,
      sourceType: "google_places",
      field: "address",
      supports: addressComplete(place),
      excerpt: place.formattedAddress,
      extractedAt: now,
    },
    {
      url: place.providerUrl,
      sourceType: "google_places",
      field: "category",
      supports: isHotelLike(place),
      excerpt: (place.types ?? []).join(", "),
      extractedAt: now,
    },
    {
      url: null,
      sourceType: "user_supplied",
      field: "user_input",
      supports: true,
      excerpt: `${input.name} — ${input.address}`,
      extractedAt: now,
    },
  ];
}

function mergeEvidence(existing: object[], incoming: object[]): object[] {
  const byKey = new Map<string, object>();
  for (const e of [...existing, ...incoming]) {
    const ev = e as any;
    byKey.set(`${ev.field}|${ev.url}|${ev.sourceType}`, e);
  }
  return [...byKey.values()];
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function hotelDedupeKey(place: ProviderPlace): string {
  return [
    "hotel",
    place.providerPlaceId ?? "",
    normalize(place.name),
    normalize(place.formattedAddress),
    place.latitude ?? "",
    place.longitude ?? "",
  ].join("|");
}

function distanceMeters(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
): number | null {
  if (
    a.latitude == null ||
    a.longitude == null ||
    b.latitude == null ||
    b.longitude == null
  )
    return null;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(h));
}

async function findCanonicalHotel(place: ProviderPlace): Promise<{
  id: string;
  latitude: number | null;
  longitude: number | null;
  provider_place_id: string | null;
  source_evidence: object[] | null;
  website: string | null;
  website_domain: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
} | null> {
  const providerId = place.providerPlaceId;
  const name = normalize(place.name);
  const phone = phoneKey(place.phone);
  const webDomain = domainOf(place.website);

  const { rows } = await pool.query(
    `SELECT id, latitude, longitude, provider_place_id,
            source_evidence, website, website_domain, phone,
            address, city, state, postal_code, country
     FROM businesses
     WHERE coalesce(is_duplicate, false) = false
       AND coalesce(status, 'active') NOT IN ('duplicate', 'permanently_hidden')
       AND (
         ($1::text IS NOT NULL AND provider_place_id = $1)
         OR ($2::text IS NOT NULL AND phone = $2)
         OR ($3::text IS NOT NULL AND website_domain = $3)
         OR (normalized_name = $4 AND lower(coalesce(category,'')) = 'hotel')
       )
     LIMIT 10`,
    [providerId, phone, webDomain, name],
  );

  if (!rows.length) return null;

  // Prefer a row within 150 m; otherwise fall back to first strong match.
  const nearby = rows.find((row: any) => {
    const d = distanceMeters(place, {
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
    });
    return d !== null && d <= 150;
  });
  return (nearby ?? rows[0]) as any;
}

// ── Resolution ────────────────────────────────────────────────────────────────

export type Resolution = {
  input: z.infer<typeof HotelInput>;
  place: ProviderPlace | null;
  status: "VERIFIED_ADD" | "EXISTING_UPDATE" | "MANUAL_REVIEW";
  reason: string | null;
  confidence: number;
};

export async function resolveHotelStay(
  raw: unknown,
  geocodeHotel: GeocodeHotelFn,
): Promise<Resolution> {
  const input = HotelInput.parse(raw);
  const resolved = await geocodeHotel(`${input.name}, ${input.address}`);
  const place = resolved.place;

  if (!place)
    return {
      input,
      place: null,
      status: "MANUAL_REVIEW",
      reason: "provider_no_match",
      confidence: 0,
    };
  if (!strongNameMatch(input.name, place.name))
    return {
      input,
      place,
      status: "MANUAL_REVIEW",
      reason: "provider_name_mismatch",
      confidence: resolved.score,
    };
  if (!addressComplete(place))
    return {
      input,
      place,
      status: "MANUAL_REVIEW",
      reason: "provider_address_incomplete",
      confidence: resolved.score,
    };
  if (!isHotelLike(place))
    return {
      input,
      place,
      status: "MANUAL_REVIEW",
      reason: "resolved_place_not_hotel",
      confidence: resolved.score,
    };
  if (resolved.score < 0.85)
    return {
      input,
      place,
      status: "MANUAL_REVIEW",
      reason: "provider_confidence_below_threshold",
      confidence: resolved.score,
    };

  const existing = await findCanonicalHotel(place);
  if (existing)
    return {
      input,
      place,
      status: "EXISTING_UPDATE",
      reason: null,
      confidence: resolved.score,
    };
  return {
    input,
    place,
    status: "VERIFIED_ADD",
    reason: null,
    confidence: resolved.score,
  };
}

// ── Manual review queue ───────────────────────────────────────────────────────

async function queueForReview(
  input: z.infer<typeof HotelInput>,
  place: ProviderPlace | null,
  reason: string,
  confidence: number,
): Promise<void> {
  await pool.query(
    `INSERT INTO business_review_items
       (candidate_name, candidate_address, candidate_city, candidate_state,
        candidate_website, candidate_phone, candidate_latitude, candidate_longitude,
        candidate_category, candidate_source_provider, candidate_source_url,
        evidence, score, review_type, reason, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'hotel','nominatim',$9,$10::jsonb,$11,'hotel_stay',$12,'pending',NOW())`,
    [
      input.name,
      input.address,
      place?.city ?? "",
      place?.state ?? "",
      place?.website ?? "",
      place?.phone ?? "",
      place?.latitude ?? null,
      place?.longitude ?? null,
      place?.providerUrl ?? "",
      JSON.stringify(
        place
          ? [
              {
                url: place.providerUrl,
                sourceType: "google_places",
                field: "identity",
                supports: false,
                excerpt: place.name,
              },
            ]
          : [],
      ),
      Math.round(confidence * 100),
      reason,
    ],
  );
}

// ── Main entry point ──────────────────────────────────────────────────────────

export type IngestHotelResult =
  | { status: "VERIFIED_ADD"; canonicalId: string }
  | { status: "EXISTING_UPDATE"; canonicalId: string }
  | { status: "MANUAL_REVIEW"; reason: string | null; canonicalId: null };

export async function ingestHotelStay(
  raw: unknown,
  geocodeHotel: GeocodeHotelFn,
): Promise<IngestHotelResult> {
  const resolution = await resolveHotelStay(raw, geocodeHotel);

  if (resolution.status === "MANUAL_REVIEW" || !resolution.place) {
    await queueForReview(
      resolution.input,
      resolution.place,
      resolution.reason ?? "unknown",
      resolution.confidence,
    );
    logger.info(
      {
        event: "HOTEL_STAY_MANUAL_REVIEW",
        name: resolution.input.name,
        reason: resolution.reason,
      },
      "hotel candidate queued for review",
    );
    return {
      status: "MANUAL_REVIEW",
      reason: resolution.reason,
      canonicalId: null,
    };
  }

  const place = resolution.place;
  const evidence = buildEvidence(resolution.input, place);
  const key = hotelDedupeKey(place);

  // Try merge into existing first (inside a "transaction" via serial queries).
  const existing = await findCanonicalHotel(place);
  if (existing) {
    const merged = mergeEvidence(
      (existing.source_evidence as object[]) ?? [],
      evidence,
    );
    await pool.query(
      `UPDATE businesses SET
         provider_place_id = COALESCE(provider_place_id, $2),
         address           = COALESCE(address, $3),
         city              = COALESCE(city, $4),
         state             = COALESCE(state, $5),
         postal_code       = COALESCE(postal_code, $6),
         country           = COALESCE(country, $7),
         latitude          = COALESCE(latitude, $8),
         longitude         = COALESCE(longitude, $9),
         phone             = COALESCE(phone, $10),
         website           = COALESCE(website, $11),
         website_domain    = COALESCE(website_domain, $12),
         source_evidence   = $13::jsonb,
         updated_at        = NOW()
       WHERE id = $1`,
      [
        existing.id,
        place.providerPlaceId,
        place.formattedAddress,
        place.city,
        place.state,
        place.postalCode,
        place.country,
        place.latitude,
        place.longitude,
        phoneKey(place.phone),
        place.website,
        domainOf(place.website),
        JSON.stringify(merged),
      ],
    );
    logger.info(
      { event: "HOTEL_STAY_EXISTING_UPDATE", id: existing.id, name: place.name },
      "hotel merged into existing record",
    );
    return { status: "EXISTING_UPDATE", canonicalId: existing.id };
  }

  // New insert — conflict-safe.
  const { rows: inserted } = await pool.query<{ id: string }>(
    `INSERT INTO businesses
       (id, name, normalized_name,
        category, subcategory, description,
        address, city, state, postal_code, country,
        latitude, longitude,
        phone, website, website_domain,
        provider_place_id, source_evidence,
        dedupe_key, status, listing_status,
        is_duplicate,
        created_at, updated_at)
     VALUES
       (gen_random_uuid(), $1, $2,
        'hotel', '', '',
        COALESCE($3,''), COALESCE($4,''), COALESCE($5,''), $6, $7,
        $8, $9,
        $10, $11, $12,
        $13, $14::jsonb,
        $15, 'active', 'active',
        false,
        NOW(), NOW())
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      place.name,
      normalize(place.name),
      place.formattedAddress,
      place.city,
      place.state,
      place.postalCode,
      place.country,
      place.latitude,
      place.longitude,
      phoneKey(place.phone),
      place.website,
      domainOf(place.website),
      place.providerPlaceId,
      JSON.stringify(evidence),
      key,
    ],
  );

  if (inserted[0]) {
    logger.info(
      { event: "HOTEL_STAY_VERIFIED_ADD", id: inserted[0].id, name: place.name },
      "hotel verified and added",
    );
    return { status: "VERIFIED_ADD", canonicalId: inserted[0].id };
  }

  // Concurrent conflict — return the winner.
  const { rows: canonical } = await pool.query<{ id: string }>(
    `SELECT id FROM businesses WHERE dedupe_key = $1 LIMIT 1`,
    [key],
  );
  if (canonical[0]) {
    return { status: "EXISTING_UPDATE", canonicalId: canonical[0].id };
  }
  await queueForReview(
    resolution.input,
    place,
    "concurrent_conflict_requires_review",
    resolution.confidence,
  );
  return {
    status: "MANUAL_REVIEW",
    reason: "concurrent_conflict_requires_review",
    canonicalId: null,
  };
}

// ── Default Nominatim geocoder ────────────────────────────────────────────────
// Used by the route handler; tests inject their own mock.

export async function nominatimGeocodeHotel(
  query: string,
): Promise<{ place: ProviderPlace | null; score: number }> {
  const { default: https } = await import("https");
  const encoded = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`;

  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "MWM-hotel-ingestion/1.0 contact@mappingwithmelanin.com",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (!data?.length) return resolve({ place: null, score: 0 });
            const d = data[0];
            const addr = d.address ?? {};
            const types = (d.type ? [d.type] : []).concat(d.class ? [d.class] : []);
            resolve({
              place: {
                providerPlaceId: d.place_id ? String(d.place_id) : null,
                name: d.display_name?.split(",")[0]?.trim() ?? query,
                formattedAddress: d.display_name ?? null,
                city:
                  addr.city ||
                  addr.town ||
                  addr.village ||
                  addr.county ||
                  null,
                state: addr.state ?? null,
                postalCode: addr.postcode ?? null,
                country: addr.country_code?.toUpperCase() ?? null,
                latitude: d.lat ? parseFloat(d.lat) : null,
                longitude: d.lon ? parseFloat(d.lon) : null,
                phone: null,
                website: null,
                types,
                providerUrl: `https://nominatim.openstreetmap.org/details?place_id=${d.place_id}`,
              },
              score: parseFloat(d.importance ?? "0") || 0.7,
            });
          } catch {
            resolve({ place: null, score: 0 });
          }
        });
      },
    );
    req.on("error", () => resolve({ place: null, score: 0 }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ place: null, score: 0 });
    });
  });
}
