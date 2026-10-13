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
  it("audits only Instagram when a full editor form changes only Instagram", () => {
    const fullEditorSubmission = {
      name: existing.name,
      description: existing.description,
      address: existing.address,
      city: existing.city,
      state: existing.state,
      phone: existing.phone,
      website: existing.website,
      hours: existing.hours,
      priceRange: existing.priceRange,
      instagram: "https://www.instagram.com/communitybooks/",
      tiktok: existing.tiktok,
      facebook: existing.facebook,
      twitter: existing.twitter,
      youtube: existing.youtube,
      pinterest: existing.pinterest,
      category: existing.category,
      subcategory: existing.subcategory,
      tags: existing.tags,
      vibes: existing.vibes,
      ownershipDesignations: existing.ownershipDesignations,
      changeNote: "Added the verified official Instagram profile.",
      sourceReceipts: [receipt("instagram", true)],
    };

    const validated = validateAdminBusinessProfilePatch(fullEditorSubmission, existing);
    expect(validated.changedColumns).toEqual(["instagram"]);
    expect(routeSource()).toContain('const changedFields = [...validated.changedColumns');
  });
  it("does not convert legacy null tags or vibes into an unrelated sourced update", () => {
    const legacyEmptyArrays = { ...existing, tags: null, vibes: null };
    const fullEditorSubmission = patch({
      phone: "215-555-0100",
      tags: [],
      vibes: [],
      changeNote: "Added the verified official phone number.",
      sourceReceipts: [receipt("phone")],
    });

    const validated = validateAdminBusinessProfilePatch(fullEditorSubmission, legacyEmptyArrays);
    expect(validated.changedColumns).toEqual(["phone"]);
    expect(validated.requiredReceiptFields).toEqual(["phone"]);
    expect(routeSource()).toContain('Object.entries(validated.patch).filter(([column]) => validated.changedColumns.includes(column))');
  });
  it("records each official social platform with its own matching receipt field", () => {
    for (const [field, value] of [
      ["twitter", "https://x.com/communitybooks"],
      ["youtube", "https://www.youtube.com/@communitybooks"],
      ["pinterest", "https://www.pinterest.com/communitybooks/"],
    ] as const) {
      const validated = validateAdminBusinessProfilePatch(patch({
        [field]: value,
        sourceReceipts: [receipt(field, true)],
      }), existing);
      expect(validated.changedColumns).toEqual([field]);
      expect(validated.requiredReceiptFields).toEqual([field]);
    }
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
});
