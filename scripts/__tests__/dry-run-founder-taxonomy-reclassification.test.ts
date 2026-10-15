import { describe, expect, it } from "vitest";
import {
  analyzeFounderTaxonomyDryRun,
  classifyForFounderTaxonomy,
} from "../dry-run-founder-taxonomy-reclassification";

const baseRecord = {
  id: "business-1",
  name: "Example Business",
  description: "A confirmed service description.",
  website: "https://example.com",
  socialProfiles: { instagram: "https://instagram.com/example" },
  tags: ["community"],
  vibes: [],
  verified: true,
  listingStatus: "live_claimed",
};

describe("founder taxonomy reclassification dry run", () => {
  it("keeps an exact current category/subcategory pair unchanged", () => {
    const proposal = classifyForFounderTaxonomy({
      ...baseRecord,
      category: "Food & Drink",
      subcategory: "Restaurants",
      vibes: ["date_night"],
    });
    expect(proposal).toMatchObject({
      status: "already_correct",
      proposedCategory: "Food & Drink",
      proposedSubcategory: "Restaurants",
      invalidStoredVibes: [],
    });
  });

  it("remaps only an explicit, conservative legacy subcategory alias", () => {
    const proposal = classifyForFounderTaxonomy({
      ...baseRecord,
      category: "Books & Media",
      subcategory: "Bookstore",
      vibes: ["Date Night"],
    });
    expect(proposal).toMatchObject({
      status: "confidently_remapped",
      proposedCategory: "Shopping & Retail",
      proposedSubcategory: "Books & Bookstores",
      invalidStoredVibes: ["Date Night"],
    });
  });

  it("holds ambiguous records and invalid stored VIBES for review instead of guessing", () => {
    const proposal = classifyForFounderTaxonomy({
      ...baseRecord,
      id: "business-unknown",
      category: "Neighborhood Favorites",
      subcategory: "Services",
      vibes: ["Date Night"],
    });
    expect(proposal.status).toBe("requires_review");
    expect(proposal.proposedCategory).toBeNull();
    expect(proposal.invalidStoredVibes).toEqual([]);
  });

  it("reports the required totals and unsupported stored VIBES without performing writes", () => {
    const report = analyzeFounderTaxonomyDryRun([
      { ...baseRecord, category: "Food & Drink", subcategory: "Restaurants", vibes: ["date_night"] },
      { ...baseRecord, id: "business-2", category: "Books & Media", subcategory: "Bookstore", vibes: ["Date Night"] },
      { ...baseRecord, id: "business-3", category: "Neighborhood Favorites", subcategory: "Services", vibes: ["Date Night"] },
    ]);
    expect(report.mode).toBe("read_only_dry_run");
    expect(report.totals).toMatchObject({
      businesses: 3,
      requiringReclassification: 2,
      confidentlyRemapped: 1,
      requiringReview: 1,
      alreadyCorrect: 1,
      businessesWithVibesRequiringCorrectionOrRemoval: 1,
    });
    expect(report.currentValuesWithoutSafeEquivalent).toEqual(["Neighborhood Favorites › Services"]);
  });
});
