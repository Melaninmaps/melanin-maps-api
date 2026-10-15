import { describe, expect, it } from "vitest";
import {
  KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION,
  PROFILE_ENRICHMENT_MANIFEST_VERSION,
  isEmptyProfileEnrichmentField,
  isGenericProfileEnrichmentDescriptionPlaceholder,
  kinfolkCurrentProfileEnrichmentFingerprint,
  parseKinfolkCurrentProfileEnrichmentManifest,
  parseProfileEnrichmentManifest,
  profileEnrichmentFingerprint,
} from "../kinfolkCurrentProfileEnrichment";

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    businessId: "business-1",
    expectedIdentity: { name: "Community Books", city: "Philadelphia", state: "PA", website: "https://communitybooks.example/" },
    patch: { description: "Independent neighborhood bookstore.", hours: "Tuesday through Saturday, 10 AM to 6 PM", tags: ["books", "community events"] },
    receipts: [
      { field: "description", sourceUrl: "https://communitybooks.example/about", sourceLabel: "Official About page", observedAt: "2026-10-15", confidence: "high", note: "Community Books describes itself as an independent neighborhood bookstore." },
      { field: "hours", sourceUrl: "https://communitybooks.example/contact", sourceLabel: "Official Contact page", observedAt: "2026-10-15", confidence: "high", note: "The page lists Tuesday through Saturday, 10 AM to 6 PM." },
      { field: "service_tags", sourceUrl: "https://communitybooks.example/events", sourceLabel: "Official Events page", observedAt: "2026-10-15", confidence: "medium", note: "The page explicitly lists books and community events." },
    ],
    ...overrides,
  };
}

function manifest(overrides: Record<string, unknown> = {}) {
  const base = {
    version: KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION,
    batchId: "official-site-001",
    generatedAt: "2026-10-15T19:00:00.000Z",
    candidates: [candidate()],
    ...overrides,
  } as Record<string, unknown>;
  return { ...base, contentFingerprint: kinfolkCurrentProfileEnrichmentFingerprint(base as never) };
}

function nonCurrentManifest(overrides: Record<string, unknown> = {}) {
  const base = {
    version: PROFILE_ENRICHMENT_MANIFEST_VERSION,
    scope: "non_kinfolk_current",
    batchId: "non-current-official-site-001",
    generatedAt: "2026-10-15T19:00:00.000Z",
    candidates: [candidate({
      patch: {
        description: "Independent neighborhood bookstore with author events.",
        tags: ["books", "author events"],
        instagram: "https://www.instagram.com/communitybooks/",
      },
      fieldModes: { description: "replace_generic_directory", tags: "append", instagram: "fill" },
      receipts: [
        { field: "description", sourceUrl: "https://communitybooks.example/about", sourceLabel: "Official About page", observedAt: "2026-10-15", confidence: "high", note: "Official page describes the independent bookstore and author events." },
        { field: "service_tags", sourceUrl: "https://communitybooks.example/events", sourceLabel: "Official Events page", observedAt: "2026-10-15", confidence: "medium", note: "Official page lists books and author events." },
        { field: "instagram", sourceUrl: "https://communitybooks.example/", sourceLabel: "Official website", observedAt: "2026-10-15", confidence: "high", note: "Official website links this Instagram profile." },
      ],
    })],
    ...overrides,
  } as Record<string, unknown>;
  return { ...base, contentFingerprint: profileEnrichmentFingerprint(base) };
}

