import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ADMIN_PROFILE_COMMUNITY_SIGNAL_FIELDS, adminProfileUpdateSqlBinding, directAdminCreationUnsafeFields, normalizeBusinessIdentityPart, validateAdminBusinessProfilePatch } from "../adminBusinessProfilePolicy";

const existing = {
  name: "Community Books", description: "Independent community bookstore.", address: "123 Main Street", city: "Philadelphia", state: "PA",
  phone: null, website: null, hours: null, priceRange: null, instagram: null, tiktok: null, facebook: null, twitter: null, youtube: null, pinterest: null,
  category: "Books & Media", subcategory: "Bookstore", tags: ["books"], vibes: [] as string[], ownershipDesignations: [] as string[],
};
const receipt = (field: string, identityMatch = false) => ({ field, sourceUrl: "https://example.org/about", sourceLabel: "Official about page", observedAt: "2026-10-05", confidence: "high", note: "Publicly stated by the business.", identityMatch, identityMatchSignal: identityMatch ? "business_name" : null });
function patch(overrides: Record<string, unknown> = {}) { return { name: "Community Books", description: "Independent community bookstore.", city: "Philadelphia", category: "Books & Media", subcategory: "Bookstore", tags: ["books"], vibes: [], ownershipDesignations: [], changeNote: "Corrected public profile details from a current official source.", ...overrides }; }
const routeSource = () => readFileSync(fileURLToPath(new URL("../../routes/businesses.ts", import.meta.url)), "utf8");

