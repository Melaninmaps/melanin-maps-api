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
  sourceDescription: "A neighborhood restaurant serving homestyle dishes and weekend brunch.",
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

  it("publishes a founder-sourced receipt with generic or absent copy without inventing card text", () => {
    const incomplete = candidate({ sourceDescription: null });
    const generic = candidate({
      sourceRecordKey: "source-receipt:generic-card",
      address: "456 Walnut Street",
      officialUrl: "https://generic-directory-record.example",
      sourceDescription: "Restaurant listing in Philadelphia.",
    });
    const plan = buildSourceBackedDirectoryIntakePlan([incomplete, generic], []);

    expect(plan.toCreate).toEqual([incomplete, generic]);
    expect(plan.heldForDescription).toEqual([incomplete, generic]);
    expect(plan.duplicateMatches).toEqual([]);
  });

  it("keeps concise factual copy and flags a directory template for review without omitting it", () => {
    const concise = candidate({
      sourceRecordKey: "source-receipt:concise-factual-copy",
      sourceDescription: "Authentic Ethiopian cuisine",
    });
    const template = candidate({
      sourceRecordKey: "source-receipt:concise-template-copy",
      address: "456 Walnut Street",
      officialUrl: "https://generic-directory-record.example",
      sourceDescription: "Restaurant listing in Philadelphia.",
    });
    const plan = buildSourceBackedDirectoryIntakePlan([concise, template], []);

    expect(plan.toCreate).toEqual([concise, template]);
    expect(plan.heldForDescription).toEqual([template]);
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

  it("skips a prior review-vault retry by its exact retained source listing URL", () => {
    const plan = buildSourceBackedDirectoryIntakePlan([candidate()], [{
      id: "previous-source-review",
      name: "Amina's Kitchen",
      city: "Philadelphia",
      state: "PA",
      address: "A different source-rendered address",
      website: null,
      sourceUrl: "https://example.test/listing/ammina",
      dedupeKey: null,
    }]);

    expect(plan.toCreate).toHaveLength(0);
    expect(plan.duplicateMatches[0]?.existingBusinessId).toBe("previous-source-review");
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

  it("keeps separately addressed source records even when they share an official domain", () => {
    const separatelyAddressedReceipt = candidate({
      sourceRecordKey: "source-receipt:ammina-second-location",
      address: "456 Walnut Street",
    });
    const plan = buildSourceBackedDirectoryIntakePlan([candidate(), separatelyAddressedReceipt], []);

    expect(plan.duplicateMatches).toHaveLength(0);
    expect(plan.toCreate).toEqual([candidate(), separatelyAddressedReceipt]);
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

  it("keeps a source-published service description searchable in the public listing copy", () => {
    const fields = sourceBackedDirectoryPublicationFields(candidate({
      sourceDescription: "A neighborhood restaurant serving Ethiopian cuisine and vegan dishes.",
      serviceTerms: ["restaurant", "Ethiopian", "vegan"],
    }));

    expect(fields.description).toContain("Ethiopian cuisine");
    expect(fields.tags).toEqual(expect.arrayContaining(["restaurant", "Ethiopian", "vegan"]));
  });

  it("leads public cards with source-published detail instead of a repeated directory prefix", () => {
    const fields = sourceBackedDirectoryPublicationFields(candidate({
      category: "Restaurants, coffee shops, bars & bakeries",
      city: "Minneapolis",
      sourceLabel: "Minnesota Black-Owned Business Directory",
      sourceDescription: "A Somali cafe serving sambusas, coffee, smoothies, and sandwiches.",
    }));

    expect(fields.description).toBe("A Somali cafe serving sambusas, coffee, smoothies, and sandwiches.");
    expect(fields.description).not.toContain("Listed by Minnesota Black-Owned Business Directory");
  });
});
