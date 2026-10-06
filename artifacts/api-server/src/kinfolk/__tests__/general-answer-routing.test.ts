import { describe, expect, it } from "vitest";
import {
  buildGenericAnswerRouteClassifierPrompt,
  buildKinfolkConversationalIntentPrompt,
  parseGenericAnswerRouteDecision,
  resolveKinfolkEvidenceOutcome,
  resolveKinfolkGeneralAnswerRoute,
  type GenericAnswerRouteDecision,
} from "../general-answer-routing";
import type { EvidenceRoute } from "../evidence-route";

function evidence(overrides: Partial<EvidenceRoute> = {}): EvidenceRoute {
  return {
    domain: "general_knowledge",
    risk: "low",
    claimMode: "factual",
    retrievalRequirement: "none",
    failClosed: false,
    allowedSources: ["reputable_reference"],
    sourceGuidance: "Stable facts may be answered directly.",
    visibleBoilerplate: null,
    accuratePublicFigureFactsAllowed: true,
    ...overrides,
  };
}

function decision(
  overrides: Partial<GenericAnswerRouteDecision>,
): GenericAnswerRouteDecision {
  return {
    evidenceNeed: "stable",
    purpose: "answer",
    conversationIntent: "informational",
    clarificationQuestion: null,
    ...overrides,
  };
}

/**
 * Compose fixture wording from interchangeable parts so the route contract is
 * asserted across shapes rather than a memorized prompt inventory.
 */
function fixture(parts: readonly string[]): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

