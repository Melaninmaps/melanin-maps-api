import type { Express, Request, Response } from "express";
import { discoveryEventV1Schema, discoverySearchRequestV1Schema, type DiscoverySearchRequestV1 } from "@workspace/api-zod";
import type { Pool } from "pg";

// Generic dining/category terms stay on canonical listing-field search. Dish
// and offering terms require governed offering evidence.
const FOOD = /\b(dish|offering|toast|pancake|waffle|sandwich|burger|taco|meal)\b/i;
const safeSourceUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : undefined;
  } catch { return undefined; }
};

export function registerDiscoveryV1Routes(app: Express, pool: Pool): void {
  let readyUntil = 0;
  let ready = false;
  app.use("/api/discovery/v1", async (_req, res, next) => {
    if (Date.now() >= readyUntil) {
      const check = await pool.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])`,
        [["business_offering_evidence", "discovery_events_v1", "discovery_member_preferences"]],
      ).catch(() => ({ rows: [] }));
      ready = new Set(check.rows.map((row) => row.table_name)).size === 3;
      readyUntil = Date.now() + 30_000;
    }
    if (!ready) return res.status(503).json({ error: "Discovery V1 schema is not ready" });
    return next();
  });
  const cleanup = setInterval(() => {
    pool.query(`DELETE FROM discovery_events_v1 WHERE retention_expires_at <= NOW()`).catch(() => undefined);
  }, 60 * 60 * 1000);
  cleanup.unref();

  app.post("/api/discovery/v1/search", async (req: Request, res: Response) => {
    const parsed = discoverySearchRequestV1Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid DiscoverySearchRequestV1", details: parsed.error.flatten() });
    const input: DiscoverySearchRequestV1 = parsed.data;
    const unsupportedFilters = Object.entries(input.filters).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined,
    ).map(([key]) => key);
    if (unsupportedFilters.length) return res.status(400).json({ error: "Unsupported Discovery V1 filters", unsupportedFilters });
    if (input.location.postalCode && !input.location.city && input.location.latitude === undefined) {
      return res.status(422).json({ code: "POSTAL_SCOPE_UNAVAILABLE", error: "Postal-only discovery is unavailable until canonical listings include a postal field." });
    }
    const hasCoordinates = input.location.latitude !== undefined && input.location.longitude !== undefined;
    const radiusMiles = hasCoordinates ? (input.location.radiusMiles ?? 5) : undefined;
    const area = hasCoordinates ? "your nearby area" : `${input.location.city}${input.location.stateRegion ? `, ${input.location.stateRegion}` : ""}${input.location.countryCode ? `, ${input.location.countryCode}` : ""} (city scope)`;
    const offering = FOOD.test(input.query);
    try {
      // Dish facts may only come from the separately-governed, approved evidence table.
      const evidenceJoin = offering ? "JOIN business_offering_evidence e ON e.business_id = b.id" : "";
      const evidenceColumns = offering
        ? "e.label, e.kind, e.source_url AS evidence_url, e.as_of, e.confidence"
        : "b.name AS label, 'listing_field'::text AS kind, b.source_url AS evidence_url, NULL::timestamptz AS as_of, 'supported'::text AS confidence";
      const textMatch = offering
        ? "e.status = 'approved' AND to_tsvector('simple', e.normalized_label || ' ' || e.label) @@ websearch_to_tsquery('simple',$4)"
        : "to_tsvector('simple', coalesce(b.name,'') || ' ' || coalesce(b.category,'') || ' ' || coalesce(b.subcategory,'')) @@ websearch_to_tsquery('simple',$4)";
      const found = hasCoordinates ? await pool.query(
        `WITH matched AS (
           SELECT b.id,b.name,b.category,b.latitude::text,b.longitude::text,b.verified,b.source_url,${evidenceColumns},
             (3958.7613 * acos(least(1,greatest(-1,cos(radians($1))*cos(radians(b.latitude))*cos(radians(b.longitude)-radians($2))+sin(radians($1))*sin(radians(b.latitude)))))) AS distance_miles
           FROM public.public_businesses b ${evidenceJoin}
           WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL AND ${textMatch}
         ) SELECT * FROM matched WHERE distance_miles <= $3 ORDER BY distance_miles ASC,name ASC LIMIT 50`,
        [input.location.latitude, input.location.longitude, radiusMiles, input.query],
      ) : await pool.query(
        `SELECT b.id,b.name,b.category,b.latitude::text,b.longitude::text,b.verified,b.source_url,${evidenceColumns},NULL::double precision AS distance_miles
         FROM public.public_businesses b ${evidenceJoin}
         WHERE LOWER(COALESCE(b.city,''))=LOWER($1)
           AND ($2::text IS NULL OR UPPER(COALESCE(b.state,''))=UPPER($2))
           AND ($3::text IS NULL OR UPPER(COALESCE(b.country,''))=UPPER($3))
           AND ${textMatch}
         ORDER BY b.verified DESC,b.name ASC LIMIT 50`,
        [input.location.city ?? "", input.location.stateRegion ?? null, input.location.countryCode ?? null, input.query],
      );
      const results = found.rows.map((r: any) => ({
        id: r.id, recordType: "business", title: r.name, subtitle: r.category ?? undefined,
        latitude: r.latitude == null ? undefined : Number(r.latitude), longitude: r.longitude == null ? undefined : Number(r.longitude),
        distanceMiles: r.distance_miles == null ? undefined : Number(r.distance_miles),
        matchReason: offering ? `Supported offering evidence: ${r.label}` : `Matched mapped listing field: ${r.label}`,
        evidence: [{ kind: r.kind, label: r.label, sourceUrl: safeSourceUrl(r.evidence_url), asOf: r.as_of instanceof Date ? r.as_of.toISOString() : undefined, confidence: r.confidence }],
        isVerified: r.verified, sourceUrl: safeSourceUrl(r.source_url),
      }));
      const capabilityMessage = !results.length && offering
        ? hasCoordinates
          ? `No mapped listing evidence for ${input.query.trim().toLowerCase()} in ${area} within ${radiusMiles} miles.`
          : `No mapped listing evidence for ${input.query.trim().toLowerCase()} in ${area}.`
        : undefined;
      return res.set("Cache-Control", "private, no-store").json({ requestId: input.requestId, resultSetId: crypto.randomUUID(), interpretedIntent: offering ? "food_or_offering" : "general_local", interpretationLabel: offering ? `Looking for ${input.query.trim()}` : "Finding mapped places", locationLabel: area, ...(radiusMiles ? { radiusMiles } : {}), results, total: results.length, capabilityMessage, nextActions: !results.length ? ["expand_10", "expand_25", "browse_related", "nominate_business", "change_location"] : [] });
    } catch (error) { req.log?.error({ error }, "Discovery V1 search failed"); return res.status(500).json({ error: "Discovery search failed" }); }
  });
  app.post("/api/discovery/v1/events", async (req: Request, res: Response) => {
    const parsed = discoveryEventV1Schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid DiscoveryEventV1", details: parsed.error.flatten() });
    const e = parsed.data;
    // Identity is never accepted from the client. Events are member-scoped only
    // when a server-authenticated session supplies the member ID.
    const memberId = req.user?.id;
    if (!memberId) return res.status(401).json({ error: "Authentication required" });
    try {
      const preference = await pool.query<{ search_improvement: boolean; consent_version: string }>(
        `SELECT search_improvement, consent_version FROM discovery_member_preferences WHERE member_id = $1`,
        [memberId],
      );
      // Default deny and use the server's stored consent, never the event body.
      if (!preference.rows[0]?.search_improvement) return res.status(202).json({ accepted: false, reason: "search_improvement_consent_required" });
      await pool.query(`DELETE FROM discovery_events_v1 WHERE retention_expires_at <= NOW()`);
      await pool.query(`INSERT INTO discovery_events_v1 (event_id,idempotency_key,member_id,event_name,consent_version,surface,platform,entry_point,app_version,request_id,result_set_id,normalized_intent,structured_filters,coarse_location_bucket,radius_miles,result_id,rank,record_type,result_count,zero_result,latency_ms,fallback_state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) ON CONFLICT (idempotency_key) DO NOTHING`, [e.eventId,e.idempotencyKey,memberId,e.eventName,preference.rows[0].consent_version,e.surface,e.platform,e.entryPoint,e.appVersion,e.requestId ?? null,e.resultSetId ?? null,e.normalizedIntent ?? null,e.filters ?? {},e.coarseLocationBucket ?? null,e.radiusMiles ?? null,e.resultId ?? null,e.rank ?? null,e.recordType ?? null,e.resultCount ?? null,e.zeroResult ?? null,e.latencyMs ?? null,e.fallbackState ?? null]);
      return res.status(202).json({ accepted: true });
    } catch (error) { req.log?.error({ error }, "Discovery V1 event failed"); return res.status(503).json({ error: "Discovery event unavailable" }); }
  });
  app.get("/api/discovery/v1/preferences", async (req: Request, res: Response) => {
    if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
    try {
      const result = await pool.query<{ search_improvement: boolean; consent_version: string }>(
        `SELECT search_improvement, consent_version FROM discovery_member_preferences WHERE member_id = $1`, [req.user.id],
      );
      return res.json({ searchImprovement: result.rows[0]?.search_improvement ?? false, consentVersion: result.rows[0]?.consent_version ?? "v1" });
    } catch { return res.status(503).json({ error: "Discovery preferences unavailable" }); }
  });
  app.put("/api/discovery/v1/preferences", async (req: Request, res: Response) => {
    if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
    const searchImprovement = req.body?.searchImprovement;
    const consentVersion = req.body?.consentVersion;
    if (typeof searchImprovement !== "boolean" || typeof consentVersion !== "string" || !/^[a-zA-Z0-9._-]{1,50}$/.test(consentVersion)) return res.status(400).json({ error: "Invalid discovery preference" });
    const client = await pool.connect().catch(() => null);
    if (!client) return res.status(503).json({ error: "Discovery preferences unavailable" });
    try {
      await client.query("BEGIN");
      await client.query(`INSERT INTO discovery_member_preferences (member_id,search_improvement,consent_version,updated_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (member_id) DO UPDATE SET search_improvement=EXCLUDED.search_improvement, consent_version=EXCLUDED.consent_version, updated_at=NOW()`, [req.user.id, searchImprovement, consentVersion]);
      if (!searchImprovement) await client.query(`DELETE FROM discovery_events_v1 WHERE member_id=$1`, [req.user.id]);
      await client.query("COMMIT");
      return res.json({ searchImprovement, consentVersion });
    } catch {
      await client.query("ROLLBACK").catch(() => undefined);
      return res.status(503).json({ error: "Discovery preferences unavailable" });
    } finally { client.release(); }
  });
}