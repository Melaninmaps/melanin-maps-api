import { describe, expect, it } from "vitest";
import {
  KINFOLK_APPROVED_PERSONAS,
  buildKinfolkConversationModeInstruction,
  buildKinfolkConversationModePrompt,
  buildKinfolkEmotionalCheckInContract,
  buildKinfolkModeIsolationContract,
  buildKinfolkNaturalConversationContract,
  isKinfolkFormalDocumentRequest,
  normalizeKinfolkConversationMode,
  normalizeKinfolkFormalDocumentReply,
} from "../conversation-mode";

describe("Kinfolk conversation modes", () => {
  it.each([
    ["big_cousin", "Big Cousin"],
    ["professor", "Professor"],
    ["business_manager", "Business Manager"],
    ["best_friend", "Best Friend"],
  ] as const)("normalizes and instructs %s", (value, label) => {
    expect(normalizeKinfolkConversationMode(value)).toBe(value);
    expect(buildKinfolkConversationModePrompt(value)).toContain(label);
    expect(buildKinfolkConversationModeInstruction(value)).not.toMatch(/imitate an identity|accent|dialect/i);
  });

  it("allows only four canonical personas and safely routes aliases or invalid values to Big Cousin", () => {
    expect(KINFOLK_APPROVED_PERSONAS).toEqual([
      "big_cousin",
      "professor",
      "business_manager",
      "best_friend",
    ]);
    expect(normalizeKinfolkConversationMode("Big Cousin")).toBe("big_cousin");
    expect(normalizeKinfolkConversationMode("community")).toBe("big_cousin");
    expect(normalizeKinfolkConversationMode("neighborhood_guide")).toBe("big_cousin");
    expect(normalizeKinfolkConversationMode("professional")).toBe("big_cousin");
    expect(normalizeKinfolkConversationMode(undefined)).toBe("big_cousin");
    expect(buildKinfolkConversationModePrompt("community" as never)).toContain("BIG COUSIN MODE");
    expect(buildKinfolkEmotionalCheckInContract("community" as never)).toContain("do not have to make it sound pretty");
  });

  it("uses document formatting only for an explicit formal authoring request", () => {
    expect(isKinfolkFormalDocumentRequest("Please draft a formal email to my boss")).toBe(true);
    expect(isKinfolkFormalDocumentRequest("Create an official change-control report")).toBe(true);
    expect(isKinfolkFormalDocumentRequest("Where am I going tonight?")).toBe(false);
    expect(isKinfolkFormalDocumentRequest("Why is the sun so hot?")).toBe(false);
  });

  it("removes decorative Markdown while retaining clean document structure", () => {
    expect(normalizeKinfolkFormalDocumentReply("# Subject\n\n* First item\n  * Nested item\n\n**Closing**"))
      .toBe("Subject\n\n- First item\n- Nested item\n\nClosing");
  });

  it("keeps hard-day and good-day support specific to each selected voice", () => {
    expect(buildKinfolkEmotionalCheckInContract("big_cousin")).toContain("do not have to make it sound pretty");
    expect(buildKinfolkEmotionalCheckInContract("professor")).toContain("hardest part");
    expect(buildKinfolkEmotionalCheckInContract("business_manager")).toContain("handle, postpone, or release");
    expect(buildKinfolkEmotionalCheckInContract("best_friend")).toContain("listen, distract, or sit with it");
    for (const mode of ["big_cousin", "professor", "business_manager", "best_friend"] as const) {
      const contract = buildKinfolkEmotionalCheckInContract(mode);
      expect(contract).toContain("Do not turn a check-in into a business recommendation");
      expect(contract).toContain("Ask at most one gentle follow-up question");
    }
  });

  it("provides materially distinct ordinary-advice framing for all four voices", () => {
    expect(buildKinfolkConversationModeInstruction("big_cousin")).toContain("here is how to go about it");
    expect(buildKinfolkConversationModeInstruction("best_friend")).toContain("here is the move");
    expect(buildKinfolkConversationModeInstruction("professor")).toContain("Answer, Why it matters, and Practice line");
    expect(buildKinfolkConversationModeInstruction("business_manager")).toContain("Priority, Decision, and Next action");
    expect(new Set(KINFOLK_APPROVED_PERSONAS.map(buildKinfolkConversationModeInstruction)).size).toBe(4);
  });

  it("makes the same delivery-only isolation boundary mandatory for every mode", () => {
    const boundary = buildKinfolkModeIsolationContract();
    expect(boundary).toContain("must not change the factual answer");
    expect(boundary).toContain("current-information routing");
    expect(boundary).toContain("safety or emergency behavior");
    expect(boundary).toContain("must not create, pause, resume, revoke, delete");
    expect(boundary).toContain("selected TTS speaker identity");

    for (const mode of ["big_cousin", "professor", "business_manager", "best_friend"] as const) {
      expect(buildKinfolkConversationModePrompt(mode)).toContain(boundary);
    }
  });

  it("requires natural reference resolution without inventing prior history or dialect", () => {
    const contract = buildKinfolkNaturalConversationContract();
    expect(contract).toContain("jawn we went to last time for soul food");
    expect(contract).toContain("active, member-owned conversation history");
    expect(contract).toContain("never invent a prior visit");
    expect(contract).toContain("J-Money");
    expect(contract).toContain("Do not imitate an accent");
  });
});
