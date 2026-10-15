import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(decodeURIComponent(new URL(relativePath, import.meta.url).pathname), "utf8");
}

const categorySource = source("../constants/categories.ts");
const listingSource = source("../app/list-business.tsx");
const searchSource = source("../app/business-search.tsx");
const homeSource = source("../app/(tabs)/index.tsx");
const businessMapSource = source("../components/BusinessMapView.tsx");
const mapTabSource = source("../components/MapTabView.tsx");
const businessesHookSource = source("../hooks/useBusinesses.ts");
const requestBuilderSource = source("../hooks/support-lens-request.ts");
const ownerVibesSource = source("../app/business-owner/vibe-tags.tsx");
const cardSource = source("../components/BusinessCard.tsx");
const experienceCardSource = source("../components/BusinessExperienceCard.tsx");
const vibeSearchSource = source("../app/vibe-search.tsx");

describe("native VIBESNOW taxonomy boundaries", () => {
  it("derives all mobile category selectors from the shared taxonomy", () => {
    expect(categorySource).toContain('import { BUSINESS_CATEGORY_TAXONOMY } from "@workspace/constants"');
    expect(categorySource).toContain("BUSINESS_CATEGORY_TAXONOMY.map");
    expect(categorySource).toContain("liveAtLaunch: true");
    expect(listingSource).toContain("getCategoryGroup(fields.category)");
    expect(listingSource).toContain("suggestedCategory.subcategories.some");
    expect(listingSource).toContain("subcategory: form.subcategory || undefined");
    expect(searchSource).toContain("BUSINESS_CATEGORY_TAXONOMY.map");
    expect(homeSource).toContain("BUSINESS_CATEGORY_TAXONOMY.map");
    expect(businessMapSource).toContain("BUSINESS_CATEGORY_TAXONOMY.map");
    expect(mapTabSource).toContain("BUSINESS_CATEGORY_TAXONOMY.map");
  });

  it("offers owner-selected VIBES only when allowed and keeps member feedback separate", () => {
    expect(ownerVibesSource).toContain("setChoices(policy.vibeChoices)");
    expect(ownerVibesSource).not.toContain("getOwnerProfileExperienceChoices");
    expect(ownerVibesSource).toContain("VIBES are not offered for this business category");
    expect(ownerVibesSource).toContain("Member quick reviews are collected separately");
  });

  it("does not infer subjective VIBES from a category and does not invent blank descriptions", () => {
    expect(cardSource).not.toContain('label: "Soul Food"');
    expect(cardSource).toContain("A category never assigns a subjective VIBE");
    expect(experienceCardSource).toContain("{choice.helperText ? (");
    expect(experienceCardSource).toContain("They are not ratings, owner claims, or verified facts.");
    expect(vibeSearchSource).toContain("{v.description ? (");
    expect(homeSource).toContain("ALL_VIBE_LABELS.map");
    expect(homeSource).toContain("vibes: activeVibe ? [activeVibe] : []");
    expect(homeSource).not.toContain('categories: ["Food", "Restaurant"');
    expect(businessesHookSource).toContain("vibes: directName ? [] : vibes");
    expect(requestBuilderSource).toContain('params.set("vibes", options.vibes.join(","))');
  });
});
