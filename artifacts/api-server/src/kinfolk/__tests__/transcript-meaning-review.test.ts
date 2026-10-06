import { describe, expect, it } from "vitest";
import {
  buildVoiceTranscriptMeaningPrompt,
  parseVoiceTranscriptMeaningReview,
} from "../transcript-meaning-review";

describe("voice transcript meaning review", () => {
  it("keeps the raw transcript as the default and makes every rewrite optional", () => {
    const review = parseVoiceTranscriptMeaningReview({
      transcript: "can you put coffee lunch and the museum in my saturday list",
      regionalFlavor: "off",
      modelContent: JSON.stringify({
        suggestedText: "Can you put coffee, lunch, and the museum in my Saturday list?",
        clarification: null,
      }),
    });

    expect(review.originalText).toBe("can you put coffee lunch and the museum in my saturday list");
    expect(review.suggestedText).toBe("Can you put coffee, lunch, and the museum in my Saturday list?");
    expect(review.requiresConfirmation).toBe(true);
    expect(review.regionalLanguage).toBe("off");
  });

  it("rejects an unrelated answer or replacement request while preserving the original", () => {
    const review = parseVoiceTranscriptMeaningReview({
      transcript: "what is the museum open today",
      regionalFlavor: "off",
      modelContent: JSON.stringify({
        suggestedText: "The museum opens at 10 AM and costs $20.",
        clarification: null,
      }),
    });

    expect(review.suggestedText).toBeNull();
    expect(review.originalText).toBe("what is the museum open today");
  });

  it("permits only an explicit regional-language setting in the bounded reviewer prompt", () => {
    const disabled = buildVoiceTranscriptMeaningPrompt({
      transcript: "what is that jawn called",
      regionalFlavor: "off",
    });
    expect(disabled.system).toContain("No member-confirmed regional language applies");
    expect(disabled.system).toContain("Do not infer");

    const selected = buildVoiceTranscriptMeaningPrompt({
      transcript: "what is that jawn called",
      regionalFlavor: "philadelphia",
    });
    expect(selected.system).toContain("member explicitly selected Philadelphia regional language");
    expect(selected.system).toContain("must not add slang");
  });

  it("fails closed to the raw transcript on malformed model output", () => {
    const review = parseVoiceTranscriptMeaningReview({
      transcript: "please make a list groceries then call mom",
      regionalFlavor: "memphis",
      modelContent: "not json",
    });

    expect(review.suggestedText).toBeNull();
    expect(review.clarification).toBeNull();
    expect(review.regionalLanguage).toBe("member_selected");
  });
});
