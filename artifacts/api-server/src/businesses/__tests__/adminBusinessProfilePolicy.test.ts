import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  normalizeBusinessIdentityPart,
  validateAdminBusinessProfilePatch,
} from "../adminBusinessProfilePolicy";

const existing = {
  name: "Community Books",
  address: "123 Main Street",
  city: "Philadelphia",
  state: "PA",
  ownershipDesignations: [] as string[],
};

function patch(overrides: Record<string, unknown> = {}) {
  return {
    name: "Community Books",
    description: "Independent community bookstore.",
    city: "Philadelphia",
    category: "Books & Media",
    subcategory: "Bookstore",
    tags: ["books"],
    vibes: [],
    ownershipDesignations: [],
    changeNote: "Corrected public profile details from a current official source.",
    ...overrides,
  };
}

const routeSource = () => readFileSync(
  fileURLToPath(new URL("../../routes/businesses.ts", import.meta.url)),
  "utf8",
);

describe("audited administrator business profile policy", () => {
  it("rejects generic attempts to change lifecycle, verification, ownership badges, or pins", () => {
    for (const blocked of ["blackOwned", "verified", "listingStatus", "latitude", "verifiedDesignations"]) {
      expect(() => validateAdminBusinessProfilePatch(patch({ [blocked]: blocked === "blackOwned" }), existing))
        .toThrow("governed by a separate reviewed workflow");
    }
  });

  it("requires a public ownership source receipt for an ownership designation change", () => {
    expect(() => validateAdminBusinessProfilePatch(patch({ ownershipDesignations: ["Black-Owned"] }), existing))
      .toThrow("source receipt is required");
    expect(validateAdminBusinessProfilePatch(patch({
      ownershipDesignations: ["Black-Owned"],
      ownershipReceipt: {
        sourceUrl: "https://example.org/owners",
        sourceLabel: "Dated official ownership announcement",
        observedAt: "2026-10-05",
        note: "Explicit ownership statement.",
      },
    }), existing).ownershipReceipt).toMatchObject({ sourceUrl: "https://example.org/owners" });
  });

  it("rejects private-network website values and invalidates a pin after a location edit", () => {
    expect(() => validateAdminBusinessProfilePatch(patch({ website: "http://127.0.0.1/private" }), existing))
      .toThrow("valid public https or http URL");
    const validated = validateAdminBusinessProfilePatch(patch({ address: "456 Walnut Street" }), existing);
    expect(validated.locationChanged).toBe(true);
  });

  it("normalizes identity comparison without equating different cities", () => {
    expect(normalizeBusinessIdentityPart("Uncle Bobbie’s Coffee & Books")).toBe("unclebobbiescoffeebooks");
    expect(normalizeBusinessIdentityPart("Philadelphia")).not.toBe(normalizeBusinessIdentityPart("Houston"));
  });

  it("uses central authorization, transactions, source receipts, and immutable audit events in the canonical edit route", () => {
    const source = routeSource();
    expect(source).toContain('router.get("/admin/businesses/:id/profile"');
    expect(source).toContain("if (!hasAdminAccess(req))");
    expect(source).toContain("business_admin_ownership_source_receipts");
    expect(source).toContain("business_admin_profile_edit_audit_events");
    expect(source).toContain('await client.query("BEGIN")');
    expect(source).toContain('await client.query("COMMIT")');
    expect(source).toContain("map_coordinates_cleared_after_address_change");
    expect(source).toContain("Use the audited duplicate review workflow instead");
  });
});
