import { describe, expect, it } from "vitest";
import { extractHealthTopic } from "../health-retrieval";
import {
  buildLifeIntentSourceQuery,
  getLifeIntentGuidance,
} from "../life-intent-guidance";

describe("Kinfolk life-intent guidance", () => {
  it("turns plain-language pregnancy planning into preconception-care retrieval and practical next questions", () => {
    const message = "I am a 45-year-old woman who wants to get pregnant.";
    const guidance = getLifeIntentGuidance(message);

    expect(guidance).toMatchObject({
      kind: "pregnancy_planning",
      sourceQuery: "preconception care official guidance",
    });
    expect(extractHealthTopic(message)).toBe("preconception care");
    expect(buildLifeIntentSourceQuery(message, guidance!)).toBe(
      "preconception care official guidance",
    );
    expect(guidance?.sourceContext).toMatch(/preconception care/i);
    expect(guidance?.followUpSuggestions).toEqual([
      "What should I discuss at a preconception visit?",
      "Which medications or vaccines should I review?",
      "What questions should I ask about my timeline?",
    ]);
    expect(guidance?.responseInstruction).toMatch(/not diagnose/i);
    expect(guidance?.responseInstruction).toMatch(/Why this source fits/i);
  });

  it("keeps a named school in official admissions and financial-aid research", () => {
    const message = "My son is looking at UCLA.";
    const guidance = getLifeIntentGuidance(message);

    expect(guidance).toMatchObject({ kind: "college_planning" });
    expect(buildLifeIntentSourceQuery(message, guidance!)).toContain("UCLA");
    expect(buildLifeIntentSourceQuery(message, guidance!)).toMatch(
      /official admissions financial aid guidance$/,
    );
    expect(guidance?.sourceContext).toMatch(/official admissions, financial-aid/i);
    expect(guidance?.followUpSuggestions).toEqual([
      "How do we compare programs and fit?",
      "What financial-aid steps come first?",
      "What should be on the application timeline?",
    ]);
  });

  it("leaves non-planning pregnancy and school statements on their existing routes", () => {
    expect(getLifeIntentGuidance("I am pregnant and have a severe headache")).toBeNull();
    expect(getLifeIntentGuidance("UCLA won last night")).toBeNull();
  });
});
