import { describe, expect, it } from "vitest";
import { enforceKinfolkResponse } from "../four-purpose-enforcement";

const catalog = [{
  id: "business-1",
  name: "AMINA",
  category: "Food",
  city: "Philadelphia",
}];

describe("Kinfolk business-card intent boundary", () => {
  it("keeps a governed card for an explicit business-discovery turn", () => {
    const result = enforceKinfolkResponse({
      reply: "Here is a local option.",
      modelRecommendations: [{ businessId: "business-1" }],
      catalog,
      sources: [],
      libraryAction: null,
      intentClass: "business_discovery",
      allowBusinessCards: true,
    });

    expect(result.recommendations).toMatchObject({
      businesses: [{ id: "business-1", name: "AMINA", paidPlacement: false }],
    });
  });

  it("drops a valid but unrelated business card from a factual answer", () => {
    const result = enforceKinfolkResponse({
      reply: "Barack Obama served as the 44th president of the United States.",
      modelRecommendations: [{ businessId: "business-1" }],
      catalog,
      sources: [],
      libraryAction: null,
      intentClass: "general_knowledge",
      allowBusinessCards: false,
    });

    expect(result.recommendations).toBeNull();
  });
});
