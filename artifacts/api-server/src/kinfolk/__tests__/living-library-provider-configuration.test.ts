import { describe, expect, it } from "vitest";
import { resolveKinfolkLivingLibraryWriterConfiguration } from "../living-library-provider-config";

describe("Kinfolk Living Library provider configuration", () => {
  it("uses the standard OpenAI configuration for a Library writer", () => {
    expect(resolveKinfolkLivingLibraryWriterConfiguration({
      OPENAI_API_KEY: "standard-key",
      LIBRARY_RESEARCH_MODEL: "gpt-5-mini",
    } as NodeJS.ProcessEnv)).toEqual({
      apiKey: "standard-key",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5-mini",
    });
  });

  it("continues to support only a paired legacy integration configuration", () => {
    expect(resolveKinfolkLivingLibraryWriterConfiguration({
      AI_INTEGRATIONS_OPENAI_API_KEY: "integration-key",
      AI_INTEGRATIONS_OPENAI_BASE_URL: "https://provider.example/v1/",
    } as NodeJS.ProcessEnv)).toEqual({
      apiKey: "integration-key",
      baseUrl: "https://provider.example/v1",
      model: "gpt-4o-mini",
    });
  });

  it("does not construct a writer with an empty credential", () => {
    expect(resolveKinfolkLivingLibraryWriterConfiguration({} as NodeJS.ProcessEnv)).toBeNull();
  });
});
