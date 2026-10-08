import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  KINFOLK_TTS_BASE_VOICE_ENV,
  KINFOLK_TTS_MODEL_ENV,
  KINFOLK_TTS_PROVIDER_ENV,
  buildKinfolkSpeechInstruction,
  normalizeKinfolkSpeechRequest,
  resolveMemberKinfolkSpeakerProfile,
  resolveMemberKinfolkSpeechVoice,
  resolveKinfolkSpeechConfiguration,
  resolveKinfolkVoiceDelivery,
} from "../voice-delivery";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk server-owned voice delivery", () => {
  it("keeps one approved base voice on the server and fails closed on invalid settings", () => {
    expect(resolveKinfolkSpeechConfiguration({} as NodeJS.ProcessEnv)).toMatchObject({
      provider: "openai",
      model: "gpt-4o-mini-tts",
      baseVoice: "onyx",
    });
    expect(resolveKinfolkSpeechConfiguration({
      [KINFOLK_TTS_MODEL_ENV]: "gpt-audio",
    } as NodeJS.ProcessEnv)).toMatchObject({
      model: "gpt-4o-mini-tts",
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

  it("uses a persisted, approved speaker choice while varying only the four delivery profiles", () => {
    const config = resolveKinfolkSpeechConfiguration({} as NodeJS.ProcessEnv)!;
    expect(resolveMemberKinfolkSpeakerProfile(config, "nova")).toMatchObject({
      id: "female",
      label: "Female Voice",
      voice: "nova",
    });
    expect(resolveMemberKinfolkSpeakerProfile(config, "shimmer")).toMatchObject({
      id: "female",
      voice: "nova",
    });
    expect(resolveMemberKinfolkSpeakerProfile(config, "untrusted-client-voice")).toMatchObject({
      id: "standard",
      label: "Standard Kinfolk Voice",
      voice: config.baseVoice,
    });
    expect(resolveMemberKinfolkSpeechVoice(config, "nova")).toBe("nova");
    expect(resolveMemberKinfolkSpeechVoice(config, "shimmer")).toBe("nova");
    expect(resolveMemberKinfolkSpeechVoice(config, "untrusted-client-voice")).toBe(config.baseVoice);
    expect(resolveMemberKinfolkSpeechVoice(config, undefined)).toBe(config.baseVoice);
    expect(resolveKinfolkVoiceDelivery("community")).toMatchObject({ label: "Big Cousin" });
    expect(resolveKinfolkVoiceDelivery("professor")).toMatchObject({ label: "Professor" });
    expect(resolveKinfolkVoiceDelivery("business_manager")).toMatchObject({ label: "Business Manager" });
    expect(resolveKinfolkVoiceDelivery("best_friend")).toMatchObject({ label: "Best Friend" });

    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      const delivery = resolveKinfolkVoiceDelivery(mode);
      expect(delivery.styleInstruction).toMatch(/English/i);
      expect(delivery.styleInstruction).toMatch(/never imitate|never perform/i);
    }
  });

  it("keeps the specified Female Voice identity separate from mode delivery", () => {
    const config = resolveKinfolkSpeechConfiguration({} as NodeJS.ProcessEnv)!;
    const female = resolveMemberKinfolkSpeakerProfile(config, "nova");
    expect(female.styleInstruction).toMatch(/warm, grounded, confident adult woman/i);
    expect(female.styleInstruction).toMatch(/natural, clear, and steady/i);
    expect(female.styleInstruction).toMatch(/robotic, childish, breathy, overly cheerful, seductive, stereotyped/i);
    expect(female.styleInstruction).toMatch(/real person/i);

    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      const instruction = buildKinfolkSpeechInstruction(resolveKinfolkVoiceDelivery(mode), female);
      expect(instruction).toContain(female.styleInstruction);
      expect(instruction).toContain("never changes the selected speaker identity");
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

  it("returns only valid audio metadata to the protected client playback path", () => {
    expect(routeSource).toContain('router.post("/kinfolk/speak"');
    expect(routeSource).toContain("audioBuffer.length < 256");
    expect(routeSource).toContain('contentType: "audio/wav"');
    expect(routeSource).toContain("splitKinfolkSpeechText(text)");
    expect(routeSource).toContain("for (const spokenText of speechChunks)");
    expect(routeSource).toContain("clips: clips.map");
    expect(routeSource).toContain("spokenText: text");
    expect(routeSource).not.toContain("Math.min(text.length, 600)");
    expect(routeSource).not.toContain("slice(0, 597)");
    expect(routeSource).toContain("speakerProfile: speakerProfile.id");
    expect(routeSource).toContain("speakerLabel: speakerProfile.label");
    expect(routeSource).toContain("safeKinfolkErrorMetadata(err)");
  });
});
