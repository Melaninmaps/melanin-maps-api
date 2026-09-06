/**
 * The only server-side model selections used by Kinfolk.
 * Roles are allowlisted here; no call site reads a model environment variable
 * directly. Deployments can pin an approved provider model per role.
 */
export type KinfolkModelRole = "staffDemo" | "fallback" | "webSearch" | "libraryResearch" | "transcription";

const SETTINGS: Record<KinfolkModelRole, { env: string; fallback: string }> = {
  staffDemo: { env: "KINFOLK_STAFF_DEMO_MODEL", fallback: "gpt-5" },
  fallback: { env: "KINFOLK_FALLBACK_MODEL", fallback: "gpt-4o-mini" },
  webSearch: { env: "KINFOLK_WEB_SEARCH_MODEL", fallback: "gpt-5" },
  libraryResearch: { env: "LIBRARY_RESEARCH_MODEL", fallback: "gpt-4o-mini" },
  transcription: { env: "KINFOLK_TRANSCRIPTION_MODEL", fallback: "gpt-4o-mini-transcribe" },
};

export function kinfolkModel(role: KinfolkModelRole, env: NodeJS.ProcessEnv = process.env): string {
  const setting = SETTINGS[role];
  const configured = env[setting.env]?.trim();
  return configured || setting.fallback;
}