describe("Kinfolk generic answer routing", () => {
  it("uses a topic-independent semantic classifier contract", () => {
    const prompt = buildGenericAnswerRouteClassifierPrompt();
    expect(prompt).toContain("changing external conditions");
    expect(prompt).toContain("materially affect health, law, finances, safety");
    expect(prompt).not.toMatch(/Beyonc|president|Mexico|celebrity/i);
    expect(prompt).not.toContain("sample question");
  });

  it("rejects classifier output outside the constrained generic schema", () => {
    expect(
      parseGenericAnswerRouteDecision({
        evidenceNeed: "latest",
        purpose: "answer",
        conversationIntent: "informational",
      }),
    ).toBeNull();
    expect(
      parseGenericAnswerRouteDecision({
        evidenceNeed: "stable",
        purpose: "lookup_everything",
        conversationIntent: "informational",
      }),
    ).toBeNull();
    expect(
      parseGenericAnswerRouteDecision({
        evidenceNeed: "current",
        purpose: "clarification",
        conversationIntent: "clarification",
        clarificationQuestion: "  Which detail changes the answer?  ",
      }),
    ).toEqual({
      evidenceNeed: "current",
      purpose: "clarification",
      conversationIntent: "clarification",
      clarificationQuestion: "Which detail changes the answer?",
    });
  });

  it("uses bounded conversational intent without inferring identity or dialect", () => {
    const prompt = buildGenericAnswerRouteClassifierPrompt();
    expect(prompt).toContain("bounded recentConversation");
    expect(prompt).toContain("never receives profile, memory, identity, location");
    expect(prompt).not.toMatch(/Beyonc|president|Mexico|celebrity/i);
    expect(buildKinfolkConversationalIntentPrompt("social_interpretation"))
      .toContain("Do not assert another person's hidden intent");
    expect(buildKinfolkConversationalIntentPrompt("emotional_support"))
      .toContain("Do not diagnose");
  });

  const classes: Array<{
    name: string;
    messages: readonly string[];
    semantic: GenericAnswerRouteDecision;
    evidence?: Partial<EvidenceRoute>;
    memory?: boolean;
    expected: string;
  }> = [
    {
      name: "ordinary everyday knowledge",
      messages: [
        fixture(["Explain", "why leaves change color."]),
        fixture(["What is", "the difference between a metaphor and a simile?"]),
      ],
      semantic: decision({ evidenceNeed: "stable", purpose: "answer" }),
      expected: "stable_knowledge",
    },
    {
      name: "current public facts",
      messages: [
        fixture([
          "Who currently leads",
          "the public agency handling this program?",
        ]),
        fixture(["What changed", "in the latest public notice?"]),
      ],
      semantic: decision({ evidenceNeed: "current", purpose: "answer" }),
      expected: "current_evidence",
    },
    {
      name: "current estimates prices and rankings",
      messages: [
        fixture(["What is the current estimate", "for this asset?"]),
        fixture(["Which option is ranked highest", "right now?"]),
      ],
      semantic: decision({ evidenceNeed: "current", purpose: "answer" }),
      expected: "current_evidence",
    },
    {
      name: "current local information",
      messages: [
        fixture(["Is this local service", "open today?"]),
        fixture(["What is happening", "near this address tonight?"]),
      ],
      semantic: decision({ evidenceNeed: "current", purpose: "answer" }),
      expected: "current_evidence",
    },
    {
      name: "planning and next steps",
      messages: [
        fixture([
          "Help me organize",
          "the first three steps for this project.",
        ]),
        fixture(["Turn these ideas", "into a practical step-by-step plan."]),
      ],
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "planning_or_writing",
      }),
      expected: "planning_or_writing",
    },
    {
      name: "writing and revision",
      messages: [
        fixture(["Rewrite this note", "so it is clear and kind."]),
        fixture(["Draft a short message", "asking for a follow-up meeting."]),
      ],
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "planning_or_writing",
      }),
      expected: "planning_or_writing",
    },
    {
      name: "approved saved context",
      messages: [
        fixture(["What detail", "did I explicitly save for you to use?"]),
        fixture(["Please use", "my approved saved context in this reply."]),
      ],
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "approved_memory_recall",
      }),
      memory: true,
      expected: "approved_member_memory",
    },
    {
      name: "high-consequence information",
      messages: [
        fixture([
          "I need help deciding",
          "what to do about an urgent health concern.",
        ]),
        fixture([
          "What is the safe next step",
          "for a regulated financial decision?",
        ]),
      ],
      semantic: decision({ evidenceNeed: "stable", purpose: "answer" }),
      evidence: {
        domain: "medical_health",
        risk: "high",
        retrievalRequirement: "authoritative",
        failClosed: true,
      },
      expected: "current_evidence",
    },
    {
      name: "material ambiguity",
      messages: [
        fixture(["Can you compare", "the two choices I mentioned?"]),
        fixture(["Which one", "should I choose?"]),
      ],
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "clarification",
        clarificationQuestion: "Which options should I compare?",
      }),
      expected: "focused_clarification",
    },
    {
      name: "genuinely unsupported requests",
      messages: [
        fixture(["Tell me a fact", "when no reliable evidence exists."]),
        fixture([
          "Help me do something",
          "that would be unsafe for another person.",
        ]),
      ],
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "unsafe_or_unverifiable",
      }),
      expected: "honest_decline",
    },
  ];

  it.each(classes)(
    "routes varied $name fixtures without recognizing a fixed prompt",
    ({ messages, semantic, evidence: evidenceOverrides, memory, expected }) => {
      for (const message of messages) {
        const result = resolveKinfolkGeneralAnswerRoute({
          message,
          evidence: evidence(evidenceOverrides),
          semantic,
          hasApprovedRelevantMemory: memory,
        });
        expect(result.strategy).toBe(expected);
      }
    },
  );

  it("never lets semantic classification weaken deterministic current or high-consequence safeguards", () => {
    const current = resolveKinfolkGeneralAnswerRoute({
      message: "What is the current status of this public program?",
      evidence: evidence(),
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "planning_or_writing",
      }),
    });
    const high = resolveKinfolkGeneralAnswerRoute({
      message: "Please help me understand this urgent symptom.",
      evidence: evidence({
        domain: "medical_health",
        risk: "high",
        retrievalRequirement: "authoritative",
        failClosed: true,
      }),
      semantic: decision({ evidenceNeed: "stable", purpose: "answer" }),
    });
    expect(current.strategy).toBe("current_evidence");
    expect(high.strategy).toBe("current_evidence");
  });

  it("routes a member's time-horizon plan directly but retains cited evidence for an external status within a plan", () => {
    const personalPlan = resolveKinfolkGeneralAnswerRoute({
      message: "Help me organize my tomorrow morning around three priorities.",
      evidence: evidence(),
      semantic: decision({ evidenceNeed: "stable", purpose: "planning_or_writing", conversationIntent: "planning" }),
      hasApprovedRelevantMemory: true,
    });
    const externalStatus = resolveKinfolkGeneralAnswerRoute({
      message: "Help me plan tomorrow around what is open in Philadelphia.",
      evidence: evidence(),
      semantic: decision({ evidenceNeed: "stable", purpose: "planning_or_writing", conversationIntent: "planning" }),
      hasApprovedRelevantMemory: true,
    });

    expect(personalPlan.strategy).toBe("planning_or_writing");
    expect(personalPlan.requiresCurrentEvidence).toBe(false);
    expect(externalStatus.strategy).toBe("current_evidence");
    expect(externalStatus.requiresCurrentEvidence).toBe(true);
  });

  it("keeps varying current-hours visit plans on the evidence route", () => {
    for (const message of [
      "Plan my museum visit tomorrow around the current opening hours.",
      "Before our weekend trip, what time is the gallery open today?",
      "Can you help plan a visit using the venue's current schedule?",
    ]) {
      const route = resolveKinfolkGeneralAnswerRoute({
        message,
        evidence: evidence(),
        semantic: decision({ evidenceNeed: "stable", purpose: "planning_or_writing", conversationIntent: "planning" }),
      });
      expect(route.strategy).toBe("current_evidence");
      expect(route.requiresCurrentEvidence).toBe(true);
    }
  });

  it("does not treat personal conversational intent as a current-evidence claim", () => {
    const cases: Array<{
      intent: GenericAnswerRouteDecision["conversationIntent"];
      purpose: GenericAnswerRouteDecision["purpose"];
      message: string;
      expected: string;
    }> = [
      {
        intent: "emotional_support",
        purpose: "answer",
        message: fixture(["I received an outcome", "that left me discouraged."]),
        expected: "stable_knowledge",
      },
      {
        intent: "decision_support",
        purpose: "answer",
        message: fixture(["Help me weigh", "two realistic next steps."]),
        expected: "stable_knowledge",
      },
      {
        intent: "social_interpretation",
        purpose: "answer",
        message: fixture([
          "How should I read",
          "this unclear response from someone?",
        ]),
        expected: "stable_knowledge",
      },
      {
        intent: "planning",
        purpose: "planning_or_writing",
        message: fixture(["Help me organize", "a flexible plan for a busy week."]),
        expected: "planning_or_writing",
      },
      {
        intent: "drafting",
        purpose: "planning_or_writing",
        message: fixture([
          "Rewrite this note",
          "so it is calm and clear: Thank you for the update.",
        ]),
        expected: "planning_or_writing",
      },
    ];

    for (const item of cases) {
      const result = resolveKinfolkGeneralAnswerRoute({
        message: item.message,
        evidence: evidence(),
        semantic: decision({
          evidenceNeed: "current",
          purpose: item.purpose,
          conversationIntent: item.intent,
        }),
      });
      expect(result.strategy).toBe(item.expected);
      expect(result.requiresCurrentEvidence).toBe(false);
    }

    const externalCurrent = resolveKinfolkGeneralAnswerRoute({
      message: fixture(["I am worried about", "the deadline today."]),
      evidence: evidence(),
      semantic: decision({
        evidenceNeed: "current",
        purpose: "answer",
        conversationIntent: "emotional_support",
      }),
    });
    expect(externalCurrent.strategy).toBe("current_evidence");
    expect(externalCurrent.requiresCurrentEvidence).toBe(true);
  });

  it("offers a useful first response for support and social turns before clarification", () => {
    const cases: Array<{
      intent: GenericAnswerRouteDecision["conversationIntent"];
      message: string;
    }> = [
      {
        intent: "emotional_support",
        message: fixture([
          "I received an outcome",
          "that left me discouraged. What is one calm next step?",
        ]),
      },
      {
        intent: "decision_support",
        message: fixture([
          "I am choosing between two practical options.",
          "Help me weigh the tradeoffs.",
        ]),
      },
      {
        intent: "social_interpretation",
        message: fixture([
          "Someone stopped replying after we made plans.",
          "How can I check in without assuming the worst?",
        ]),
      },
    ];

    for (const item of cases) {
      const result = resolveKinfolkGeneralAnswerRoute({
        message: item.message,
        evidence: evidence(),
        semantic: decision({
          evidenceNeed: "stable",
          purpose: "clarification",
          conversationIntent: item.intent,
          clarificationQuestion: "What detail would help?",
        }),
      });
      expect(result.strategy).toBe("stable_knowledge");
      expect(result.requiresFocusedClarification).toBe(false);
    }

    const explicitlyMaterialGap = resolveKinfolkGeneralAnswerRoute({
      message: "Help me decide what to do next.",
      evidence: evidence(),
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "answer",
        conversationIntent: "decision_support",
      }),
      hasMateriallyMissingDetail: true,
    });
    expect(explicitlyMaterialGap.strategy).toBe("focused_clarification");
  });

  it("does not ask for clarification when a revision request includes its source text", () => {
    const complete = resolveKinfolkGeneralAnswerRoute({
      message: "Please rewrite this note so it is warm and clear: I am following up about our meeting.",
      evidence: evidence(),
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "clarification",
        clarificationQuestion: "What should the note say?",
      }),
    });
    const incomplete = resolveKinfolkGeneralAnswerRoute({
      message: "Please rewrite this note so it is warm and clear.",
      evidence: evidence(),
      semantic: decision({
        evidenceNeed: "stable",
        purpose: "clarification",
        clarificationQuestion: "What should the note say?",
      }),
    });

    expect(complete.strategy).toBe("planning_or_writing");
    expect(complete.requiresCurrentEvidence).toBe(false);
    expect(incomplete.strategy).toBe("focused_clarification");
  });

  it("requires evidence before a current-answer strategy can render an answer", () => {
    const current = resolveKinfolkGeneralAnswerRoute({
      message: "What is the latest verified status of this public program?",
      evidence: evidence(),
      semantic: decision({ evidenceNeed: "current", purpose: "answer" }),
    });
    expect(
      resolveKinfolkEvidenceOutcome({
        route: current,
        hasSupportingEvidence: false,
      }),
    ).toBe("decline");
    expect(
      resolveKinfolkEvidenceOutcome({
        route: current,
        hasSupportingEvidence: true,
      }),
    ).toBe("answer");
  });
});
