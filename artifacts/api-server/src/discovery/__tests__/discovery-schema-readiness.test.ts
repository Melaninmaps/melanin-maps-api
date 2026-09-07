import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { ensureRequiredDiscoverySchema } from "../../lib/startup-migrations";

const requiredTables = [
  "discovery_taxonomy_concepts",
  "business_offering_evidence",
  "discovery_events_v1",
  "discovery_member_preferences",
];

describe("required Discovery V1 startup schema", () => {
  it("fails closed when the post-migration assertion finds a missing table", async () => {
    const db = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: requiredTables.slice(0, -1).map((table_name) => ({ table_name })) }),
    };

    await expect(ensureRequiredDiscoverySchema(db as any)).rejects.toThrow(
      "missing tables: discovery_member_preferences",
    );
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it("is awaited in boot flow before the server starts listening", () => {
    const startup = readFileSync(new URL("../../index.ts", import.meta.url), "utf8");
    const assertion = startup.indexOf("await ensureRequiredDiscoverySchema(pool, logger)");
    const listen = startup.indexOf("app.listen(port");
    expect(assertion).toBeGreaterThan(-1);
    expect(listen).toBeGreaterThan(assertion);
  });
  it("makes the canonical public view expose postal_code and keeps DB analytics allowlisted", () => {
    const source = readFileSync(new URL("../../lib/startup-migrations.ts", import.meta.url), "utf8");
    expect(source).toContain("CREATE OR REPLACE VIEW public.public_businesses");
    expect(source).toContain("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS postal_code TEXT");
    expect(source).toContain("discovery_analytics_allowed_filter_ids");
    expect(source).toContain("a.filter_key=item.key AND a.filter_id=value_item #>> '{}'");
    expect(source).toContain("businesses_discovery_city_postal_idx");
  });
});