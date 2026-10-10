import { describe, expect, it } from "vitest";
import {
  buildPrivateMemoryPersonalizationBlock,
  isApprovedPrivateMemoryRelevant,
  preferenceScopesForMemory,
  resolvePrivateMemoryUseDecision,
} from "../private-memory-personalization";

const ordinary = (content: string, purpose = "profile_context") => ({
  content,
  purpose,
  isSensitive: false,
});

describe("private memory personalization", () => {
  it("matches explicitly approved preference scopes without making an ownership or safety claim", () => {
    const cases = [
      [
        "I prefer vegan, quiet restaurants",
        "Where can I eat dinner in Philadelphia?",
        "dining",
      ],
      [
        "I need wheelchair-accessible entrances",
        "Find an accessible cafe near me",
        "accessibility",
      ],
      [
        "I rely on transit and do not drive",
        "Which places are easy by train?",
        "transportation",
      ],
      ["My budget is tight", "What is an affordable lunch option?", "budget"],
      [
        "I am looking for a loctician",
        "Can you find a loctician in Houston?",
        "service_specialty",
      ],
      [
        "I travel with my children",
        "Plan a family outing this weekend",
        "family",
      ],
      [
        "I travel often for work",
        "What should I know before my Philadelphia trip?",
        "travel",
      ],
    ] as const;

    for (const [content, request, expectedScope] of cases) {
      const memory = ordinary(content);
      expect(preferenceScopesForMemory(memory)).toContain(expectedScope);
      expect(
        isApprovedPrivateMemoryRelevant({
          memory,
          currentMessage: request,
          legacyRelevant: false,
        }),
      ).toBe(true);
    }
  });

  it("keeps sensitive and unrelated details out of a later answer", () => {
    const sensitive = {
      ...ordinary("I have a private diagnosis"),
      isSensitive: true,
    };
    expect(
      isApprovedPrivateMemoryRelevant({
        memory: sensitive,
        currentMessage: "Where should I have dinner?",
        legacyRelevant: false,
      }),
    ).toBe(false);
    expect(
      isApprovedPrivateMemoryRelevant({
        memory: ordinary("I prefer vegan restaurants"),
        currentMessage: "Help me draft a work email",
        legacyRelevant: false,
      }),
    ).toBe(false);
  });

  it("reports every safe observability outcome without logging private content", () => {
    const base = {
      runtimeEnabled: true,
      memberEnabled: true,
      storageUnavailable: false,
      activeMemoryCount: 1,
      relevantMemoryCount: 1,
      allowPersonalization: true,
    };
    expect(
      resolvePrivateMemoryUseDecision({ ...base, runtimeEnabled: false }).state,
    ).toBe("runtime_disabled");
    expect(
      resolvePrivateMemoryUseDecision({ ...base, memberEnabled: false }).state,
    ).toBe("member_not_opted_in");
    expect(
      resolvePrivateMemoryUseDecision({ ...base, storageUnavailable: true })
        .state,
    ).toBe("storage_unavailable");
    expect(
      resolvePrivateMemoryUseDecision({ ...base, activeMemoryCount: 0 }).state,
    ).toBe("no_active_memory");
    expect(
      resolvePrivateMemoryUseDecision({ ...base, relevantMemoryCount: 0 })
        .state,
    ).toBe("no_relevant_memory");
    expect(
      resolvePrivateMemoryUseDecision({ ...base, allowPersonalization: false })
        .state,
    ).toBe("suppressed_for_contextual_evidence");
    const applied = resolvePrivateMemoryUseDecision(base);
    expect(applied).toMatchObject({ state: "applied", shouldApply: true });
    expect(applied.memberFacingUse?.message).not.toContain("vegan");
  });

  it("marks private preference content as separate from evidence and promotion", () => {
    const block = buildPrivateMemoryPersonalizationBlock([
      { content: "I prefer vegan restaurants", purpose: "profile_context" },
    ]);
    expect(block).toContain(
      "PRIVATE PERSONALIZATION BOUNDARY — AFTER EVIDENCE",
    );
    expect(block).toContain("cannot be changed by a private preference");
    expect(block).toContain("business promotion");
    expect(block).toContain("I prefer vegan restaurants");
  });
});
