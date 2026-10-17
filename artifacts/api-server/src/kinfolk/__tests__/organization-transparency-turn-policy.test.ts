import { describe, expect, it } from "vitest";
import {
  buildOrganizationTransparencyPrompt,
  classifyOrganizationTransparencyTurn,
} from "../organization-transparency-turn-policy";

describe("Kinfolk organization transparency turn policy", () => {
  it("separates care research from healthcare workplace research", () => {
    expect(
      classifyOrganizationTransparencyTurn(
        "What clinical sources describe care at Example Hospital?",
      ),
    ).toBe("healthcare_care_research");
    expect(
      classifyOrganizationTransparencyTurn(
        "What are nurses saying about staffing at Example Hospital?",
      ),
    ).toBe("healthcare_workplace_research");
  });

  it("does not convert community experience into care-quality proof", () => {
    const prompt = buildOrganizationTransparencyPrompt(
      "healthcare_care_research",
    );
    expect(prompt).toMatch(/community experience is contextual only/i);
    expect(prompt).toMatch(/source-backed clinical information only/i);
    expect(prompt).toMatch(/map pin.*ownership tag.*rating/i);
  });

  it("keeps employer themes separate from a universal score or legal conclusion", () => {
    const prompt = buildOrganizationTransparencyPrompt("employer_research");
    expect(prompt).toMatch(/not a legal conclusion/i);
    expect(prompt).toMatch(/do not flatten them into a score/i);
  });

  it("guides experience submissions into relationship, privacy, and moderation rather than instant publication", () => {
    const prompt = buildOrganizationTransparencyPrompt(
      "organization_experience_submission",
    );
    expect(prompt).toMatch(/relationship type/i);
    expect(prompt).toMatch(/privacy choice/i);
    expect(prompt).toMatch(/pending moderation/i);
  });
});
