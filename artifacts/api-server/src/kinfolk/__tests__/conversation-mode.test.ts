import { describe, expect, it } from "vitest";
import {
  buildKinfolkConversationModeInstruction,
  buildKinfolkConversationModePrompt,
  buildKinfolkEmotionalCheckInContract,
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
    expect(buildKinfolkConversationModeInstruction(value)).not.toMatch(/imitate an identity|accent|dialect/i);
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
});
