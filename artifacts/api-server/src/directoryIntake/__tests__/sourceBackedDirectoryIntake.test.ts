import { describe, expect, it } from "vitest";
import {
  buildSourceBackedDirectoryIntakePlan,
  normalizeDirectoryIdentity,
  sourceBackedDirectoryPublicationFields,
} from "../sourceBackedDirectoryIntake";
import type { SourceBackedDirectoryCandidate } from "../sourceBackedDirectoryCandidates";

const candidate = (overrides: Partial<SourceBackedDirectoryCandidate> = {}): SourceBackedDirectoryCandidate => ({
  name: "Amina's Kitchen",
  category: "Restaurant",
  subcategory: "Restaurant",
  address: "123 Walnut Street",
  city: "Philadelphia",
  state: "PA",
  country: "US",
  phone: null,
  officialUrl: "https://www.amina.example/menu",
  ownershipDesignations: ["Black / African American-Owned"],
  serviceTerms: ["soul food"],
  sourceLabel: "Founder-provided directory",
  sourceUrl: "https://example.test/directory",
  sourceListingUrl: "https://example.test/listing/ammina",
  sourceRecordKey: "source-receipt:ammina",
  ownershipEvidence: "Named Black-owned directory listing.",
  batch: "directory_sources_2026_09_27",
  ...overrides,
});

describe("source-backed directory reconciliation", () => {
  it("normalizes superficial punctuation and casing without changing stored source values", () => {
    expect(normalizeDirectoryIdentity(" AMINA’S Kitchen ")).toBe("aminaskitchen");
  });

  it("skips only an exact same-place business with the same supplied street address", () => {
    const plan = buildSourceBackedDirectoryIntakePlan([candidate()], [{
      id: "existing-amina",
      name: "Amina's Kitchen",
      city: "Philadelphia",
      state: "PA",
      address: "123 Walnut St.",
      website: null,
      sourceUrl: null,
      dedupeKey: null,
    }]);
    expect(plan.toCreate).toHaveLength(0);
    expect(plan.duplicateMatches).toEqual([{ candidate: candidate(), existingBusinessId: "existing-amina", reason: "exact_address" }]);
  });

  it("skips an exact official destination when no street address is supplied", () => {
    const mapless = candidate({ address: null });
    const plan = buildSourceBackedDirectoryIntakePlan([mapless], [{
      id: "existing-amina",
      name: "AMINAS KITCHEN",
      city: "Philadelphia",
      state: "PA",
      address: null,
      website: "https://www.amina.example/contact",
      sourceUrl: null,
      dedupeKey: null,
    }]);
    expect(plan.toCreate).toHaveLength(0);
    expect(plan.duplicateMatches[0]?.reason).toBe("exact_official_destination");
  });

  it("retains a similar name when neither source address nor official destination proves a duplicate", () => {
    const plan = buildSourceBackedDirectoryIntakePlan([candidate()], [{
      id: "similar-name-only",
      name: "Amina's Kitchen",
      city: "Philadelphia",
      state: "PA",
      address: "555 Market Street",
      website: "https://different.example",
      sourceUrl: null,
      dedupeKey: null,
    }]);
    expect(plan.duplicateMatches).toHaveLength(0);
    expect(plan.toCreate).toEqual([candidate()]);
  });

  it("skips a prior intake retry by its exact retained source receipt key", () => {
    const mapless = candidate({ address: null, officialUrl: null });
    const plan = buildSourceBackedDirectoryIntakePlan([mapless], [{
      id: "previous-source-intake",
      name: "Different Record Title",
      city: "Elsewhere",
      state: "PA",
      address: null,
      website: null,
      sourceUrl: "https://example.test/directory",
      dedupeKey: "source-receipt:ammina",
    }]);
    expect(plan.toCreate).toHaveLength(0);
    expect(plan.duplicateMatches[0]?.existingBusinessId).toBe("previous-source-intake");
  });

  it("publishes one exact same-place record when distinct source receipts arrive together", () => {
    const secondReceipt = candidate({
      sourceRecordKey: "source-receipt:ammina-secondary-directory",
      sourceUrl: "https://other-directory.example/black-businesses",
      sourceListingUrl: "https://other-directory.example/listing/aminas-kitchen",
    });
    const plan = buildSourceBackedDirectoryIntakePlan([candidate(), secondReceipt], []);

    expect(plan.toCreate).toEqual([candidate()]);
    expect(plan.duplicateMatches).toEqual([{
      candidate: secondReceipt,
      existingBusinessId: null,
      matchedSourceReceiptKey: "source-receipt:ammina",
      reason: "within_source_batch",
    }]);
  });

  it("preserves overlong source categories and contacts without overflowing bounded columns", () => {
    const originalCategory = "Media Streaming Distribution Services, Social Networks, and other Media Networks and Content Providers";
    const sourceContact = "Place Orders here: https://www.darnelscakes.com/shop";
    const fields = sourceBackedDirectoryPublicationFields(candidate({
      category: originalCategory,
      subcategory: originalCategory,
      phone: sourceContact,
    }));

    expect(fields.category).toBe("Community business");
    expect(fields.subcategory).toBe("Source-listed category");
    expect(fields.phone).toBeNull();
    expect(fields.tags).toContain(originalCategory);
    expect(fields.description).toContain(sourceContact);
  });
});
