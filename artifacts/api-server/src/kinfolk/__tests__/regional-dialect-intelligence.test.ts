import { describe, expect, it } from "vitest";
import {
  buildBoundedVoiceLanguageContext,
  buildRegionalComprehensionPrompt,
  buildReviewedPronunciationGuidance,
  matchReviewedPlaceReferences,
  normalizeMemberLanguagePreferences,
  validateMemberLanguagePreferencePatch,
  type ReviewedPlaceReference,
} from "../regional-dialect-intelligence";

const tchoupitoulas: ReviewedPlaceReference = {
  id: "ref-1",
  canonicalId: "new-orleans-tchoupitoulas",
  writtenName: "Tchoupitoulas Street",
  aliases: ["Tchoupitoulas", "Tchoupitoulas Street"],
  languageCode: "en",
  regionalProfile: "new_orleans",
  pronunciationGuidance: "chop-uh-TOO-luhs",
};

describe("regional dialect intelligence foundation", () => {
  it("preserves an existing regional selection without inventing a language or opt-in", () => {
    const preferences = normalizeMemberLanguagePreferences({
      regionalFlavor: "new_orleans",
      personalityMode: "best_friend",
    });
    expect(preferences).toMatchObject({
      preferredConversationLanguage: "en",
      regionalSpeechComprehension: "new_orleans",
      regionalSpeakingStyle: "member_selected",
      pronunciationAssistance: false,
      languageDetectionMode: "off",
      codeSwitchingMode: "manual",
      persona: "best_friend",
      legacyRegionalStyleFallback: true,
    });
  });

  it("accepts only explicit, bounded language settings", () => {
    expect(
      validateMemberLanguagePreferencePatch({
        preferredConversationLanguage: "es",
        regionalSpeechComprehension: "new_orleans",
        regionalSpeakingStyle: "member_selected",
        pronunciationAssistance: true,
        languageDetectionMode: "ask",
        codeSwitchingMode: "manual",
      }),
    ).toEqual([]);
    expect(
      validateMemberLanguagePreferencePatch({
        preferredConversationLanguage: "fr",
        regionalSpeechComprehension: "unknown-city",
        pronunciationAssistance: "yes",
      }).length,
    ).toBeGreaterThan(0);
  });

  it("passes only reviewed names into a bounded transcription context", () => {
    const preferences = normalizeMemberLanguagePreferences({
      preferredConversationLanguage: "en",
      regionalSpeechComprehension: "new_orleans",
      regionalSpeakingStyle: "standard",
      pronunciationAssistance: true,
    });
    const context = buildBoundedVoiceLanguageContext({
      preferences,
      references: [tchoupitoulas],
    });
    expect(context.languageCode).toBe("en");
    expect(context.transcriptionPrompt).toContain("Tchoupitoulas Street");
    expect(context.transcriptionPrompt).not.toContain("chat history");
    expect(context.approvedReferences).toEqual([
      {
        canonicalId: "new-orleans-tchoupitoulas",
        writtenName: "Tchoupitoulas Street",
      },
    ]);
  });

  it("requires exact reviewed aliases before producing pronunciation guidance", () => {
    expect(
      matchReviewedPlaceReferences("Take me to Tchoupitoulas Street", [
        tchoupitoulas,
      ]),
    ).toHaveLength(1);
    expect(
      matchReviewedPlaceReferences("Take me to an unfamiliar street", [
        tchoupitoulas,
      ]),
    ).toHaveLength(0);
    expect(
      buildReviewedPronunciationGuidance({
        spokenText: "Tchoupitoulas Street",
        references: [tchoupitoulas],
      }),
    ).toContain("chop-uh-TOO-luhs");
    expect(
      buildReviewedPronunciationGuidance({
        spokenText: "unfamiliar street",
        references: [tchoupitoulas],
      }),
    ).toBeNull();
  });

  it("separates comprehension from speaking style and fails closed in high-stakes contexts", () => {
    const preferences = normalizeMemberLanguagePreferences({
      regionalSpeechComprehension: "new_orleans",
      regionalSpeakingStyle: "standard",
      preferredConversationLanguage: "es",
    });
    const ordinary = buildRegionalComprehensionPrompt({ preferences });
    expect(ordinary).toContain("Understand a clearly expressed regional term");
    expect(ordinary).toContain("Use plain language unless");
    expect(ordinary).toContain("Spanish");
    expect(
      buildRegionalComprehensionPrompt({
        preferences,
        intentClass: "medical_health",
      }),
    ).toContain("Use calm, precise plain language");
  });
});
