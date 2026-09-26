import { describe, expect, it } from "vitest";
import {
  resolveOpenAIConfiguration,
  STANDARD_OPENAI_BASE_URL,
} from "@workspace/integrations-openai-ai-server";
import {
  createOpenAISpeechRequest,
  resolveAudioOpenAIConfiguration,
} from "@workspace/integrations-openai-ai-server/audio";

describe("Kinfolk voice provider configuration", () => {
  it("accepts the standard production OpenAI configuration for server audio", () => {
    expect(resolveAudioOpenAIConfiguration({
      OPENAI_API_KEY: "standard-production-key",
    } as NodeJS.ProcessEnv)).toEqual({
      apiKey: "standard-production-key",
      baseURL: "https://api.openai.com/v1",
    });
  });

  it("continues to support the paired integration configuration", () => {
    expect(resolveAudioOpenAIConfiguration({
      AI_INTEGRATIONS_OPENAI_API_KEY: "integration-key",
      AI_INTEGRATIONS_OPENAI_BASE_URL: "https://provider.example/v1",
    } as NodeJS.ProcessEnv)).toEqual({
      apiKey: "integration-key",
      baseURL: "https://provider.example/v1",
    });
  });

  it("prefers the standard OpenAI endpoint for audio when both providers are configured", () => {
    expect(resolveAudioOpenAIConfiguration({
      OPENAI_API_KEY: "standard-production-key",
      AI_INTEGRATIONS_OPENAI_API_KEY: "integration-key",
      AI_INTEGRATIONS_OPENAI_BASE_URL: "https://text-only-proxy.example/v1",
    } as NodeJS.ProcessEnv)).toEqual({
      apiKey: "standard-production-key",
      baseURL: STANDARD_OPENAI_BASE_URL,
    });
  });

  it("does not pair a standard OpenAI key with a leftover integration endpoint", () => {
    expect(resolveOpenAIConfiguration({
      OPENAI_API_KEY: "standard-production-key",
      AI_INTEGRATIONS_OPENAI_BASE_URL: "https://legacy-proxy.example/v1",
    } as NodeJS.ProcessEnv)).toEqual({
      apiKey: "standard-production-key",
      baseURL: STANDARD_OPENAI_BASE_URL,
    });
  });

  it("uses a custom endpoint only when it is paired with its integration key", () => {
    expect(resolveOpenAIConfiguration({
      OPENAI_API_KEY: "standard-production-key",
      AI_INTEGRATIONS_OPENAI_API_KEY: "integration-key",
      AI_INTEGRATIONS_OPENAI_BASE_URL: "https://provider.example/v1",
    } as NodeJS.ProcessEnv)).toEqual({
      apiKey: "integration-key",
      baseURL: "https://provider.example/v1",
    });
  });

  it("fails closed when no supported OpenAI configuration is present", () => {
    expect(() => resolveAudioOpenAIConfiguration({} as NodeJS.ProcessEnv)).toThrow(
      /OpenAI configuration is required/,
    );
  });

  it("uses the documented speech endpoint request shape and keeps delivery direction separate from the script", () => {
    expect(createOpenAISpeechRequest({
      text: "Here is what matters next.",
      voice: "onyx",
      format: "wav",
      model: "gpt-audio",
      styleInstruction: "Speak in English with a calm, warm, direct cadence.",
    })).toEqual({
      model: "gpt-4o-mini-tts",
      voice: "onyx",
      input: "Here is what matters next.",
      response_format: "wav",
      instructions: "Speak in English with a calm, warm, direct cadence.",
    });
  });

  it("maps the legacy PCM label to the documented speech endpoint value", () => {
    expect(createOpenAISpeechRequest({
      text: "A short check.",
      voice: "alloy",
      format: "pcm16",
    }).response_format).toBe("pcm");
  });
});
