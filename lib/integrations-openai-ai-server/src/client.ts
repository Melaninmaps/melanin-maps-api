import OpenAI from "openai";

export const STANDARD_OPENAI_BASE_URL = "https://api.openai.com/v1";

export type OpenAIConfiguration = Readonly<{
  apiKey: string;
  baseURL: string;
}>;

/**
 * Prefer the original integration variables when available, while allowing a
 * normal OpenAI API key deployment to work without duplicating a secret under
 * a second variable name. A standard-key fallback always targets OpenAI's
 * documented v1 endpoint; custom providers must set both integration values.
 */
export function resolveOpenAIConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): OpenAIConfiguration | null {
  const integratedApiKey = environment.AI_INTEGRATIONS_OPENAI_API_KEY?.trim();
  const standardApiKey = environment.OPENAI_API_KEY?.trim();
  const apiKey = integratedApiKey || standardApiKey;
  if (!apiKey) return null;

  const baseURL = environment.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim()
    || environment.OPENAI_BASE_URL?.trim()
    || (standardApiKey ? STANDARD_OPENAI_BASE_URL : "");
  return baseURL ? { apiKey, baseURL } : null;
}

function getOpenAI(): OpenAI {
  const configuration = resolveOpenAIConfiguration();
  if (!configuration) {
    throw new Error(
      "OpenAI configuration is required. Set AI_INTEGRATIONS_OPENAI_API_KEY with AI_INTEGRATIONS_OPENAI_BASE_URL, or OPENAI_API_KEY.",
    );
  }
  return new OpenAI({
    apiKey: configuration.apiKey,
    baseURL: configuration.baseURL,
    maxRetries: 0,
  });
}

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  },
});
