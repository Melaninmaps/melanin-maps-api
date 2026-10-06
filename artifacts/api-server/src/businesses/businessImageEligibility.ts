export const BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION =
  "business-image-receipts-v1";
// Existing mobile builds use a category stock fallback whenever imageUrl is
// null. Until those clients receive the matching neutral-placeholder UI, return
// this existing MWM mark rather than any business-looking stock photo. New
// clients read imageEligibility and render their local location placeholder.
export const LEGACY_NEUTRAL_BUSINESS_PLACEHOLDER_URL =
  "https://api.melaninmaps.com/favicon.svg";

export const BUSINESS_IMAGE_RECEIPT_SOURCES = [
  "business_owner_upload",
  "official_business_website",
  "official_business_social",
  "approved_member_visit",
] as const;

export type BusinessImageReceiptSource =
  (typeof BUSINESS_IMAGE_RECEIPT_SOURCES)[number];
export type BusinessImageReceiptStatus = "pending" | "approved" | "revoked";

export type ImageEligibilityQuery = {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: T[] }>;
};

type PublicImageRecord = {
  id?: unknown;
  imageUrl?: unknown;
  photos?: unknown;
};

export type ReceiptSafeBusinessImage<T> = Omit<T, "imageUrl" | "photos"> & {
  imageUrl: string | null;
  photos: string[];
  imageEligibility: "receipt_verified" | "suppressed_unverified" | "none";
};

type ApprovedImageReceipt = {
  business_id: string;
  image_url: string;
};

export type BusinessImageReceiptInput = Readonly<{
  imageUrl: string;
  sourceType: BusinessImageReceiptSource;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  submittedByUserId?: string | null;
}>;

export type BusinessImageReceiptBusiness = Readonly<{
  id: string;
  imageUrl?: string | null;
  photos?: unknown;
  website?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
}>;

function uniqueUrls(values: readonly unknown[]): string[] {
  const urls = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const url = value.trim();
    if (!url) continue;
    urls.add(url);
  }
  return [...urls];
}

