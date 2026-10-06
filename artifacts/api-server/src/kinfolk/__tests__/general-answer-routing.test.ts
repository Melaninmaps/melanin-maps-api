import { describe, expect, it } from "vitest";
import {
  buildGenericAnswerRouteClassifierPrompt,
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
      }),
    ).toBeNull();
    expect(
      parseGenericAnswerRouteDecision({
        evidenceNeed: "stable",
        purpose: "lookup_everything",
      }),
    ).toBeNull();
    expect(
      parseGenericAnswerRouteDecision({
        evidenceNeed: "current",
        purpose: "clarification",
        clarificationQuestion: "  Which detail changes the answer?  ",
      }),
    ).toEqual({
      evidenceNeed: "current",
      purpose: "clarification",
      clarificationQuestion: "Which detail changes the answer?",
    });
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
