import { describe, expect, it } from "vitest";
import {
  buildKinfolkFirstCallCompositionCheck,
  buildKinfolkResponsePresentationPrompt,
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

  it("gives structured answers a safe, readable Markdown contract", () => {
    const structured = buildKinfolkResponsePresentationPrompt({
      responseLength: "balanced",
      responseFormat: "structured",
      source: "saved",
    });

    expect(structured).toContain("Use a number only for an actual order or sequence");
    expect(structured).toContain("safe plain-text Markdown");
    expect(structured).toContain("[descriptive link text](https://...)");
    expect(structured).toContain("Never emit HTML");
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
    expect(brief).toContain("A simple question should be short; a complex, consequential, or multi-part question may need a compact explanation");
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

  it("guides the first model call to synthesize brief answers instead of triggering a fixed post-generation rewrite", () => {
    const brief = buildKinfolkResponsePresentationPrompt({
      responseLength: "brief",
      responseFormat: "natural",
      source: "current_message",
    });

    expect(brief).toContain("Synthesize related support");
    expect(brief).toContain("Do not omit meaning merely to be brief");
    expect(brief).not.toContain("rewrite");
  });

  it("uses a context-sensitive first-call check instead of fixed list or word rules", () => {
    const naturalBrief = buildKinfolkFirstCallCompositionCheck({
      presentation: { responseLength: "brief", responseFormat: "natural" },
      depth: "standard",
    });
    const detailedStructured = buildKinfolkFirstCallCompositionCheck({
      presentation: { responseLength: "detailed", responseFormat: "structured" },
      depth: "detailed",
    });

    expect(naturalBrief).toContain("Do not default to headings, a numbered plan, or a multi-bullet checklist");
    expect(naturalBrief).toContain("smallest complete shape");
    expect(detailedStructured).toContain("distinctions that materially improve scanning");
    expect(naturalBrief).not.toContain("word limit");
  });
});
