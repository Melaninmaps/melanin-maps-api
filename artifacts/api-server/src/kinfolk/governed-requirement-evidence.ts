import type { GovernedKinfolkBusiness } from "./governedBusinessRepository";

/**
 * A private requirement is deliberately translated into a small, server-owned
 * set of evidence checks. The raw member text never leaves the memory boundary,
 * is never returned to clients, and is never used to change catalog eligibility,
 * ownership, safety, citations, or promotion rules.
 */
export type GovernedRequirementConstraint =
  | "documented_accessibility"
  | "documented_vegan"
  | "documented_vegetarian"
  | "documented_halal"
  | "documented_kosher"
  | "documented_gluten_free"
  | "documented_dairy_free"
  | "documented_quiet_environment"
  | "documented_transit"
  | "documented_parking"
  | "documented_family";

export type GovernedRequirementEvidence = Readonly<{
  hasRequirement: boolean;
  /**
   * A requirement with no controlled evidence predicate fails closed for
   * recommendations. Kinfolk asks for a different search or more evidence
   * instead of substituting an approximate result.
   */
  hasUnsupportedRequirement: boolean;
  constraints: readonly GovernedRequirementConstraint[];
}>;

type RequirementMemoryCandidate = Readonly<{
  content: string;
  purpose: string;
  isSensitive: boolean;
}>;

const REQUIREMENT_RULES: ReadonlyArray<{
  constraint: GovernedRequirementConstraint;
  pattern: RegExp;
}> = [
  {
    constraint: "documented_accessibility",
    pattern: /\b(?:wheelchair|ada|accessible|accessibility|mobility|step[- ]free|elevator)\b/i,
  },
  {
    constraint: "documented_vegan",
    pattern: /\b(?:vegan|plant[- ]based)\b/i,
  },
  { constraint: "documented_vegetarian", pattern: /\bvegetarian\b/i },
  { constraint: "documented_halal", pattern: /\bhalal\b/i },
  { constraint: "documented_kosher", pattern: /\bkosher\b/i },
  {
    constraint: "documented_gluten_free",
    pattern: /\bgluten[- ]free\b/i,
  },
  {
    constraint: "documented_dairy_free",
    pattern: /\bdairy[- ]free\b/i,
  },
  {
    constraint: "documented_quiet_environment",
    pattern: /\b(?:quiet|sensory[- ]friendly|low[- ]sensory)\b/i,
  },
  {
    constraint: "documented_transit",
    pattern: /\b(?:transit|public transport|subway|bus|train|car[- ]free|walkable)\b/i,
  },
  { constraint: "documented_parking", pattern: /\bparking\b/i },
  {
    constraint: "documented_family",
    pattern: /\b(?:children|kids?|family|child[- ]friendly|stroller)\b/i,
  },
];

/**
 * Converts only active, non-sensitive hard requirements into opaque controlled
 * constraints. A generic preference remains a soft ranking cue elsewhere;
 * hard requirements are never converted into ranking terms.
 */
export function governedRequirementEvidenceForMemories(
  memories: readonly RequirementMemoryCandidate[],
): GovernedRequirementEvidence {
  const constraints = new Set<GovernedRequirementConstraint>();
  let hasRequirement = false;
  let hasUnsupportedRequirement = false;

  for (const memory of memories) {
    if (memory.isSensitive || memory.purpose !== "requirement_context") continue;
    hasRequirement = true;
    const matched = REQUIREMENT_RULES.filter((rule) => rule.pattern.test(memory.content));
    if (matched.length === 0) {
      hasUnsupportedRequirement = true;
      continue;
    }
    for (const rule of matched) constraints.add(rule.constraint);
  }

  return {
    hasRequirement,
    hasUnsupportedRequirement,
    constraints: [...constraints],
  };
}

function documentedListingText(
  business: Pick<
    GovernedKinfolkBusiness,
    | "tags"
    | "specialties"
    | "accessibilityFeatures"
    | "audiencesServed"
    | "vibes"
    | "environmentTags"
    | "amenityTags"
  >,
): string {
  return [
    ...business.tags,
    ...business.specialties,
    ...business.accessibilityFeatures,
    ...business.audiencesServed,
    ...business.vibes,
    ...business.environmentTags,
    ...business.amenityTags,
  ]
    .join(" ")
    .toLocaleLowerCase("en-US");
}

function matchesConstraint(
  text: string,
  constraint: GovernedRequirementConstraint,
): boolean {
  switch (constraint) {
    case "documented_accessibility":
      return /\b(?:wheelchair|ada(?:[- ]compliant)?|accessible(?: entrance)?|accessibility|mobility|step[- ]free|elevator)\b/.test(text);
    case "documented_vegan":
      return /\b(?:vegan|plant[- ]based)\b/.test(text);
    case "documented_vegetarian":
      return /\bvegetarian\b/.test(text);
    case "documented_halal":
      return /\bhalal\b/.test(text);
    case "documented_kosher":
      return /\bkosher\b/.test(text);
    case "documented_gluten_free":
      return /\bgluten[- ]free\b/.test(text);
    case "documented_dairy_free":
      return /\bdairy[- ]free\b/.test(text);
    case "documented_quiet_environment":
      return /\b(?:quiet|sensory[- ]friendly|low[- ]sensory)\b/.test(text);
    case "documented_transit":
      return /\b(?:transit|public transport|subway|bus|train|car[- ]free|walkable)\b/.test(text);
    case "documented_parking":
      return /\bparking\b/.test(text);
    case "documented_family":
      return /\b(?:children|kids?|family|child[- ]friendly|stroller)\b/.test(text);
  }
}

/**
 * Filters only the response cohort. It does not change a record's catalog
 * eligibility or persistence. A positive match means public listing metadata
 * supports the stated constraint, not that Kinfolk has independently certified
 * an accommodation, menu, price, or current availability.
 */
export function hasDocumentedRequirementEvidence(
  business: Pick<
    GovernedKinfolkBusiness,
    | "tags"
    | "specialties"
    | "accessibilityFeatures"
    | "audiencesServed"
    | "vibes"
    | "environmentTags"
    | "amenityTags"
  >,
  evidence: GovernedRequirementEvidence,
): boolean {
  if (!evidence.hasRequirement) return true;
  if (evidence.hasUnsupportedRequirement || evidence.constraints.length === 0)
    return false;
  const text = documentedListingText(business);
  return evidence.constraints.every((constraint) => matchesConstraint(text, constraint));
}
