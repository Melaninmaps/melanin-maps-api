export const KINFOLK_VOICES = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
] as const;
export type KinfolkVoice = (typeof KINFOLK_VOICES)[number];
export const DEFAULT_KINFOLK_VOICE: KinfolkVoice = "onyx";

export function isKinfolkVoice(value: unknown): value is KinfolkVoice {
  return (
    typeof value === "string" && KINFOLK_VOICES.includes(value as KinfolkVoice)
  );
}

export function normalizeKinfolkVoice(value: unknown): KinfolkVoice {
  return isKinfolkVoice(value) ? value : DEFAULT_KINFOLK_VOICE;
}

export const AAVE_LEVELS = [0, 1, 2, 3] as const;
export type AaveLevel = (typeof AAVE_LEVELS)[number];

export const REGIONAL_LANGUAGE_PROFILES = [
  {
    id: "philadelphia",
    label: "Philadelphia",
    aliases: ["philadelphia", "philly"],
    expressions: ["jawn"],
  },
  {
    id: "memphis",
    label: "Memphis",
    aliases: ["memphis"],
    expressions: ["mane"],
  },
  {
    id: "new_york",
    label: "New York City",
    aliases: ["new york", "nyc"],
    expressions: ["bodega"],
  },
  {
    id: "washington_dc",
    label: "Washington, DC",
    aliases: ["washington", "district of columbia", "dc", "dmv"],
    expressions: ["joint"],
  },
  {
    id: "atlanta",
    label: "Atlanta",
    aliases: ["atlanta"],
    expressions: ["the A"],
  },
  {
    id: "new_orleans",
    label: "New Orleans",
    aliases: ["new orleans", "nola"],
    expressions: ["lagniappe"],
  },
  {
    id: "chicago",
    label: "Chicago",
    aliases: ["chicago"],
    expressions: ["the Chi"],
  },
  {
    id: "houston",
    label: "Houston",
    aliases: ["houston"],
    expressions: ["H-Town"],
  },
  { id: "miami", label: "Miami", aliases: ["miami"], expressions: ["305"] },
  {
    id: "detroit",
    label: "Detroit",
    aliases: ["detroit"],
    expressions: ["Motor City"],
  },
  {
    id: "oakland",
    label: "Oakland",
    aliases: ["oakland"],
    expressions: ["the Town"],
  },
  {
    id: "baltimore",
    label: "Baltimore",
    aliases: ["baltimore", "b-more"],
    expressions: ["hon"],
  },
] as const;

export type RegionalCityId = (typeof REGIONAL_LANGUAGE_PROFILES)[number]["id"];
export type RegionalFlavor = "off" | "follow_destination" | RegionalCityId;
export const REGIONAL_FLAVORS = [
  "off",
  "follow_destination",
  ...REGIONAL_LANGUAGE_PROFILES.map((profile) => profile.id),
] as const;

