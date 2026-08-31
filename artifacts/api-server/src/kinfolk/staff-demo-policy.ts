export type KinfolkDemoMode = "standard" | "staff_demo";

export type KinfolkStaffDemoEligibility = {
  authenticated: boolean;
  administrator: boolean;
  activeTester: boolean;
};

export type KinfolkModelPolicy = {
  mode: KinfolkDemoMode;
  primaryModel: string;
  fallbackModel: string | null;
  maxOutputTokens: number;
  historyMessageLimit: number;
  historyCharacterLimit: number;
};

export type KinfolkExperience = {
  mode: "staff_demo";
  label: "Staff demo";
  qualityTier: "quality";
  contextTurns: 6;
};

export type KinfolkHistoryInput = {
  role: "user" | "assistant";
  content: string;
};

export type CompatibilityFallbackReason =
  | "compatibility_http_status"
  | "model_not_found"
  | "unsupported_request_parameter";

export type CompatibilityFallbackClassification = {
  eligible: boolean;
  reason: CompatibilityFallbackReason | null;
  providerStatus: number | null;
};

export type KinfolkEnvironment = Partial<Record<
  "KINFOLK_STAFF_DEMO_MODEL" | "KINFOLK_FALLBACK_MODEL",
  string | undefined
>>;

const STANDARD_MODEL = "gpt-4o-mini";
const DEFAULT_STAFF_MODEL = "gpt-5";
const STANDARD_MAX_OUTPUT_TOKENS = 600;
const STAFF_MAX_OUTPUT_TOKENS = 900;

export const STAFF_DEMO_EXPERIENCE: Readonly<KinfolkExperience> = Object.freeze({
  mode: "staff_demo",
  label: "Staff demo",
  qualityTier: "quality",
  contextTurns: 6,
});

export const KINFOLK_CONTEXT_TRUTH_BLOCK = `CONTEXT AND MEMORY TRUTH — NON-NEGOTIABLE:
Use only the context supplied in this request, including recent conversation history, member-selected preferences, and any consent-gated private memory explicitly provided by the server. You have no automatic or unlimited memory, this conversation does not train you, and you must not imply that information will persist unless a server-provided memory block explicitly says it was saved with consent.`;

export const STAFF_DEMO_STYLE_BLOCK = `STAFF DEMO RESPONSE STYLE — SUBORDINATE TO ALL GOVERNING RULES:
Answer directly and naturally. Prefer short paragraphs or compact bullets when they improve clarity. Ask at most one optional clarifying question, and only when it would materially improve the answer. Never invent a citation or URL; use only sources supplied in the request. Safety, privacy, source and citation requirements, server-resolved geography, and response-enforcement rules always override this style guidance.`;

function configuredModel(value: string | undefined, fallback: string): string {
  const configured = value?.trim();
  return configured || fallback;
}

export function isStaffDemoEligible(input: KinfolkStaffDemoEligibility): boolean {
  return input.authenticated && (input.administrator || input.activeTester);
}

export function resolveKinfolkModelPolicy(
  eligibleForStaffDemo: boolean,
  env: KinfolkEnvironment,
): KinfolkModelPolicy {
  if (!eligibleForStaffDemo) {
    return {
      mode: "standard",
      primaryModel: STANDARD_MODEL,
      fallbackModel: null,
      maxOutputTokens: STANDARD_MAX_OUTPUT_TOKENS,
      historyMessageLimit: 8,
      historyCharacterLimit: 400,
    };
  }

  return {
    mode: "staff_demo",
    primaryModel: configuredModel(env.KINFOLK_STAFF_DEMO_MODEL, DEFAULT_STAFF_MODEL),
    fallbackModel: configuredModel(env.KINFOLK_FALLBACK_MODEL, STANDARD_MODEL),
    maxOutputTokens: STAFF_MAX_OUTPUT_TOKENS,
    historyMessageLimit: 12,
    historyCharacterLimit: 1200,
  };
}

/** The health/canary model is the configured compatibility model, never the staff quality model. */
export function resolveKinfolkProbeModel(env: KinfolkEnvironment): string {
  return configuredModel(env.KINFOLK_FALLBACK_MODEL, STANDARD_MODEL);
}

export function isGpt5Family(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  const finalSegment = normalized.split("/").pop() ?? normalized;
  return /^gpt-5(?:$|[-.])/.test(finalSegment);
}

