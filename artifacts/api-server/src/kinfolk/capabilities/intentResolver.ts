import type {
  IntentResolution,
  LocalContext,
  LocalContextRepository,
  NeedCategory,
  ProfessionalType,
  ToneStyle,
} from "./types";

const CATEGORY_PATTERNS: Array<{
  category: NeedCategory;
  pattern: RegExp;
  professionalType: ProfessionalType;
  disclaimer: boolean;
}> = [
  {
    category: "legal_information",
    pattern: /\b(law|legal|rights|court|attorney|lawyer|eviction|lease|custody|contract|sue|lawsuit)\b/i,
    professionalType: "attorney",
    disclaimer: true,
  },
  {
    category: "medical_information",
    pattern: /\b(doctor|medical|health|symptom|clinic|pregnan|therapy|mental health|medicine|diagnosis|chest pain|cannot breathe|can'?t breathe|severe bleeding|stroke)\b/i,
    professionalType: "medical_professional",
    disclaimer: true,
  },
  {
    category: "home_service",
    pattern: /\b(plumb|pipe|drain|leak|water heater|toilet|faucet|sewer)\b/i,
    professionalType: "plumber",
    disclaimer: false,
  },
  {
    category: "nightlife",
    pattern: /\b(nightlife|night life|bar|club|lounge|late night|after dark)\b/i,
    professionalType: "business",
    disclaimer: false,
  },
  {
    category: "education",
    pattern: /\b(school|college|university|scholarship|student|education|stem|science|engineering|math)\b/i,
    professionalType: null,
    disclaimer: false,
  },
  {
    category: "financial_education",
    pattern: /\b(debt|credit|tax|invest|insurance|mortgage|loan|retirement|budget)\b/i,
    professionalType: null,
    disclaimer: true,
  },
  {
    category: "business_discovery",
    pattern: /\b(find|recommend|near me|business|restaurant|store|bookstore|dentist|contractor)\b/i,
    professionalType: "business",
    disclaimer: false,
  },
];

const URGENT_MEDICAL_PATTERN = /\b(chest pain|cannot breathe|can'?t breathe|overdose|suicid|self harm|severe bleeding|stroke)\b/i;
const LOCAL_PHRASE_PATTERN = /\b(uptown|downtown|midtown|the west end|the east side|in town)\b/i;
const COMMUNITY_LANGUAGE_PATTERN = /\b(y['’]?all|finna|ima|i['’]m a|we gon|gone head)\b/i;

function defaultLocation(): LocalContext {
  return {
    city: null,
    stateCode: null,
    neighborhood: null,
    placeMeaning: null,
    confidence: 0,
  };
}

function selectNeed(message: string): {
  category: NeedCategory;
  professionalType: ProfessionalType;
  disclaimer: boolean;
} {
  const match = CATEGORY_PATTERNS.find((candidate) => candidate.pattern.test(message));
  return match
    ? { category: match.category, professionalType: match.professionalType, disclaimer: match.disclaimer }
    : { category: "general_guidance", professionalType: null, disclaimer: false };
}

function extractLocalPhrase(message: string): string | null {
  return message.match(LOCAL_PHRASE_PATTERN)?.[0]?.toLocaleLowerCase("en-US") ?? null;
}

/**
 * Tone is a member preference, not a stereotype. Kinfolk can recognize a
 * conversational register, but only uses community-conversational wording when
 * the member has deliberately selected that style in preferences.
 */
function resolveTone(input: {
  preferredTone: ToneStyle | null;
  message: string;
}): { toneStyle: ToneStyle; toneDetectedFromMessage: boolean } {
  const toneDetectedFromMessage = COMMUNITY_LANGUAGE_PATTERN.test(input.message);
  return {
    toneStyle: input.preferredTone ?? "warm_standard",
    toneDetectedFromMessage,
  };
}

export async function resolveKinfolkIntent(input: {
  message: string;
  preferredTone: ToneStyle | null;
  memberLocation: { city: string | null; stateCode: string | null };
  localContextRepository: LocalContextRepository;
}): Promise<IntentResolution> {
  const need = selectNeed(input.message);
  const localPhrase = extractLocalPhrase(input.message);
  const { toneStyle, toneDetectedFromMessage } = resolveTone({
    preferredTone: input.preferredTone,
    message: input.message,
  });

  const resolvedPlace = localPhrase
    ? await input.localContextRepository.resolvePlacePhrase({
        phrase: localPhrase,
        memberCity: input.memberLocation.city,
        memberStateCode: input.memberLocation.stateCode,
      })
    : null;

  const localContext: LocalContext = resolvedPlace ?? {
    ...defaultLocation(),
    city: input.memberLocation.city,
    stateCode: input.memberLocation.stateCode,
  };

  const urgentSafetyFlag = need.category === "medical_information" && URGENT_MEDICAL_PATTERN.test(input.message);
  const eligibleProfessionalOffer = urgentSafetyFlag ? null : need.professionalType;

  return {
    primaryNeed: need.category,
    professionalOffer: eligibleProfessionalOffer,
    professionalOfferReason: eligibleProfessionalOffer
      ? `A verified local ${eligibleProfessionalOffer.replace("_", " ")} may be useful as an optional next step.`
      : null,
    localContext,
    toneStyle,
    toneDetectedFromMessage,
    asksForImmediateAction: /\b(need|find|show|where|help me|looking for)\b/i.test(input.message),
    urgentSafetyFlag,
    requiresEducationalDisclaimer: need.disclaimer,
  };
}
