import { describe, expect, it } from "vitest";
import {
  buildKinfolkResponsePresentationPrompt,
  needsKinfolkBriefPresentationRevision,
  needsKinfolkNaturalPresentationRevision,
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

  it("treats response length as a composition preference instead of a text cutoff", () => {
    const brief = buildKinfolkResponsePresentationPrompt({
      responseLength: "brief",
      responseFormat: "structured",
      source: "saved",
    });
    const natural = buildKinfolkResponsePresentationPrompt({
      responseLength: "detailed",
      responseFormat: "natural",
      source: "saved",
    });

    expect(brief).toContain("Do not omit meaning merely to be brief");
    expect(brief).toContain("complex, consequential, or multi-part question may need more explanation");
    expect(natural).toContain("Preserve readable paragraph breaks");
    expect(natural).toContain("small descriptive heading, compact list, or short copyable script");
  });

  it("keeps the same saved preference across simple, complex, and emotional member turns", () => {
    for (const message of [
      "What is photosynthesis?",
      "Compare two job offers when one pays more but requires relocating away from family.",
      "I feel overwhelmed about moving and I do not know what to do.",
    ]) {
      expect(resolveKinfolkResponsePresentation({
        message,
        savedDetailLevel: "standard",
        savedTonePreference: "format_natural",
      })).toEqual({ responseLength: "balanced", responseFormat: "natural", source: "saved" });
    }
  });

  it("requests a readability rewrite only for list-heavy natural conversation", () => {
    expect(needsKinfolkNaturalPresentationRevision({
      presentation: { responseFormat: "natural" },
      reply: "A paragraph.\n\n- One\n- Two\n- Three\n- Four\n- Five",
    })).toBe(true);
    expect(needsKinfolkNaturalPresentationRevision({
      presentation: { responseFormat: "natural" },
      reply: "A paragraph.\n\n- One\n- Two\n- Three",
    })).toBe(false);
    expect(needsKinfolkNaturalPresentationRevision({
      presentation: { responseFormat: "structured" },
      reply: "- One\n- Two\n- Three\n- Four\n- Five",
    })).toBe(false);
  });

  it("distills only crowded brief replies without discarding their trailing text mechanically", () => {
    expect(needsKinfolkBriefPresentationRevision({
      presentation: { responseLength: "brief" },
      reply: "Answer\n- One\n- Two\n- Three\n- Four\n- Five\n- Six",
    })).toBe(true);
    expect(needsKinfolkBriefPresentationRevision({
      presentation: { responseLength: "brief" },
      reply: "Direct answer with one material limitation.",
    })).toBe(false);
    expect(needsKinfolkBriefPresentationRevision({
      presentation: { responseLength: "detailed" },
      reply: "- One\n- Two\n- Three\n- Four\n- Five\n- Six",
    })).toBe(false);
  });
});
