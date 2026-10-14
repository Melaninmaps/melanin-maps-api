export type CommunityJourneyType = "wedding" | "birthday";
export type CommunityJourneyStage = "inspiration";
export type CommunitySuggestionAction = "helpful" | "not_relevant" | "already_handled";

/**
 * A privacy-suppressed aggregate can either support retaining a category or
 * indicate that Kinfolk should reconsider it. No counts, members, messages,
 * locations, or individual feedback are represented by this type.
 */
export type CommunityAggregateSignal = Readonly<{
  categoryKey: string;
  effect: "support" | "reconsider";
}>;

export type CommunityIntelligenceSuggestion = Readonly<{
  id: string;
  journeyType: CommunityJourneyType;
  stage: CommunityJourneyStage;
  intent: "planning";
  categoryKey: string;
  label: string;
  reason: string;
}>;

type SuggestionBlueprint = Readonly<
  Omit<CommunityIntelligenceSuggestion, "journeyType" | "stage" | "intent">
  & { readonly completedNeedPatterns?: readonly RegExp[] }
>;

type JourneyBlueprint = Readonly<{
  journeyType: CommunityJourneyType;
  keywords: readonly RegExp[];
  suggestions: readonly SuggestionBlueprint[];
}>;

const EXCLUDED_CONTEXT = /\b(?:medical|diagnos(?:is|e)|prescription|therapy|tax|invest(?:ment|ing)?|loan|bankrupt|lawsuit|attorney|visa|immigration|emergency|assault|police)\b/i;

/**
 * These patterns only honor a need that the member explicitly says is complete
 * in the current message. They do not infer a life stage, access memory, or
 * persist conversation text.
 */
const WEDDING_VENUE_COMPLETED = /\b(?:venue|location|ceremony site|reception site)\b[^.]{0,72}\b(?:booked|reserved|secured|confirmed|locked\s*in)\b|\b(?:booked|reserved|secured|confirmed|locked\s*in)\b[^.]{0,72}\b(?:venue|location|ceremony site|reception site)\b/i;
const BIRTHDAY_DECORATIONS_COMPLETED = /\b(?:decorations?|balloons?|centerpieces?|party decor)\b[^.]{0,72}\b(?:already\s+)?(?:handled|done|finished|sorted|taken\s+care\s+of)\b|\b(?:already\s+)?(?:handled|done|finished|sorted|taken\s+care\s+of)\b[^.]{0,72}\b(?:decorations?|balloons?|centerpieces?|party decor)\b/i;

const JOURNEY_BLUEPRINTS: readonly JourneyBlueprint[] = [
  {
    journeyType: "wedding",
    keywords: [/\bwedding\b/i, /\bbridal\b/i, /\bbride\b/i, /\bgroom\b/i, /\bgetting married\b/i, /\bengagement\b/i],
    suggestions: [
      {
        id: "wedding-venue-planning",
        categoryKey: "wedding_venue_planning",
        label: "Venue planning",
        reason: "Before other details depend on it, a venue plan can clarify timing, guest flow, and what needs to happen next.",
        completedNeedPatterns: [WEDDING_VENUE_COMPLETED],
      },
      {
        id: "wedding-alterations",
        categoryKey: "wedding_alterations",
        label: "Alterations and fittings",
        reason: "Checking fitting lead times early can keep your final look from becoming a last-minute task.",
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
        id: "birthday-decorations",
        categoryKey: "birthday_decorations",
        label: "Decorations and setup",
        reason: "A simple decoration plan can make the celebration feel intentional without turning the day into extra work.",
        completedNeedPatterns: [BIRTHDAY_DECORATIONS_COMPLETED],
      },
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

  return blueprint.suggestions
    .filter((suggestion) => !suggestion.completedNeedPatterns?.some((pattern) => pattern.test(message)))
    .map(({ completedNeedPatterns: _completedNeedPatterns, ...suggestion }) => ({
      ...suggestion,
      journeyType,
      stage: "inspiration" as const,
      intent: "planning" as const,
    }))
    .slice(0, 3);
}

/**
 * Applies only already-suppressed aggregate effects. A reconsider effect removes
 * an otherwise relevant category; support can reorder remaining categories. It
 * never creates a category, a business recommendation, or a member-facing claim.
 */
export function applyCommunityIntelligenceSignals(
  suggestions: readonly CommunityIntelligenceSuggestion[],
  signals: readonly CommunityAggregateSignal[],
): CommunityIntelligenceSuggestion[] {
  const reconsidered = new Set(
    signals.filter((signal) => signal.effect === "reconsider").map((signal) => signal.categoryKey),
  );
  const supported = new Set(
    signals.filter((signal) => signal.effect === "support").map((signal) => signal.categoryKey),
  );

  return suggestions
    .filter((suggestion) => !reconsidered.has(suggestion.categoryKey))
    .map((suggestion, index) => ({ suggestion, index }))
    .sort((left, right) => {
      const leftPriority = supported.has(left.suggestion.categoryKey) ? 0 : 1;
      const rightPriority = supported.has(right.suggestion.categoryKey) ? 0 : 1;
      return leftPriority - rightPriority || left.index - right.index;
    })
    .map(({ suggestion }) => suggestion)
    .slice(0, 3);
}

/** Backward-compatible helper for callers that only have supported categories. */
export function rankCommunityIntelligenceSuggestions(
  suggestions: readonly CommunityIntelligenceSuggestion[],
  supportedCategoryKeys: readonly string[],
): CommunityIntelligenceSuggestion[] {
  return applyCommunityIntelligenceSignals(
    suggestions,
    supportedCategoryKeys.map((categoryKey) => ({ categoryKey, effect: "support" as const })),
  );
}

export function isCommunitySuggestionAction(value: unknown): value is CommunitySuggestionAction {
  return value === "helpful" || value === "not_relevant" || value === "already_handled";
}

export function getCommunitySuggestionById(id: unknown): CommunityIntelligenceSuggestion | null {
  if (typeof id !== "string") return null;
  for (const blueprint of JOURNEY_BLUEPRINTS) {
    const match = blueprint.suggestions.find((suggestion) => suggestion.id === id);
    if (match) {
      const { completedNeedPatterns: _completedNeedPatterns, ...suggestion } = match;
      return {
        ...suggestion,
        journeyType: blueprint.journeyType,
        stage: "inspiration",
        intent: "planning",
      };
    }
  }
  return null;
}
