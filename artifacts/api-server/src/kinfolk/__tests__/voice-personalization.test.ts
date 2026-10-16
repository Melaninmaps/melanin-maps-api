import { describe, expect, it } from "vitest";
import {
  buildAaveRegisterPrompt,
  buildKinfolkAaveDeliveryCheck,
  buildLanguagePersonalizationPrompt,
  buildRegionalLanguagePrompt,
  defaultVoicePreferences,
  normalizeKinfolkVoice,
  normalizeRegionalFlavor,
  resolveRegionalLanguageProfile,
  shouldReviewKinfolkAaveDelivery,
  validateKinfolkPreferenceUpdate,
} from "../voice-personalization";

describe("Kinfolk voice preference defaults and validation", () => {
  it("keeps spoken replies and regional vocabulary off by default", () => {
    expect(defaultVoicePreferences()).toEqual({
      kinfolkVoice: "onyx",
      autoSpeak: false,
      aaveLevel: 0,
      regionalFlavor: "off",
    });
    expect(normalizeKinfolkVoice("unknown")).toBe("onyx");
    expect(normalizeRegionalFlavor("standard")).toBe("off");
  });

  it("accepts persisted voice settings and rejects invalid enum, range, and type values", () => {
    expect(validateKinfolkPreferenceUpdate({
      kinfolkVoice: "nova",
      autoSpeak: true,
      aaveLevel: 3,
      regionalFlavor: "follow_destination",
      communicationStyle: "friendly",
      recommendationLifeStage: "40_64",
      personalityMode: "business_manager",
    })).toEqual({ ok: true });

    // Existing saved preference labels remain valid to avoid silently
    // overwriting a member's profile during the four-mode migration.
    expect(validateKinfolkPreferenceUpdate({ personalityMode: "neighborhood_guide" })).toEqual({ ok: true });

    const invalid = validateKinfolkPreferenceUpdate({
      kinfolkVoice: "celebrity-clone",
      autoSpeak: "yes",
      aaveLevel: 4,
      regionalFlavor: "wherever",
      emojiLevel: "constant",
      recommendationLifeStage: "45",
      favoriteCities: ["Memphis", 3],
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.issues).toHaveLength(7);
  });

  it("validates the Support Lens mode contract", () => {
    expect(
      validateKinfolkPreferenceUpdate({
        supportLensMode: "strict_documented_designations",
      }),
    ).toEqual({ ok: true });
    const invalid = validateKinfolkPreferenceUpdate({
      supportLensMode: "rank_matching_first",
    });
    expect(invalid.ok).toBe(false);
  });
});

describe("Kinfolk regional and AAVE prompt wiring", () => {
  it("uses the destination only for follow-conversation-city and honors an explicit city instead", () => {
    expect(resolveRegionalLanguageProfile("off", "Philadelphia")?.id).toBeUndefined();
    expect(resolveRegionalLanguageProfile("follow_destination", "Philadelphia, PA")?.id).toBe("philadelphia");
    expect(resolveRegionalLanguageProfile("memphis", "Philadelphia, PA")?.id).toBe("memphis");

    const followed = buildRegionalLanguagePrompt({
      regionalFlavor: "follow_destination",
      destination: "Philadelphia, PA",
      intentClass: "culture_entertainment",
    });
    expect(followed).toContain('"jawn"');
    expect(followed).toContain("at most ONE");
    expect(followed).toContain("private delivery preference");
    expect(followed).toContain("expressions you considered");
    expect(followed).toContain("If no expression fits naturally, use none");
    expect(followed).not.toContain("mane");
  });

  it.each(["medical_health", "safety_emergency", "legal_regulated", "financial_regulated"])(
    "suppresses AAVE and regional slang for %s",
    (intentClass) => {
      const prompt = buildLanguagePersonalizationPrompt({
        aaveLevel: 3,
        regionalFlavor: "memphis",
        destination: "Memphis",
        intentClass,
      });
      expect(prompt).toMatch(/calm, precise plain language/i);
      expect(prompt).toMatch(/do not use AAVE or regional slang/i);
      expect(prompt).not.toContain('"mane"');
    },
  );

  it("allows no profanity at any AAVE level and prohibits caricature or identity inference", () => {
    for (const level of [1, 2, 3]) {
      const prompt = buildAaveRegisterPrompt(level, "general_knowledge");
      expect(prompt).toContain("Use no profanity");
      expect(prompt).toContain("Never perform, exaggerate, caricature, stereotype");
      expect(prompt).toContain("infer identity");
      expect(prompt).not.toMatch(/profanity (?:is )?allowed|casual profanity/i);
    }
    expect(buildAaveRegisterPrompt(2, "general_knowledge")).toContain(
      "in the response itself",
    );
    expect(buildAaveRegisterPrompt(2, "general_knowledge")).toContain(
      "grammar, syntax, rhythm, and sentence construction",
    );
    expect(buildAaveRegisterPrompt(2, "general_knowledge")).toContain(
      "stock greeting, stack familiar slang, or treat a phrasebook",
    );
    expect(buildAaveRegisterPrompt(2, "general_knowledge")).toContain(
      "one coherent human voice",
    );
    expect(buildAaveRegisterPrompt(2, "general_knowledge")).toContain(
      "Never manufacture nonstandard grammar, switch subject and object forms",
    );
    expect(buildAaveRegisterPrompt(2, "general_knowledge")).toContain(
      "do not silently fall back to mostly standard-English prose",
    );
    expect(buildAaveRegisterPrompt(3, "general_knowledge")).toContain(
      "without stacking stock slang",
    );
  });

  it("uses first-call contextual AAVE guidance rather than marker-count rewrite heuristics", () => {
    const languagePrompt = buildLanguagePersonalizationPrompt({
      aaveLevel: 2,
      regionalFlavor: "off",
      intentClass: "general_knowledge",
    });
    expect(languagePrompt).toContain("explicit member language choice");
    expect(languagePrompt).toContain("not merely a standard-English answer");
    expect(languagePrompt).not.toContain("at least two ordinary sentences");
    expect(languagePrompt).not.toContain("FINAL QUALITY GATE");
  });

  it("adds a final delivery confirmation only for an active level-two AAVE preference", () => {
    const languagePrompt = buildLanguagePersonalizationPrompt({
      aaveLevel: 2,
      regionalFlavor: "off",
      intentClass: "general_knowledge",
    });
    expect(buildKinfolkAaveDeliveryCheck({ aaveLevel: 2, languagePrompt })).toContain(
      "externally visible delivery choice",
    );
    expect(buildKinfolkAaveDeliveryCheck({ aaveLevel: 0, languagePrompt })).toBe("");
    expect(buildKinfolkAaveDeliveryCheck({ aaveLevel: 2, languagePrompt: "" })).toBe("");
  });

  it("limits native-quality AAVE review to an explicit direct-reply preference", () => {
    const languagePrompt = buildLanguagePersonalizationPrompt({
      aaveLevel: 2,
      regionalFlavor: "off",
      intentClass: "general_knowledge",
    });
    expect(shouldReviewKinfolkAaveDelivery({
      aaveLevel: 2,
      languagePrompt,
      isGeneratedArtifact: false,
    })).toBe(true);
    expect(shouldReviewKinfolkAaveDelivery({
      aaveLevel: 2,
      languagePrompt,
      isGeneratedArtifact: true,
    })).toBe(false);
    expect(shouldReviewKinfolkAaveDelivery({
      aaveLevel: 0,
      languagePrompt,
      isGeneratedArtifact: false,
    })).toBe(false);
  });
});
