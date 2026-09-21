import { describe, expect, it } from "vitest";
import { permittedIdentityContext } from "../permitted-identity-context";
import { buildSearchPlan } from "../lens-planner";

describe("Kinfolk explicit research-lens hashtags", () => {
  it("uses #BlackWomen only as current-turn population evidence, never a saved identity", () => {
    const context = permittedIdentityContext("#BlackWomen breast cancer screening");
    expect(context).toMatchObject({
      demographic: null,
      requestedPopulation: "Black women",
      demographicQualifier: "Black women",
      source: "explicit_current_turn",
      persist: false,
      diagnosisAllowed: false,
    });
  });

  it("plans condition-first and group-level evidence for an explicitly scoped health request", () => {
    const plan = buildSearchPlan(
      "#BlackWomen breast cancer screening",
      { id: "member", active: false, activeLensIds: [], lenses: [], preferredDomains: [], blockedDomains: [], locale: "en-US" },
      {},
    );
    expect(plan.queries).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "evidence" }),
      expect.objectContaining({ role: "community_primary", text: expect.stringMatching(/Black women population evidence/i) }),
    ]));
  });
});
