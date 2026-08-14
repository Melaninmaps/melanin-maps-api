import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { pool } from "@workspace/db";
import { dedupeKey, normalizeText } from "../lib/business-dedup";

/**
 * Replace POST /admin/business-discovery/approve with this handler.
 * Keep the existing isAdmin implementation and provider search code.
 */
export async function approveDiscoveredBusiness(req: Request, res: Response) {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = req.body as {
    name?: string;
    address?: string | null;
    city?: string;
    state?: string;
    category?: string;
    phone?: string | null;
    website?: string | null;
    lat?: number | null;
    lng?: number | null;
    ownershipDesignations?: string[] | null;
    blackOwned?: boolean;
    placeId?: string | null;
  };

  const name = body.name?.trim() ?? "";
  const address = body.address?.trim() || null;
  const city = body.city?.trim() ?? "";
  const state = body.state?.trim() ?? "";
  const category = body.category?.trim() ?? "";
  const phone = body.phone?.trim() || null;
  const website = body.website?.trim() || null;
  const latitude = Number.isFinite(body.lat) ? body.lat : null;
  const longitude = Number.isFinite(body.lng) ? body.lng : null;

  if (!name || !city || !state || !category) {
    res.status(400).json({ error: "name, city, state, category required" });
    return;
  }

  // This is the one identity representation used by all write paths.
  const normalizedName = normalizeText(name);
  const key = dedupeKey({
    name,
    address,
    city,
    state,
    latitude,
    longitude,
  });
  const sourceProvider = "google_places";
  const sourceUrl = body.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(body.placeId)}`
    : website;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the identity key before deciding whether this is new. The unique
    // partial index remains the final race-condition defense.
    const existing = await client.query(
      `SELECT id, name, city, state, address, listing_status, is_duplicate
         FROM businesses
        WHERE dedupe_key = $1
          AND COALESCE(is_duplicate,false) = false
          AND COALESCE(status,'') NOT IN ('duplicate','permanently_hidden','removed','deleted')
        FOR UPDATE`,
      [key],
    );

    if (existing.rows[0]) {
      const row = existing.rows[0];
      await client.query(
        `UPDATE businesses
            SET website = COALESCE(NULLIF($1, ''), website),
                phone = COALESCE(NULLIF($2, ''), phone),
                source_provider = COALESCE(source_provider, $3),
                source_url = COALESCE(source_url, $4),
                normalized_name = $5,
                updated_at = NOW()
          WHERE id = $6`,
        [website, phone, sourceProvider, sourceUrl, normalizedName, row.id],
      );
      await client.query("COMMIT");
      res.status(200).json({
        ok: true,
        id: row.id,
        existingId: row.id,
        isDuplicate: true,
        action: "EXISTING_CANONICAL",
        message: `${name} already exists; no duplicate was created`,
      });
      return;
    }

    const id = randomUUID();
    const inserted = await client.query(
      `INSERT INTO businesses (
         id, name, address, city, state, category, phone, website,
         latitude, longitude, listing_status, status, verified, black_owned,
         ownership_designations, source_provider, source_url,
         normalized_name, dedupe_key, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         'live_unclaimed','active',false,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW()
       )
       ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL
         AND COALESCE(is_duplicate,false) = false
         AND COALESCE(status,'') NOT IN ('duplicate','permanently_hidden','removed','deleted')
       DO UPDATE SET
         website = COALESCE(NULLIF(EXCLUDED.website, ''), businesses.website),
         phone = COALESCE(NULLIF(EXCLUDED.phone, ''), businesses.phone),
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS inserted`,
      [
        id, name, address, city, state, category, phone, website,
        latitude, longitude, body.blackOwned ?? false,
        body.ownershipDesignations ?? [], sourceProvider, sourceUrl,
        normalizedName, key,
      ],
    );

    const canonical = inserted.rows[0];
    await client.query("COMMIT");
    res.status(canonical.inserted ? 201 : 200).json({
      ok: true,
      id: canonical.id,
      existingId: canonical.inserted ? null : canonical.id,
      isDuplicate: !canonical.inserted,
      action: canonical.inserted ? "CREATED_CANONICAL" : "EXISTING_CANONICAL",
      message: canonical.inserted ? `${name} added to the platform` : `${name} already exists; no duplicate was created`,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    // A concurrent request may win the unique-key race. Return the canonical
    // row instead of exposing a 500 or creating another row.
    if (error?.code === "23505") {
      const winner = await client.query(
        `SELECT id FROM businesses WHERE dedupe_key = $1 AND COALESCE(is_duplicate,false)=false LIMIT 1`,
        [key],
      );
      if (winner.rows[0]) {
        res.status(200).json({ ok: true, id: winner.rows[0].id, isDuplicate: true, action: "EXISTING_CANONICAL" });
        return;
      }
    }
    req.log.error({ error }, "business discovery approval failed");
    res.status(500).json({ error: "Failed to add business" });
  } finally {
    client.release();
  }
}

declare function isAdmin(req: Request): boolean;
