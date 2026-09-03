import { describe, expect, it } from "vitest";
import {
  AAVE_LEVEL_OPTIONS,
  composerValueFromTranscript,
  KINFOLK_VOICE_OPTIONS,
  normalizeWebRegionalFlavor,
  REGIONAL_LANGUAGE_OPTIONS,
  shouldAutoSpeakNewReply,
} from "../lib/kinfolkVoicePreferences";

describe("Kinfolk transcript review", () => {
  it("places only the transcript in the composer for review", () => {
    expect(composerValueFromTranscript("  Find dinner in Memphis  ")).toBe("Find dinner in Memphis");
    expect(composerValueFromTranscript(undefined)).toBe("");
    expect(composerValueFromTranscript("Kinfolk heard nothing special")).toBe("Kinfolk heard nothing special");
  });
});

describe("Kinfolk automatic spoken replies", () => {
  it("requires explicit opt-in and a newly returned real assistant reply", () => {
    const valid = { isNewAssistantReply: true, content: "I found two options." };
    expect(shouldAutoSpeakNewReply({ ...valid, autoSpeak: false })).toBe(false);
    expect(shouldAutoSpeakNewReply({ ...valid, autoSpeak: true })).toBe(true);
    expect(shouldAutoSpeakNewReply({ ...valid, autoSpeak: true, isNewAssistantReply: false })).toBe(false);
    expect(shouldAutoSpeakNewReply({ ...valid, autoSpeak: true, degraded: true })).toBe(false);
    expect(shouldAutoSpeakNewReply({ ...valid, autoSpeak: true, errorFallback: true })).toBe(false);
    expect(shouldAutoSpeakNewReply({ ...valid, autoSpeak: true, content: "  " })).toBe(false);
  });
});

describe("Kinfolk voice preference labels", () => {
  it("brands the stable default without claiming a human clone and clearly labels feminine options", () => {
    const original = KINFOLK_VOICE_OPTIONS.find((voice) => voice.id === "onyx");
    expect(original?.label).toBe("Kinfolk Original");
    expect(original?.description).toMatch(/synthetic voice.*default/i);
    expect(KINFOLK_VOICE_OPTIONS.filter((voice) => voice.feminine).map((voice) => voice.id)).toEqual(["nova", "shimmer"]);
    expect(KINFOLK_VOICE_OPTIONS.map((voice) => `${voice.label} ${voice.description}`).join(" ")).not.toMatch(/clone|celebrity|human identity/i);
  });

  it("exposes respectful AAVE and opt-in regional choices grounded in supported cities", () => {
    expect(AAVE_LEVEL_OPTIONS.map((option) => option.label)).toEqual(["Off", "Light", "Conversational", "Full"]);
    expect(REGIONAL_LANGUAGE_OPTIONS.slice(0, 2).map((option) => option.label)).toEqual(["Off", "Follow conversation city"]);
    expect(REGIONAL_LANGUAGE_OPTIONS.map((option) => option.label)).toEqual(expect.arrayContaining(["Philadelphia", "Memphis"]));
    expect(normalizeWebRegionalFlavor("standard")).toBe("off");
  });
});