export function buildKinfolkChatCompletionRequest<TMessages>(input: {
  model: string;
  messages: TMessages;
  maxOutputTokens: number;
  temperature?: number;
}): {
  model: string;
  messages: TMessages;
  response_format: { type: "json_object" };
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
} {
  const common = {
    model: input.model,
    messages: input.messages,
    response_format: { type: "json_object" as const },
  };

  if (isGpt5Family(input.model)) {
    return {
      ...common,
      max_completion_tokens: input.maxOutputTokens,
    };
  }

  return {
    ...common,
    max_tokens: input.maxOutputTokens,
    ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
  };
}

export function buildKinfolkProbeRequest<TMessages>(input: {
  model: string;
  messages: TMessages;
  maxOutputTokens: number;
  temperature?: number;
}): {
  model: string;
  messages: TMessages;
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
} {
  const common = { model: input.model, messages: input.messages };
  if (isGpt5Family(input.model)) {
    return { ...common, max_completion_tokens: input.maxOutputTokens };
  }
  return {
    ...common,
    max_tokens: input.maxOutputTokens,
    ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
  };
}

export function buildKinfolkHistory<T extends KinfolkHistoryInput>(
  messages: readonly T[],
  policy: Pick<KinfolkModelPolicy, "historyMessageLimit" | "historyCharacterLimit">,
): KinfolkHistoryInput[] {
  return messages
    .slice(-policy.historyMessageLimit)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, policy.historyCharacterLimit),
    }));
}

function providerStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const candidate = (error as { status?: unknown; statusCode?: unknown }).status
    ?? (error as { statusCode?: unknown }).statusCode;
  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : null;
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return String(error ?? "");
}

export function classifyCompatibilityFallback(
  error: unknown,
): CompatibilityFallbackClassification {
  const status = providerStatus(error);
  const name = errorName(error);
  if (name === "AbortError" || name === "TimeoutError" || status === 401 || status === 403) {
    return { eligible: false, reason: null, providerStatus: status };
  }

  if (status === 400 || status === 404 || status === 422) {
    return { eligible: true, reason: "compatibility_http_status", providerStatus: status };
  }

  const message = errorMessage(error).toLowerCase();
  if (/model.{0,80}(not found|does not exist|not available|not supported)|unknown model|invalid model/.test(message)) {
    return { eligible: true, reason: "model_not_found", providerStatus: status };
  }
  if (/unsupported (parameter|argument|request)|unknown parameter|unrecognized request argument|does not support.{0,80}(parameter|temperature|max_tokens|max_completion_tokens|response_format)|parameter.{0,80}(not supported|is unsupported)/.test(message)) {
    return { eligible: true, reason: "unsupported_request_parameter", providerStatus: status };
  }

  return { eligible: false, reason: null, providerStatus: status };
}

export function staffDemoPromptBlock(policy: Pick<KinfolkModelPolicy, "mode">): string {
  return policy.mode === "staff_demo" ? STAFF_DEMO_STYLE_BLOCK : "";
}

export function staffDemoResponseMarker(
  policy: Pick<KinfolkModelPolicy, "mode">,
): { experience: KinfolkExperience } | Record<string, never> {
  return policy.mode === "staff_demo"
    ? { experience: { ...STAFF_DEMO_EXPERIENCE } }
    : {};
}

export function modelFamilyForLog(model: string): "gpt-5" | "legacy" {
  return isGpt5Family(model) ? "gpt-5" : "legacy";
}

export function buildCompatibilityFallbackLog(input: {
  requestId: string;
  policy: Pick<KinfolkModelPolicy, "mode" | "primaryModel" | "fallbackModel">;
  classification: CompatibilityFallbackClassification;
}): {
  requestId: string;
  mode: KinfolkDemoMode;
  reason: CompatibilityFallbackReason | null;
  providerStatus: number | null;
  primaryFamily: "gpt-5" | "legacy";
  fallbackFamily: "gpt-5" | "legacy";
} {
  return {
    requestId: input.requestId,
    mode: input.policy.mode,
    reason: input.classification.reason,
    providerStatus: input.classification.providerStatus,
    primaryFamily: modelFamilyForLog(input.policy.primaryModel),
    fallbackFamily: modelFamilyForLog(input.policy.fallbackModel ?? ""),
  };
}
