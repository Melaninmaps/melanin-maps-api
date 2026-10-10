import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  runSafetyHubLifecycleReconciliation,
} from "../safetyHubLifecycleRunner";
import {
  getCachedProximityWarnings,
  proximityCacheKey,
  setCachedProximityWarnings,
} from "../proximityWarningCache";

type QueryResponse = { rows: unknown[]; rowCount?: number };

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

function lifecycleDatabase(respond: (sql: string) => QueryResponse) {
  const query = vi.fn(async (sql: string) => respond(sql));
  const release = vi.fn();
  return {
    query,
    release,
    database: { connect: vi.fn().mockResolvedValue({ query, release }) },
  };
}

describe("Safety Hub lifecycle reconciliation", () => {
  const now = new Date("2026-10-10T15:00:00.000Z");

  it("deactivates only current display projections and invalidates their cache after commit", async () => {
    const fake = lifecycleDatabase((sql) => {
      if (sql.includes("COUNT(*)::text AS count")) return { rows: [{ count: "2" }], rowCount: 1 };
      if (sql.includes("UPDATE safety_reports")) return { rows: [{ id: "report-corrected" }], rowCount: 1 };
      if (sql.includes("UPDATE community_alerts") && sql.includes("expires_at <=")) {
        return { rows: [{ id: "alert-expired" }], rowCount: 1 };
      }
      if (sql.includes("UPDATE community_alerts") && sql.includes("corrected_at IS NOT NULL")) {
        return { rows: [{ id: "alert-corrected" }], rowCount: 1 };
      }
      if (sql.includes("SELECT DISTINCT target_id")) return { rows: [], rowCount: 0 };
      if (sql.includes("UPDATE safety_incidents")) return { rows: [{ id: "incident-stale" }], rowCount: 1 };
      if (sql.includes("SELECT city, region, category, neighborhood")) return { rows: [], rowCount: 0 };
      return { rows: [], rowCount: 0 };
    });
    const key = proximityCacheKey(39.953, -75.165, 500);
    setCachedProximityWarnings(key, { warnings: [{ id: "stale" }], areaIncidents: [] });

    const result = await runSafetyHubLifecycleReconciliation({
      database: fake.database as never,
      now,
    });

    expect(result).toEqual({
      expiredReportDisplaysObserved: 2,
      correctedReportDisplaysDeactivated: 1,
      expiredCommunityAlertsDeactivated: 1,
      correctedCommunityAlertsDeactivated: 1,
      businessRatingsReconciled: 0,
      staleIncidentsResolved: 1,
      activeIncidentsReconciled: 0,
      displayCachesInvalidated: true,
    });
    expect(fake.query).toHaveBeenCalledWith("COMMIT");
    expect(fake.release).toHaveBeenCalledOnce();
    expect(getCachedProximityWarnings(key)).toBeNull();

    const statements = fake.query.mock.calls.map(([sql]) => String(sql)).join("\n");
    expect(statements).toContain("SET display_expires_at = $1");
    expect(statements).toContain("SET is_active = false");
    expect(statements).toContain("SET status = 'resolved'");
    expect(statements).not.toMatch(/SET is_active = false,\s*expires_at/i);
    expect(statements).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b/i);
  });

  it("rebuilds a business safety projection from current evidence without changing the source report", async () => {
    const fake = lifecycleDatabase((sql) => {
      if (sql.includes("COUNT(*)::text AS count")) return { rows: [{ count: "0" }], rowCount: 1 };
      if (sql.includes("UPDATE safety_reports") || sql.includes("UPDATE community_alerts")) return { rows: [], rowCount: 0 };
      if (sql.includes("SELECT DISTINCT target_id")) return { rows: [{ target_id: "business-1" }], rowCount: 1 };
      if (sql.includes("pg_advisory_xact_lock")) return { rows: [], rowCount: 1 };
      if (sql.includes("SELECT severity, COUNT(*)::text AS count")) return { rows: [], rowCount: 0 };
      if (sql.includes("UPDATE businesses SET safety_rating = NULL")) return { rows: [], rowCount: 1 };
      if (sql.includes("FROM business_safety_submissions")) return { rows: [{ rating: "4.25" }], rowCount: 1 };
      if (sql.includes("UPDATE businesses SET safety_rating = $1")) return { rows: [], rowCount: 1 };
      if (sql.includes("UPDATE safety_incidents") || sql.includes("SELECT city, region, category, neighborhood")) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    });

    const result = await runSafetyHubLifecycleReconciliation({
      database: fake.database as never,
      now,
    });

    expect(result.businessRatingsReconciled).toBe(1);
    const statements = fake.query.mock.calls.map(([sql]) => String(sql)).join("\n");
    expect(statements).toContain("FROM safety_reports");
    expect(statements).toContain("AND display_expires_at > NOW()");
    expect(statements).toContain("UPDATE businesses SET safety_rating = NULL");
    expect(statements).toContain("UPDATE businesses SET safety_rating = $1 WHERE id = $2");
  });

  it("keeps an unchanged cache when no lifecycle projection needs reconciliation", async () => {
    const fake = lifecycleDatabase(() => ({ rows: [], rowCount: 0 }));
    const key = proximityCacheKey(38.907, -77.037, 500);
    const cached = { warnings: [{ id: "current" }], areaIncidents: [] };
    setCachedProximityWarnings(key, cached);

    const result = await runSafetyHubLifecycleReconciliation({
      database: fake.database as never,
      now,
    });

    expect(result.displayCachesInvalidated).toBe(false);
    expect(getCachedProximityWarnings(key)).toEqual(cached);
  });

  it("rolls back and leaves cached projections alone when the durable reconciliation fails", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql === "BEGIN") return { rows: [], rowCount: 0 };
      if (sql.includes("COUNT(*)::text AS count")) throw new Error("database unavailable");
      return { rows: [], rowCount: 0 };
    });
    const release = vi.fn();
    const key = proximityCacheKey(33.749, -84.388, 500);
    const cached = { warnings: [{ id: "still-current" }], areaIncidents: [] };
    setCachedProximityWarnings(key, cached);

    await expect(runSafetyHubLifecycleReconciliation({
      database: { connect: vi.fn().mockResolvedValue({ query, release }) } as never,
      now,
    })).rejects.toThrow("database unavailable");

    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
    expect(getCachedProximityWarnings(key)).toEqual(cached);
  });

  it("uses the existing secret-protected scheduler pattern and filters every Safety Hub display read", () => {
    const runner = source("../safetyHubLifecycleRunner.ts");
    const cron = source("../../routes/cron.ts");
    const directions = source("../../routes/directions.ts");

    expect(runner).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b/i);
    expect(cron).toContain('router.post("/cron/safety-hub-lifecycle"');
    expect(cron).toContain("if (!verifyCronSecret(req, res)) return;");
    expect(cron).toContain("runSafetyHubLifecycleReconciliation()");
    expect(directions).toContain("AND sr.withdrawn_at IS NULL");
    expect(directions).toContain("AND sr.display_expires_at > NOW()");
  });
});
