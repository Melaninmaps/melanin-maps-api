export const COMMUNITY_FREQUENTED_SIGNAL_KINDS = [
  "ownership",
  "community_experience",
  "confidence",
  "safety_context",
  "fit",
] as const;

export type CommunityFrequentedSignalKind = (typeof COMMUNITY_FREQUENTED_SIGNAL_KINDS)[number];

export type CommunityFrequentedSignalValue =
  | "verified"
  | "affirmed"
  | "clear"
  | "caution"
  | "withheld";

/**
 * Metadata only: callers must never place a member's raw contribution or private
 * location/history in this policy input. This pure contract is not a persistence
 * model and does not itself create a visible scorecard.
 */
export type CommunityFrequentedContribution = Readonly<{
  contributorId: string;
  businessOwnerId: string;
  businessId: string;
  city: string;
  publicCommunityExperienceConsent: boolean;
  kind: CommunityFrequentedSignalKind;
  value: CommunityFrequentedSignalValue;
  expiresAt?: Date | string | null;
}>;

export type CommunityFrequentedScorecardInput = Readonly<{
  businessId: string;
  city: string;
  now: Date | string | number;
  contributions: readonly CommunityFrequentedContribution[];
}>;

export type CommunityFrequentedScorecardComponents = Readonly<{
  ownership: "verified" | "unavailable";
  communityExperience: "supported" | "unavailable";
  confidence: "supported" | "insufficient";
  safetyContext: "clear" | "caution" | "unavailable";
  fit: "supported" | "unavailable";
}>;

export type CommunityFrequentedScorecard =
  | Readonly<{
      status: "available";
      scope: Readonly<{ businessId: string; city: string }>;
      components: CommunityFrequentedScorecardComponents;
    }>
  | Readonly<{
      status: "withheld";
      components: CommunityFrequentedScorecardComponents;
    }>;

type NormalizedContribution = Readonly<{
  contributorId: string;
  businessOwnerId: string;
  kind: CommunityFrequentedSignalKind;
  value: CommunityFrequentedSignalValue;
}>;

const MAX_PUBLIC_SCOPE_LENGTH = 120;
const MAX_IDENTIFIER_LENGTH = 200;

function normalizeBoundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ").toLowerCase();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function normalizePublicScope(value: unknown): string | null {
  return normalizeBoundedString(value, MAX_PUBLIC_SCOPE_LENGTH);
}

function normalizeIdentifier(value: unknown): string | null {
  return normalizeBoundedString(value, MAX_IDENTIFIER_LENGTH);
}

function toEpochMilliseconds(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    const epoch = value.getTime();
    return Number.isFinite(epoch) ? epoch : null;
  }
  if (typeof value === "string") {
    const epoch = Date.parse(value);
    return Number.isFinite(epoch) ? epoch : null;
  }
  return null;
}

function isSignalKind(value: unknown): value is CommunityFrequentedSignalKind {
  return typeof value === "string"
    && (COMMUNITY_FREQUENTED_SIGNAL_KINDS as readonly string[]).includes(value);
}

function isValueAllowedForKind(
  kind: CommunityFrequentedSignalKind,
  value: unknown,
): value is CommunityFrequentedSignalValue {
  if (kind === "ownership") return value === "verified";
  if (kind === "safety_context") {
    return value === "clear" || value === "caution" || value === "withheld";
  }
  return value === "affirmed";
}

function unavailableComponents(): CommunityFrequentedScorecardComponents {
  return {
    ownership: "unavailable",
    communityExperience: "unavailable",
    confidence: "insufficient",
    safetyContext: "unavailable",
    fit: "unavailable",
  };
}

function withheldScorecard(): CommunityFrequentedScorecard {
  return { status: "withheld", components: unavailableComponents() };
}

/**
 * Evaluates only already-normalized public metadata for a future Community
 * scorecard. It is deliberately pure and fail-closed: consent, public scope,
 * owner identity, signal shape, expiry, duplicate contributor activity, and
 * safety evidence are all evaluated before any bounded component is returned.
 */
export function evaluateCommunityFrequentedScorecard(
  input: CommunityFrequentedScorecardInput,
): CommunityFrequentedScorecard {
  const now = toEpochMilliseconds(input?.now);
  const requestedBusinessId = normalizePublicScope(input?.businessId);
  const requestedCity = normalizePublicScope(input?.city);
  if (now === null || !requestedBusinessId || !requestedCity || !Array.isArray(input?.contributions)) {
    return withheldScorecard();
  }

  const candidateContributions: NormalizedContribution[] = [];
  for (const contribution of input.contributions) {
    if (!contribution || typeof contribution !== "object") continue;
    if (contribution.publicCommunityExperienceConsent !== true) continue;

    const contributorId = normalizeIdentifier(contribution.contributorId);
    const businessOwnerId = normalizeIdentifier(contribution.businessOwnerId);
    const businessId = normalizePublicScope(contribution.businessId);
    const city = normalizePublicScope(contribution.city);
    const expiresAt = contribution.expiresAt === undefined || contribution.expiresAt === null
      ? null
      : toEpochMilliseconds(contribution.expiresAt);

    if (
      !contributorId
      || !businessOwnerId
      || !businessId
      || !city
      || businessId !== requestedBusinessId
      || city !== requestedCity
      || contributorId === businessOwnerId
      || !isSignalKind(contribution.kind)
      || !isValueAllowedForKind(contribution.kind, contribution.value)
      || (contribution.expiresAt !== undefined && contribution.expiresAt !== null && expiresAt === null)
      || (expiresAt !== null && expiresAt <= now)
    ) {
      continue;
    }

    candidateContributions.push({
      contributorId,
      businessOwnerId,
      kind: contribution.kind,
      value: contribution.value,
    });
  }

  // One eligible contributor may contribute one public signal for an exact
  // business/city scope. Reject every signal from a duplicate contributor so
  // input ordering cannot choose which signal receives influence.
  const contributorCounts = new Map<string, number>();
  for (const contribution of candidateContributions) {
    contributorCounts.set(
      contribution.contributorId,
      (contributorCounts.get(contribution.contributorId) ?? 0) + 1,
    );
  }
  const accepted = candidateContributions.filter(
    (contribution) => contributorCounts.get(contribution.contributorId) === 1,
  );

  const hasKind = (kind: CommunityFrequentedSignalKind): boolean => (
    accepted.some((contribution) => contribution.kind === kind)
  );
  if (accepted.length < 2 || !hasKind("confidence")) return withheldScorecard();

  const safetySignals = accepted.filter((contribution) => contribution.kind === "safety_context");
  if (
    safetySignals.length === 0
    || safetySignals.some((contribution) => contribution.value === "withheld")
  ) {
    return withheldScorecard();
  }

  const hasCaution = safetySignals.some((contribution) => contribution.value === "caution");

  return {
    status: "available",
    scope: { businessId: requestedBusinessId, city: requestedCity },
    components: {
      ownership: hasKind("ownership") ? "verified" : "unavailable",
      communityExperience: hasKind("community_experience") ? "supported" : "unavailable",
      confidence: "supported",
      safetyContext: hasCaution ? "caution" : "clear",
      fit: hasKind("fit") ? "supported" : "unavailable",
    },
  };
}
