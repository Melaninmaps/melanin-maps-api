export type SubmissionSource = "website" | "instagram" | "facebook" | "tiktok" | "linkedin" | "qr" | "other";
export type SubmissionStatus = "pending_review" | "approved" | "declined" | "needs_more_info";

export type CommunityBusinessSubmissionInput = {
  submitterName?: string;
  submitterEmail?: string;
  businessName: string;
  businessDescription: string;
  primaryCategory: string;
  specialties?: string[];
  communityTags?: string[];
  ownerName?: string;
  ownerRole?: string;
  ownerIdentityText?: string;
  locationLabel?: string;
  addressLine1?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  tiktokHandle?: string;
  source?: SubmissionSource;
  sourceCampaign?: string;
};

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : undefined;
const list = (value: unknown, maxItems: number, maxLength: number) => Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, maxItems).map((item) => item.slice(0, maxLength)) : [];

export function validateSubmission(value: unknown): CommunityBusinessSubmissionInput {
  if (!value || typeof value !== "object") throw new Error("SUBMISSION_BODY_REQUIRED");
  const source = value as Record<string, unknown>;
  const businessName = text(source.businessName, 160);
  const businessDescription = text(source.businessDescription, 3000);
  const primaryCategory = text(source.primaryCategory, 80);
  if (!businessName || businessName.length < 2) throw new Error("BUSINESS_NAME_REQUIRED");
  if (!businessDescription || businessDescription.length < 20) throw new Error("BUSINESS_DESCRIPTION_REQUIRED");
  if (!primaryCategory) throw new Error("BUSINESS_CATEGORY_REQUIRED");
  return {
    businessName, businessDescription, primaryCategory,
    submitterName: text(source.submitterName, 120), submitterEmail: text(source.submitterEmail, 254),
    specialties: list(source.specialties, 12, 80), communityTags: list(source.communityTags, 8, 80),
    ownerName: text(source.ownerName, 160), ownerRole: text(source.ownerRole, 120), ownerIdentityText: text(source.ownerIdentityText, 280),
    locationLabel: text(source.locationLabel, 200), addressLine1: text(source.addressLine1, 200), city: text(source.city, 100), stateRegion: text(source.stateRegion, 100), postalCode: text(source.postalCode, 20), countryCode: text(source.countryCode, 2) ?? "US",
    phone: text(source.phone, 40), email: text(source.email, 254), websiteUrl: text(source.websiteUrl, 500), instagramHandle: text(source.instagramHandle, 100), facebookUrl: text(source.facebookUrl, 500), tiktokHandle: text(source.tiktokHandle, 100),
    source: (["website","instagram","facebook","tiktok","linkedin","qr","other"] as const).includes(source.source as SubmissionSource) ? source.source as SubmissionSource : "website",
    sourceCampaign: text(source.sourceCampaign, 120),
  };
}
