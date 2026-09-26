import { describe, expect, it } from "vitest";
import { buildKinfolkCulturalLearningOpportunity } from "../cultural-learning-opportunity";

describe("Kinfolk cultural learning opportunity", () => {
  it("offers a source-seeking ancient Mediterranean follow-up for the Odyssey casting conversation", () => {
    const opportunity = buildKinfolkCulturalLearningOpportunity(
      "Why were people upset about Lupita Nyong'o being cast in The Odyssey?",
    );

    expect(opportunity).toEqual(
      expect.objectContaining({
        followUpSuggestion:
          "What do historians and museum collections show about African presence and representation in the ancient Mediterranean?",
      }),
    );
    expect(opportunity?.promptBlock).toMatch(/primary question first/i);
    expect(opportunity?.promptBlock).toMatch(/do not say.*proves/i);
    expect(opportunity?.retrievalQueries).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Lupita.*Odyssey.*casting/i),
        expect.stringMatching(/Africans in ancient Greek art/i),
      ]),
    );
  });

  it("does not add a diaspora lesson to unrelated questions", () => {
    expect(
      buildKinfolkCulturalLearningOpportunity("How does the sun stay hot?"),
    ).toBeNull();
    expect(
      buildKinfolkCulturalLearningOpportunity("Tell me about The Odyssey"),
    ).toBeNull();
  });
});
