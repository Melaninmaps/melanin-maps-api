export const KINFOLK_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
export type KinfolkVoice = (typeof KINFOLK_VOICES)[number];
export const DEFAULT_KINFOLK_VOICE: KinfolkVoice = "onyx";

export function isKinfolkVoice(value: unknown): value is KinfolkVoice {
  return typeof value === "string" && KINFOLK_VOICES.includes(value as KinfolkVoice);
}

export function normalizeKinfolkVoice(value: unknown): KinfolkVoice {
  return isKinfolkVoice(value) ? value : DEFAULT_KINFOLK_VOICE;
}

export const AAVE_LEVELS = [0, 1, 2, 3] as const;
export type AaveLevel = (typeof AAVE_LEVELS)[number];

export const REGIONAL_LANGUAGE_PROFILES = [
  { id: "philadelphia", label: "Philadelphia", aliases: ["philadelphia", "philly"], expressions: ["jawn"] },
  { id: "memphis", label: "Memphis", aliases: ["memphis"], expressions: ["mane"] },
  { id: "new_york", label: "New York City", aliases: ["new york", "nyc"], expressions: ["bodega"] },
  { id: "washington_dc", label: "Washington, DC", aliases: ["washington", "district of columbia", "dc", "dmv"], expressions: ["joint"] },
  { id: "atlanta", label: "Atlanta", aliases: ["atlanta"], expressions: ["the A"] },
  { id: "new_orleans", label: "New Orleans", aliases: ["new orleans", "nola"], expressions: ["lagniappe"] },
  { id: "chicago", label: "Chicago", aliases: ["chicago"], expressions: ["the Chi"] },
  { id: "houston", label: "Houston", aliases: ["houston"], expressions: ["H-Town"] },
  { id: "miami", label: "Miami", aliases: ["miami"], expressions: ["305"] },
  { id: "detroit", label: "Detroit", aliases: ["detroit"], expressions: ["Motor City"] },
  { id: "oakland", label: "Oakland", aliases: ["oakland"], expressions: ["the Town"] },
  { id: "baltimore", label: "Baltimore", aliases: ["baltimore", "b-more"], expressions: ["hon"] },
] as const;

export type RegionalCityId = (typeof REGIONAL_LANGUAGE_PROFILES)[number]["id"];
export type RegionalFlavor = "off" | "follow_destination" | RegionalCityId;
export const REGIONAL_FLAVORS = [
  "off",
  "follow_destination",
  ...REGIONAL_LANGUAGE_PROFILES.map((profile) => profile.id),
] as const;

export function isRegionalFlavor(value: unknown): value is RegionalFlavor {
  return typeof value === "string" && (REGIONAL_FLAVORS as readonly string[]).includes(value);
}

/** Older rows used `standard`; treating it as Off preserves explicit-consent semantics. */
export function normalizeRegionalFlavor(value: unknown): RegionalFlavor {
  return isRegionalFlavor(value) ? value : "off";
}

const HIGH_STAKES_INTENTS = new Set([
  "medical_health",
  "hair_loss_care",
  "safety_emergency",
  "legal_regulated",
  "financial_regulated",
]);

export function isHighStakesLanguageContext(intentClass: string | null | undefined): boolean {
  return Boolean(intentClass && HIGH_STAKES_INTENTS.has(intentClass));
}

export function resolveRegionalLanguageProfile(
  regionalFlavor: unknown,
  destination: string | null | undefined,
) {
  const selected = normalizeRegionalFlavor(regionalFlavor);
  if (selected === "off") return null;
  if (selected !== "follow_destination") {
    return REGIONAL_LANGUAGE_PROFILES.find((profile) => profile.id === selected) ?? null;
  }
  if (!destination) return null;
  const normalizedDestination = destination.toLowerCase();
  return REGIONAL_LANGUAGE_PROFILES.find((profile) =>
    profile.aliases.some((alias) => normalizedDestination.includes(alias)),
  ) ?? null;
}

export function buildRegionalLanguagePrompt(options: {
  regionalFlavor: unknown;
  destination?: string | null;
  intentClass?: string | null;
}): string {
  if (isHighStakesLanguageContext(options.intentClass)) return "";
  const profile = resolveRegionalLanguageProfile(options.regionalFlavor, options.destination);
  if (!profile) return "";
  return `REGIONAL LANGUAGE — MEMBER ENABLED (${profile.label}):\nThe member explicitly chose occasional ${profile.label} vocabulary. You may use at most ONE natural local expression in this response, only when it genuinely fits: ${profile.expressions.map((term) => `"${term}"`).join(", ")}. Never force an expression, imitate an accent, perform or stereotype a community, or infer the member's identity. This changes occasional vocabulary only; it never changes the selected TTS voice or its timbre.`;
}

