import { describe, expect, it } from "vitest";
import {
  COMMUNICATION_PREFERENCE_PREFIX,
  buildConsentedCommunicationPreferenceMemory,
  isCommunicationPreferenceRevocationRequest,
  parseConsentedCommunicationPreference,
  resolveKinfolkCommunicationPreference,
} from "../communication-preferences";

const natTurner = "Who was Nat Turner, and why is he still important today?";

function resolve(overrides: Partial<Parameters<typeof resolveKinfolkCommunicationPreference>[0]> = {}) {
  return resolveKinfolkCommunicationPreference({
    message: natTurner,
    history: [],
    memories: [],
    persistedAaveLevel: 0,
    persistedRegionalFlavor: "off",
    intentClass: "general_knowledge",
    ...overrides,
  });
}

describe("Kinfolk communication preference precedence", () => {
  it("keeps an on-demand AAVE request temporary and independent from the persisted setting", () => {
    const standard = resolve({ persistedAaveLevel: 0 });
    const onDemand = resolve({
      message: "Who was Nat Turner? Tell me in AAVE.",
      persistedAaveLevel: 0,
    });

    expect(standard).toMatchObject({ aaveLevel: 0, source: "settings" });
    expect(onDemand).toMatchObject({ aaveLevel: 2, source: "current_message" });
    expect(onDemand.prompt).toContain("independent from the selected Kinfolk persona");
    expect(buildConsentedCommunicationPreferenceMemory("Who was Nat Turner? Tell me in AAVE.")).toBeNull();
  });

  it("keeps regional language separate from AAVE and never derives it from an unselected location", () => {
    const philadelphia = resolve({
      persistedAaveLevel: 0,
      persistedRegionalFlavor: "philadelphia",
    });
    const newYork = resolve({
      persistedAaveLevel: 0,
      persistedRegionalFlavor: "new_york",
    });

    expect(philadelphia).toMatchObject({ aaveLevel: 0, regionalFlavor: "philadelphia", source: "settings" });
    expect(newYork).toMatchObject({ aaveLevel: 0, regionalFlavor: "new_york", source: "settings" });
    expect(philadelphia.prompt).toContain("Philadelphia");
    expect(newYork.prompt).toContain("New York City");

    const cityMentionOnly = resolve({
      message: "How should I start planning a weekend in Philadelphia?",
      persistedRegionalFlavor: "off",
    });
    expect(cityMentionOnly).toMatchObject({
      regionalFlavor: "off",
      source: "settings",
    });
  });

  it("applies a consented history-AAVE preference, then honors a standard-English request for one answer", () => {
    const saved = buildConsentedCommunicationPreferenceMemory(
      "Always explain history to me in AAVE.",
    );
    expect(saved).toContain(COMMUNICATION_PREFERENCE_PREFIX);

    const fromMemory = resolve({ memories: [{ content: saved! }] });
    const currentOverride = resolve({
      message: "Who was Nat Turner? Explain this answer in standard English.",
      memories: [{ content: saved! }],
    });

    expect(fromMemory).toMatchObject({ aaveLevel: 2, source: "saved_memory" });
    expect(currentOverride).toMatchObject({
      aaveLevel: 0,
      regionalFlavor: "off",
      source: "current_message",
    });
  });

  it("retains an explicit temporary conversation instruction without creating private memory", () => {
    const result = resolve({
      history: [{ role: "user", content: "Just for this conversation, explain things in AAVE." }],
    });

    expect(result).toMatchObject({ aaveLevel: 2, source: "temporary_conversation" });
    expect(
      buildConsentedCommunicationPreferenceMemory(
        "Just for this conversation, explain things in AAVE.",
      ),
    ).toBeNull();
  });

  it("supports durable regional preferences, corrections, and targeted revocation", () => {
    const philadelphia = buildConsentedCommunicationPreferenceMemory(
      "Use Philadelphia AAVE when we're having casual conversations.",
    );
    const newYork = buildConsentedCommunicationPreferenceMemory(
      "Use New York AAVE when we're having casual conversations.",
    );
    const noAave = buildConsentedCommunicationPreferenceMemory(
      "Don't use AAVE unless I ask.",
    );

    expect(parseConsentedCommunicationPreference(philadelphia)).toMatchObject({
      aaveLevel: 2,
      regionalFlavor: "philadelphia",
      scope: "casual",
    });
    expect(parseConsentedCommunicationPreference(newYork)).toMatchObject({
      aaveLevel: 2,
      regionalFlavor: "new_york",
      scope: "casual",
    });
    expect(parseConsentedCommunicationPreference(noAave)).toMatchObject({ aaveLevel: 0 });
    expect(
      isCommunicationPreferenceRevocationRequest("Forget my AAVE preference."),
    ).toBe(true);
    expect(
      isCommunicationPreferenceRevocationRequest("Who was Nat Turner?"),
    ).toBe(false);
  });

  it("routes durable standard-English, step-by-step, and current-style requests through consented communication memory", () => {
    const professional = buildConsentedCommunicationPreferenceMemory(
      "Use standard English for professional emails.",
    );
    const stepByStep = buildConsentedCommunicationPreferenceMemory(
      "Always explain things step by step.",
    );
    const currentStyle = buildConsentedCommunicationPreferenceMemory(
      "I like the way you explained that. Remember that style.",
    );

    expect(parseConsentedCommunicationPreference(professional)).toMatchObject({
      aaveLevel: 0,
      scope: "professional",
    });
    expect(parseConsentedCommunicationPreference(stepByStep)).toMatchObject({
      stepByStep: true,
    });
    expect(parseConsentedCommunicationPreference(currentStyle)).toMatchObject({
      preserveCurrentStyle: true,
    });
    expect(
      resolve({
        message: "Help me decide what to do next.",
        memories: [{ content: stepByStep! }],
      }).prompt,
    ).toContain("COMMUNICATION DELIVERY — MEMBER SELECTED");
  });

  it("keeps consented communication preferences isolated to the supplied member memory set", () => {
    const memberA = resolve({
      message: "Who was Nat Turner?",
      memories: [
        {
          content:
            "Kinfolk communication preference: use a natural AAVE register; apply this to history explanations.",
        },
      ],
    });
    const memberB = resolve({
      message: "Who was Nat Turner?",
      memories: [],
    });

    expect(memberA).toMatchObject({ source: "saved_memory", aaveLevel: 2 });
    expect(memberB).toMatchObject({ source: "settings", aaveLevel: 0, regionalFlavor: "off" });
  });

  it("preserves the same communication preference when the member switches personas", () => {
    const saved = buildConsentedCommunicationPreferenceMemory(
      "Remember that I prefer history explained in AAVE.",
    );
    const beforeSwitch = resolve({ memories: [{ content: saved! }] });
    const afterSwitch = resolve({ memories: [{ content: saved! }] });

    expect(beforeSwitch).toEqual(afterSwitch);
    expect(afterSwitch).toMatchObject({ aaveLevel: 2, source: "saved_memory" });
  });
});
