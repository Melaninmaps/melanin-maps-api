// Kept parallel with web/src/lib/kinfolk-onboarding.ts; parity is regression-tested.
export const CORE_STEPS = ["welcome", "interests", "use_cases", "budget", "response_style"] as const;
export type OnboardingStep = typeof CORE_STEPS[number] | "beauty_services" | "travel_style" | "family_planning" | "ready";

export const INTEREST_OPTIONS = [
  "Restaurants & Dining", "Beauty & Wellness", "Arts & Entertainment",
  "Shopping & Retail", "Nightlife & Music", "Cultural Sites", "Outdoors",
  "Education & Learning", "Family Activities",
] as const;
export const PURPOSE_OPTIONS = ["Places to go", "Services", "Safety information", "Culture", "Resources", "Family-friendly plans"] as const;
export const BUDGET_OPTIONS = [
  { value: "budget", label: "Budget-friendly", sub: "$ deals & hidden gems" },
  { value: "mid", label: "Moderate", sub: "$$ everyday quality" },
  { value: "luxury", label: "Upscale", sub: "$$$ elevated experiences" },
  { value: "any", label: "Mix it up", sub: "Depends on the occasion" },
] as const;
export const RESPONSE_OPTIONS = [
  { value: "friendly", label: "Friendly", sub: "Warm and straightforward" },
  { value: "concise", label: "Concise", sub: "Just the essentials" },
  { value: "detailed", label: "Detailed", sub: "More explanation when I ask" },
] as const;
export const BEAUTY_OPTIONS = [
  { value: "barber", label: "Barber" },
  { value: "loctician", label: "Loctician" },
  { value: "natural_hair_stylist", label: "Natural hair stylist" },
  { value: "braider", label: "Braider" },
  { value: "nail_tech", label: "Nail tech" },
  { value: "esthetician", label: "Skincare services" },
  { value: "massage_therapist", label: "Massage services" },
  { value: "personal_trainer", label: "Personal trainer" },
] as const;
export const TRIP_OPTIONS = [
  { value: "solo", label: "Solo pace" }, { value: "couple", label: "Couples getaway" },
  { value: "family", label: "Family-friendly trip" }, { value: "group", label: "Group outing" },
  { value: "business", label: "Work trip" }, { value: "spiritual", label: "Reflective trip" },
] as const;
export const COMPANION_OPTIONS = [
  { value: "solo", label: "Just me" }, { value: "partner", label: "A partner" },
  { value: "friends", label: "Friends" }, { value: "family", label: "Family" },
  { value: "colleagues", label: "Colleagues" },
] as const;

export interface OnboardingDraft {
  interests: string[];
  purposes: string[];
  budget: typeof BUDGET_OPTIONS[number]["value"] | "";
  responseStyle: typeof RESPONSE_OPTIONS[number]["value"] | "";
  beautyServices: string[];
  tripStyles: string[];
  travelCompanion: typeof COMPANION_OPTIONS[number]["value"] | "";
  familyFriendly: boolean;
  familyCompanion: typeof COMPANION_OPTIONS[number]["value"] | "";
}
export function emptyOnboardingDraft(): OnboardingDraft {
  return { interests: [], purposes: [], budget: "", responseStyle: "", beautyServices: [], tripStyles: [], travelCompanion: "", familyFriendly: false, familyCompanion: "" };
}

export function buildOnboardingSteps(draft: OnboardingDraft): OnboardingStep[] {
  const steps: OnboardingStep[] = [...CORE_STEPS];
  if (draft.interests.includes("Beauty & Wellness")) steps.push("beauty_services");
  const travelSelected = draft.purposes.includes("Places to go");
  if (travelSelected) steps.push("travel_style");
  if (draft.interests.includes("Family Activities") || draft.purposes.includes("Family-friendly plans") ||
    (travelSelected && (draft.tripStyles.includes("family") || draft.travelCompanion === "family"))) {
    steps.push("family_planning");
  }
  // Five core prompts + up to three explicit follow-ups. With none, a non-collecting
  // finish screen keeps progress at six steps; it does not add another preference.
  if (steps.length === CORE_STEPS.length) steps.push("ready");
  return steps;
}

export function skipOnboardingPrompt(draft: OnboardingDraft, step: OnboardingStep): OnboardingDraft {
  // Clear only this in-memory answer, never an existing saved preference.
  switch (step) {
    case "interests": return { ...draft, interests: [] };
    case "use_cases": return { ...draft, purposes: [] };
    case "budget": return { ...draft, budget: "" };
    case "response_style": return { ...draft, responseStyle: "" };
    case "beauty_services": return { ...draft, beautyServices: [] };
    case "travel_style": return { ...draft, tripStyles: [], travelCompanion: "" };
    case "family_planning": return { ...draft, familyFriendly: false, familyCompanion: "" };
    default: return draft;
  }
}

export interface OnboardingPreferences {
  favoriteCategories?: string[];
  culturalInterests?: string[];
  budgetRange?: string;
  communicationStyle?: string;
  lifestyleServices?: string[];
  tripStyle?: string[];
  travelCompanion?: string;
}
export function buildOnboardingPayload(draft: OnboardingDraft): OnboardingPreferences {
  const steps = buildOnboardingSteps(draft);
  const payload: OnboardingPreferences = {};
  if (draft.interests.length) payload.favoriteCategories = [...draft.interests];
  if (draft.purposes.length) payload.culturalInterests = [...draft.purposes];
  if (draft.budget) payload.budgetRange = draft.budget;
  if (draft.responseStyle) payload.communicationStyle = draft.responseStyle;
  if (steps.includes("beauty_services") && draft.beautyServices.length) payload.lifestyleServices = [...draft.beautyServices];
  const tripStyle = steps.includes("travel_style") ? [...draft.tripStyles] : [];
  if (steps.includes("family_planning") && draft.familyFriendly) tripStyle.push("family");
  if (tripStyle.length) payload.tripStyle = [...new Set(tripStyle)];
  const companion = (steps.includes("family_planning") && draft.familyCompanion) ||
    (steps.includes("travel_style") && draft.travelCompanion);
  if (companion) payload.travelCompanion = companion;
  return payload;
}

export async function completeOnboarding(
  payload: OnboardingPreferences,
  savePreferences: (value: OnboardingPreferences) => Promise<boolean>,
  confirmCompletion: () => Promise<boolean>,
): Promise<boolean> {
  try {
    // Full skip and an entirely skipped draft never issue an empty preference PUT.
    if (Object.keys(payload).length && !await savePreferences(payload)) return false;
    return await confirmCompletion();
  } catch {
    return false;
  }
}
