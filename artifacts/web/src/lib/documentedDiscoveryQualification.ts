export type QualificationOwnershipSourceKind = "approved_public" | "business_official" | "owner_official";

export type QualificationInput = Readonly<{
  businessName: string;
  ownershipDesignations: readonly string[];
  ownershipSourceUrl: string;
  ownershipSourceLabel: string;
  ownershipSourceKind: QualificationOwnershipSourceKind;
  officialWebsiteUrl: string;
  officialSocialUrl: string;
  observedOn: string;
  ownershipExpiresOn: string;
  reviewOn: string;
  decisionReason: string;
  batchReference: string;
}>;

type Evidence = {
  field: "identity" | "ownership" | "official_website" | "official_social";
  sourceKind: "approved_public" | "business_official" | "owner_official";
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  sourceExpiresAt?: string;
  confidence: "high";
  observedValue: Record<string, unknown>;
};

export type DocumentedDiscoveryQualificationPayload = Readonly<{
  eligibilityStatus: "qualified";
  decisionReason: string;
  reconciliationReasonCode: "source_ownership_and_official_presence_verified" | "social_only_public_business";
  batchReference?: string;
  ownershipDesignations: string[];
  ownershipSourceExpiresAt: string;
  reviewAfter: string;
  evidence: Evidence[];
}>;

function requiredText(value: string, label: string): string {
  const result = value.trim();
  if (!result) throw new Error(`${label} is required.`);
  return result;
}

function httpsUrl(value: string, label: string): string {
  const result = requiredText(value, label);
  let parsed: URL;
  try { parsed = new URL(result); } catch { throw new Error(`${label} must be a valid HTTPS URL.`); }
  if (parsed.protocol !== "https:") throw new Error(`${label} must use HTTPS.`);
  parsed.hash = "";
  return parsed.toString();
}

function isoStartOfDate(value: string, label: string): string {
  const date = requiredText(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${label} must use YYYY-MM-DD.`);
  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} is invalid.`);
  return new Date(timestamp).toISOString();
}

/**
 * Builds only the existing audited documented-discovery decision contract. It
 * intentionally has no lifecycle, ownership-field, duplicate, coordinate, or
 * map-pin properties, so the Admin control cannot broaden its authority.
 */
export function buildDocumentedDiscoveryQualification(
  input: QualificationInput,
): DocumentedDiscoveryQualificationPayload {
  const ownershipDesignations = [...new Set(input.ownershipDesignations.map((value) => value.trim()).filter(Boolean))];
  if (ownershipDesignations.length === 0) throw new Error("A recorded ownership designation is required before Kinfolk qualification.");
  const ownershipSourceUrl = httpsUrl(input.ownershipSourceUrl, "Ownership source URL");
  const ownershipSourceLabel = requiredText(input.ownershipSourceLabel, "Ownership source label");
  const observedAt = isoStartOfDate(input.observedOn, "Observed on");
  const ownershipSourceExpiresAt = isoStartOfDate(input.ownershipExpiresOn, "Ownership review expiry");
  const reviewAfter = isoStartOfDate(input.reviewOn, "Next review date");
  if (Date.parse(ownershipSourceExpiresAt) <= Date.parse(observedAt)) throw new Error("Ownership review expiry must be after the observation date.");
  if (Date.parse(reviewAfter) <= Date.parse(observedAt)) throw new Error("Next review date must be after the observation date.");

  const officialWebsiteUrl = input.officialWebsiteUrl.trim() ? httpsUrl(input.officialWebsiteUrl, "Official website URL") : "";
  const officialSocialUrl = input.officialSocialUrl.trim() ? httpsUrl(input.officialSocialUrl, "Official social profile URL") : "";
  if (!officialWebsiteUrl && !officialSocialUrl) throw new Error("Verify an official website or official social profile before qualifying this business.");
  const decisionReason = requiredText(input.decisionReason, "Decision reason");
  const businessName = requiredText(input.businessName, "Business name");
  const firstOfficialSource = officialWebsiteUrl || officialSocialUrl;
  const evidence: Evidence[] = [
    {
      field: "identity",
      sourceKind: "business_official",
      sourceUrl: firstOfficialSource,
      sourceLabel: officialWebsiteUrl ? "Official business website identity evidence" : "Official business social identity evidence",
      observedAt,
      confidence: "high",
      observedValue: { businessName, identityMatch: true, matchingSignals: ["business_name"] },
    },
    {
      field: "ownership",
      sourceKind: input.ownershipSourceKind,
      sourceUrl: ownershipSourceUrl,
      sourceLabel: ownershipSourceLabel,
      observedAt,
      sourceExpiresAt: ownershipSourceExpiresAt,
      confidence: "high",
      observedValue: { designations: ownershipDesignations },
    },
  ];
  if (officialWebsiteUrl) {
    evidence.push({
      field: "official_website",
      sourceKind: "business_official",
      sourceUrl: officialWebsiteUrl,
      sourceLabel: "Official business website",
      observedAt,
      confidence: "high",
      observedValue: { websiteUrl: officialWebsiteUrl, identityMatch: true, matchingSignals: ["business_name"] },
    });
  }
  if (officialSocialUrl) {
    evidence.push({
      field: "official_social",
      sourceKind: "business_official",
      sourceUrl: officialSocialUrl,
      sourceLabel: "Official business social profile",
      observedAt,
      confidence: "high",
      observedValue: { profileUrl: officialSocialUrl, identityMatch: true, matchingSignals: ["business_name"] },
    });
  }
  const batchReference = input.batchReference.trim();
  return {
    eligibilityStatus: "qualified",
    decisionReason,
    reconciliationReasonCode: officialWebsiteUrl
      ? "source_ownership_and_official_presence_verified"
      : "social_only_public_business",
    ...(batchReference ? { batchReference } : {}),
    ownershipDesignations,
    ownershipSourceExpiresAt,
    reviewAfter,
    evidence,
  };
}
