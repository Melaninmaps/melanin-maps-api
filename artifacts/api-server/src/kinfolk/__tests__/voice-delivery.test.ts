import { describe, expect, it } from "vitest";
import {
  KINFOLK_TTS_BASE_VOICE_ENV,
  KINFOLK_TTS_MODEL_ENV,
  KINFOLK_TTS_PROVIDER_ENV,
  normalizeKinfolkSpeechRequest,
  resolveKinfolkSpeechConfiguration,
  resolveKinfolkVoiceDelivery,
} from "../voice-delivery";

describe("Kinfolk server-owned voice delivery", () => {
  it("keeps one approved base voice on the server and fails closed on invalid settings", () => {
    expect(resolveKinfolkSpeechConfiguration({} as NodeJS.ProcessEnv)).toMatchObject({
      provider: "openai",
      model: "gpt-audio",
      baseVoice: "onyx",
    });
    expect(resolveKinfolkSpeechConfiguration({
      [KINFOLK_TTS_PROVIDER_ENV]: "unapproved-provider",
    } as NodeJS.ProcessEnv)).toBeNull();
    expect(resolveKinfolkSpeechConfiguration({
      [KINFOLK_TTS_BASE_VOICE_ENV]: "celebrity-clone",
    } as NodeJS.ProcessEnv)).toBeNull();
    expect(resolveKinfolkSpeechConfiguration({
      [KINFOLK_TTS_MODEL_ENV]: "unapproved-audio-model",
    } as NodeJS.ProcessEnv)).toBeNull();
  });

  it("uses the same base-voice policy while varying only the four delivery profiles", () => {
    expect(resolveKinfolkVoiceDelivery("community")).toMatchObject({ label: "Just Big Cousin" });
    expect(resolveKinfolkVoiceDelivery("professor")).toMatchObject({ label: "Professor" });
    expect(resolveKinfolkVoiceDelivery("business_manager")).toMatchObject({ label: "Business Manager" });
    expect(resolveKinfolkVoiceDelivery("best_friend")).toMatchObject({ label: "Best Friend" });

    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      const delivery = resolveKinfolkVoiceDelivery(mode);
      expect(delivery.styleInstruction).toMatch(/English/i);
      expect(delivery.styleInstruction).toMatch(/never imitate|never perform/i);
    }
  });

  it("accepts only delivery mode and request metadata from a client speech request", () => {
    expect(normalizeKinfolkSpeechRequest({
      mode: "professor",
      requestId: "turn-123",
      voice: "untrusted-client-voice",
    })).toEqual({ mode: "professor", requestId: "turn-123" });
    expect(normalizeKinfolkSpeechRequest({ mode: "unrecognized", requestId: 8 }))
      .toEqual({ mode: "community", requestId: null });
  });
});
