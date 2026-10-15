import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../businesses.ts", import.meta.url)), "utf8");

describe("Kinfolk Current official-site profile enrichment route", () => {
  it("requires administrator authorization and a verified manifest", () => {
    const route = source.slice(source.indexOf('router.post("/admin/businesses/kinfolk-current/profile-enrichment-apply"'), source.indexOf("// ─── POST /admin/seed-known-businesses"));
    expect(route).toContain("hasAdminAccess(req)");
    expect(route).toContain("parseKinfolkCurrentProfileEnrichmentManifest");
    expect(route).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(route).toContain("kinfolkCurrentSqlPredicate");
    expect(route).toContain("profileEnrichmentIdentityMatches");
  });

  it("can only fill empty, receipt-backed profile fields", () => {
    const route = source.slice(source.indexOf('router.post("/admin/businesses/kinfolk-current/profile-enrichment-apply"'), source.indexOf("// ─── POST /admin/seed-known-businesses"));
    expect(route).toContain("isEmptyProfileEnrichmentField");
    expect(route).toContain('["description", "hours", "phone", "tags"]');
    expect(route).toContain("sourceReceipts.length !== Object.keys(fillOnlyPatch).length");
    expect(route).toContain("business_profile_field_receipts");
    expect(route).toContain("business_admin_profile_edit_audit_events");
  });

  it("skips changes when lifecycle, delete review, identity, or current field state changed", () => {
    const route = source.slice(source.indexOf('router.post("/admin/businesses/kinfolk-current/profile-enrichment-apply"'), source.indexOf("// ─── POST /admin/seed-known-businesses"));
    expect(route).toContain("kinfolk_current_online_presence_reviews");
    expect(route).toContain("Business is not currently publicly listed.");
    expect(route).toContain("differs from the reviewed source snapshot");
    expect(route).toContain("will not overwrite them");
  });
});