describe("audited administrator business profile policy", () => {
  it("rejects generic attempts to change lifecycle, verification, ownership badges, or pins", () => {
    for (const blocked of ["blackOwned", "verified", "listingStatus", "latitude", "verifiedDesignations"]) expect(() => validateAdminBusinessProfilePatch(patch({ [blocked]: blocked === "blackOwned" }), existing)).toThrow("governed by a separate reviewed workflow");
  });
  it("does not allow an official-profile edit to mutate member-supplied tags, endorsements, check-ins, reviews, or Tia signals", () => {
    for (const field of ADMIN_PROFILE_COMMUNITY_SIGNAL_FIELDS) {
      expect(() => validateAdminBusinessProfilePatch(patch({ [field]: [] }), existing)).toThrow("community member information");
    }
  });
  it("requires a public source receipt for every changed public fact", () => {
    expect(() => validateAdminBusinessProfilePatch(patch({ description: "Updated bookstore description." }), existing)).toThrow("source receipt is required for: description");
    const descriptionChange = validateAdminBusinessProfilePatch(patch({ description: "Updated bookstore description.", sourceReceipts: [receipt("description")] }), existing);
    expect(descriptionChange.requiredReceiptFields).toEqual(["description"]);
    expect(descriptionChange.receiptObservedValues).toEqual({ description: { fields: { description: "Updated bookstore description." }, identityMatch: { asserted: false, signal: null } } });
    expect(() => validateAdminBusinessProfilePatch(patch({ priceRange: "$$" }), existing)).toThrow("source receipt is required for: price_range");
    const priceChange = validateAdminBusinessProfilePatch(patch({ priceRange: "$$", sourceReceipts: [receipt("price_range")] }), existing);
    expect(priceChange.requiredReceiptFields).toEqual(["price_range"]);
    expect(priceChange.receiptObservedValues).toEqual({ price_range: { fields: { price_range: "$$" }, identityMatch: { asserted: false, signal: null } } });
  });
  it("requires a public ownership source receipt for an ownership designation change", () => {
    expect(() => validateAdminBusinessProfilePatch(patch({ ownershipDesignations: ["Black-Owned"] }), existing)).toThrow("source receipt is required");
    expect(validateAdminBusinessProfilePatch(patch({ ownershipDesignations: ["Black-Owned"], ownershipReceipt: { sourceUrl: "https://example.org/owners", sourceLabel: "Dated official ownership announcement", observedAt: "2026-10-05", note: "Explicit ownership statement." } }), existing).fieldReceipts).toContainEqual(expect.objectContaining({ field: "ownership", sourceUrl: "https://example.org/owners" }));
  });
  it("binds editable array fields as JSONB rather than PostgreSQL arrays", () => {
    expect(adminProfileUpdateSqlBinding("ownership_designations", ["Black / African American-Owned"])).toEqual({ value: '["Black / African American-Owned"]', jsonb: true });
    expect(adminProfileUpdateSqlBinding("vibes", ["Welcoming"])).toEqual({ value: '["Welcoming"]', jsonb: true });
    expect(adminProfileUpdateSqlBinding("website", "https://communitybooks.example")).toEqual({ value: "https://communitybooks.example", jsonb: false });
    expect(routeSource()).toContain('binding.jsonb ? "::jsonb" : ""');
  });
  it("rejects private-network website values and invalidates a pin after a sourced location edit", () => {
    expect(() => validateAdminBusinessProfilePatch(patch({ website: "http://127.0.0.1/private" }), existing)).toThrow("valid public https or http URL");
    const validated = validateAdminBusinessProfilePatch(patch({ address: "456 Walnut Street", sourceReceipts: [receipt("address")] }), existing);
    expect(validated.locationChanged).toBe(true);
  });
  it("never accepts a directory as an official website or a cross-platform social URL", () => {
    expect(() => validateAdminBusinessProfilePatch(patch({ website: "https://www.yelp.com/biz/community-books" }), existing)).toThrow("official website");
    expect(() => validateAdminBusinessProfilePatch(patch({ website: "https://www.doordash.com/store/community-books" }), existing)).toThrow("official website");
    expect(() => validateAdminBusinessProfilePatch(patch({ website: "https://www.instagram.com/communitybooks/" }), existing)).toThrow("official website");
    expect(() => validateAdminBusinessProfilePatch(patch({ website: "https://g.page/community-books" }), existing)).toThrow("official website");
    expect(() => validateAdminBusinessProfilePatch(patch({ instagram: "https://www.yelp.com/biz/community-books" }), existing)).toThrow("official instagram");
    expect(() => validateAdminBusinessProfilePatch(patch({ instagram: "https://www.instagram.com/communitybooks/", sourceReceipts: [receipt("instagram")] }), existing)).toThrow("explicit identity match");
    expect(validateAdminBusinessProfilePatch(patch({ instagram: "https://www.instagram.com/communitybooks/", sourceReceipts: [receipt("instagram", true)] }), existing).patch.instagram).toContain("instagram.com");
  });
  it("allows the legacy direct-create path to create only a staged receipt-free shell", () => {
    expect(directAdminCreationUnsafeFields({ website: "https://communitybooks.example", instagram: "", ownershipDesignations: [], blackOwned: false })).toEqual(["website"]);
    expect(directAdminCreationUnsafeFields({ ownershipDesignations: ["Black-Owned"], blackOwned: true })).toEqual(["ownershipDesignations", "blackOwned"]);
    expect(directAdminCreationUnsafeFields({ website: "", ownershipDesignations: [], blackOwned: false })).toEqual([]);
  });
  it("normalizes identity comparison without equating different cities", () => {
    expect(normalizeBusinessIdentityPart("Uncle Bobbie’s Coffee & Books")).toBe("unclebobbiescoffeebooks");
    expect(normalizeBusinessIdentityPart("Philadelphia")).not.toBe(normalizeBusinessIdentityPart("Houston"));
  });
  it("uses central authorization, transactions, receipts, and immutable audit events in the canonical edit route", () => {
    const source = routeSource();
    expect(source).toContain('router.get("/admin/businesses/:id/profile"'); expect(source).toContain("if (!hasAdminAccess(req))"); expect(source).toContain("business_profile_field_receipts"); expect(source).toContain("business_admin_profile_edit_audit_events"); expect(source).toContain('await client.query("BEGIN")'); expect(source).toContain('await client.query("COMMIT")'); expect(source).toContain("map_coordinates_cleared_after_address_change"); expect(source).toContain("Use the audited duplicate review workflow instead"); expect(source).toContain('includes("same_name_and_address")');
    const profileEditSource = source.slice(source.indexOf('router.patch("/admin/businesses/:id/profile"'), source.indexOf("export default router"));
    expect(profileEditSource).not.toMatch(/(?:DELETE|UPDATE)\s+.*(?:business_vibe_evidence|business_endorsement_taps|reviews|checkins)/i);
    expect(profileEditSource).toContain("receiptObservedValues[receipt.field]");
    expect(source).toContain("observedValue: receipt.observed_value");
    const retiredMediaRoute = source.slice(source.indexOf('router.post(\n  "/admin/businesses/:id/social-link"'), source.indexOf('router.get(\n  "/admin/businesses/check-duplicate"'));
    expect(retiredMediaRoute).toContain("UNRECEIPTED_SOCIAL_MEDIA_ROUTE_RETIRED");
    expect(retiredMediaRoute).not.toContain(".update(businessesTable)");
    const directCreateRoute = source.slice(source.indexOf('router.post(\n  "/admin/businesses"'), source.indexOf('router.post(\n  "/admin/businesses/:id/confirm-fake"'));
    expect(directCreateRoute).toContain("FIELD_RECEIPTS_REQUIRED_FOR_PRESENCE");
    expect(directCreateRoute).toContain("STAGED_CREATION_REQUIRED");
  });

  it("uses the canonical updated timestamp as an Admin profile revision and denies stale writes before receipts or audit effects", () => {
    const source = routeSource();
    const profileRead = source.slice(
      source.indexOf('router.get("/admin/businesses/:id/profile"'),
      source.indexOf('router.patch("/admin/businesses/:id/profile"'),
    );
    const profilePatch = source.slice(
      source.indexOf('router.patch("/admin/businesses/:id/profile"'),
      source.indexOf('router.post(\n  "/admin/seed-known-businesses"'),
    );
    const lock = profilePatch.indexOf("FOR UPDATE");
    const staleCheck = profilePatch.indexOf("businessProfileRevisionMatches(existing.updated_at, expectedUpdatedAt)");
    const validation = profilePatch.indexOf("validateAdminBusinessProfilePatch", staleCheck);
    const update = profilePatch.indexOf("UPDATE businesses", validation);
    const receipts = profilePatch.indexOf("INSERT INTO business_profile_field_receipts", update);
    const audit = profilePatch.indexOf("INSERT INTO business_admin_profile_edit_audit_events", receipts);

    expect(source).toContain("is_duplicate: boolean;\n  updated_at: string;");
    expect(source).toContain("AS is_duplicate, updated_at");
    expect(source).toContain("updatedAt: row.updated_at");
    expect(profileRead).toContain("business: toAdminBusinessProfile(row)");
    expect(profilePatch).toContain("parseExpectedBusinessProfileUpdatedAt(");
    expect(profilePatch).toContain('code: "BUSINESS_PROFILE_REVISION_REQUIRED"');
    expect(lock).toBeGreaterThanOrEqual(0);
    expect(staleCheck).toBeGreaterThan(lock);
    expect(source).toContain('code: "BUSINESS_PROFILE_STALE_WRITE"');
    expect(validation).toBeGreaterThan(staleCheck);
    expect(update).toBeGreaterThan(validation);
    expect(receipts).toBeGreaterThan(update);
    expect(audit).toBeGreaterThan(receipts);
    expect(profilePatch).toContain("AS is_duplicate, updated_at");
    expect(profilePatch).toContain("GREATEST(clock_timestamp(), updated_at + INTERVAL '1 millisecond')");
  });
});
