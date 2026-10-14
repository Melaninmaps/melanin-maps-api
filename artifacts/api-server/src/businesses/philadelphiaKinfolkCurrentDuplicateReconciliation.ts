import {
  highConfidenceBusinessDuplicateReasons,
  normalizeBusinessPhone,
  normalizeOfficialSocialProfileForPlatform,
  normalizeOfficialWebsiteDomain,
  type BusinessDuplicateMatchReason,
} from "./businessDuplicateIdentity";
import { normalizeText } from "../lib/business-dedup";

export const PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION =
  "philadelphia-kinfolk-current-pin-social-v1" as const;

export const SOCIAL_FIELDS = [
  "instagram",
  "facebook",
  "tiktok",
  "twitter",
  "youtube",
  "pinterest",
] as const;

export type SocialField = (typeof SOCIAL_FIELDS)[number];
export type ReceiptField = "instagram" | "facebook" | "tiktok" | "service_tags";

export type ProfileFieldReceipt = Readonly<{
  fieldName: ReceiptField;
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  confidence: "high" | "medium" | "low";
  note: string | null;
  observedValue: unknown;
}>;

export type KinfolkCurrentBusinessRecord = Readonly<{
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  twitter: string | null;
  youtube: string | null;
  pinterest: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  updatedAt: string;
}>;

export type SocialTransfer = Readonly<{
  field: SocialField;
  value: string;
  receipt: ProfileFieldReceipt;
}>;

export type ApprovedDuplicateConsolidation = Readonly<{
  canonicalId: string;
  duplicateId: string;
  businessName: string;
  identityReasons: BusinessDuplicateMatchReason[];
  transfers: SocialTransfer[];
  canonicalUpdatedAt: string;
  duplicateUpdatedAt: string;
}>;

export type ManualReviewDuplicate = Readonly<{
  businessIds: [string, string];
  businessName: string;
  reasons: string[];
}>;

export type DuplicateReconciliationPlan = Readonly<{
  approved: ApprovedDuplicateConsolidation[];
  manualReview: ManualReviewDuplicate[];
}>;

function normalizedBusinessName(value: string | null | undefined): string {
  return normalizeText(
    String(value ?? "").replace(/[\u0027\u2018\u2019]/g, ""),
  );
}

