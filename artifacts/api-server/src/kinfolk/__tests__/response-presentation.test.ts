import { describe, expect, it } from "vitest";
import {
  buildKinfolkResponsePresentationPrompt,
  normalizeKinfolkBriefStructuredReply,
  normalizeKinfolkNaturalConversationReply,
  resolveKinfolkResponsePresentation,
  responsePresentationFromDeliveryProfile,
  responsePresentationToDeliveryProfile,
} from "../response-presentation";

describe("Kinfolk response presentation preferences", () => {
  it("maps the four saved length choices and three saved format choices through the existing delivery profile", () => {
    expect(responsePresentationToDeliveryProfile({ responseLength: "brief", responseFormat: "natural" })).toEqual({
      detailLevel: "quick",
      tonePreference: "format_natural",
    });
    expect(responsePresentationToDeliveryProfile({ responseLength: "balanced", responseFormat: "structured" })).toEqual({
      detailLevel: "standard",
      tonePreference: "format_structured",
    });
    expect(responsePresentationToDeliveryProfile({ responseLength: "detailed", responseFormat: "adaptive" })).toEqual({
      detailLevel: "deep",
      tonePreference: "format_adaptive",
    });
    expect(responsePresentationToDeliveryProfile({ responseLength: "adaptive", responseFormat: "adaptive" })).toEqual({
      detailLevel: "adaptive",
      tonePreference: "format_adaptive",
    });
    expect(responsePresentationFromDeliveryProfile({ detailLevel: "deep", tonePreference: "format_structured" })).toEqual({
      responseLength: "detailed",
      responseFormat: "structured",
    });
  });

  it("uses explicit current-turn length and format requests without changing saved preferences", () => {
    expect(resolveKinfolkResponsePresentation({
      message: "Give me the long version with headings.",
      savedDetailLevel: "quick",
      savedTonePreference: "format_natural",
    })).toEqual({ responseLength: "detailed", responseFormat: "structured", source: "current_message" });
    expect(resolveKinfolkResponsePresentation({
      message: "Summarize that in a natural conversation.",
      savedDetailLevel: "deep",
      savedTonePreference: "format_structured",
    })).toEqual({ responseLength: "brief", responseFormat: "natural", source: "current_message" });
  });

  it("keeps saved response presentation independent from persona and artifact format", () => {
    const presentation = resolveKinfolkResponsePresentation({
      message: "Explain the history of Black-owned banks.",
      savedDetailLevel: "deep",
      savedTonePreference: "format_natural",
    });
    const prompt = buildKinfolkResponsePresentationPrompt(presentation);

    expect(presentation).toMatchObject({
      responseLength: "detailed",
      responseFormat: "natural",
      source: "saved",
    });
    expect(prompt).toContain("selected Kinfolk persona changes conversational tone");
    expect(prompt).toContain("standalone email, letter, resume, developer instruction, proposal");
    expect(prompt).toContain("Simple questions stay direct even when Detailed is selected");
    expect(prompt).not.toContain("fixed response size");
  });

  it("uses adaptive defaults when no explicit member profile exists", () => {
    expect(resolveKinfolkResponsePresentation({
      message: "What time is it?",
    })).toEqual({ responseLength: "adaptive", responseFormat: "adaptive", source: "default" });
  });

  it("removes unsolicited list scaffolding from a natural conversation without changing content", () => {
    expect(normalizeKinfolkNaturalConversationReply(
      "Here is the point:\n\n1. Keep the evidence.\n- Talk to your manager.\n\nNext step:\n\n2) Follow up in writing.",
    )).toBe("Keep the evidence. Talk to your manager.\n\nFollow up in writing.");
  });

  it("keeps a brief structured answer to its first three essential points", () => {
    expect(normalizeKinfolkBriefStructuredReply(
      "Summary\n- First\n- Second\n- Third\n- Fourth\nClosing",
    )).toBe("Summary\n- First\n- Second\n- Third");
  });
});