function asHttpsUrl(value: unknown, label: string): URL {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${label} must be a safe HTTPS URL`);
  }
  url.hash = "";
  return url;
}

function sameHost(left: URL, right: URL): boolean {
  const normalize = (host: string) => host.toLowerCase().replace(/^www\./, "");
  return normalize(left.hostname) === normalize(right.hostname);
}

function normalizedSocialPrefix(value: string): string | null {
  try {
    const url = asHttpsUrl(value, "official social URL");
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return `${url.hostname.toLowerCase()}${path}`;
  } catch {
    return null;
  }
}

function matchesOfficialSocial(source: URL, officialSocials: readonly unknown[]): boolean {
  const sourcePrefix = `${source.hostname.toLowerCase()}${source.pathname
    .replace(/\/+$/, "")
    .toLowerCase()}`;
  return officialSocials.some((official) => {
    if (typeof official !== "string" || !official.trim()) return false;
    const prefix = normalizedSocialPrefix(official);
    return Boolean(prefix && (sourcePrefix === prefix || sourcePrefix.startsWith(`${prefix}/`)));
  });
}

export function receiptSourceMatchesCurrentBusinessIdentity(
  business: BusinessImageReceiptBusiness,
  sourceType: BusinessImageReceiptSource,
  sourceUrl: string | null | undefined,
): boolean | null {
  if (sourceType === "business_owner_upload" || sourceType === "approved_member_visit") {
    return true;
  }
  if (!sourceUrl) return false;
  try {
    const source = asHttpsUrl(sourceUrl, "sourceUrl");
    if (sourceType === "official_business_website") {
      return Boolean(business.website?.trim() && sameHost(source, asHttpsUrl(business.website, "business website")));
    }
    if (sourceType === "official_business_social") {
      return matchesOfficialSocial(source, [business.instagram, business.tiktok, business.facebook]);
    }
    return null;
  } catch {
    return false;
  }
}

/**
 * Validates an image receipt before it is recorded. A stored image URL alone
 * never authorizes public display: each allowed source is tied to the exact
 * canonical business row and either an approved owner/member action or the
 * business's current official destination.
 */
export function validateBusinessImageReceipt(
  business: BusinessImageReceiptBusiness,
  input: BusinessImageReceiptInput,
): Required<Pick<BusinessImageReceiptInput, "imageUrl" | "sourceType">> &
  Pick<BusinessImageReceiptInput, "sourceUrl" | "sourceLabel" | "submittedByUserId"> {
  const imageUrl = asHttpsUrl(input.imageUrl, "imageUrl").toString();
  if (!BUSINESS_IMAGE_RECEIPT_SOURCES.includes(input.sourceType)) {
    throw new Error("sourceType is invalid");
  }

  const knownImages = uniqueUrls([
    business.imageUrl,
    ...(Array.isArray(business.photos) ? business.photos : []),
  ]);
  if (!knownImages.includes(imageUrl)) {
    throw new Error("imageUrl must already be attached to this exact business");
  }

  const sourceLabel =
    typeof input.sourceLabel === "string" && input.sourceLabel.trim()
      ? input.sourceLabel.trim().slice(0, 255)
      : null;
  const submittedByUserId =
    typeof input.submittedByUserId === "string" && input.submittedByUserId.trim()
      ? input.submittedByUserId.trim().slice(0, 255)
      : null;

  if (input.sourceType === "business_owner_upload") {
    if (!submittedByUserId) {
      throw new Error("business owner upload receipts require the uploading owner");
    }
    return {
      imageUrl,
      sourceType: input.sourceType,
      sourceUrl: null,
      sourceLabel,
      submittedByUserId,
    };
  }

  if (input.sourceType === "approved_member_visit") {
    if (!submittedByUserId) {
      throw new Error("approved member visit receipts require the contributing member");
    }
    return {
      imageUrl,
      sourceType: input.sourceType,
      sourceUrl: null,
      sourceLabel,
      submittedByUserId,
    };
  }

  const source = asHttpsUrl(input.sourceUrl, "sourceUrl");
  if (input.sourceType === "official_business_website") {
    if (receiptSourceMatchesCurrentBusinessIdentity(business, input.sourceType, source.toString()) !== true) {
      throw new Error("official website receipt must use this business's current official website");
    }
  }

  if (input.sourceType === "official_business_social") {
    if (receiptSourceMatchesCurrentBusinessIdentity(business, input.sourceType, source.toString()) !== true) {
      throw new Error("official social receipt must use this business's recorded official social account");
    }
  }

  return {
    imageUrl,
    sourceType: input.sourceType,
    sourceUrl: source.toString(),
    sourceLabel,
    submittedByUserId,
  };
}

/**
 * Receipts are stored separately from the legacy image fields so suppressing a
 * public image is reversible and never deletes the original media or source.
 * This helper is called by approval/audit controls rather than at app startup.
 */
export async function ensureBusinessImageEvidenceSchema(
  query: ImageEligibilityQuery,
): Promise<void> {
  await query.query(`
    CREATE TABLE IF NOT EXISTS business_image_evidence_receipts (
      id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id           varchar(255) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
      image_url             text NOT NULL,
      source_type           text NOT NULL CHECK (source_type IN (
        'business_owner_upload', 'official_business_website',
        'official_business_social', 'approved_member_visit'
      )),
      source_url            text,
      source_label          text,
      submitted_by_user_id  varchar(255),
      reviewed_by_user_id   varchar(255),
      status                text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'revoked')),
      policy_version        text NOT NULL,
      rejection_or_revocation_reason text,
      reviewed_at           timestamptz,
      created_at            timestamptz NOT NULL DEFAULT now(),
      updated_at            timestamptz NOT NULL DEFAULT now(),
      UNIQUE (business_id, image_url)
    );
    CREATE INDEX IF NOT EXISTS business_image_evidence_receipts_public_idx
      ON business_image_evidence_receipts (business_id, image_url)
      WHERE status = 'approved';
  `);
  await query.query(`
    CREATE TABLE IF NOT EXISTS business_image_audit_events (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id    varchar(255) NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
      image_url      text NOT NULL,
      action         text NOT NULL CHECK (action IN ('suppressed', 'receipt_approved', 'receipt_revoked', 'audit_observed')),
      reason         text NOT NULL,
      actor_user_id  varchar(255),
      details        jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at     timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS business_image_audit_events_business_idx
      ON business_image_audit_events (business_id, created_at DESC);
  `);
}

export async function attachEligibleBusinessImages<T extends PublicImageRecord>(
  query: ImageEligibilityQuery,
  records: readonly T[],
): Promise<Array<ReceiptSafeBusinessImage<T>>> {
  const ids = records
    .map((record) => (typeof record.id === "string" ? record.id : null))
    .filter((id): id is string => Boolean(id));

  let approvedReceipts: ApprovedImageReceipt[] = [];
  if (ids.length) {
    try {
      const result = await query.query<ApprovedImageReceipt>(
        `SELECT business_id, image_url
           FROM business_image_evidence_receipts
          WHERE business_id = ANY($1::varchar[])
            AND status = 'approved'`,
        [ids],
      );
      approvedReceipts = result.rows;
    } catch {
      // The receipt table may not yet exist on a staged/recovery environment.
      // Fail closed: no legacy image becomes public without a receipt.
      approvedReceipts = [];
    }
  }

  const allowedByBusiness = new Map<string, Set<string>>();
  for (const receipt of approvedReceipts) {
    const businessId = typeof receipt.business_id === "string" ? receipt.business_id : "";
    const imageUrl = typeof receipt.image_url === "string" ? receipt.image_url.trim() : "";
    if (!businessId || !imageUrl) continue;
    const allowed = allowedByBusiness.get(businessId) ?? new Set<string>();
    allowed.add(imageUrl);
    allowedByBusiness.set(businessId, allowed);
  }

  return records.map((record) => {
    const businessId = typeof record.id === "string" ? record.id : "";
    const allowed = allowedByBusiness.get(businessId) ?? new Set<string>();
    const legacyUrls = uniqueUrls([
      record.imageUrl,
      ...(Array.isArray(record.photos) ? record.photos : []),
    ]);
    const photos = legacyUrls.filter((url) => allowed.has(url));
    const receiptVerifiedUrl =
      typeof record.imageUrl === "string" && allowed.has(record.imageUrl.trim())
        ? record.imageUrl.trim()
        : (photos[0] ?? null);
    const imageEligibility = legacyUrls.length
      ? (receiptVerifiedUrl ? "receipt_verified" : "suppressed_unverified")
      : "none";
    const imageUrl = imageEligibility === "suppressed_unverified"
      ? LEGACY_NEUTRAL_BUSINESS_PLACEHOLDER_URL
      : receiptVerifiedUrl;
    return {
      ...record,
      imageUrl,
      photos,
      imageEligibility,
    } as ReceiptSafeBusinessImage<T>;
  });
}

export function classifyImageAuditReasons(input: Readonly<{
  imageUrl: string;
  usageCount: number;
  hasApprovedReceipt: boolean;
  receiptSourceMatchesCurrentOfficialIdentity?: boolean;
}>): string[] {
  const reasons: string[] = [];
  const url = input.imageUrl.toLowerCase();
  if (!input.hasApprovedReceipt) reasons.push("no_approved_source_receipt");
  if (input.usageCount > 1) reasons.push("duplicated_across_businesses");
  if (/unsplash|pexels|pixabay|shutterstock|istock|placeholder|placehold|picsum|stock/.test(url)) {
    reasons.push("stock_or_generic_host");
  }
  if (input.receiptSourceMatchesCurrentOfficialIdentity === false) {
    reasons.push("official_source_identity_mismatch");
  }
  return reasons;
}