function normalizedLocation(value: string | null | undefined): string {
  return normalizeText(value ?? "");
}

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function validCoordinate(
  value: number | string | null | undefined,
  min: number,
  max: number,
): boolean {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

export function hasStoredMapPin(record: KinfolkCurrentBusinessRecord): boolean {
  return (
    validCoordinate(record.latitude, -90, 90) &&
    validCoordinate(record.longitude, -180, 180) &&
    !(Number(record.latitude) === 0 && Number(record.longitude) === 0)
  );
}

export function receiptFieldForSocial(field: SocialField): ReceiptField {
  if (field === "instagram" || field === "facebook" || field === "tiktok")
    return field;
  return "service_tags";
}

function receiptObservedSocialValue(
  receipt: ProfileFieldReceipt,
  field: SocialField,
): string | null {
  if (!receipt.observedValue || typeof receipt.observedValue !== "object")
    return null;
  const value = receipt.observedValue as {
    fields?: Record<string, unknown>;
    identityMatch?: { asserted?: unknown; signal?: unknown };
  };
  const stored = value.fields?.[field];
  const identityAsserted = value.identityMatch?.asserted === true;
  const identitySignal =
    typeof value.identityMatch?.signal === "string" &&
    value.identityMatch.signal.trim();
  return typeof stored === "string" &&
    stored.trim() &&
    identityAsserted &&
    identitySignal
    ? stored.trim()
    : null;
}

function receiptForSocial(
  receipts: readonly ProfileFieldReceipt[],
  field: SocialField,
  expectedValue: string,
): ProfileFieldReceipt | null {
  const receiptField = receiptFieldForSocial(field);
  return (
    receipts.find(
      (receipt) =>
        receipt.fieldName === receiptField &&
        receiptObservedSocialValue(receipt, field) === expectedValue,
    ) ?? null
  );
}

function socialValue(
  record: KinfolkCurrentBusinessRecord,
  field: SocialField,
): string | null {
  return text(record[field]);
}

function socialProfileMatches(
  field: SocialField,
  left: string,
  right: string,
): boolean {
  return (
    normalizeOfficialSocialProfileForPlatform(field, left) ===
    normalizeOfficialSocialProfileForPlatform(field, right)
  );
}

function differingOfficialFields(
  canonical: KinfolkCurrentBusinessRecord,
  duplicate: KinfolkCurrentBusinessRecord,
): string[] {
  const conflicts: string[] = [];
  const canonicalDomain = normalizeOfficialWebsiteDomain(canonical.website);
  const duplicateDomain = normalizeOfficialWebsiteDomain(duplicate.website);
  if (
    canonicalDomain &&
    duplicateDomain &&
    canonicalDomain !== duplicateDomain
  ) {
    conflicts.push("different official website domains");
  }

  const canonicalPhone = normalizeBusinessPhone(canonical.phone);
  const duplicatePhone = normalizeBusinessPhone(duplicate.phone);
  if (canonicalPhone && duplicatePhone && canonicalPhone !== duplicatePhone) {
    conflicts.push("different normalized phone numbers");
  }

  for (const field of SOCIAL_FIELDS) {
    const canonicalSocial = socialValue(canonical, field);
    const duplicateSocial = socialValue(duplicate, field);
    if (
      canonicalSocial &&
      duplicateSocial &&
      !socialProfileMatches(field, canonicalSocial, duplicateSocial)
    ) {
      conflicts.push(`different ${field} profiles`);
    }
  }
  return conflicts;
}

function buildTransfers(
  canonical: KinfolkCurrentBusinessRecord,
  duplicate: KinfolkCurrentBusinessRecord,
  receiptsByBusinessId: ReadonlyMap<string, readonly ProfileFieldReceipt[]>,
): { transfers: SocialTransfer[]; missingReceipts: string[] } {
  const sourceReceipts = receiptsByBusinessId.get(duplicate.id) ?? [];
  const transfers: SocialTransfer[] = [];
  const missingReceipts: string[] = [];

  for (const field of SOCIAL_FIELDS) {
    if (socialValue(canonical, field)) continue;
    const sourceValue = socialValue(duplicate, field);
    if (!sourceValue) continue;
    if (!normalizeOfficialSocialProfileForPlatform(field, sourceValue)) {
      missingReceipts.push(`${field} has an invalid social URL or handle`);
      continue;
    }
    const receipt = receiptForSocial(sourceReceipts, field, sourceValue);
    if (!receipt) {
      missingReceipts.push(
        `${field} lacks a matching identity-attested field receipt`,
      );
      continue;
    }
    transfers.push({ field, value: sourceValue, receipt });
  }

  return { transfers, missingReceipts };
}

function candidateReason(
  canonical: KinfolkCurrentBusinessRecord,
  duplicate: KinfolkCurrentBusinessRecord,
  identityReasons: BusinessDuplicateMatchReason[],
  receiptsByBusinessId: ReadonlyMap<string, readonly ProfileFieldReceipt[]>,
): {
  approved?: ApprovedDuplicateConsolidation;
  manual?: ManualReviewDuplicate;
} {
  const stableIds: [string, string] = [canonical.id, duplicate.id].sort() as [
    string,
    string,
  ];
  const reasons = differingOfficialFields(canonical, duplicate);
  if (hasStoredMapPin(duplicate))
    reasons.push("both records have stored map coordinates");
  if (!hasStoredMapPin(canonical))
    reasons.push("the canonical record has no stored map pin");

  const { transfers, missingReceipts } = buildTransfers(
    canonical,
    duplicate,
    receiptsByBusinessId,
  );
  reasons.push(...missingReceipts);
  if (transfers.length === 0)
    reasons.push(
      "no source-receipted social profile is missing from the pinned record",
    );

  if (reasons.length > 0) {
    return {
      manual: {
        businessIds: stableIds,
        businessName: canonical.name,
        reasons: [...new Set(reasons)].sort(),
      },
    };
  }

  return {
    approved: {
      canonicalId: canonical.id,
      duplicateId: duplicate.id,
      businessName: canonical.name,
      identityReasons,
      transfers,
      canonicalUpdatedAt: canonical.updatedAt,
      duplicateUpdatedAt: duplicate.updatedAt,
    },
  };
}

/**
 * Builds an intentionally narrow, reviewable consolidation plan.
 *
 * It never considers same-name listings alone. An automatic plan is emitted only
 * for exactly two current Kinfolk records in Philadelphia, with one stored pin,
 * high-confidence duplicate identity evidence, no conflicting official values,
 * and at least one missing social profile backed by the duplicate's own
 * identity-attested field receipt. Everything else is a manual-review case.
 */
export function buildPhiladelphiaKinfolkCurrentDuplicatePlan(
  records: readonly KinfolkCurrentBusinessRecord[],
  receiptsByBusinessId: ReadonlyMap<string, readonly ProfileFieldReceipt[]>,
): DuplicateReconciliationPlan {
  const byName = new Map<string, KinfolkCurrentBusinessRecord[]>();
  for (const record of records) {
    if (
      normalizedLocation(record.city) !== "philadelphia" ||
      normalizedLocation(record.state) !== "pa"
    ) {
      continue;
    }
    const name = normalizedBusinessName(record.name);
    if (!name) continue;
    const current = byName.get(name) ?? [];
    current.push(record);
    byName.set(name, current);
  }

  const approved: ApprovedDuplicateConsolidation[] = [];
  const manualReview: ManualReviewDuplicate[] = [];

  for (const group of byName.values()) {
    if (group.length < 2) continue;
    if (group.length !== 2) {
      manualReview.push({
        businessIds: [group[0]!.id, group[1]!.id].sort() as [string, string],
        businessName: group[0]!.name,
        reasons: [
          `${group.length} current records share this normalized name; no automatic multi-record merge`,
        ],
      });
      continue;
    }

    const [left, right] = group;
    const identityReasons = highConfidenceBusinessDuplicateReasons(left, right);
    if (identityReasons.length === 0) continue;

    const leftPinned = hasStoredMapPin(left);
    const rightPinned = hasStoredMapPin(right);
    if (leftPinned === rightPinned) {
      manualReview.push({
        businessIds: [left.id, right.id].sort() as [string, string],
        businessName: left.name,
        reasons: [
          leftPinned
            ? "both records have stored map coordinates"
            : "neither record has a stored map pin",
        ],
      });
      continue;
    }

    const canonical = leftPinned ? left : right;
    const duplicate = leftPinned ? right : left;
    const result = candidateReason(
      canonical,
      duplicate,
      identityReasons,
      receiptsByBusinessId,
    );
    if (result.approved) approved.push(result.approved);
    if (result.manual) manualReview.push(result.manual);
  }

  return {
    approved: approved.sort((left, right) =>
      left.canonicalId.localeCompare(right.canonicalId),
    ),
    manualReview: manualReview.sort((left, right) =>
      `${left.businessName}:${left.businessIds.join(":")}`.localeCompare(
        `${right.businessName}:${right.businessIds.join(":")}`,
      ),
    ),
  };
}
