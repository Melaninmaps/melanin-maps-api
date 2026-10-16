import {
  AAVE_LEVELS,
  REGIONAL_LANGUAGE_PROFILES,
  buildLanguagePersonalizationPrompt,
  normalizeRegionalFlavor,
  type AaveLevel,
  type RegionalFlavor,
} from "./voice-personalization";

/**
 * Member-authored communication preferences are deliberately represented as
 * ordinary, consented private-memory entries. This keeps them inside the
 * existing owner-scoped review, edit, delete, reset, and runtime-consent model
 * without adding a parallel preference store or inferring language from place.
 */
export const COMMUNICATION_PREFERENCE_PREFIX = "Kinfolk communication preference:";

type CommunicationScope = "all" | "history" | "casual" | "professional";
type CommunicationPreferenceSource =
  | "current_message"
  | "temporary_conversation"
  | "saved_memory"
  | "settings";

export type KinfolkCommunicationPreference = Readonly<{
  aaveLevel?: AaveLevel;
  regionalFlavor?: RegionalFlavor;
  stepByStep?: boolean;
  preserveCurrentStyle?: boolean;
  scope: CommunicationScope;
}>;

export type ResolvedKinfolkCommunicationPreference = Readonly<{
  aaveLevel: AaveLevel;
  regionalFlavor: RegionalFlavor;
  source: CommunicationPreferenceSource;
  prompt: string;
}>;

