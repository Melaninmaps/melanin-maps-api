import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { pool } from "@workspace/db";
import { dedupeKey as makeDedupeKey, normalizeText } from "../lib/business-dedup";

/**
 * Shared public visibility predicate for Drizzle/SQL callers.
 * Prefer querying public.public_businesses after the SQL migration.
 */
export const PUBLIC_BUSINESS_PREDICATE = `
  COALESCE(b.is_duplicate, false) = false
  AND COALESCE(b.status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
  AND COALESCE(b.listing_status, '') IN ('live_unclaimed', 'live_claimed')
`;

/**
 * Correct map-pins SQL replacement.
 */
export const MAP_PINS_SQL = `
  SELECT id, name, latitude, longitude, category, subcategory,
         city, state, country, listing_status
  FROM public.public_businesses
  WHERE latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND latitude <> 0
    AND longitude <> 0
  ORDER BY confidence_score DESC NULLS LAST, created_at DESC
`;

/**
 * Correct public list/search FROM and visibility replacement.
 * Add all existing dynamic search predicates to `whereSql` and parameters.
 */
export function publicBusinessListSql(whereSql = "TRUE") {
  return `
    SELECT b.*
    FROM public.public_businesses b
    WHERE (${whereSql})
    ORDER BY b.founding_business DESC NULLS LAST,
             b.confidence_score DESC NULLS LAST
  `;
}

/**
 * Correct public detail lookup. A known duplicate or hidden ID behaves as not found.
 */
