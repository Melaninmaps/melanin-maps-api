import type { AgeBand } from "../lib/audience-policy";
import type { GovernedKinfolkBusiness } from "./governedBusinessRepository";

export type BusinessAudienceBand = AgeBand | "mixed_all_ages";

export type KinfolkBusinessPersonalization = Readonly<{
  ageBand?: BusinessAudienceBand | null;
  preferenceTerms?: readonly string[];
  avoidTerms?: readonly string[];
  currentRequest?: string;
}>;

export type RankedKinfolkBusiness = GovernedKinfolkBusiness & Readonly<{
  matchReasons: string[];
}>;

// Unknown and mixed-age requests stay as protective as the youngest supported
// audience. Only the canonical persisted bands from audience-policy are valid;
// fixture-only values such as 13_17, 18_39, 40_64, and 65_plus are excluded.
const PROTECTIVE_BANDS = new Set<BusinessAudienceBand>([
  "unknown",
  "under_13",
  "13_15",
  "16_17",
  "mixed_all_ages",
]);
const MINOR_HARD_EXCLUDED = /(?:\b(?:night\s*club|nightclub|adult nightlife|adult entertainment|strip\s*club|stripclub|gentlemen(?:'s|s)?\s*club|cabaret|adults? only|age[- ]restricted|mature audiences? only)\b|(?:^|[^a-z0-9])(?:18|21)\s*\+(?=$|[^a-z0-9]))/i;
const MINOR_SOFT_EXCLUDED = /\b(?:nightlife|cocktails?|bars?|taverns?|pubs?|lounges?|social clubs?|beer|wine)\b/i;
const MINOR_POSITIVE = /\b(?:teens?|youth|children|child|families|family[- ]friendly|all ages|under (?:13|18|21))\b/i;
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
    ...business.specialties,
    ...business.communityValues,
    ...business.audiencesServed,
    ...business.vibes,
    ...business.accessibilityFeatures,
    ...business.environmentTags,
    ...business.amenityTags,
    business.audienceType,
    business.story,
    business.missionStatement,
    business.whyStarted,
    business.whatCustomersShouldKnow,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .normalize("NFKD")
    .toLowerCase();
}

export function isProtectiveBusinessAudience(ageBand: BusinessAudienceBand | null | undefined): boolean {
  return PROTECTIVE_BANDS.has(ageBand ?? "unknown");
}

export function audienceAllowsBusinessText(input: {
  ageBand: BusinessAudienceBand | null | undefined;
  text: string;
  publishedAudienceEvidence?: string;
}): boolean {
  if (!isProtectiveBusinessAudience(input.ageBand)) return true;
  if (MINOR_HARD_EXCLUDED.test(input.text)) return false;
  const hasPublishedMinorAudienceSignal = MINOR_POSITIVE.test(input.publishedAudienceEvidence ?? "");
  return !MINOR_SOFT_EXCLUDED.test(input.text) || hasPublishedMinorAudienceSignal;
}

function meaningfulTokens(value: string): string[] {
  return [...new Set(value.split(" ").filter((token) => token.length >= 3 && !STOP_WORDS.has(token)))];
}

function containsWholeTerm(text: string, term: string): boolean {
  const pattern = term
    .split(" ")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^a-z0-9]+");
  return new RegExp(`(?:^|[^a-z0-9])${pattern}(?=$|[^a-z0-9])`, "i").test(text);
}

function scoredBusiness(
  business: GovernedKinfolkBusiness,
  index: number,
  personalization: KinfolkBusinessPersonalization,
): { business: GovernedKinfolkBusiness; index: number; score: number; reasons: string[] } | null {
  const text = searchableText(business);
  const publishedAudienceEvidence = [
    ...business.audiencesServed,
    business.audienceType,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0).join(" ");
  const hasPublishedMinorAudienceSignal = MINOR_POSITIVE.test(publishedAudienceEvidence);
  const protectiveAudience = isProtectiveBusinessAudience(personalization.ageBand);
  if (!audienceAllowsBusinessText({
    ageBand: personalization.ageBand,
    text,
    publishedAudienceEvidence,
  })) return null;

  let score = 0;
  const reasons: string[] = [];
  const request = cleanTerm(personalization.currentRequest);
  if (request) {
    const directRequestTokens = meaningfulTokens(request).filter((token) => containsWholeTerm(text, token));
    score += Math.min(8, directRequestTokens.length * 2);
  }

  for (const rawTerm of personalization.preferenceTerms ?? []) {
    const term = cleanTerm(rawTerm);
    if (!term) continue;
    if (containsWholeTerm(text, term)) {
      score += 7;
      reasons.push(`Matches your saved preference: ${rawTerm.trim()}`);
      continue;
    }
    const termTokens = meaningfulTokens(term);
    const matchingTokens = termTokens.filter((token) => containsWholeTerm(text, token));
    const requiredTokenMatches = termTokens.length > 1 ? 2 : 1;
    if (matchingTokens.length >= requiredTokenMatches) {
      score += Math.min(4, matchingTokens.length);
      reasons.push(`Related to your saved preference: ${rawTerm.trim()}`);
    }
  }

  for (const rawTerm of personalization.avoidTerms ?? []) {
    const term = cleanTerm(rawTerm);
    if (term && containsWholeTerm(text, term)) score -= 8;
  }

  if (protectiveAudience && hasPublishedMinorAudienceSignal) {
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
