import { describe, expect, it } from "vitest";
import { resolveConsentedHealthPopulationContext } from "../consented-health-context";

const confirmedBlackWomanMemory = {
  content: "I am a BW.",
  purpose: "profile_context",
  isSensitive: true,
  sensitiveConsentGrantedAt: new Date("2026-09-29T00:00:00.000Z"),
};

describe("consented private health population context", () => {
  it("uses a separately confirmed self-description for a generic health question", () => {
    expect(
      resolveConsentedHealthPopulationContext(
        [confirmedBlackWomanMemory],
        "What should I ask my doctor about anemia?",
      ),
    ).toEqual({
      label: "Black woman",
      source: "consented_private_memory",
    });
  });

  it("does not use unconfirmed, non-sensitive, or non-profile memories", () => {
    expect(
      resolveConsentedHealthPopulationContext(
        [{ ...confirmedBlackWomanMemory, sensitiveConsentGrantedAt: null }],
        "What should I ask my doctor about anemia?",
      ),
    ).toBeNull();
    expect(
      resolveConsentedHealthPopulationContext(
        [{ ...confirmedBlackWomanMemory, isSensitive: false }],
        "What should I ask my doctor about anemia?",
      ),
    ).toBeNull();
    expect(
      resolveConsentedHealthPopulationContext(
        [{ ...confirmedBlackWomanMemory, purpose: "planning_context" }],
        "What should I ask my doctor about anemia?",
      ),
    ).toBeNull();
  });

  it("yields to a population explicitly named in the current turn", () => {
    expect(
      resolveConsentedHealthPopulationContext(
        [confirmedBlackWomanMemory],
        "What should I know about anemia for Hispanic women?",
      ),
    ).toBeNull();
  });
});
