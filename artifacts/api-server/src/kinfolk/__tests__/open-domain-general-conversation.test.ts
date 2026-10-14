import { describe, expect, it } from "vitest";
import { parseKinfolkModelPayload } from "../itinerary-response";
import {
  buildLeanGeneralChatPrompt,
  canUseLeanGeneralChat,
} from "../lean-general-chat";
import { sanitizeKinfolkGeneralReply } from "../general-reply-presentation";
import { classifyKinfolkRequest } from "../request-classifier";

const ordinaryInput = {
  intentClass: "general_knowledge",
  requiresCurrentEvidence: false,
  hasLocation: false,
  hasImages: false,
  hasContextualResearch: false,
  hasNamedBusiness: false,
  isTravelPlanning: false,
  hasCircleContext: false,
  hasResolvedEntity: false,
  hasLibraryGrounding: false,
  hasRequestedVibes: false,
} as const;

describe("open-domain ordinary Kinfolk conversation", () => {
  it.each([
    "Why does a sourdough starter sometimes collapse after rising?",
    "Help me turn this scattered agenda into a 30-minute brainstorming session.",
    "Write a gentle bedtime story about a shy moon explorer.",
    "Explain a checksum to someone who has never written code.",
    "What is a fair counterargument to this claim about remote work?",
    "Give me a simple way to compare two apartment layouts without deciding for me.",
    "How can I politely say I need more time to think about an offer?",
    "Turn this rough idea into three questions I can use in a workshop.",
    "What makes an analogy useful instead of confusing?",
    "Can you help me make a packing list for a weekend with uncertain weather?",
    "I feel scattered; what is one low-pressure way to choose a next task?",
    "What are the tradeoffs between keeping a paper journal and a digital one?",
  ])("keeps an unfamiliar ordinary question on the general conversation path: %s", (message) => {
    expect(classifyKinfolkRequest(message).route).toBe("general_knowledge");
    expect(canUseLeanGeneralChat(ordinaryInput)).toBe(true);
  });

  it("keeps specialized capabilities additive rather than topic gates", () => {
    const prompt = buildLeanGeneralChatPrompt();
    expect(prompt).toContain("open-domain, general-purpose conversational assistant");
    expect(prompt).toContain("never a gate on ordinary conversation");
    expect(prompt).toContain("Do not require a message to match a predetermined subject");
  });

  it("permits a compatible provider's bounded ordinary plain-text answer without opening structured paths", () => {
    const ordinary = parseKinfolkModelPayload(
      "A thoughtful answer can start with the main idea and then explain the tradeoffs.",
      { allowPlainTextReply: true },
    );
    const governed = parseKinfolkModelPayload(
      "A thoughtful answer can start with the main idea and then explain the tradeoffs.",
    );

    expect(ordinary.valid).toBe(true);
    expect(ordinary.reply).toContain("main idea");
    expect(governed.valid).toBe(false);
  });

  it("removes a duplicated response envelope from ordinary member-facing prose", () => {
    expect(
      sanitizeKinfolkGeneralReply(
        "Start with the smallest useful step.\n\nfollowUpSuggestions: [\"Try it now\"]\nrecommendations: null\nsmartPromotion: null",
      ),
    ).toBe("Start with the smallest useful step.");
    expect(
      sanitizeKinfolkGeneralReply(
        "A checksum helps detect a changed file.\n\n{\n  \"reply\": \"\",\n  \"recommendations\": null\n}",
      ),
    ).toBe("A checksum helps detect a changed file.");
    expect(
      sanitizeKinfolkGeneralReply(
        "I can share recommendations if you ask for them, but this is the direct answer.",
      ),
    ).toBe("I can share recommendations if you ask for them, but this is the direct answer.");
  });
});
