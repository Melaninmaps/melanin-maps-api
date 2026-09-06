const FORBIDDEN_PUBLIC_TAG_VALUE = /\b(?:black|african[ -]?american|minority|women?|female|male|lgbtq\+?|queer|trans(?:gender)?|veteran|disabled|disability|children?|kids?|teens?|youth|under[ -]?13|adult(?:s)?[ -]?only|21\+|safe(?:ty)?|verified|trusted|approved|best|excellent|affordable|budget|luxury|free|pricing|price)\b/i;

function isForbiddenPersonaKey(key: string): boolean {
  if (key === "personaDataIncluded") return false;
  const normalized = key.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return normalized.startsWith("profile")
    || normalized.endsWith("profile")
    || normalized.includes("persona")
    || normalized.includes("matchscore")
    || normalized === "audiencefacts"
    || normalized === "publicaudiencetags"
    || normalized === "safety"
    || normalized === "safetysignal"
    || normalized === "accessibility"
    || normalized === "accessibilitysignal"
    || normalized === "frugal"
    || normalized === "frugalsignal"
    || normalized === "adventure"
    || normalized === "adventuresignal"
    || normalized === "travel"
    || normalized === "travelsignal"
    || normalized === "hairlocssignal"
    || normalized === "haircolorsignal";
}

function containsForbiddenPersonaKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenPersonaKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([key, entry]) => (
    isForbiddenPersonaKey(key)
    || containsForbiddenPersonaKey(entry)
  ));
}

export function assertKinfolkPocCandidatePrivacy(row: Record<string, unknown>): void {
  const ownershipDesignations = Array.isArray(row.ownershipDesignations) ? row.ownershipDesignations : [];
  const searchTags = Array.isArray(row.searchTags) ? row.searchTags : [];
  if (
    row.personaDataIncluded !== false
    || row.culturalSpecialty != null
    || row.notes != null
    || row.ownershipEvidence != null
    || ownershipDesignations.length > 0
    || Object.prototype.hasOwnProperty.call(row, "founderPriceTierReviewOnly")
    || searchTags.some((tag) => typeof tag !== "string" || FORBIDDEN_PUBLIC_TAG_VALUE.test(tag))
    || containsForbiddenPersonaKey(row)
  ) {
    throw new Error(`Privacy-unsafe proof-of-concept candidate at source row ${String(row.sourceRow ?? "unknown")}`);
  }
}
