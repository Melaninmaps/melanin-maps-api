import { describe, expect, it } from "vitest";
import { deriveBusinessSubject } from "../business-subject";
import {
  DIRECTORY_TAXONOMY_V2,
  directoryTaxonomyServiceForSubject,
  isDirectoryTaxonomyV2Enabled,
  matchesDocumentedSourceTaxonomyTag,
  mayUseSourceBackedTagEvidence,
} from "../directory-taxonomy-v2";

describe("directory taxonomy v2 release gate", () => {
  it("is disabled until the exact enable flag is present", () => {
    expect(isDirectoryTaxonomyV2Enabled({ NODE_ENV: "production" })).toBe(false);
    expect(isDirectoryTaxonomyV2Enabled({ DIRECTORY_TAXONOMY_V2: "TRUE" })).toBe(false);
    expect(isDirectoryTaxonomyV2Enabled({ DIRECTORY_TAXONOMY_V2: "true" })).toBe(true);
  });

  it("includes the initial retail bookstore and food coffee-shop services in a complete catalog", () => {
    const bookstore = directoryTaxonomyServiceForSubject(deriveBusinessSubject("Find bookstores in Minneapolis")!);
    const coffee = directoryTaxonomyServiceForSubject(deriveBusinessSubject("Find coffee shops in Minneapolis")!);
    expect(bookstore).toMatchObject({ vertical: "retail", facet: "bookstore" });
    expect(coffee).toMatchObject({ vertical: "food_and_beverage", facet: "coffee_shop" });
    expect(new Set(DIRECTORY_TAXONOMY_V2.map((service) => service.vertical))).toEqual(
      new Set([
        "food_and_beverage", "retail", "beauty_and_personal_care", "health_and_wellness",
        "community_and_care", "home_and_trades", "arts_culture_and_entertainment",
        "lodging_and_experiences", "automotive", "professional_services",
      ]),
    );
  });

  it("requires the feature flag, strict evidence mode, and a known service before a tag can participate", () => {
    const subject = deriveBusinessSubject("Find bookstores in Minneapolis")!;
    expect(mayUseSourceBackedTagEvidence({ subject, strictOwnershipEvidence: true, environment: {} })).toBe(false);
    expect(mayUseSourceBackedTagEvidence({
      subject,
      strictOwnershipEvidence: true,
      environment: { DIRECTORY_TAXONOMY_V2: "true" },
    })).toBe(true);
    expect(mayUseSourceBackedTagEvidence({
      subject,
      strictOwnershipEvidence: false,
      environment: { DIRECTORY_TAXONOMY_V2: "true" },
    })).toBe(false);
  });

  it("accepts only exact source-receipted service tags and never treats a tag as ownership evidence", () => {
    const subject = deriveBusinessSubject("Find coffee shops in Minneapolis")!;
    expect(matchesDocumentedSourceTaxonomyTag({
      researchSourceUrl: "https://directory.example.test/candidate/1",
      tags: ["Coffee shop", "Pastries"],
    }, subject)).toBe(true);
    expect(matchesDocumentedSourceTaxonomyTag({
      researchSourceUrl: null,
      tags: ["Coffee shop"],
    }, subject)).toBe(false);
    expect(matchesDocumentedSourceTaxonomyTag({
      researchSourceUrl: "https://directory.example.test/candidate/2",
      tags: ["Community coffee program"],
    }, subject)).toBe(false);
  });
});
