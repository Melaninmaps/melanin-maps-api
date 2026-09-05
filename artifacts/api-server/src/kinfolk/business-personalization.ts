import type { GovernedKinfolkBusiness } from "./governedBusinessRepository";

export type KinfolkBusinessPersonalization = Readonly<{
  ageBand?: string | null;
  preferenceTerms?: readonly string[];
  avoidTerms?: readonly string[];
  currentRequest?: string;
}>;

export type RankedKinfolkBusiness = GovernedKinfolkBusiness & Readonly<{
  matchReasons: string[];
}>;

const MINOR_BANDS = new Set(["under_13", "13_17"]);
const MINOR_HARD_EXCLUDED = /\b(?:night\s*club|nightclub|adult nightlife|21\+|adults? only|age[- ]restricted)\b/i;
const MINOR_SOFT_EXCLUDED = /\b(?:nightlife|cocktails?|full bar|beer|wine)\b/i;
const MINOR_POSITIVE = /\b(?:teen|youth|children|child|family|all ages|under 13|student)\b/i;
const STOP_WORDS = new Set([
  "and", "the", "for", "with", "this", "that", "from", "into", "near", "local",
  "place", "places", "business", "businesses", "services", "service", "something",
  "things", "looking", "want", "need", "find", "recommend", "philadelphia",
]);

function cleanTerm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
  return clean.length >= 2 && clean.length <= 100 ? clean : null;
}

function searchableText(business: GovernedKinfolkBusiness): string {
  return [
    business.name,
    business.category,
    business.subcategory,
    business.description,
    ...business.tags,
    ...business.communityValues,
    ...business.audiencesServed,
    ...business.vibes,
    ...business.accessibilityFeatures,
    ...business.environmentTags,
    ...business.amenityTags,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .normalize("NFKD")
    .toLowerCase();
}

function meaningfulTokens(value: string): string[] {
  return [...new Set(value.split(" ").filter((token) => token.length >= 3 && !STOP_WORDS.has(token)))];
}

function scoredBusiness(
  business: GovernedKinfolkBusiness,
  index: number,
  personalization: KinfolkBusinessPersonalization,
): { business: GovernedKinfolkBusiness; index: number; score: number; reasons: string[] } | null {
  const text = searchableText(business);
  const hasPublishedMinorAudienceSignal = MINOR_POSITIVE.test(text);
  const isMinor = MINOR_BANDS.has(personalization.ageBand ?? "");
  if (isMinor && MINOR_HARD_EXCLUDED.test(text)) return null;
  if (
    isMinor
    && MINOR_SOFT_EXCLUDED.test(text)
    && !hasPublishedMinorAudienceSignal
  ) return null;

  let score = 0;
  const reasons: string[] = [];
  const request = cleanTerm(personalization.currentRequest);
  if (request) {
    const directRequestTokens = meaningfulTokens(request).filter((token) => text.includes(token));
    score += Math.min(8, directRequestTokens.length * 2);
  }

  for (const rawTerm of personalization.preferenceTerms ?? []) {
    const term = cleanTerm(rawTerm);
    if (!term) continue;
    if (text.includes(term)) {
      score += 7;
      reasons.push(`Matches your saved preference: ${rawTerm.trim()}`);
      continue;
    }
    const matchingTokens = meaningfulTokens(term).filter((token) => text.includes(token));
    if (matchingTokens.length > 0) {
      score += Math.min(4, matchingTokens.length);
      reasons.push(`Related to your saved preference: ${rawTerm.trim()}`);
    }
  }

  for (const rawTerm of personalization.avoidTerms ?? []) {
    const term = cleanTerm(rawTerm);
    if (term && text.includes(term)) score -= 8;
  }

  if (isMinor && hasPublishedMinorAudienceSignal) {
    score += 8;
    reasons.unshift("Includes a published youth, child, teen, or family audience signal");
  }

  return { business, index, score, reasons: [...new Set(reasons)].slice(0, 3) };
}

export function rankGovernedBusinessesForMember(
  businesses: readonly GovernedKinfolkBusiness[],
  personalization: KinfolkBusinessPersonalization = {},
): RankedKinfolkBusiness[] {
  return businesses
    .map((business, index) => scoredBusiness(business, index, personalization))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ business, reasons }) => ({ ...business, matchReasons: reasons }));
}
