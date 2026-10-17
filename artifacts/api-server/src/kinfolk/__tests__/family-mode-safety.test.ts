import { describe, expect, it } from "vitest";
import {
  buildFamilyModeSystemInstruction,
  familyModeAudienceBand,
  familyModeRestrictedResponse,
  isFamilyModeRestrictedRequest,
} from "../family-mode-safety";

describe("Family Mode Kinfolk safety policy", () => {
  it("uses a temporary protective audience band without changing an assured under-13 band", () => {
    expect(familyModeAudienceBand("18_plus")).toBe("13_15");
    expect(familyModeAudienceBand("unknown")).toBe("13_15");
    expect(familyModeAudienceBand("under_13")).toBe("under_13");
  });

  it("intercepts adult-oriented discovery but keeps ordinary family questions available", () => {
    expect(isFamilyModeRestrictedRequest("Find a nightclub near me")).toBe(
      true,
    );
    expect(
      isFamilyModeRestrictedRequest("What casinos are open tonight?"),
    ).toBe(true);
    expect(isFamilyModeRestrictedRequest("Find a brewery in my city")).toBe(
      true,
    );
    expect(
      isFamilyModeRestrictedRequest("Plan a museum day for Saturday"),
    ).toBe(false);
    expect(isFamilyModeRestrictedRequest("Tell me about a jazz musician")).toBe(
      false,
    );
  });

  it("states the limited, non-persistent scope of the override", () => {
    const prompt = buildFamilyModeSystemInstruction();
    expect(prompt).toContain("family-safe");
    expect(prompt).toContain("does not change, save, or announce");
    expect(prompt).toContain("regular Kinfolk voice");
    expect(familyModeRestrictedResponse().reply).toContain("Family Mode is on");
  });
});
