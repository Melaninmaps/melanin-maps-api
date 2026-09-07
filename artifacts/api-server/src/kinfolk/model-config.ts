/**
 * The only server-side model selections used by Kinfolk.
 * Roles are allowlisted here; no call site reads a model environment variable
 * directly. Deployments can pin an approved provider model per role.
 */
export type KinfolkModelRole = "staffDemo" | "fallback" | "webSearch" | "libraryResearch" | "transcription";

const CHAT_MODELS = new Set(["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"]);
const RESEARCH_MODELS = new Set(["gpt-5", "gpt-5-mini", "gpt-4o", "gpt-4o-mini"]);
const TRANSCRIPTION_MODELS = new Set(["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"]);

const SETTINGS: Record<KinfolkModelRole, { env: string; fallback: string; allowed: ReadonlySet<string> }> = {
  staffDemo: { env: "KINFOLK_STAFF_DEMO_MODEL", fallback: "gpt-5", allowed: CHAT_MODELS },
  fallback: { env: "KINFOLK_FALLBACK_MODEL", fallback: "gpt-4o-mini", allowed: CHAT_MODELS },
  webSearch: { env: "KINFOLK_WEB_SEARCH_MODEL", fallback: "gpt-5", allowed: RESEARCH_MODELS },
  libraryResearch: { env: "LIBRARY_RESEARCH_MODEL", fallback: "gpt-4o-mini", allowed: RESEARCH_MODELS },
  transcription: { env: "KINFOLK_TRANSCRIPTION_MODEL", fallback: "gpt-4o-mini-transcribe", allowed: TRANSCRIPTION_MODELS },
};

export function kinfolkModel(role: KinfolkModelRole, env: NodeJS.ProcessEnv = process.env): string {
  const setting = SETTINGS[role];
  const configured = env[setting.env]?.trim();
  return configured && setting.allowed.has(configured) ? configured : setting.fallback;
}

export function assertKinfolkModelEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const invalid = (Object.entries(SETTINGS) as Array<[KinfolkModelRole, typeof SETTINGS[KinfolkModelRole]]>)
    .flatMap(([role, setting]) => {
      const configured = env[setting.env]?.trim();
      return configured && !setting.allowed.has(configured)
        ? [`${setting.env} is not approved for Kinfolk role ${role}.`]
        : [];
    });
  if (invalid.length > 0) {
    throw new Error(`Invalid Kinfolk model configuration: ${invalid.join(" ")}`);
  }
}
