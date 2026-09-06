import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canonicalCandidateLocation,
  canonicalPriceRange,
  canonicalStreetIdentity,
  communityMinorityClaim,
  deterministicUuid,
  explicitOwnershipDesignations,
  normalizedIdentity,
  safeExternalUrl,
  socialUrl,
} from "../publish-founder-business-inventory";

function candidate(overrides: Record<string, unknown> = {}): any {
  return {
    ownership_designations: [],
    ownership_evidence: null,
    ...overrides,
  };
}

describe("founder business inventory publication policy", () => {
  it("keeps only schema-safe price bands and rejects the exact oversized workbook value", () => {
    expect(canonicalPriceRange("$$$")).toBe("$$$");
    expect(canonicalPriceRange("Moderate")).toBe("Moderate");
    expect(canonicalPriceRange("$150+ kids braids")).toBeNull();
    expect(canonicalPriceRange("12345678901")).toBeNull();
  });

  it("uses deterministic city-scoped identities without collapsing cities", () => {
    expect(normalizedIdentity({ name: "AMINA", city: "Philadelphia", state: "PA" }))
      .toBe(normalizedIdentity({ name: "Amina", city: "Philadelphia", state: "pa" }));
    expect(normalizedIdentity({ name: "Amina", city: "Philadelphia", state: "PA" }))
      .not.toBe(normalizedIdentity({ name: "Amina", city: "Atlanta", state: "GA" }));
    expect(normalizedIdentity({ name: "Amina", city: "Richmond", state: "VA", raw_record: { country: "United States" } }))
      .not.toBe(normalizedIdentity({ name: "Amina", city: "Richmond", state: "VA", raw_record: { country: "Canada" } }));
  });

  it("reconciles equivalent full and short street addresses", () => {
    expect(canonicalStreetIdentity("1102 Germantown Ave, Philadelphia, PA 19123", "Philadelphia", "PA"))
      .toBe(canonicalStreetIdentity("1102 Germantown Ave", "Philadelphia", "PA"));
  });

  it("canonicalizes City, ST workbook fields before identity and street reconciliation", () => {
    const location = canonicalCandidateLocation({
      city: "Los Angeles, CA",
      state: "United States",
      raw_record: { country: "United States" },
    });
    expect(location).toEqual({ city: "Los Angeles", state: "CA", country: "United States" });
    expect(normalizedIdentity({ name: "Harold & Belle's", city: "Los Angeles, CA", state: "United States", raw_record: { country: "United States" } }))
      .toBe(normalizedIdentity({ name: "Harold & Belle's", city: "Los Angeles", state: "CA", raw_record: { country: "United States" } }));
    expect(canonicalStreetIdentity("2920 W Jefferson Blvd", location.city, location.state))
      .toBe(canonicalStreetIdentity("2920 W Jefferson Blvd, Los Angeles, CA", "Los Angeles", "CA"));
    expect(canonicalCandidateLocation({ city: "Toronto", state: "Ontario", raw_record: {} }).country).toBe("");
    expect(canonicalCandidateLocation({ city: "Toronto", state: "ON", raw_record: {} }).country).toBe("");
  });

  it("creates stable valid UUIDs from canonical identity", () => {
    const first = deterministicUuid("amina|philadelphia|pa");
    const second = deterministicUuid("amina|philadelphia|pa");
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("accepts ordinary web links but rejects credentials, local hosts, and unsafe schemes", () => {
    expect(safeExternalUrl("https://example.com/path")).toBe("https://example.com/path");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("https://user:secret@example.com/")).toBeNull();
    expect(safeExternalUrl("http://127.0.0.1/private")).toBeNull();
    expect(safeExternalUrl("http://localhost/private")).toBeNull();
  });

  it("keeps social links on the declared platform", () => {
    expect(socialUrl("instagram", "https://instagram.com/example")).toContain("instagram.com");
    expect(socialUrl("instagram", "https://facebook.com/example")).toBeNull();
    expect(socialUrl("tiktok", "https://evil.example/tiktok.com/example")).toBeNull();
  });

  it("maps only explicit founder ownership evidence and never guesses from a business name", () => {
    expect(explicitOwnershipDesignations([candidate({ ownership_evidence: "Black woman-owned business" })]))
      .toEqual(["Black / African American-Owned", "Woman-Owned"]);
    expect(explicitOwnershipDesignations([candidate({ ownership_evidence: null, name: "African Beauty" })]))
      .toEqual([]);
  });

  it("keeps family-owned alone neutral but treats explicit community minority designations as unverified claims", () => {
    expect(communityMinorityClaim(["Family-Owned"])).toBeNull();
    expect(communityMinorityClaim(["Woman-Owned"])).toBe("community_reported_minority_owned");
    expect(communityMinorityClaim(["Black / African American-Owned", "Woman-Owned"]))
      .toBe("community_reported_minority_owned");
  });
});

describe("founder publication database safeguards", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../publish-founder-business-inventory.ts"), "utf8");

  it("selects only the four immutable founder-authorized source checksums", () => {
    expect(source.match(/sha256: "[0-9a-f]{64}"/g)).toHaveLength(4);
    expect(source).toContain("today-net-new-business-candidates.jsonl");
    expect(source).toContain("verifyAuthorizedBatches(client, lock)");
    expect(source).toContain("batch_id = ANY($1::uuid[])");
    expect(source).toContain("status IN ('pending_review', 'needs_research', 'published')");
    expect(source).toContain("FOUNDER_AUTHORIZED_BATCH_SET_MISMATCH");
  });

  it("keeps existing varchar business IDs as text throughout reconciliation", () => {
    expect(source).toContain("record_id text NOT NULL");
    expect(source).toContain("identity_key text, record_id text");
    expect(source).toContain("SET record_id = b.id");
    expect(source).not.toContain("b.id::uuid");
  });

  it("aborts before audit writes when an identity claim has another winner", () => {
    const conflictCheck = source.indexOf("BULK_PUBLICATION_IDENTITY_WINNER_CONFLICT");
    const auditWrite = source.indexOf("INSERT INTO directory_import_publications");
    expect(conflictCheck).toBeGreaterThan(-1);
    expect(auditWrite).toBeGreaterThan(conflictCheck);
    expect(source).toContain("i.business_id <> p.record_id");
  });

  it("builds the apply plan only after transaction locks and revalidates candidate state before writes", () => {
    const begin = source.indexOf('client.query("BEGIN ISOLATION LEVEL SERIALIZABLE")');
    const advisoryLock = source.indexOf("pg_advisory_xact_lock", begin);
    const lockedPlan = source.indexOf("createPlans(client, true)", advisoryLock);
    const businessInsert = source.indexOf("INSERT INTO businesses", lockedPlan);
    expect(begin).toBeGreaterThan(-1);
    expect(advisoryLock).toBeGreaterThan(begin);
    expect(lockedPlan).toBeGreaterThan(advisoryLock);
    expect(businessInsert).toBeGreaterThan(lockedPlan);
    expect(source).toContain('lock ? "FOR UPDATE OF b" : ""');
    expect(source).toContain('lock ? "FOR UPDATE" : ""');
    expect(source).toContain("BULK_PUBLICATION_STALE_OR_INELIGIBLE_PLAN");
    expect(source).toContain("c.matched_business_id IS DISTINCT FROM p.original_matched_business_id");
    expect(source).toContain("const location = canonicalCandidateLocation(row)");
  });

  it("preflights both installed dedupe indexes and refuses cross-country fallback rewiring", () => {
    expect(source).toContain("businesses_active_dedupe_key_unique");
    expect(source).toContain("businesses_canonical_dedupe_key_unique");
    expect(source).toContain("i.indisunique,i.indisvalid,i.indisready");
    expect(source).toContain(")::text[] key_columns");
    expect(source).toContain("predicate_md5");
    expect(source).toContain("BULK_PUBLICATION_DEDUPE_INDEX_DEFINITION_MISMATCH");
    expect(source).toContain("BULK_PUBLICATION_DUAL_INDEX_PREFLIGHT_CONFLICT");
    expect(source).toContain("normalizeCountry(business.country) !== candidateCountry");
    expect(source).toContain("btrim(COALESCE(b.country,''))<>''");
  });
});
