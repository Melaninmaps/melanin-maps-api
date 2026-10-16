import { describe, expect, it } from "vitest";
import {
  buildKinfolkConversationModeInstruction,
  buildKinfolkConversationModePrompt,
  buildKinfolkEmotionalCheckInContract,
  buildKinfolkPersonaFinalFormInstruction,
  buildKinfolkUnderSpecifiedSavingsDebtReply,
  buildKinfolkNaturalConversationContract,
  isKinfolkFormalDocumentRequest,
  normalizeKinfolkConversationMode,
  normalizeKinfolkFormalDocumentReply,
} from "../conversation-mode";

describe("Kinfolk conversation modes", () => {
  it.each([
    ["community", "Big Cousin"],
    ["professor", "Professor"],
    ["business_manager", "Business Manager"],
    ["best_friend", "Best Friend"],
  ] as const)("normalizes and instructs %s", (value, label) => {
    expect(normalizeKinfolkConversationMode(value)).toBe(value);
    expect(buildKinfolkConversationModePrompt(value)).toContain(label);
    expect(buildKinfolkConversationModeInstruction(value)).toContain("PERSONA BOUNDARY");
    expect(buildKinfolkConversationModeInstruction(value)).toContain("not facts, safety, evidence standards, privacy");
  });

  it("safely maps legacy or invalid values to Big Cousin", () => {
    expect(normalizeKinfolkConversationMode("neighborhood_guide")).toBe("community");
    expect(normalizeKinfolkConversationMode("professional")).toBe("community");
    expect(normalizeKinfolkConversationMode(undefined)).toBe("community");
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
    expect(buildKinfolkEmotionalCheckInContract("community")).toContain("do not have to make it sound pretty");
    expect(buildKinfolkEmotionalCheckInContract("professor")).toContain("hardest part");
    expect(buildKinfolkEmotionalCheckInContract("business_manager")).toContain("handle, postpone, or release");
    expect(buildKinfolkEmotionalCheckInContract("best_friend")).toContain("listen, distract, or sit with it");
    for (const mode of ["community", "professor", "business_manager", "best_friend"] as const) {
      const contract = buildKinfolkEmotionalCheckInContract(mode);
      expect(contract).toContain("Do not turn a check-in into a business recommendation");
      expect(contract).toContain("Ask at most one gentle follow-up question");
    }
  });

  it("provides materially distinct ordinary-advice framing for all four voices", () => {
    expect(buildKinfolkConversationModeInstruction("community")).toContain("real-life implication");
    expect(buildKinfolkConversationModeInstruction("best_friend")).toContain("current curiosity or feeling");
    expect(buildKinfolkConversationModeInstruction("professor")).toContain("causes or mechanism");
    expect(buildKinfolkConversationModeInstruction("business_manager")).toContain("organize concise priorities, trade-offs");
  });

  it("keeps Big Cousin and Best Friend conversational while keeping manager frameworks decision-specific", () => {
    expect(buildKinfolkConversationModeInstruction("community")).toContain(
      "rather than turning the answer into a checklist unless the member asks for a plan",
    );
    expect(buildKinfolkPersonaFinalFormInstruction("community")).toContain(
      "Start ordinary personal advice with connected prose, not a checklist",
    );
    expect(buildKinfolkConversationModeInstruction("best_friend")).toContain(
      "make room for feeling, reflection, and a realistic next thought before offering any plan",
    );
    expect(buildKinfolkPersonaFinalFormInstruction("best_friend")).toContain(
      "Start ordinary personal advice with connected prose, not a roadmap",
    );
    expect(buildKinfolkConversationModeInstruction("business_manager")).toContain(
      "For factual, historical, explanatory, or reflective questions",
    );
    expect(buildKinfolkConversationModeInstruction("business_manager")).toContain(
      "do not impose Objective, Priority, Options, Trade-offs, Recommended-next-action, Context, or Impact labels",
    );
  });

  it("keeps consequential recommendations evidence-based across all personas", () => {
    for (const mode of ["community", "professor", "business_manager", "best_friend"] as const) {
      const contract = buildKinfolkConversationModeInstruction(mode);
      expect(contract).toContain("SHARED QUALITY AND RISK BOUNDARY");
      expect(contract).toContain("same evidence-based core recommendation and uncertainty");
      expect(contract).toContain("do not prescribe using all savings, keeping all savings, a dollar split");
      expect(contract).toContain("APR, required expenses, upcoming bills, income stability");
    }
  });

  it("does not let personas impose a fixed response length or format", () => {
    for (const mode of ["community", "professor", "business_manager", "best_friend"] as const) {
      const finalForm = buildKinfolkPersonaFinalFormInstruction(mode);
      expect(finalForm).toContain("never imposes a rigid word, paragraph, section, or bullet limit");
    }
    expect(buildKinfolkConversationModeInstruction("best_friend")).toContain(
      "member’s requested or saved response length and format",
    );
    expect(buildKinfolkConversationModeInstruction("community")).toContain(
      "member’s requested or saved response length and format",
    );
  });

  it("returns the same safe clarification for underspecified savings-and-card-debt questions", () => {
    const reply = buildKinfolkUnderSpecifiedSavingsDebtReply(
      "I have $2,000 saved and $1,200 in credit card debt. What should I do?",
    );
    expect(reply).toContain("can’t responsibly tell you how much to move");
    expect(reply).toContain("APR and minimum payment");
    expect(reply).toContain("essential surprises");
    expect(buildKinfolkUnderSpecifiedSavingsDebtReply(
      "I have $2,000 saved, $1,200 in card debt at 30% APR, and rent due next week.",
    )).toBeNull();
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
