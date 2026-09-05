import type { BusinessSubjectKey } from "./business-subject";
import type { ClarificationStep } from "./intentClarification";

export function temporaryBusinessAudienceBand(message: string): string | null {
  if (/\b(?:teens?|teenagers?|13\s*(?:-|to)\s*17)\b/i.test(message)) return "13_17";
  if (/\b(?:child|children|kid|kids|under 13)\b/i.test(message)) return "under_13";
  if (/\b(?:adult|adults|grown[- ]?ups?)\b/i.test(message)) return "18_39";
  if (/\b(?:mixed ages|all ages|keep this search broad)\b/i.test(message)) return "mixed";
  return null;
}

export function businessDiscoveryClarification(input: {
  message: string;
  subjectKey: BusinessSubjectKey;
  ageBand: string;
  city?: string;
}): ClarificationStep[] {
  const locationSuffix = input.city?.trim() ? ` in ${input.city.trim()}` : "";
  const broadHairRequest = input.subjectKey === "salon"
    && !/\b(?:locs?|natural hair|braids?|protective styles?|hair color|wash and style|wash and go|silk press|barber|general hair salon|keep this search broad)\b/i.test(input.message);
  if (broadHairRequest) {
    return [{
      id: "business-hair-service",
      question: "What kind of hair service should I focus on?",
      explanation: "You can skip this and I’ll keep the search broad.",
      options: [
        { value: "locs", label: `Loc and natural-hair care${locationSuffix}` },
        { value: "braids", label: `Braids or protective styles${locationSuffix}` },
        { value: "hair-color", label: `Hair color or wash and style${locationSuffix}` },
        { value: "general-salon", label: `General hair salon${locationSuffix}` },
      ],
      skippable: true,
      persistence: "temporary",
    }];
  }
  if (input.subjectKey === "activity" && input.ageBand === "unknown") {
    return [{
      id: "business-activity-audience",
      question: "Who should these things to do work for?",
      explanation: "Age range helps me avoid adult-only options. You can skip and keep it broad.",
      options: [
        { value: "adults", label: `Things to do for adults${locationSuffix}` },
        { value: "teens", label: `Things to do for teens${locationSuffix}` },
        { value: "kids", label: `Things to do for kids${locationSuffix}` },
        { value: "mixed", label: `Things to do for mixed ages${locationSuffix}` },
      ],
      skippable: true,
      persistence: "temporary",
    }];
  }
  return [];
}
