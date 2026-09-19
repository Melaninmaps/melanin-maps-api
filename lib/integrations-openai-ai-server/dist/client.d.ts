import OpenAI from "openai";
export declare const STANDARD_OPENAI_BASE_URL = "https://api.openai.com/v1";
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
export declare function resolveOpenAIConfiguration(environment?: NodeJS.ProcessEnv): OpenAIConfiguration | null;
export declare const openai: OpenAI;
//# sourceMappingURL=client.d.ts.map