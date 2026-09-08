import { describe, expect, it } from "vitest";
import {
  buildRecommendationLifeStageInstruction,
  isRecommendationLifeStage,
  resolveRecommendationLifeStage,
} from "../recommendation-life-stage";

describe("voluntary recommendation life stage", () => {
  it("accepts only the closed, editable preference vocabulary", () => {
    for (const value of ["unspecified", "18_39", "40_64", "65_plus"]) {
      expect(isRecommendationLifeStage(value)).toBe(true);
    }
    for (const value of ["21", "45", "65", "13_17", null, undefined]) {
      expect(isRecommendationLifeStage(value)).toBe(false);
    }
  });

  it.each(["unknown", "under_13", "13_15", "16_17"] as const)(
    "suppresses adult life stage for protective audience %s",
    (band) => {
      expect(resolveRecommendationLifeStage("65_plus", band)).toBe("unspecified");
    },
  );

  it("preserves an assured adult's voluntary bracket and reversible opt-out", () => {
    expect(resolveRecommendationLifeStage("18_39", "18_plus")).toBe("18_39");
    expect(resolveRecommendationLifeStage("40_64", "18_plus")).toBe("40_64");
    expect(resolveRecommendationLifeStage("65_plus", "18_plus")).toBe("65_plus");
    expect(resolveRecommendationLifeStage("unspecified", "18_plus")).toBe("unspecified");
  });

  it("limits prompt use and expressly prohibits life-stage stereotypes", () => {
    expect(buildRecommendationLifeStageInstruction("unspecified")).toBe("");
    const prompt = buildRecommendationLifeStageInstruction("65_plus");
    expect(prompt).toContain("member selected");
    expect(prompt).toContain("explicit interests and constraints");
    expect(prompt).toMatch(/Never infer income, mobility, health, family status, maturity, culture, or identity/);
    expect(prompt).toContain("Never announce the stored bracket");
    expect(prompt).toContain("Do not use it to weaken audience-safety rules");
  });
});
