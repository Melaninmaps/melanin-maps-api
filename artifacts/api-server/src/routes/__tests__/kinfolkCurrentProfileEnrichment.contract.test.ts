import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../businesses.ts", import.meta.url)), "utf8");
const route = source.slice(
  source.indexOf("async function applyProfileEnrichmentManifest"),
  source.indexOf("// ─── POST /admin/seed-known-businesses"),
);

describe("source-receipted profile enrichment route", () => {
  it("requires administrator authorization, a verified manifest, and exact membership scope", () => {
    expect(route).toContain("hasAdminAccess(req)");
    expect(route).toContain("parseProfileEnrichmentManifest");
    expect(route).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(route).toContain("kinfolkCurrentSqlPredicate");
    expect(route).toContain("manifest.scope === \"kinfolk_current\"");
    expect(route).toContain("profileEnrichmentIdentityMatches");
  });

  it("uses audited receipts for the approved additive profile fields", () => {
    expect(route).toContain("isEmptyProfileEnrichmentField");
    expect(route).toContain('"instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest"');
    expect(route).toContain("sourceReceipts.length !== Object.keys(fillOnlyPatch).length");
    expect(route).toContain("business_profile_field_receipts");
    expect(route).toContain("business_admin_profile_edit_audit_events");
    expect(route).toContain("isGenericDirectoryProfileDescription");
  });

  it("holds scope, lifecycle, identity, and populated-value conflicts without overwriting", () => {
    expect(route).toContain("Business is already in Kinfolk Current and is outside the non-current enrichment scope.");
    expect(route).toContain("kinfolk_current_online_presence_reviews");
    expect(route).toContain("Business is not currently publicly listed.");
    expect(route).toContain("differs from the reviewed source snapshot");
    expect(route).toContain("HOLD_IDENTITY_OR_CONTACT_CONFLICT");
    expect(route).toContain("existingTags");
  });

  it("keeps the legacy Current endpoint as an alias to the same audited handler", () => {
    expect(source).toContain('router.post("/admin/businesses/profile-enrichment-apply", applyProfileEnrichmentManifest)');
    expect(source).toContain('router.post("/admin/businesses/kinfolk-current/profile-enrichment-apply", applyProfileEnrichmentManifest)');
  });
});
