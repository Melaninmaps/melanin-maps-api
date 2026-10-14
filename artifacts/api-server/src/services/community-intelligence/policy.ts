export type CommunityJourneyType = "wedding" | "birthday";
export type CommunityJourneyStage = "inspiration";
export type CommunitySuggestionAction = "helpful" | "not_relevant" | "already_handled";

export type CommunityIntelligenceSuggestion = Readonly<{
  id: string;
  journeyType: CommunityJourneyType;
  stage: CommunityJourneyStage;
  intent: "planning";
  categoryKey: string;
  label: string;
  reason: string;
}>;

type JourneyBlueprint = Readonly<{
  journeyType: CommunityJourneyType;
  keywords: readonly RegExp[];
  suggestions: readonly Omit<CommunityIntelligenceSuggestion, "journeyType" | "stage" | "intent">[];
}>;

const EXCLUDED_CONTEXT = /\b(?:medical|diagnos(?:is|e)|prescription|therapy|tax|invest(?:ment|ing)?|loan|bankrupt|lawsuit|attorney|visa|immigration|emergency|assault|police)\b/i;

const JOURNEY_BLUEPRINTS: readonly JourneyBlueprint[] = [
  {
    journeyType: "wedding",
    keywords: [/\bwedding\b/i, /\bbridal\b/i, /\bbride\b/i, /\bgroom\b/i, /\bgetting married\b/i, /\bengagement\b/i],
    suggestions: [
      {
        id: "wedding-alterations",
        categoryKey: "wedding_alterations",
        label: "Alterations and fittings",
        reason: "You are still in the inspiration stage, and checking fitting lead times early can keep your final look from becoming a last-minute task.",
      },
      {
        id: "wedding-getting-ready",
        categoryKey: "wedding_getting_ready_timing",
        label: "Getting-ready timing",
        reason: "Hair, makeup, photos, and travel often need a shared timing plan before individual appointments are chosen.",
      },
      {
        id: "wedding-setup-cleanup",
        categoryKey: "wedding_setup_cleanup",
        label: "Setup and cleanup coordination",
        reason: "A simple setup and cleanup plan can protect the day-of experience while you are still deciding on the celebration style.",
      },
    ],
  },
  {
    journeyType: "birthday",
    keywords: [/\bbirthday\b/i, /\bturning\s+\d{1,3}\b/i, /\bbirthday party\b/i, /\bbirthday celebration\b/i],
    suggestions: [
      {
        id: "birthday-venue-logistics",
        categoryKey: "birthday_venue_logistics",
        label: "Venue logistics",
        reason: "Before details fill in, it can help to decide how much room, timing, and weather flexibility the celebration needs.",
      },
      {
        id: "birthday-transport-access",
        categoryKey: "birthday_transport_access",
        label: "Transportation and access",
        reason: "Thinking through arrival, parking, and access early can make the plan easier for the people you want there.",
      },
      {
        id: "birthday-setup-cleanup",
        categoryKey: "birthday_setup_cleanup",
        label: "Setup and cleanup",
        reason: "A lightweight setup and cleanup plan can keep the celebration from becoming work for the guest of honor.",
      },
    ],
  },
] as const;

export function recognizeCommunityJourney(message: string): CommunityJourneyType | null {
  const normalized = message.trim();
  if (!normalized || EXCLUDED_CONTEXT.test(normalized)) return null;
  return JOURNEY_BLUEPRINTS.find((blueprint) => blueprint.keywords.some((keyword) => keyword.test(normalized)))?.journeyType ?? null;
}

export function communityIntelligenceSuggestionsForMessage(message: string): CommunityIntelligenceSuggestion[] {
  const journeyType = recognizeCommunityJourney(message);
  if (!journeyType) return [];
  const blueprint = JOURNEY_BLUEPRINTS.find((entry) => entry.journeyType === journeyType);
  if (!blueprint) return [];
  return blueprint.suggestions.slice(0, 3).map((suggestion) => ({
    ...suggestion,
    journeyType,
    stage: "inspiration",
    intent: "planning",
  }));
}

/**
 * Applies only a centrally supplied, already-suppressed category ordering hint.
 * It never creates a category, a business recommendation, or member-facing claim.
 */
export function rankCommunityIntelligenceSuggestions(
  suggestions: readonly CommunityIntelligenceSuggestion[],
  supportedCategoryKeys: readonly string[],
): CommunityIntelligenceSuggestion[] {
  const supported = new Set(supportedCategoryKeys);
  return [...suggestions]
    .map((suggestion, index) => ({ suggestion, index }))
    .sort((left, right) => {
      const leftPriority = supported.has(left.suggestion.categoryKey) ? 0 : 1;
      const rightPriority = supported.has(right.suggestion.categoryKey) ? 0 : 1;
      return leftPriority - rightPriority || left.index - right.index;
    })
    .map(({ suggestion }) => suggestion)
    .slice(0, 3);
}

export function isCommunitySuggestionAction(value: unknown): value is CommunitySuggestionAction {
  return value === "helpful" || value === "not_relevant" || value === "already_handled";
}

export function getCommunitySuggestionById(id: unknown): CommunityIntelligenceSuggestion | null {
  if (typeof id !== "string") return null;
  for (const blueprint of JOURNEY_BLUEPRINTS) {
    const match = blueprint.suggestions.find((suggestion) => suggestion.id === id);
    if (match) {
      return {
        ...match,
        journeyType: blueprint.journeyType,
        stage: "inspiration",
        intent: "planning",
      };
    }
  }
  return null;
}
