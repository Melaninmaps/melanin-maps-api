import { describe, expect, it } from "vitest";
import { buildExplicitMemoryConsentPlan } from "../explicit-memory-consent";
import {
  buildPrivateMemoryPersonalizationBlock,
  isApprovedPrivateMemoryRelevant,
  resolvePrivateMemoryUseDecision,
  type PrivateMemoryCandidate,
} from "../private-memory-personalization";

type DisposableMember = {
  id: string;
  continuityAccepted: boolean;
  memories: Array<
    PrivateMemoryCandidate & { paused: boolean; revoked: boolean }
  >;
};

function saveSelectedConsent(member: DisposableMember, message: string): void {
  const plan = buildExplicitMemoryConsentPlan(message);
  expect(plan).not.toBeNull();
  const selected = plan!.ordinary;
  expect(selected.length).toBeGreaterThan(0);
  member.continuityAccepted = true;
  member.memories.push(
    ...selected.map((item) => ({
      content: item.content,
      purpose: plan!.purpose,
      isSensitive: false,
      paused: false,
      revoked: false,
    })),
  );
}

function evaluateNewConversation(input: {
  member: DisposableMember;
  message: string;
  contextualEvidence: boolean;
  highConsequence?: boolean;
}) {
  const active = input.member.memories.filter(
    (memory) => !memory.paused && !memory.revoked,
  );
  const relevant = active.filter((memory) =>
    isApprovedPrivateMemoryRelevant({
      memory,
      currentMessage: input.message,
      legacyRelevant: false,
    }),
  );
  const decision = resolvePrivateMemoryUseDecision({
    runtimeEnabled: true,
    memberEnabled: input.member.continuityAccepted,
    storageUnavailable: false,
    activeMemoryCount: active.length,
    relevantMemoryCount: relevant.length,
    // Researched answers may use non-sensitive approved preferences. Only a
    // high-consequence evidence route suppresses personalization.
    allowPersonalization: !(input.contextualEvidence && input.highConsequence),
  });
  return {
    decision,
    prompt: decision.shouldApply
      ? buildPrivateMemoryPersonalizationBlock(relevant)
      : "",
  };
}

describe("disposable explicit-memory workflow proof", () => {
  it("saves an explicitly selected preference and applies it in a separate conversation", () => {
    const member: DisposableMember = {
      id: "disposable-memory-proof-member",
      continuityAccepted: false,
      memories: [],
    };

    // Conversation A: explicit instruction plus item-level consent selection.
    saveSelectedConsent(
      member,
      "Kinfolk, remember: I prefer vegan restaurants and quiet places.",
    );
    expect(member.continuityAccepted).toBe(true);
    expect(member.memories).toHaveLength(1);

    // Conversation B: a new conversation ID is deliberately not needed for the
    // stored preference; only the same authenticated disposable member is used.
    const recalled = evaluateNewConversation({
      member,
      message: "Where should I eat dinner in Philadelphia?",
      contextualEvidence: false,
    });
    expect(recalled.decision).toMatchObject({
      state: "applied",
      shouldApply: true,
    });
    expect(recalled.decision.memberFacingUse).toEqual({
      applied: true,
      message: "Your saved preference helped tailor this answer.",
    });
    expect(recalled.prompt).toContain("vegan restaurants");

    // A researched answer keeps factual evidence separate while still allowing
    // the same approved preference as an optional personalization.
    const researched = evaluateNewConversation({
      member,
      message: "What current vegan-friendly dinner options are near City Hall?",
      contextualEvidence: true,
    });
    expect(researched.decision.state).toBe("applied");
    expect(researched.prompt).toContain("AFTER EVIDENCE");
    expect(researched.prompt).toContain(
      "cannot be changed by a private preference",
    );
  });

  it("does not reuse an unrelated, paused, or revoked preference", () => {
    const member: DisposableMember = {
      id: "disposable-memory-proof-member-2",
      continuityAccepted: true,
      memories: [
        {
          content: "I prefer vegan restaurants",
          purpose: "profile_context",
          isSensitive: false,
          paused: false,
          revoked: false,
        },
      ],
    };

    const unrelated = evaluateNewConversation({
      member,
      message: "Help me write a professional follow-up email.",
      contextualEvidence: false,
    });
    expect(unrelated.decision.state).toBe("no_relevant_memory");
    expect(unrelated.prompt).toBe("");

    member.memories[0]!.paused = true;
    const paused = evaluateNewConversation({
      member,
      message: "Where should I eat dinner?",
      contextualEvidence: false,
    });
    expect(paused.decision.state).toBe("no_active_memory");

    member.memories[0]!.paused = false;
    member.memories[0]!.revoked = true;
    const revoked = evaluateNewConversation({
      member,
      message: "Where should I eat dinner?",
      contextualEvidence: false,
    });
    expect(revoked.decision.state).toBe("no_active_memory");
  });

  it("suppresses a relevant preference for a high-consequence evidence route", () => {
    const member: DisposableMember = {
      id: "disposable-memory-proof-member-3",
      continuityAccepted: true,
      memories: [
        {
          content: "My budget is tight",
          purpose: "profile_context",
          isSensitive: false,
          paused: false,
          revoked: false,
        },
      ],
    };
    const result = evaluateNewConversation({
      member,
      message: "What affordable tax filing help is available right now?",
      contextualEvidence: true,
      highConsequence: true,
    });
    expect(result.decision.state).toBe("suppressed_for_contextual_evidence");
    expect(result.prompt).toBe("");
  });
});
