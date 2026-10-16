import { describe, expect, it } from "vitest";
import { summarizeCommunitySignals } from "../community-signal-summary";

describe("community signal summaries", () => {
  const business = {
    id: "restaurant-1",
    category: "Food & Drink",
    subcategory: "Restaurants",
  };

  it("keeps quick reviews, community VIBES, and The Real separate with governed labels", () => {
    const result = summarizeCommunitySignals({
      business,
      feedback: [
        { business_id: "restaurant-1", kind: "caption", key: "official_food_drink_portions_with_love", count: "8" },
        { business_id: "restaurant-1", kind: "vibe", key: "date_night", count: 3 },
        { business_id: "restaurant-1", kind: "caption", key: "price:price_2", count: 4 },
        { business_id: "restaurant-1", kind: "caption", key: "unapproved_claim", count: 99 },
      ],
      theReal: [
        { business_id: "restaurant-1", tag_key: "this_doctor_listens", count: 12 },
      ],
    });

    expect(result.quickReviews).toEqual([
      { key: "official_food_drink_portions_with_love", label: "Portions With Love", count: 8 },
    ]);
    expect(result.communityVibes).toEqual([
      { key: "date_night", label: "Date Night", count: 3 },
    ]);
    expect(result.theReal).toEqual([]);
  });

  it("exposes a threshold-qualified The Real signal only for its governed category", () => {
    const result = summarizeCommunitySignals({
      business: { id: "care-1", category: "Health & Wellness", subcategory: "Primary Care & Medical Practices" },
      feedback: [],
      theReal: [
        { business_id: "care-1", tag_key: "this_doctor_listens", count: 6 },
        { business_id: "care-1", tag_key: "not_a_real_tag", count: 15 },
      ],
    });

    expect(result.theReal).toEqual([
      { key: "this_doctor_listens", label: "This Doctor Listens", count: 6 },
    ]);
  });
});