export async function findPublicBusinessById(id: string) {
  const result = await pool.query(
    `SELECT b.*
       FROM public.public_businesses b
      WHERE b.id = $1
      LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

/**
 * Find the physical candidate row represented by a review item.
 * Seeded duplicate-review rows may not have a candidate_business_id column,
 * so match the candidate fields while excluding the canonical matched ID.
 */
async function findReviewCandidate(client: any, item: {
  candidate_name: string;
  candidate_address: string | null;
  candidate_city: string;
  candidate_state: string;
  candidate_latitude: number | null;
  candidate_longitude: number | null;
  matched_business_id: string | null;
}) {
  const { rows } = await client.query(
    `SELECT id, duplicate_of_id, is_duplicate, status, listing_status
       FROM businesses
      WHERE id <> COALESCE($1, '')
        AND lower(regexp_replace(name, '[^a-z0-9]+', '', 'gi')) =
            lower(regexp_replace($2, '[^a-z0-9]+', '', 'gi'))
        AND lower(coalesce(city, '')) = lower(coalesce($3, ''))
        AND lower(coalesce(state, '')) = lower(coalesce($4, ''))
        AND (
          ($5::double precision IS NOT NULL AND $6::double precision IS NOT NULL
           AND round(latitude::numeric, 5) = round($5::numeric, 5)
           AND round(longitude::numeric, 5) = round($6::numeric, 5))
          OR (
            coalesce($7, '') <> ''
            AND lower(coalesce(address, '')) = lower($7)
          )
        )
      ORDER BY COALESCE(is_duplicate, false) ASC, created_at DESC
      LIMIT 1`,
    [
      item.matched_business_id,
      item.candidate_name,
      item.candidate_city,
      item.candidate_state,
      item.candidate_latitude,
      item.candidate_longitude,
      item.candidate_address,
    ],
  );
  return rows[0] ?? null;
}

/**
 * PATCH /api/admin/business-review/:id
 * Replace the existing handler with this transaction-safe implementation.
 * `isAdmin(req)` must remain the project’s existing authorization guard.
 */
export async function handleBusinessReviewAction(req: Request, res: Response) {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const reviewId = String(req.params.id);
  const action = String((req.body as { action?: string }).action ?? "");
  const allowed = new Set(["approve", "reject", "merge", "keep_both", "needs_research"]);
  if (!allowed.has(action)) {
    res.status(400).json({ error: "Invalid review action" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const itemResult = await client.query(
      `SELECT id, review_type, status, candidate_name, candidate_address,
              candidate_city, candidate_state, candidate_website, candidate_phone,
              candidate_latitude, candidate_longitude, candidate_category,
              candidate_source_provider, candidate_source_url, matched_business_id
         FROM business_review_items
        WHERE id = $1
        FOR UPDATE`,
      [reviewId],
    );
    const item = itemResult.rows[0];
    if (!item) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Review item not found" });
      return;
    }
    if (item.status !== "pending") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Review item already resolved", status: item.status });
      return;
    }

    const adminId = (req.session as Record<string, unknown> | undefined)?.userId ?? null;

    if (action === "merge") {
      if (!item.matched_business_id) {
        await client.query("ROLLBACK");
        res.status(422).json({ error: "Cannot merge without a canonical matched_business_id" });
        return;
      }

      const canonical = await client.query(
        `SELECT id, is_duplicate, status, listing_status
           FROM businesses
          WHERE id = $1
          FOR UPDATE`,
        [item.matched_business_id],
      );
      if (!canonical.rows[0]) {
        await client.query("ROLLBACK");
        res.status(422).json({ error: "Canonical business does not exist" });
        return;
      }
      if (canonical.rows[0].is_duplicate === true) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Canonical target is itself marked duplicate" });
        return;
      }

      const candidate = await findReviewCandidate(client, item);
      if (!candidate) {
        await client.query("ROLLBACK");
        res.status(422).json({
          error: "Could not identify a physical candidate row to merge; no business row was changed",
        });
        return;
      }
      if (candidate.id === item.matched_business_id) {
        await client.query("ROLLBACK");
        res.status(422).json({ error: "Candidate and canonical IDs are identical" });
        return;
      }

      await client.query(
        `UPDATE businesses
            SET is_duplicate = true,
                duplicate_of_id = $1::uuid,
                duplicate_reason = 'manual_review_merge',
                duplicate_marked_at = NOW(),
                listing_status = 'permanently_hidden',
                status = 'permanently_hidden',
                updated_at = NOW()
          WHERE id = $2`,
        [item.matched_business_id, candidate.id],
      );

      await client.query(
        `UPDATE business_review_items
            SET status = 'merged',
                resolved_by = $1,
                resolved_at = NOW(),
                updated_at = NOW(),
                matched_business_id = $2
          WHERE id = $3`,
        [adminId, item.matched_business_id, reviewId],
      );

      await client.query("COMMIT");
      res.json({ ok: true, status: "merged", duplicateId: candidate.id, canonicalId: item.matched_business_id });
      return;
    }

    if (action === "approve" || action === "keep_both") {
      const key = makeDedupeKey({
        name: item.candidate_name,
        city: item.candidate_city,
        state: item.candidate_state,
        address: item.candidate_address,
        latitude: item.candidate_latitude,
        longitude: item.candidate_longitude,
      });
      const inserted = await client.query(
        `INSERT INTO businesses
          (id, name, address, city, state, website, phone, latitude, longitude,
           category, status, listing_status, source_provider, source_url,
           normalized_name, dedupe_key, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active','live_unclaimed',
                 $11,$12,$13,$14,NOW(),NOW())
         ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL
           AND COALESCE(is_duplicate,false) = false
           AND COALESCE(status,'') NOT IN ('duplicate','permanently_hidden','removed','deleted')
         DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [
          randomUUID(), item.candidate_name, item.candidate_address,
          item.candidate_city, item.candidate_state, item.candidate_website,
          item.candidate_phone, item.candidate_latitude, item.candidate_longitude,
          item.candidate_category, item.candidate_source_provider,
          item.candidate_source_url ?? null, normalizeText(item.candidate_name), key,
        ],
      );
      if (!inserted.rows[0]) throw new Error("Business approval did not return a canonical row");
    }

    const newStatus = action === "approve" ? "approved"
      : action === "reject" ? "rejected"
      : action === "keep_both" ? "keep_both"
      : "needs_research";
    await client.query(
      `UPDATE business_review_items
          SET status = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW()
        WHERE id = $3`,
      [newStatus, adminId, reviewId],
    );

    await client.query("COMMIT");
    res.json({ ok: true, status: newStatus });
  } catch (error) {
    await client.query("ROLLBACK");
    req.log.error({ error }, "business review action failed");
    res.status(500).json({ error: "Business review action failed" });
  } finally {
    client.release();
  }
}

// Existing project authorization function; keep the project implementation.
declare function isAdmin(req: Request): boolean;