const AAVE_REQUEST = /\b(?:tell|explain|say|put|write|answer|talk)(?:\s+(?:me|that|this|it|to me|history|things|this answer))*\s+(?:in|using|with)\s+(?:aave|african[ -]?american vernacular english)\b|\b(?:aave|african[ -]?american vernacular english)\s+(?:version|style|register)\b|\bsay it how we(?:'d| would) say it\b/i;
const AAVE_MENTION = /\b(?:aave|african[ -]?american vernacular english)\b/i;
const STANDARD_ENGLISH_REQUEST = /\b(?:standard|plain|professional)\s+english\b|\b(?:no|without)\s+(?:aave|slang)\b|\b(?:do not|don't)\s+use\s+(?:aave|slang)\b|\bonly\s+use\s+aave\b/i;
const TEMPORARY_SCOPE = /\b(?:just|only)\s+(?:for|in)\s+(?:this|the)\s+(?:conversation|chat|turn|answer)\b|\bfor now\b/i;
const DURABLE_SIGNAL = /\b(?:remember|always|from now on|my (?:language |communication )?preference|prefer)\b|\b(?:do not|don't|only)\s+use\s+(?:aave|standard english)[^.?!]{0,48}\b(?:unless|when)\s+i\s+ask\b|\buse\s+(?:[a-z]+\s+){0,2}aave\s+when\b|\buse\s+(?:standard|plain|professional)\s+english\s+(?:for|when)\b/i;
const HISTORY_SCOPE = /\b(?:history|historical|enslavement|civil rights|past)\b/i;
const HISTORY_QUESTION = /\b(?:who was|what happened|why (?:is|was|are|were).{0,40}\bimportant|slavery|reconstruction|abolition|insurrection|uprising|nat turner)\b/i;
const CASUAL_SCOPE = /\b(?:casual|everyday|chat(?:ting)?)\b/i;
const PROFESSIONAL_SCOPE = /\b(?:professional|work|business writing|email|resume|cover letter)\b/i;
const STEP_BY_STEP_REQUEST = /\bstep(?:[\s-]+by[\s-]+step)?\b/i;
const REMEMBER_CURRENT_STYLE = /\b(?:remember|save|keep)\s+(?:that|this)\s+style\b/i;
const REVOCATION_SIGNAL = /\b(?:forget|revoke|clear|remove|delete)\b/i;
const FORMAL_REQUEST = /\b(?:draft|write|prepare|compose|create)\b[\s\S]{0,80}\b(?:email|letter|request|complaint|appeal|proposal|policy|plan|report|resume|cover letter)\b/i;

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

function resolveRegionalFlavorFromText(value: string): RegionalFlavor | undefined {
  const normalized = value.toLowerCase();
  return REGIONAL_LANGUAGE_PROFILES.find((profile) =>
    profile.aliases.some((alias) => new RegExp(`\\b${alias.replace(/\s+/g, "\\s+")}\\b`, "i").test(normalized)),
  )?.id;
}

function explicitlyRequestsRegionalLanguage(
  value: string,
  regionalFlavor: RegionalFlavor | undefined,
): boolean {
  if (!regionalFlavor || regionalFlavor === "off" || regionalFlavor === "follow_destination") {
    return false;
  }
  const profile = REGIONAL_LANGUAGE_PROFILES.find((candidate) => candidate.id === regionalFlavor);
  if (!profile) return false;
  const alias = profile.aliases.map((item) => item.replace(/\s+/g, "\\s+")).join("|");
  return new RegExp(
    `\\b(?:${alias})\\s+(?:aave|regional\\s+(?:language|vocabulary)|dialect)\\b|\\b(?:aave|regional\\s+(?:language|vocabulary)|dialect)\\b.{0,60}\\b(?:${alias})\\b`,
    "i",
  ).test(value);
}

function resolveScope(value: string): CommunicationScope {
  if (HISTORY_SCOPE.test(value)) return "history";
  if (PROFESSIONAL_SCOPE.test(value)) return "professional";
  if (CASUAL_SCOPE.test(value)) return "casual";
  return "all";
}

function preferenceFromMessage(value: unknown): KinfolkCommunicationPreference | null {
  const message = normalizeText(value);
  if (!message) return null;

  const requestsStandardEnglish = STANDARD_ENGLISH_REQUEST.test(message);
  const requestsAave = AAVE_REQUEST.test(message) ||
    (AAVE_MENTION.test(message) && /\b(?:use|prefer|want|like|always|remember|speak)\b/i.test(message));
  const stepByStep = STEP_BY_STEP_REQUEST.test(message);
  const regionalCandidate = resolveRegionalFlavorFromText(message);
  const regionalFlavor = explicitlyRequestsRegionalLanguage(message, regionalCandidate)
    ? regionalCandidate
    : undefined;

  if (!requestsStandardEnglish && !requestsAave && !regionalFlavor && !stepByStep) return null;

  return {
    ...(requestsStandardEnglish
      ? { aaveLevel: 0 as AaveLevel, regionalFlavor: "off" as RegionalFlavor }
      : requestsAave
        ? { aaveLevel: 2 as AaveLevel }
        : {}),
    ...(regionalFlavor && !requestsStandardEnglish ? { regionalFlavor } : {}),
    ...(stepByStep ? { stepByStep: true } : {}),
    scope: resolveScope(message),
  };
}

/** A current explicit instruction is temporary unless it clearly asks for retention. */
export function parseCurrentTurnCommunicationPreference(
  value: unknown,
): KinfolkCommunicationPreference | null {
  return preferenceFromMessage(value);
}

/**
 * Only clear, member-owned language requests receive a save offer. A one-time
 * "tell me in AAVE" request deliberately returns null here, so it cannot alter
 * the account or private memory without a separate, affirmative choice.
 */
export function buildConsentedCommunicationPreferenceMemory(
  value: unknown,
): string | null {
  const message = normalizeText(value);
  const preference = preferenceFromMessage(message);
  const remembersCurrentStyle = REMEMBER_CURRENT_STYLE.test(message);
  if (
    (!preference && !remembersCurrentStyle) ||
    TEMPORARY_SCOPE.test(message) ||
    (!DURABLE_SIGNAL.test(message) && !remembersCurrentStyle)
  ) {
    return null;
  }

  const parts: string[] = [];
  if (preference?.aaveLevel === 0) {
    parts.push("use standard English unless the member explicitly requests AAVE");
  } else if (preference?.aaveLevel) {
    parts.push("use a natural AAVE register");
  }
  if (preference?.regionalFlavor && preference.regionalFlavor !== "off") {
    const label = REGIONAL_LANGUAGE_PROFILES.find(
      (profile) => profile.id === preference.regionalFlavor,
    )?.label;
    if (label) parts.push(`use the member-selected ${label} regional language setting when appropriate`);
  }
  if (preference?.stepByStep) {
    parts.push("explain the response step by step when the request benefits from it");
  }
  if (remembersCurrentStyle) {
    parts.push("preserve the member's currently selected Kinfolk persona and response approach");
  }
  if (preference?.scope && preference.scope !== "all") {
    parts.push(`apply this to ${preference.scope === "history" ? "history explanations" : preference.scope === "casual" ? "casual conversations" : "professional writing"}`);
  }
  if (parts.length === 0) return null;
  return `${COMMUNICATION_PREFERENCE_PREFIX} ${parts.join("; ")}.`;
}

export function parseConsentedCommunicationPreference(
  value: unknown,
): KinfolkCommunicationPreference | null {
  const content = normalizeText(value);
  if (!content.toLowerCase().startsWith(COMMUNICATION_PREFERENCE_PREFIX.toLowerCase())) {
    return null;
  }
  const parsed = preferenceFromMessage(content);
  const preserveCurrentStyle = /preserve the member's currently selected Kinfolk persona and response approach/i.test(content);
  if (parsed) return { ...parsed, ...(preserveCurrentStyle ? { preserveCurrentStyle: true } : {}) };
  return {
    ...(content.includes("standard English")
      ? { aaveLevel: 0 as AaveLevel, regionalFlavor: "off" as RegionalFlavor }
      : content.includes("AAVE")
        ? { aaveLevel: 2 as AaveLevel }
        : {}),
    ...(resolveRegionalFlavorFromText(content) && explicitlyRequestsRegionalLanguage(content, resolveRegionalFlavorFromText(content))
      ? { regionalFlavor: resolveRegionalFlavorFromText(content) }
      : {}),
    ...(STEP_BY_STEP_REQUEST.test(content) ? { stepByStep: true } : {}),
    ...(preserveCurrentStyle ? { preserveCurrentStyle: true } : {}),
    scope: resolveScope(content),
  };
}

function isScopeRelevant(scope: CommunicationScope, message: string): boolean {
  if (scope === "all") return true;
  if (scope === "history") return HISTORY_SCOPE.test(message) || HISTORY_QUESTION.test(message);
  if (scope === "professional") return FORMAL_REQUEST.test(message);
  return !FORMAL_REQUEST.test(message);
}

function latestApplicableSavedPreference(
  memories: readonly { content: string }[],
  message: string,
): KinfolkCommunicationPreference | null {
  for (const memory of memories) {
    const preference = parseConsentedCommunicationPreference(memory.content);
    if (preference && isScopeRelevant(preference.scope, message)) return preference;
  }
  return null;
}

function latestTemporaryConversationPreference(
  history: readonly { role: string; content: string }[],
): KinfolkCommunicationPreference | null {
  for (const entry of [...history].reverse()) {
    if (entry.role !== "user" || !TEMPORARY_SCOPE.test(entry.content)) continue;
    const preference = preferenceFromMessage(entry.content);
    if (preference) return preference;
  }
  return null;
}

/**
 * Priority is fixed and additive: current message, temporary conversation
 * instruction, explicitly consented private memory, member-selected regional
 * and AAVE settings, then the persona's normal presentation. Location never
 * selects a dialect or regional profile.
 */
export function resolveKinfolkCommunicationPreference(input: {
  message: string;
  history: readonly { role: string; content: string }[];
  memories: readonly { content: string }[];
  persistedAaveLevel: unknown;
  persistedRegionalFlavor: unknown;
  intentClass?: string | null;
}): ResolvedKinfolkCommunicationPreference {
  const persistedAaveLevel = Number.isInteger(input.persistedAaveLevel) &&
    AAVE_LEVELS.includes(input.persistedAaveLevel as AaveLevel)
    ? input.persistedAaveLevel as AaveLevel
    : 0 as AaveLevel;
  const persistedRegionalFlavor = normalizeRegionalFlavor(input.persistedRegionalFlavor);
  const saved = latestApplicableSavedPreference(input.memories, input.message);
  const temporary = latestTemporaryConversationPreference(input.history);
  const current = parseCurrentTurnCommunicationPreference(input.message);
  const winning = current ?? temporary ?? saved ?? null;
  const source: CommunicationPreferenceSource = current
    ? "current_message"
    : temporary
      ? "temporary_conversation"
      : saved
        ? "saved_memory"
        : "settings";

  const aaveLevel = winning?.aaveLevel ?? persistedAaveLevel;
  const regionalFlavor = winning?.aaveLevel === 0
    ? "off"
    : winning?.regionalFlavor ?? persistedRegionalFlavor;
  const languagePrompt = buildLanguagePersonalizationPrompt({
    aaveLevel,
    regionalFlavor,
    intentClass: input.intentClass,
  });
  const deliveryPrompt = winning?.stepByStep
    ? "COMMUNICATION DELIVERY — MEMBER SELECTED: When the request benefits from a process, explain it in clear ordered steps. This changes organization only; keep the selected Kinfolk persona and the member's language setting."
    : "";
  const promptParts = [languagePrompt, deliveryPrompt].filter(Boolean);
  const prompt = promptParts.length > 0
    ? `COMMUNICATION STYLE LAYER (${source}):\n${promptParts.join("\n\n")}\nThis language layer is independent from the selected Kinfolk persona. Preserve that persona's structure, depth, judgment, and follow-up behavior; do not turn AAVE or regional language into a fifth persona, forced slang, a stereotype, or an accent performance.`
    : "";

  return { aaveLevel, regionalFlavor, source, prompt };
}

/** A direct, precise request may revoke only the member's saved language memories. */
export function isCommunicationPreferenceRevocationRequest(value: unknown): boolean {
  const message = normalizeText(value);
  return REVOCATION_SIGNAL.test(message) &&
    /\b(?:aave|regional language|regional aave|communication (?:style|preference)|language preference)\b/i.test(message);
}
