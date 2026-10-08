import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { pool as defaultPool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";

export const KINFOLK_CATALOG_COHORT_KEY = "kinfolk_catalog" as const;
export const KINFOLK_CATALOG_STATES = ["intake", "review", "ready", "held", "removed"] as const;
export type KinfolkCatalogState = (typeof KINFOLK_CATALOG_STATES)[number];

type QueryResult<T = Record<string, unknown>> = { rows: T[]; rowCount?: number | null };
type QueryClient = { query<T = Record<string, unknown>>(statement: string, values?: readonly unknown[]): Promise<QueryResult<T>> };
type CatalogDatabase = QueryClient & { connect(): Promise<QueryClient & { release(): void }> };

export type CatalogStateChange = { state: KinfolkCatalogState; reason: string };

export function parseKinfolkCatalogStateChange(body: unknown): CatalogStateChange {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("A catalog state change is required");
  const input = body as Record<string, unknown>;
  const state = String(input.state ?? "").trim();
  const reason = String(input.reason ?? "").trim();
  if (!KINFOLK_CATALOG_STATES.includes(state as KinfolkCatalogState)) {
    throw new Error("state must be intake, review, ready, held, or removed");
  }
  if (reason.length < 3 || reason.length > 1000) {
    throw new Error("reason must be between 3 and 1000 characters");
  }
  return { state: state as KinfolkCatalogState, reason };
}

function safePage(value: unknown): number {
  const page = Number.parseInt(String(value ?? "1"), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function safePageSize(value: unknown): number {
  const pageSize = Number.parseInt(String(value ?? "50"), 10);
  return Number.isFinite(pageSize) ? Math.max(1, Math.min(pageSize, 100)) : 50;
}

/**
 * The catalog is a durable, admin-managed cohort relation. It deliberately
 * contains only existing canonical business ids; it never publishes, clones,
 * creates, or changes a business listing's lifecycle.
 */
export function registerKinfolkCatalogAdminRoutes(app: Express, database: CatalogDatabase = defaultPool as CatalogDatabase): void {
  app.get("/api/admin/kinfolk-catalog", async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin required" });
      return;
    }
    const page = safePage(req.query.page);
    const pageSize = safePageSize(req.query.pageSize);
    const search = String(req.query.search ?? "").trim();
    const city = String(req.query.city ?? "").trim();
    const state = String(req.query.state ?? "all").trim();
    if (state !== "all" && !KINFOLK_CATALOG_STATES.includes(state as KinfolkCatalogState)) {
      res.status(400).json({ error: "Unknown catalog state" });
      return;
    }

    const filters = ["m.cohort_key = $1"];
    const params: unknown[] = [KINFOLK_CATALOG_COHORT_KEY];
    if (search) {
      params.push(`%${search}%`);
      filters.push(`(b.name ILIKE $${params.length} OR b.city ILIKE $${params.length} OR b.category ILIKE $${params.length})`);
    }
    if (city) {
      params.push(city);
      filters.push(`LOWER(BTRIM(b.city)) = LOWER(BTRIM($${params.length}))`);
    }
    if (state !== "all") {
      params.push(state);
      filters.push(`m.state = $${params.length}`);
    }
    const where = filters.join(" AND ");
    try {
      const [rows, total] = await Promise.all([
        database.query<{
          business_id: string; name: string; city: string | null; state_code: string | null;
          category: string | null; listing_status: string | null; is_duplicate: boolean;
          catalog_state: KinfolkCatalogState; reason: string; updated_at: string; created_at: string;
        }>(
          `SELECT m.business_id, b.name, b.city, b.state AS state_code, b.category, b.listing_status,
                  COALESCE(b.is_duplicate, false) AS is_duplicate, m.state AS catalog_state,
                  m.reason, m.updated_at, m.created_at
             FROM business_catalog_cohort_memberships m
             JOIN businesses b ON b.id = m.business_id
            WHERE ${where}
            ORDER BY m.updated_at DESC, b.name ASC, b.id ASC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, pageSize, (page - 1) * pageSize],
        ),
        database.query<{ total: string }>(
          `SELECT COUNT(*)::text AS total
             FROM business_catalog_cohort_memberships m
             JOIN businesses b ON b.id = m.business_id
            WHERE ${where}`,
          params,
        ),
      ]);
      const filteredTotal = Number(total.rows[0]?.total ?? 0);
      res.json({
        memberships: rows.rows.map((row) => ({
          businessId: row.business_id,
          name: row.name,
          city: row.city,
          state: row.state_code,
          category: row.category,
          listingStatus: row.listing_status,
          isDuplicate: row.is_duplicate,
          catalogState: row.catalog_state,
          reason: row.reason,
          updatedAt: row.updated_at,
          createdAt: row.created_at,
        })),
        page,
        pageSize,
        filteredTotal,
        totalPages: Math.max(1, Math.ceil(filteredTotal / pageSize)),
        states: KINFOLK_CATALOG_STATES,
      });
    } catch (error) {
      req.log.error({ error }, "Failed to load Kinfolk Catalog cohort");
      res.status(500).json({ error: "Could not load the Kinfolk Catalog cohort" });
    }
  });

  app.patch("/api/admin/kinfolk-catalog/:businessId", async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin required" });
      return;
    }
    let change: CatalogStateChange;
    try {
      change = parseKinfolkCatalogStateChange(req.body);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid catalog change" });
      return;
    }

    const businessId = String(req.params.businessId ?? "").trim();
    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      const business = await client.query<{ id: string; name: string; is_duplicate: boolean }>(
        "SELECT id, name, COALESCE(is_duplicate, false) AS is_duplicate FROM businesses WHERE id = $1 FOR UPDATE",
        [businessId],
      );
      if (!business.rows[0]) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      if (business.rows[0].is_duplicate) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Confirmed duplicate records cannot be added to the Kinfolk Catalog" });
        return;
      }
      const before = await client.query<{ state: KinfolkCatalogState; reason: string; updated_at: string }>(
        `SELECT state, reason, updated_at
           FROM business_catalog_cohort_memberships
          WHERE business_id = $1 AND cohort_key = $2
          FOR UPDATE`,
        [businessId, KINFOLK_CATALOG_COHORT_KEY],
      );
      const current = before.rows[0] ?? null;
      const updated = await client.query<{
        business_id: string; state: KinfolkCatalogState; reason: string; created_at: string; updated_at: string;
      }>(
        `INSERT INTO business_catalog_cohort_memberships
           (business_id, cohort_key, state, reason, created_by_user_id, updated_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (business_id, cohort_key) DO UPDATE
           SET state = EXCLUDED.state,
               reason = EXCLUDED.reason,
               updated_by_user_id = EXCLUDED.updated_by_user_id,
               updated_at = NOW()
         RETURNING business_id, state, reason, created_at, updated_at`,
        [businessId, KINFOLK_CATALOG_COHORT_KEY, change.state, change.reason, req.user?.id ?? null],
      );
      const membership = updated.rows[0];
      await client.query(
        `INSERT INTO business_catalog_cohort_audit_events
           (id, business_id, cohort_key, action, actor_user_id, reason, before_state, after_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
        [
          randomUUID(), businessId, KINFOLK_CATALOG_COHORT_KEY,
          current ? "state_changed" : "added",
          req.user?.id ?? null,
          change.reason,
          JSON.stringify(current),
          JSON.stringify(membership),
        ],
      );
      await client.query("COMMIT");
      res.json({ business: business.rows[0], membership, changed: true });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      req.log.error({ error }, "Failed to update Kinfolk Catalog membership");
      res.status(500).json({ error: "Could not update the Kinfolk Catalog membership" });
    } finally {
      client.release();
    }
  });
}
