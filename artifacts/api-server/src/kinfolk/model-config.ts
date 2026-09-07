/**
 * The only server-side model selections used by Kinfolk.
 * Roles are allowlisted here; no call site reads a model environment variable
 * directly. Deployments can pin an approved provider model per role.
 */
export type KinfolkModelRole = "staffDemo" | "fallback" | "webSearch" | "libraryResearch" | "transcription" | "embedding";

const CHAT_MODELS = new Set(["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"]);
const RESEARCH_MODELS = new Set(["gpt-5", "gpt-5-mini", "gpt-4o", "gpt-4o-mini"]);
const TRANSCRIPTION_MODELS = new Set(["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"]);
const EMBEDDING_MODELS = new Set(["text-embedding-3-small"]);
export const KINFOLK_EMBEDDING_DIMENSIONS = 1536;

const SETTINGS: Record<KinfolkModelRole, { env: string | null; fallback: string; allowed: ReadonlySet<string> }> = {
  staffDemo: { env: "KINFOLK_STAFF_DEMO_MODEL", fallback: "gpt-5", allowed: CHAT_MODELS },
  fallback: { env: "KINFOLK_FALLBACK_MODEL", fallback: "gpt-4o-mini", allowed: CHAT_MODELS },
  webSearch: { env: "KINFOLK_WEB_SEARCH_MODEL", fallback: "gpt-5", allowed: RESEARCH_MODELS },
  libraryResearch: { env: "LIBRARY_RESEARCH_MODEL", fallback: "gpt-4o-mini", allowed: RESEARCH_MODELS },
  transcription: { env: "KINFOLK_TRANSCRIPTION_MODEL", fallback: "gpt-4o-mini-transcribe", allowed: TRANSCRIPTION_MODELS },
  // Semantic retrieval is an existing optional internal path, not a configurable
  // provider-readiness role. Keep its model centralized without inventing an
  // additional environment role beyond the five approved by this assignment.
  embedding: { env: null, fallback: "text-embedding-3-small", allowed: EMBEDDING_MODELS },
};

export function kinfolkModel(role: KinfolkModelRole, env: NodeJS.ProcessEnv = process.env): string {
  const setting = SETTINGS[role];
  const configured = setting.env ? env[setting.env]?.trim() : undefined;
  return configured && setting.allowed.has(configured) ? configured : setting.fallback;
}

export type KinfolkEmbeddingConfig = Readonly<{
  model: string;
  dimensions: typeof KINFOLK_EMBEDDING_DIMENSIONS;
}>;

/**
 * Semantic retrieval is optional, but when enabled it must match the fixed
 * vector(1536) database column exactly. Partial numeric strings, decimals,
 * signs, exponents, and every other dimension are rejected rather than
 * silently coerced.
 */
export function kinfolkEmbeddingConfig(
  env: NodeJS.ProcessEnv = process.env,
): KinfolkEmbeddingConfig | null {
  const configured = env.KINFOLK_EMBEDDING_DIMENSIONS?.trim();
  if (!configured) return null;
  if (!/^\d+$/.test(configured) || Number(configured) !== KINFOLK_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `KINFOLK_EMBEDDING_DIMENSIONS must be exactly ${KINFOLK_EMBEDDING_DIMENSIONS} for Kinfolk semantic retrieval.`,
    );
  }
  return {
    model: kinfolkModel("embedding", env),
    dimensions: KINFOLK_EMBEDDING_DIMENSIONS,
  };
}

export function assertKinfolkModelEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const invalid = (Object.entries(SETTINGS) as Array<[KinfolkModelRole, typeof SETTINGS[KinfolkModelRole]]>)
    .flatMap(([role, setting]) => {
      const configured = setting.env ? env[setting.env]?.trim() : undefined;
      return configured && !setting.allowed.has(configured)
        ? [`${setting.env ?? role} is not approved for Kinfolk role ${role}.`]
        : [];
    });
  if (invalid.length > 0) {
    throw new Error(`Invalid Kinfolk model configuration: ${invalid.join(" ")}`);
  }
  kinfolkEmbeddingConfig(env);
}
