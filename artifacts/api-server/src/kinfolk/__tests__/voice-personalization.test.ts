import { describe, expect, it } from "vitest";
import {
  buildAaveRegisterPrompt,
  buildLanguagePersonalizationPrompt,
  buildRegionalLanguagePrompt,
  defaultVoicePreferences,
  normalizeKinfolkVoice,
  normalizeRegionalFlavor,
  resolveRegionalLanguageProfile,
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
    })).toEqual({ ok: true });

    const invalid = validateKinfolkPreferenceUpdate({
      kinfolkVoice: "celebrity-clone",
      autoSpeak: "yes",
      aaveLevel: 4,
      regionalFlavor: "wherever",
      emojiLevel: "constant",
      favoriteCities: ["Memphis", 3],
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.issues).toHaveLength(6);
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
  });
});
