/**
 * Safety Hub P0 — Serious Credible Threat policy.
 *
 * This is deliberately a closed policy boundary, not a replacement for the
 * Police/ICE observation or community-intelligence flows. It has no route,
 * persistence, push-provider, or deletion side effect. A future privileged
 * adapter must persist the returned audit plan and perform delivery separately.
 */

export const SERIOUS_CREDIBLE_THREAT_KIND = "serious_credible_threat" as const;

const THREAT_CATEGORIES = [
  "imminent_violence",
  "targeted_credible_threat",
  "active_threat",
] as const;

const THREAT_EVIDENCE_KINDS = [
  "official_public_safety_source",
  "trusted_organization",
  "independent_witness_record",
] as const;

const ORDINARY_OBSERVATION_KINDS = new Set([
  "police",
  "ice",
  "police_observation",
  "ice_observation",
  "checkpoint",
]);

const MAX_NOTICE_LIFETIME_MS = 4 * 60 * 60 * 1000;
const STREET_OR_COORDINATE_PATTERN = /(?:\b\d{1,6}\b|\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|highway|hwy|drive|dr|lane|ln|court|ct|lat(?:itude)?|lng|lon(?:gitude)?)\b)/i;

export type SeriousCredibleThreatCategory = (typeof THREAT_CATEGORIES)[number];
export type ThreatEvidenceKind = (typeof THREAT_EVIDENCE_KINDS)[number];
export type ThreatModerationDecision = "unreviewed" | "approved" | "rejected";
export type ThreatNoticeState = "not_published" | "active" | "expired" | "withdrawn" | "corrected";
export type ThreatNotificationState =
  | "not_eligible"
  | "queued"
  | "provider_accepted"
  | "delivery_confirmed"
  | "delivery_failed";

/**
 * Only a city/region may cross this policy boundary. The key allow-list is
 * intentional: coordinates, street text, venue names, and member locations are
 * rejected rather than rounded or copied into a notice.
 */
export interface CoarseThreatArea {
  city: string;
  region: string;
}

export interface ThreatEvidenceReference {
  referenceId: string;
  kind: ThreatEvidenceKind;
  independentlyVerified: boolean;
  verifiedAt: Date | null;
}

export interface ThreatConsent {
  /** The reporter explicitly permits a private, restricted safety review. */
  privateReview: boolean;
  /** The reporter explicitly permits a city-level anonymized safety notice. */
  anonymousCityLevelNotice: boolean;
}

export interface ThreatModeration {
  decision: ThreatModerationDecision;
  moderatorId: string | null;
  reviewedAt: Date | null;
  /** Moderator-authored, non-identifying copy. Never use the reporter narrative. */
  publicSummary: string | null;
}

export interface SeriousCredibleThreatSubmission {
  kind: string;
  category: string;
  consent: ThreatConsent;
  evidence: readonly ThreatEvidenceReference[];
  area: CoarseThreatArea;
  moderation: ThreatModeration;
  requestedExpiresAt: Date | null;
}

export type ThreatBlocker =
  | "wrong_workflow"
  | "ordinary_observation"
  | "invalid_category"
  | "missing_explicit_consent"
  | "unsafe_or_precise_location"
  | "insufficient_verified_evidence"
  | "moderation_not_approved"
  | "expired";

export interface SafeThreatNotice {
  threatCategory: SeriousCredibleThreatCategory;
  city: string;
  region: string;
  summary: string;
  expiresAt: Date;
  noticeState: "active";
}

export interface SeriousThreatAssessment {
  blockers: readonly ThreatBlocker[];
  eligibleToQueue: boolean;
  notificationState: ThreatNotificationState;
  safeNotice: SafeThreatNotice | null;
}

function isUsableText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function isThreatCategory(value: unknown): value is SeriousCredibleThreatCategory {
  return typeof value === "string" && (THREAT_CATEGORIES as readonly string[]).includes(value);
}

function isThreatEvidenceKind(value: unknown): value is ThreatEvidenceKind {
  return typeof value === "string" && (THREAT_EVIDENCE_KINDS as readonly string[]).includes(value);
}

