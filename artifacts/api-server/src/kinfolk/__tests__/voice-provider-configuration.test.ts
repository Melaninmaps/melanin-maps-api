import { describe, expect, it } from "vitest";
import { resolveAudioOpenAIConfiguration } from "@workspace/integrations-openai-ai-server/audio";

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

  it("fails closed when no supported OpenAI configuration is present", () => {
    expect(() => resolveAudioOpenAIConfiguration({} as NodeJS.ProcessEnv)).toThrow(
      /OpenAI configuration is required/,
    );
  });
});