export function isRegionalFlavor(value: unknown): value is RegionalFlavor {
  return (
    typeof value === "string" &&
    (REGIONAL_FLAVORS as readonly string[]).includes(value)
  );
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

export function isHighStakesLanguageContext(
  intentClass: string | null | undefined,
): boolean {
  return Boolean(intentClass && HIGH_STAKES_INTENTS.has(intentClass));
}

export function resolveRegionalLanguageProfile(
  regionalFlavor: unknown,
  destination: string | null | undefined,
) {
  const selected = normalizeRegionalFlavor(regionalFlavor);
  if (selected === "off") return null;
  if (selected !== "follow_destination") {
    return (
      REGIONAL_LANGUAGE_PROFILES.find((profile) => profile.id === selected) ??
      null
    );
  }
  if (!destination) return null;
  const normalizedDestination = destination.toLowerCase();
  return (
    REGIONAL_LANGUAGE_PROFILES.find((profile) =>
      profile.aliases.some((alias) => normalizedDestination.includes(alias)),
    ) ?? null
  );
}

export function buildRegionalLanguagePrompt(options: {
  regionalFlavor: unknown;
  destination?: string | null;
  intentClass?: string | null;
}): string {
  if (isHighStakesLanguageContext(options.intentClass)) return "";
  const profile = resolveRegionalLanguageProfile(
    options.regionalFlavor,
    options.destination,
  );
  if (!profile) return "";
  return `REGIONAL LANGUAGE — MEMBER ENABLED (${profile.label}):\nThis is a private delivery preference, not a topic for the reply. Do not mention the selected region, the language setting, expressions you considered, expressions you declined, or how you chose wording unless the member explicitly asks. You may use at most ONE natural local expression only when it genuinely improves this exact answer: ${profile.expressions.map((term) => `"${term}"`).join(", ")}. Never force an expression, imitate an accent, perform or stereotype a community, or infer the member's identity. If no expression fits naturally, use none. This changes occasional vocabulary only; it never changes the selected TTS voice or its timbre.`;
}

export function buildAaveRegisterPrompt(
  level: unknown,
  intentClass?: string | null,
): string {
  if (isHighStakesLanguageContext(intentClass)) return "";
  if (
    !Number.isInteger(level) ||
    !AAVE_LEVELS.includes(level as AaveLevel) ||
    level === 0
  )
    return "";
  const guidance: Record<Exclude<AaveLevel, 0>, string> = {
    1: "Keep the response mostly in plain standard English, with only a light, natural conversational cadence.",
    2: "This is an explicit member language choice: use a noticeable but measured, context-appropriate AAVE register in the response itself—not merely a standard-English answer with one informal phrase. Let grammar, syntax, rhythm, and sentence construction carry the voice where they fit the member's topic and selected persona; the whole response should read as one coherent human voice, not a standard-English draft with substitutions. Use only constructions that sound natural in the full sentence. Never manufacture nonstandard grammar, switch subject and object forms, use a stock greeting, stack familiar slang, or treat a phrasebook as proof of compliance. Historical, academic, and practical answers still need factual precision and should not become a performance. Before returning, read the whole reply for naturalness, clarity, and consistency with the selected register, persona, and requested format; do not silently fall back to mostly standard-English prose because the topic is serious or explanatory.",
    3: "Use the member-selected full AAVE register consistently in the response itself through natural grammar, syntax, cadence, and vocabulary where they fit. It must visibly differ from a standard-English answer without stacking stock slang, performing an identity, or turning the reply into a dialect demonstration. Prioritize clarity, factual precision, and natural phrasing over intensity.",
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
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Keeps an explicit level-two setting visible at the final first-call layer
 * without inspecting generated text for slang, markers, or a quota of dialect
 * features. High-stakes contexts have no AAVE prompt and therefore return no
 * delivery check.
 */
export function buildKinfolkAaveDeliveryCheck(input: {
  aaveLevel: unknown;
  languagePrompt: string;
}): string {
  if (
    input.aaveLevel !== 2 ||
    !input.languagePrompt.includes("AAVE REGISTER — MEMBER SELECTED LEVEL 2")
  ) {
    return "";
  }
  return "FINAL ACTIVE LANGUAGE CHECK — MEMBER-SELECTED AAVE LEVEL 2: This is an externally visible delivery choice for this direct reply. Do not return mostly standard-English prose with one informal word. Use a natural, moderate AAVE voice where it belongs in the full answer, while keeping every fact, qualification, and safety point clear. Do not force slang or a construction that does not fit the sentence, and do not mention this setting.";
}

/**
 * A level-two setting is an explicit, low-stakes language preference. The
 * provider receives one bounded native-quality review only for that setting;
 * this is intentionally not a marker-count heuristic and never runs for an
 * artifact or a high-stakes language override.
 */
export function shouldReviewKinfolkAaveDelivery(input: {
  aaveLevel: unknown;
  languagePrompt: string;
  isGeneratedArtifact: boolean;
}): boolean {
  return input.aaveLevel === 2 &&
    !input.isGeneratedArtifact &&
    input.languagePrompt.includes("AAVE REGISTER — MEMBER SELECTED LEVEL 2");
}

const ENUM_FIELDS: Record<string, readonly string[]> = {
  recommendationLifeStage: ["unspecified", "18_39", "40_64", "65_plus"],
  budgetRange: ["budget", "mid", "luxury", "any"],
  travelCompanion: ["solo", "partner", "family", "friends", "colleagues"],
  communicationStyle: [
    "friendly",
    "concise",
    "detailed",
    "professional",
    "conversational",
  ],
  personalityMode: [
    // Current member-facing Kinfolk Voices. These values are shared by the
    // web chat, mobile chat, and saved preference controls.
    "community",
    "professor",
    "business_manager",
    "best_friend",
    // Legacy rows and older clients remain accepted so a preference update
    // never erases an existing member's chosen setting.
    "neighborhood_guide",
    "cultural_curator",
    "travel_companion",
  ],
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
  "communities",
  "cultures",
  "preferredLanguages",
  "lifestyleServices",
] as const;

export type PreferenceValidation =
  | { ok: true }
  | { ok: false; issues: string[] };

export function validateKinfolkPreferenceUpdate(
  body: Record<string, unknown>,
): PreferenceValidation {
  const issues: string[] = [];
  for (const [field, allowed] of Object.entries(ENUM_FIELDS)) {
    if (
      body[field] !== undefined &&
      (typeof body[field] !== "string" ||
        !allowed.includes(body[field] as string))
    ) {
      issues.push(`${field} must be one of: ${allowed.join(", ")}`);
    }
  }
  for (const field of ARRAY_FIELDS) {
    if (
      body[field] !== undefined &&
      (!Array.isArray(body[field]) ||
        !(body[field] as unknown[]).every((item) => typeof item === "string"))
    ) {
      issues.push(`${field} must be an array of strings`);
    }
  }
  for (const field of [
    "communities",
    "cultures",
    "preferredLanguages",
  ] as const) {
    const value = body[field];
    if (!Array.isArray(value)) continue;
    if (
      value.length > 25 ||
      value.some((item) => item.trim().length < 2 || item.trim().length > 100)
    ) {
      issues.push(`${field} may contain up to 25 entries of 2–100 characters`);
    }
  }
  if (body.kinfolkVoice !== undefined && !isKinfolkVoice(body.kinfolkVoice)) {
    issues.push(`kinfolkVoice must be one of: ${KINFOLK_VOICES.join(", ")}`);
  }
  if (
    body.regionalFlavor !== undefined &&
    !isRegionalFlavor(body.regionalFlavor)
  ) {
    issues.push(
      `regionalFlavor must be one of: ${REGIONAL_FLAVORS.join(", ")}`,
    );
  }
  if (
    body.aaveLevel !== undefined &&
    (!Number.isInteger(body.aaveLevel) ||
      !AAVE_LEVELS.includes(body.aaveLevel as AaveLevel))
  ) {
    issues.push("aaveLevel must be an integer from 0 through 3");
  }
  for (const field of ["autoSpeak", "knowBeforeYouGo", "useMemberContextByDefault"] as const) {
    if (body[field] !== undefined && typeof body[field] !== "boolean")
      issues.push(`${field} must be a boolean`);
  }
  if (
    body.dietaryNotes !== undefined &&
    body.dietaryNotes !== null &&
    typeof body.dietaryNotes !== "string"
  ) {
    issues.push("dietaryNotes must be a string or null");
  }
  if (
    body.supportLensMode !== undefined &&
    body.supportLensMode !== "all_businesses" &&
    body.supportLensMode !== "strict_documented_designations"
  ) {
    issues.push(
      "supportLensMode must be all_businesses or strict_documented_designations",
    );
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