function hasOnlyCoarseAreaKeys(area: unknown): area is CoarseThreatArea {
  if (!isRecord(area)) return false;
  const keys = Object.keys(area);
  return keys.length === 2 && keys.every((key) => key === "city" || key === "region");
}

export function isCoarseThreatArea(area: unknown): area is CoarseThreatArea {
  return hasOnlyCoarseAreaKeys(area)
    && isUsableText(area.city, 100)
    && isUsableText(area.region, 100)
    && !STREET_OR_COORDINATE_PATTERN.test(area.city)
    && !STREET_OR_COORDINATE_PATTERN.test(area.region);
}

function hasExplicitConsent(consent: unknown): boolean {
  if (!isRecord(consent)) return false;
  return consent.privateReview === true && consent.anonymousCityLevelNotice === true;
}

function hasSufficientVerifiedEvidence(evidence: unknown, now: Date): boolean {
  if (!Array.isArray(evidence)) return false;
  const verifiedReferenceIds = new Set<string>();
  for (const item of evidence) {
    if (!isRecord(item)) continue;
    if (!isUsableText(item.referenceId, 160)
      || !isThreatEvidenceKind(item.kind)
      || !item.independentlyVerified
      || !isValidDate(item.verifiedAt)
      || item.verifiedAt.getTime() > now.getTime()) continue;
    verifiedReferenceIds.add(item.referenceId.trim());
  }
  // High-impact notices need two distinct, already-verified references. A future
  // moderator may attach more evidence, but this boundary never infers credibility.
  return verifiedReferenceIds.size >= 2;
}

function hasApprovedModeration(moderation: unknown, now: Date): moderation is ThreatModeration {
  if (!isRecord(moderation)) return false;
  return moderation.decision === "approved"
    && isUsableText(moderation.moderatorId, 160)
    && isValidDate(moderation.reviewedAt)
    && moderation.reviewedAt.getTime() <= now.getTime()
    && isUsableText(moderation.publicSummary, 280);
}

function hasValidExpiry(expiresAt: unknown, now: Date): expiresAt is Date {
  if (!isValidDate(expiresAt)) return false;
  const lifetime = expiresAt.getTime() - now.getTime();
  return lifetime > 0 && lifetime <= MAX_NOTICE_LIFETIME_MS;
}

/**
 * Evaluates whether a serious-threat record may enter a notification queue.
 * Missing, malformed, or unreviewed inputs are blockers; this never partially
 * publishes a notice or claims a member was notified.
 */
export function assessSeriousCredibleThreat(
  submission: SeriousCredibleThreatSubmission | unknown,
  now = new Date(),
): SeriousThreatAssessment {
  const blockers: ThreatBlocker[] = [];
  const inspectionTime = isValidDate(now) ? now : new Date(Number.NaN);
  const raw = isRecord(submission) ? submission : {};
  const kind = normalizedText(raw.kind);
  const category = normalizedText(raw.category);
  const threatCategory = isThreatCategory(category) ? category : null;
  const area = isCoarseThreatArea(raw.area) ? raw.area : null;
  const moderation = hasApprovedModeration(raw.moderation, inspectionTime) ? raw.moderation : null;
  const expiresAt = hasValidExpiry(raw.requestedExpiresAt, inspectionTime) ? raw.requestedExpiresAt : null;

  if (kind !== SERIOUS_CREDIBLE_THREAT_KIND) blockers.push("wrong_workflow");
  if (ORDINARY_OBSERVATION_KINDS.has(kind)
    || category === "police"
    || category === "ice") {
    blockers.push("ordinary_observation");
  }
  if (!threatCategory) blockers.push("invalid_category");
  if (!hasExplicitConsent(raw.consent)) blockers.push("missing_explicit_consent");
  if (!area) blockers.push("unsafe_or_precise_location");
  if (!hasSufficientVerifiedEvidence(raw.evidence, inspectionTime)) blockers.push("insufficient_verified_evidence");
  if (!moderation) blockers.push("moderation_not_approved");
  if (!expiresAt) blockers.push("expired");

  if (blockers.length > 0) {
    return {
      blockers,
      eligibleToQueue: false,
      notificationState: "not_eligible",
      safeNotice: null,
    };
  }

  return {
    blockers: [],
    eligibleToQueue: true,
    // Queued is intentionally not represented as sent or delivered. Provider
    // outcomes must be recorded through recordThreatNotificationOutcome.
    notificationState: "queued",
    safeNotice: {
      threatCategory: threatCategory!,
      city: area!.city.trim(),
      region: area!.region.trim(),
      summary: moderation!.publicSummary!.trim(),
      expiresAt: expiresAt!,
      noticeState: "active",
    },
  };
}

