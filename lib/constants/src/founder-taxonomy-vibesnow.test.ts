import { describe, expect, it } from "vitest";
import {
  ALL_VIBE_LABELS,
  BUSINESS_CATEGORY_TAXONOMY,
  FOUNDER_QUICK_REVIEW_LABELS_BY_CATEGORY,
  FOUNDER_TAXONOMY_CONTRACT,
  FOUNDER_TAXONOMY_VERSION,
  FOUNDER_TAXONOMY_WORKBOOK_SHA256,
  getBusinessExperiencePolicy,
  getOwnerProfileExperienceChoices,
  isCanonicalBusinessCategory,
  isCanonicalSubcategoryForCategory,
  isVibeEligible,
  OFFICIAL_QUICK_REVIEW_TAGS,
  VIBES_BY_CATEGORY,
} from "./index";

describe("VIBESNOW founder taxonomy contract", () => {
  it("pins the reviewed workbook version and checksum", () => {
    expect(FOUNDER_TAXONOMY_VERSION).toBe("vibesnow-2026-10-15");
    expect(FOUNDER_TAXONOMY_WORKBOOK_SHA256).toBe(
      "5b46a5f9f18a69840a1ca2e164f30f1c11d93f70c1f966c441d7f9e499525d16",
    );
    expect(FOUNDER_TAXONOMY_CONTRACT).toHaveLength(22);
    expect(FOUNDER_TAXONOMY_CONTRACT.flatMap((entry) => entry.subcategories)).toHaveLength(239);
    expect(FOUNDER_TAXONOMY_CONTRACT.flatMap((entry) => entry.vibeLabels)).toHaveLength(125);
    expect(FOUNDER_TAXONOMY_CONTRACT.flatMap((entry) => entry.quickReviewLabels)).toHaveLength(335);
  });

  it("derives every selectable category, VIBE, and quick-review label from one source", () => {
    for (const entry of FOUNDER_TAXONOMY_CONTRACT) {
      const category = BUSINESS_CATEGORY_TAXONOMY.find((item) => item.name === entry.category);
      expect(category?.subcategories).toEqual(entry.subcategories);
      expect((VIBES_BY_CATEGORY[entry.category] ?? []).map((vibe) => vibe.label)).toEqual(entry.vibeLabels);
      expect(FOUNDER_QUICK_REVIEW_LABELS_BY_CATEGORY[entry.category]).toEqual(entry.quickReviewLabels);
      expect(
        OFFICIAL_QUICK_REVIEW_TAGS
          .filter((tag) => tag.category === entry.category)
          .map((tag) => tag.label),
      ).toEqual(entry.quickReviewLabels);
    }
  });

  it("keeps VIBES category-gated and does not invent founder wording", () => {
    const foodVibes = VIBES_BY_CATEGORY["Food & Drink"];
    expect(foodVibes.map((vibe) => vibe.label)).toEqual(
      FOUNDER_TAXONOMY_CONTRACT.find((entry) => entry.category === "Food & Drink")!.vibeLabels,
    );
    expect(foodVibes.find((vibe) => vibe.label === "Chill")?.helperText).toBe("");
    expect(foodVibes.find((vibe) => vibe.label === "Comfy")?.helperText).toBe("");
    expect(VIBES_BY_CATEGORY["Professional Services"]).toBeUndefined();
    expect(isVibeEligible("Food & Drink")).toBe(true);
    expect(isVibeEligible("Professional Services")).toBe(false);
    expect(ALL_VIBE_LABELS).not.toContain("Soul Food");
  });

  it("allows only canonical category/subcategory pairs for new listings", () => {
    expect(isCanonicalBusinessCategory("Food & Drink")).toBe(true);
    expect(isCanonicalBusinessCategory("Restaurant")).toBe(false);
    expect(isCanonicalSubcategoryForCategory("Food & Drink", "Restaurants")).toBe(true);
    expect(isCanonicalSubcategoryForCategory("Food & Drink", "Barbershops")).toBe(false);
    expect(isCanonicalSubcategoryForCategory("Beauty & Personal Care", "Barbershops")).toBe(true);
  });

  it("never turns quick-review endorsements into owner-selected VIBES", () => {
    const professional = getBusinessExperiencePolicy("Professional Services", "Consultants");
    expect(professional.vibeChoices).toEqual([]);
    expect(professional.reactionChoices.length).toBeGreaterThan(0);
    expect(getOwnerProfileExperienceChoices(professional)).toEqual([]);

    const food = getBusinessExperiencePolicy("Food & Drink", "Restaurants");
    expect(getOwnerProfileExperienceChoices(food)).toEqual(food.vibeChoices);
    expect(food.reactionChoices.map((choice) => choice.label)).toContain("Worth The Drive");
    expect(food.vibeChoices.map((choice) => choice.label)).not.toContain("Worth The Drive");
  });
});
