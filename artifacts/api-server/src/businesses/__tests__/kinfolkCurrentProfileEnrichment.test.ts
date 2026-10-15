import { describe, expect, it } from "vitest";
import {
  KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION,
  isEmptyProfileEnrichmentField,
  kinfolkCurrentProfileEnrichmentFingerprint,
  parseKinfolkCurrentProfileEnrichmentManifest,
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

  it("only fills absent profile fields and never overwrites existing content", () => {
    expect(isEmptyProfileEnrichmentField("description", null)).toBe(true);
    expect(isEmptyProfileEnrichmentField("hours", "  ")).toBe(true);
    expect(isEmptyProfileEnrichmentField("phone", "215-555-0100")).toBe(false);
    expect(isEmptyProfileEnrichmentField("tags", [])).toBe(true);
    expect(isEmptyProfileEnrichmentField("tags", ["books"])).toBe(false);
  });
});