export type ThreatNotificationOutcome = "provider_accepted" | "delivery_confirmed" | "delivery_failed";

/**
 * Truthful notification state transition. A caller cannot report a delivery
 * before an internal queue entry exists, and a provider acknowledgement is not
 * misrepresented as confirmation at a device.
 */
export function recordThreatNotificationOutcome(
  current: ThreatNotificationState,
  outcome: ThreatNotificationOutcome,
): ThreatNotificationState {
  if (current === "not_eligible") return current;
  if (outcome === "provider_accepted" && current === "queued") return outcome;
  if (outcome === "delivery_confirmed" && current === "provider_accepted") return outcome;
  if (outcome === "delivery_failed" && (current === "queued" || current === "provider_accepted")) return outcome;
  return current;
}

export interface ThreatLifecycleRecord {
  noticeState: ThreatNoticeState;
  summary: string;
  expiresAt: Date;
}

export type ThreatLifecycleHook =
  | { action: "expire"; actor: "scheduler"; occurredAt: Date }
  | { action: "withdraw"; actor: "reporter_verified" | "moderator"; occurredAt: Date; reason: string }
  | { action: "correct"; actor: "moderator"; occurredAt: Date; correctedSummary: string };

export interface ThreatLifecyclePlan {
  accepted: boolean;
  nextRecord: ThreatLifecycleRecord;
  auditEvent: {
    action: ThreatLifecycleHook["action"];
    actor: ThreatLifecycleHook["actor"];
    occurredAt: Date;
  } | null;
  deactivateNotice: boolean;
  irreversibleDeletion: false;
}

function unchangedLifecyclePlan(record: ThreatLifecycleRecord): ThreatLifecyclePlan {
  return {
    accepted: false,
    nextRecord: record,
    auditEvent: null,
    deactivateNotice: false,
    irreversibleDeletion: false,
  };
}

/**
 * Produces an auditable, reversible lifecycle instruction. Persistence adapters
 * must retain the source record and append the audit event; this policy exposes
 * no hard-delete operation.
 */
export function planThreatLifecycleUpdate(
  record: ThreatLifecycleRecord,
  hook: ThreatLifecycleHook,
): ThreatLifecyclePlan {
  if (!isValidDate(hook.occurredAt) || !isValidDate(record.expiresAt) || !isUsableText(record.summary, 280)) {
    return unchangedLifecyclePlan(record);
  }

  if (hook.action === "expire") {
    if (hook.actor !== "scheduler" || record.noticeState !== "active" || hook.occurredAt.getTime() < record.expiresAt.getTime()) {
      return unchangedLifecyclePlan(record);
    }
    return {
      accepted: true,
      nextRecord: { ...record, noticeState: "expired" },
      auditEvent: { action: hook.action, actor: hook.actor, occurredAt: hook.occurredAt },
      deactivateNotice: true,
      irreversibleDeletion: false,
    };
  }

  if (hook.action === "withdraw") {
    if ((hook.actor !== "reporter_verified" && hook.actor !== "moderator") || !isUsableText(hook.reason, 280)) {
      return unchangedLifecyclePlan(record);
    }
    return {
      accepted: true,
      nextRecord: { ...record, noticeState: "withdrawn" },
      auditEvent: { action: hook.action, actor: hook.actor, occurredAt: hook.occurredAt },
      deactivateNotice: true,
      irreversibleDeletion: false,
    };
  }

  if (!isUsableText(hook.correctedSummary, 280)) return unchangedLifecyclePlan(record);
  return {
    accepted: true,
    nextRecord: { ...record, summary: hook.correctedSummary.trim(), noticeState: "corrected" },
    auditEvent: { action: hook.action, actor: hook.actor, occurredAt: hook.occurredAt },
    deactivateNotice: false,
    irreversibleDeletion: false,
  };
}