describe("Kinfolk Current profile enrichment manifest", () => {
  it("accepts a bounded source-receipted field manifest", () => {
    const parsed = parseKinfolkCurrentProfileEnrichmentManifest(manifest());
    expect(parsed.candidates[0].patch).toEqual({ description: "Independent neighborhood bookstore.", hours: "Tuesday through Saturday, 10 AM to 6 PM", tags: ["books", "community events"] });
  });

  it("rejects a tampered manifest fingerprint", () => {
    const input = manifest() as Record<string, unknown>;
    ((input.candidates as Array<Record<string, unknown>>)[0].patch as Record<string, unknown>).description = "Tampered description.";
    expect(() => parseKinfolkCurrentProfileEnrichmentManifest(input)).toThrow("fingerprint");
  });

  it("rejects identity, lifecycle, location, ownership, and unsupported field changes", () => {
    for (const field of ["address", "city", "state", "website", "ownershipDesignations", "listingStatus", "latitude"]) {
      const input = manifest({ candidates: [candidate({ patch: { [field]: "unsafe" }, receipts: [] })] });
      expect(() => parseKinfolkCurrentProfileEnrichmentManifest(input)).toThrow();
    }
  });

  it("requires an exact field receipt for every proposed public fact", () => {
    const input = manifest({ candidates: [candidate({ receipts: [{ field: "description", sourceUrl: "https://communitybooks.example/about", sourceLabel: "Official About page", observedAt: "2026-10-15", confidence: "high", note: "Missing other receipts." }] })] });
    expect(() => parseKinfolkCurrentProfileEnrichmentManifest(input)).toThrow("exactly one receipt");
  });

  it("only fills absent profile fields and appends service tags", () => {
    expect(isEmptyProfileEnrichmentField("description", null)).toBe(true);
    expect(isEmptyProfileEnrichmentField("hours", "  ")).toBe(true);
    expect(isEmptyProfileEnrichmentField("phone", "215-555-0100")).toBe(false);
    expect(isEmptyProfileEnrichmentField("tags", [])).toBe(true);
    expect(isEmptyProfileEnrichmentField("tags", ["books"])).toBe(false);
  });

  it("accepts the explicit noncurrent scope and approved social-link additions", () => {
    const parsed = parseProfileEnrichmentManifest(nonCurrentManifest());
    expect(parsed.scope).toBe("non_kinfolk_current");
    expect(parsed.candidates[0].fieldModes).toEqual({ description: "replace_generic_directory", tags: "append", instagram: "fill" });
    expect(parsed.candidates[0].patch.instagram).toBe("https://www.instagram.com/communitybooks/");
  });

  it("accepts the held-profile scope without granting lifecycle mutation fields", () => {
    const parsed = parseProfileEnrichmentManifest(nonCurrentManifest({ scope: "non_kinfolk_current_all" }));
    expect(parsed.scope).toBe("non_kinfolk_current_all");
    expect(parsed.candidates[0].patch).not.toHaveProperty("listingStatus");
  });

  it("requires a matching confirmed-inactive website check before replacing a website", () => {
    const input = nonCurrentManifest({
      scope: "non_kinfolk_current_all",
      candidates: [candidate({
        expectedIdentity: { name: "Community Books", city: "Philadelphia", state: "PA", website: "https://old-communitybooks.example/" },
        patch: { website: "https://new-communitybooks.example/" },
        fieldModes: { website: "replace_verified_inactive" },
        websiteRecovery: { priorWebsite: "https://old-communitybooks.example/", priorWebsiteClassification: "REMOVE_CONFIRMED_INACTIVE", checkedAt: "2026-10-15" },
        receipts: [{ field: "website", sourceUrl: "https://new-communitybooks.example/", sourceLabel: "Official home page", observedAt: "2026-10-15", confidence: "high", note: "The recovered official home page matches the business identity." }],
      })],
    });
    expect(parseProfileEnrichmentManifest(input).candidates[0].websiteRecovery?.priorWebsite).toBe("https://old-communitybooks.example/");
    const unsafe = nonCurrentManifest({
      candidates: [candidate({ patch: { website: "https://new-communitybooks.example/" }, fieldModes: { website: "replace_verified_inactive" }, receipts: [{ field: "website", sourceUrl: "https://new-communitybooks.example/", sourceLabel: "Official home page", observedAt: "2026-10-15", confidence: "high", note: "The recovered official home page matches the business identity." }] })],
    });
    expect(() => parseProfileEnrichmentManifest(unsafe)).toThrow("websiteRecovery");
  });

  it("rejects an unscoped manifest and unsafe replacement modes", () => {
    const unscoped = nonCurrentManifest({ scope: undefined });
    expect(() => parseProfileEnrichmentManifest(unscoped)).toThrow("scope");
    const unsafeMode = nonCurrentManifest({
      candidates: [candidate({
        patch: { phone: "215-555-0100" },
        fieldModes: { phone: "replace_generic_directory" },
        receipts: [{ field: "phone", sourceUrl: "https://communitybooks.example/contact", sourceLabel: "Official Contact page", observedAt: "2026-10-15", confidence: "high", note: "Official page lists this phone number." }],
      })],
    });
    expect(() => parseProfileEnrichmentManifest(unsafeMode)).toThrow("Only descriptions");
  });

  it("only identifies a closed list of generic imported descriptions as replaceable", () => {
    expect(isGenericProfileEnrichmentDescriptionPlaceholder("Barber")).toBe(true);
    expect(isGenericProfileEnrichmentDescriptionPlaceholder("Beauty & Hair")).toBe(true);
    expect(isGenericProfileEnrichmentDescriptionPlaceholder("Black-owned")).toBe(true);
    expect(isGenericProfileEnrichmentDescriptionPlaceholder("Black-owned / Jamaican / Caribbean")).toBe(true);
    expect(isGenericProfileEnrichmentDescriptionPlaceholder("Black-owned directory listing: a comprehensive directory of Black-owned businesses.")).toBe(true);
    expect(isGenericProfileEnrichmentDescriptionPlaceholder("Black-owned neighborhood restaurant serving Jamaican comfort food.")).toBe(false);
    expect(isGenericProfileEnrichmentDescriptionPlaceholder("Neighborhood barbershop offering fades and beard care.")).toBe(false);
  });
});
