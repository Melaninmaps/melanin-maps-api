import { resolveOpenAIConfiguration } from "@workspace/integrations-openai-ai-server";
import { kinfolkModel } from "./model-config";

export type KinfolkLivingLibraryWriterConfiguration = Readonly<{
  apiKey: string;
  baseUrl: string;
  model: string;
}>;

/**
 * Resolves the same paired OpenAI configuration used by the primary Kinfolk
 * route. A standard OPENAI_API_KEY is sufficient; legacy integration aliases
 * remain supported only when they include their matching base URL.
 */
export function resolveKinfolkLivingLibraryWriterConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): KinfolkLivingLibraryWriterConfiguration | null {
  const configuration = resolveOpenAIConfiguration(environment);
  if (!configuration) return null;

  return {
    apiKey: configuration.apiKey,
    baseUrl: configuration.baseURL.replace(/\/$/, ""),
    model: kinfolkModel("libraryResearch", environment),
  };
}
