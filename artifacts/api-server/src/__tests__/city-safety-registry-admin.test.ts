import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminRoute = readFileSync(
  fileURLToPath(new URL("../routes/admin.ts", import.meta.url)),
  "utf8",
);
const migrations = readFileSync(
  fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);

describe("city safety source registry administration", () => {
  it("is admin-only, source-reviewed, versioned, and content-minimized", () => {
    expect(adminRoute).toContain('router.get("/admin/kinfolk/city-safety-sources"');
    expect(adminRoute).toContain('router.put("/admin/kinfolk/city-safety-sources/:sourceId"');
    expect(adminRoute).toContain("if (!isAdmin(req))");
    expect(adminRoute).toContain("new URL(url).protocol !== \"https:\"");
    expect(adminRoute).toContain("reviewed_by = $10, version = version + 1");
    expect(adminRoute).not.toContain("raw source body");
  });

  it("uses additive idempotent registry and minimal retrieval-audit migrations", () => {
    expect(migrations).toContain("CREATE TABLE IF NOT EXISTS kinfolk_city_safety_sources");
    expect(migrations).toContain("CREATE TABLE IF NOT EXISTS kinfolk_city_safety_retrieval_audit_events");
    expect(migrations).toContain("ON CONFLICT (id) DO NOTHING");
    const auditSchema = migrations.slice(
      migrations.indexOf("CREATE TABLE IF NOT EXISTS kinfolk_city_safety_retrieval_audit_events"),
      migrations.indexOf("CREATE INDEX IF NOT EXISTS kinfolk_city_safety_audit_source_created_idx"),
    );
    expect(auditSchema).not.toContain("user_id");
    expect(auditSchema).not.toContain("prompt");
    expect(auditSchema).not.toContain("message");
  });
});