export function buildAaveRegisterPrompt(
  level: unknown,
  intentClass?: string | null,
): string {
  if (isHighStakesLanguageContext(intentClass)) return "";
  if (!Number.isInteger(level) || !AAVE_LEVELS.includes(level as AaveLevel) || level === 0) return "";
  const guidance: Record<Exclude<AaveLevel, 0>, string> = {
    1: "Keep the response mostly in plain standard English, with only a light, natural conversational cadence.",
    2: "Use a natural conversational AAVE register while keeping every sentence clear and easy to understand.",
    3: "Use the member-selected full AAVE register consistently but naturally, prioritizing clarity over intensity.",
  };
  return `AAVE REGISTER — MEMBER SELECTED LEVEL ${level}:\n${guidance[level as Exclude<AaveLevel, 0>]} Use no profanity. Never perform, exaggerate, caricature, stereotype, imitate an accent, or infer identity. Do not mix registers to signal who you think the member is; follow only this explicit setting.`;
}

export function buildLanguagePersonalizationPrompt(options: {
  aaveLevel: unknown;
  regionalFlavor: unknown;
  destination?: string | null;
  intentClass?: string | null;
}): string {
  if (isHighStakesLanguageContext(options.intentClass)) {
    return "HIGH-STAKES LANGUAGE OVERRIDE: Use calm, precise plain language. Do not use AAVE or regional slang, regardless of personalization settings.";
  }
  return [
    buildAaveRegisterPrompt(options.aaveLevel, options.intentClass),
    buildRegionalLanguagePrompt(options),
  ].filter(Boolean).join("\n\n");
}

const ENUM_FIELDS: Record<string, readonly string[]> = {
  budgetRange: ["budget", "mid", "luxury", "any"],
  travelCompanion: ["solo", "partner", "family", "friends", "colleagues"],
  communicationStyle: ["friendly", "concise", "detailed", "professional", "conversational"],
  personalityMode: ["neighborhood_guide", "cultural_curator", "travel_companion", "community"],
  emojiLevel: ["none", "some", "lots"],
  humorLevel: ["none", "light", "playful"],
};

const ARRAY_FIELDS = [
  "favoriteCategories",
  "favoriteCities",
  "avoidCategories",
  "tripStyle",
  "culturalInterests",
  "preferredOwnershipTypes",
  "ownershipTypes",
  "diasporaCountries",
  "lifestyleServices",
] as const;

export type PreferenceValidation = { ok: true } | { ok: false; issues: string[] };

export function validateKinfolkPreferenceUpdate(body: Record<string, unknown>): PreferenceValidation {
  const issues: string[] = [];
  for (const [field, allowed] of Object.entries(ENUM_FIELDS)) {
    if (body[field] !== undefined && (typeof body[field] !== "string" || !allowed.includes(body[field] as string))) {
      issues.push(`${field} must be one of: ${allowed.join(", ")}`);
    }
  }
  for (const field of ARRAY_FIELDS) {
    if (body[field] !== undefined && (!Array.isArray(body[field]) || !(body[field] as unknown[]).every((item) => typeof item === "string"))) {
      issues.push(`${field} must be an array of strings`);
    }
  }
  if (body.kinfolkVoice !== undefined && !isKinfolkVoice(body.kinfolkVoice)) {
    issues.push(`kinfolkVoice must be one of: ${KINFOLK_VOICES.join(", ")}`);
  }
  if (body.regionalFlavor !== undefined && !isRegionalFlavor(body.regionalFlavor)) {
    issues.push(`regionalFlavor must be one of: ${REGIONAL_FLAVORS.join(", ")}`);
  }
  if (body.aaveLevel !== undefined && (!Number.isInteger(body.aaveLevel) || !AAVE_LEVELS.includes(body.aaveLevel as AaveLevel))) {
    issues.push("aaveLevel must be an integer from 0 through 3");
  }
  for (const field of ["autoSpeak", "knowBeforeYouGo"] as const) {
    if (body[field] !== undefined && typeof body[field] !== "boolean") issues.push(`${field} must be a boolean`);
  }
  if (body.dietaryNotes !== undefined && body.dietaryNotes !== null && typeof body.dietaryNotes !== "string") {
    issues.push("dietaryNotes must be a string or null");
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function defaultVoicePreferences() {
  return {
    kinfolkVoice: DEFAULT_KINFOLK_VOICE,
    autoSpeak: false,
    aaveLevel: 0 as AaveLevel,
    regionalFlavor: "off" as RegionalFlavor,
  };
}
