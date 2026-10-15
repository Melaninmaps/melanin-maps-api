import { createHash, randomUUID } from "crypto";

export const KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION =
  "kinfolk_current_online_presence_apply_v1";
export const KINFOLK_CURRENT_DELETE_REVIEW_LISTING_STATUS = "staged";
export const KINFOLK_CURRENT_DELETE_REVIEW_REASON =
  "Kinfolk Current online-presence verification found no active official website or social profile";
export const KINFOLK_CURRENT_DELETE_REVIEW_DELETION_HOLD_REASON =
  "Kinfolk Current Delete Review automatic permanent deletion held for seven days";

export type SqlClient = {
  query: (statement: string, values?: readonly unknown[]) => Promise<unknown>;
};

export type ActiveOfficialSocial = Readonly<{
  platform: "instagram" | "tiktok" | "facebook" | "twitter" | "youtube" | "pinterest";
  url: string;
}>;

export type WebsiteRemovalManifestItem = Readonly<{
  businessId: string;
  businessName: string;
  city: string;
  state: string;
  originalWebsite: string;
  verifiedOfficialSocial: readonly ActiveOfficialSocial[];
  verification: Record<string, unknown>;
  currentSnapshotHash: string;
}>;

export type DeleteReviewManifestItem = Readonly<{
  businessId: string;
  businessName: string;
  city: string;
  state: string;
  currentSnapshotHash: string;
  originalLinks: Readonly<{
    website: string | null;
    social: Readonly<Record<string, string>>;
  }>;
  websiteVerification: Record<string, unknown>;
  socialVerification: Readonly<Record<string, Record<string, unknown>>>;
  originalSnapshot: Record<string, unknown>;
}>;

export type KinfolkCurrentOnlinePresenceManifest = Readonly<{
  kind: typeof KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION;
  manifestFingerprint: string;
  generatedAt: string;
  source: Readonly<{
    verifierVersion: string;
    inputSha256: string;
    completedAt: string;
  }>;
  websiteRemovals: readonly WebsiteRemovalManifestItem[];
  deleteReviews: readonly DeleteReviewManifestItem[];
}>;

const SOCIAL_PLATFORMS = new Set<ActiveOfficialSocial["platform"]>([
  "instagram",
  "tiktok",
  "facebook",
  "twitter",
  "youtube",
  "pinterest",
]);

const MAX_MANIFEST_ITEMS = 1_000;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${stableJson(record[key])}`,
  ).join(",")}}`;
}

export function kinfolkCurrentOnlinePresenceManifestFingerprint(
  input: unknown,
): string {
  return createHash("sha256").update(stableJson(input)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function asArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value;
}

function verifyConfirmedInactiveWebsite(
  evidence: Record<string, unknown>,
  label: string,
): Record<string, unknown> {
  if (evidence.classification !== "REMOVE_CONFIRMED_INACTIVE") {
    throw new Error(`${label} must contain a confirmed inactive website result.`);
  }
  return evidence;
}

function verifyNoQualifyingOfficialWebsite(
  evidence: Record<string, unknown>,
  label: string,
): Record<string, unknown> {
  const classification = evidence.classification;
  if (
    classification !== "REMOVE_CONFIRMED_INACTIVE" &&
    classification !== "MISSING" &&
    classification !== "UNVERIFIED_OR_IDENTITY_UNCLEAR"
  ) {
    throw new Error(
      `${label} must document a confirmed inactive, missing, or identity-unverified website.`,
    );
  }
  return evidence;
}

function verifyNoQualifyingOfficialSocial(
  evidence: Record<string, unknown>,
  label: string,
): Record<string, unknown> {
  const classification = evidence.classification;
  if (
    classification !== "INACTIVE_OR_REMOVED" &&
    classification !== "UNVERIFIED_OR_IDENTITY_UNCLEAR"
  ) {
    throw new Error(
      `${label} must document an inactive or identity-unverified official social URL.`,
    );
  }
  return evidence;
}

function parseActiveSocial(value: unknown, label: string): ActiveOfficialSocial {
  const social = asRecord(value, label);
  const platform = requiredString(social.platform, `${label}.platform`);
  if (!SOCIAL_PLATFORMS.has(platform as ActiveOfficialSocial["platform"])) {
    throw new Error(`${label}.platform is not supported.`);
  }
  return {
    platform: platform as ActiveOfficialSocial["platform"],
    url: requiredString(social.url, `${label}.url`),
  };
}

function parseWebsiteRemoval(value: unknown, index: number): WebsiteRemovalManifestItem {
  const item = asRecord(value, `websiteRemovals[${index}]`);
  const social = asArray(item.verifiedOfficialSocial, `websiteRemovals[${index}].verifiedOfficialSocial`)
    .map((entry, socialIndex) =>
      parseActiveSocial(entry, `websiteRemovals[${index}].verifiedOfficialSocial[${socialIndex}]`),
    );
  if (social.length === 0) {
    throw new Error(`websiteRemovals[${index}] must preserve at least one verified official social URL.`);
  }
  return {
    businessId: requiredString(item.businessId, `websiteRemovals[${index}].businessId`),
    businessName: requiredString(item.businessName, `websiteRemovals[${index}].businessName`),
    city: requiredString(item.city, `websiteRemovals[${index}].city`),
    state: requiredString(item.state, `websiteRemovals[${index}].state`),
    originalWebsite: requiredString(item.originalWebsite, `websiteRemovals[${index}].originalWebsite`),
    verifiedOfficialSocial: social,
    verification: verifyConfirmedInactiveWebsite(
      asRecord(item.verification, `websiteRemovals[${index}].verification`),
      `websiteRemovals[${index}].verification`,
    ),
    currentSnapshotHash: requiredString(item.currentSnapshotHash, `websiteRemovals[${index}].currentSnapshotHash`),
  };
}

function parseDeleteReview(value: unknown, index: number): DeleteReviewManifestItem {
  const item = asRecord(value, `deleteReviews[${index}]`);
  const originalLinks = asRecord(item.originalLinks, `deleteReviews[${index}].originalLinks`);
  const social = asRecord(originalLinks.social ?? {}, `deleteReviews[${index}].originalLinks.social`);
  const socialVerification = asRecord(
    item.socialVerification ?? {},
    `deleteReviews[${index}].socialVerification`,
  );
  const originalWebsite = typeof originalLinks.website === "string"
    ? originalLinks.website.trim()
    : "";
  const websiteVerification = asRecord(
    item.websiteVerification,
    `deleteReviews[${index}].websiteVerification`,
  );
  if (originalWebsite) {
    verifyNoQualifyingOfficialWebsite(
      websiteVerification,
      `deleteReviews[${index}].websiteVerification`,
    );
  } else if (websiteVerification.classification !== "MISSING") {
    throw new Error(
      `deleteReviews[${index}] must either retain an inactive website receipt or explicitly document that no website is stored.`,
    );
  }
  const parsedSocialVerification: Record<string, Record<string, unknown>> = {};
  for (const [platform, url] of Object.entries(social)) {
    requiredString(url, `deleteReviews[${index}].originalLinks.social.${platform}`);
    const verification = asRecord(
      socialVerification[platform],
      `deleteReviews[${index}].socialVerification.${platform}`,
    );
    parsedSocialVerification[platform] = verifyNoQualifyingOfficialSocial(
      verification,
      `deleteReviews[${index}].socialVerification.${platform}`,
    );
  }
  return {
    businessId: requiredString(item.businessId, `deleteReviews[${index}].businessId`),
    businessName: requiredString(item.businessName, `deleteReviews[${index}].businessName`),
    city: requiredString(item.city, `deleteReviews[${index}].city`),
    state: requiredString(item.state, `deleteReviews[${index}].state`),
    currentSnapshotHash: requiredString(
      item.currentSnapshotHash,
      `deleteReviews[${index}].currentSnapshotHash`,
    ),
    originalLinks: {
      website: originalWebsite || null,
      social: Object.fromEntries(
        Object.entries(social).map(([platform, url]) => [
          platform,
          requiredString(url, `deleteReviews[${index}].originalLinks.social.${platform}`),
        ]),
      ),
    },
    websiteVerification,
    socialVerification: parsedSocialVerification,
    originalSnapshot: asRecord(item.originalSnapshot ?? {}, `deleteReviews[${index}].originalSnapshot`),
  };
}

/**
 * Parses a narrow, evidence-bearing admin plan. The server never accepts a
 * browser-selected ID list as proof that a public listing is inactive.
 */
export function parseKinfolkCurrentOnlinePresenceManifest(
  value: unknown,
): KinfolkCurrentOnlinePresenceManifest {
  const manifest = asRecord(value, "manifest");
  if (manifest.kind !== KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION) {
    throw new Error("This is not a supported Kinfolk Current online-presence manifest.");
  }
  const websiteRemovals = asArray(manifest.websiteRemovals, "manifest.websiteRemovals")
    .map(parseWebsiteRemoval);
  const deleteReviews = asArray(manifest.deleteReviews, "manifest.deleteReviews")
    .map(parseDeleteReview);
  if (websiteRemovals.length + deleteReviews.length === 0) {
    throw new Error("The manifest does not contain any proposed actions.");
  }
  if (websiteRemovals.length + deleteReviews.length > MAX_MANIFEST_ITEMS) {
    throw new Error(`The manifest exceeds the ${MAX_MANIFEST_ITEMS}-record safety limit.`);
  }
  const allIds = [...websiteRemovals, ...deleteReviews].map((item) => item.businessId);
  if (new Set(allIds).size !== allIds.length) {
    throw new Error("A business may appear in only one online-presence action in a manifest.");
  }
  const source = asRecord(manifest.source, "manifest.source");
  const parsed = {
    kind: KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION as typeof KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION,
    generatedAt: requiredString(manifest.generatedAt, "manifest.generatedAt"),
    source: {
      verifierVersion: requiredString(source.verifierVersion, "manifest.source.verifierVersion"),
      inputSha256: requiredString(source.inputSha256, "manifest.source.inputSha256"),
      completedAt: requiredString(source.completedAt, "manifest.source.completedAt"),
    },
    websiteRemovals,
    deleteReviews,
  };
  const manifestFingerprint = requiredString(manifest.manifestFingerprint, "manifest.manifestFingerprint");
  if (manifestFingerprint !== kinfolkCurrentOnlinePresenceManifestFingerprint(parsed)) {
    throw new Error("The online-presence manifest integrity fingerprint is invalid.");
  }
  return { ...parsed, manifestFingerprint };
}

export async function ensureKinfolkCurrentOnlinePresenceReviewSchema(
  client: SqlClient,
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS kinfolk_current_online_presence_reviews (
      business_id TEXT PRIMARY KEY,
      state TEXT NOT NULL CHECK (state IN ('queued', 'restored')),
      original_listing_state JSONB NOT NULL,
      verification_evidence JSONB NOT NULL,
      source_manifest JSONB NOT NULL,
      queued_by TEXT,
      queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      restored_by TEXT,
      restored_at TIMESTAMPTZ
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS kinfolk_current_online_presence_reviews_state_queued_idx
      ON kinfolk_current_online_presence_reviews(state, queued_at DESC)
  `);
  await client.query(`
    CREATE OR REPLACE FUNCTION public.prevent_queued_kinfolk_current_review_deletion()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF EXISTS (
        SELECT 1
          FROM kinfolk_current_online_presence_reviews review
         WHERE review.business_id::text = OLD.id::text
           AND review.state = 'queued'
      ) THEN
        RAISE EXCEPTION 'Business % is in Kinfolk Current Delete Review and cannot be permanently deleted', OLD.id;
      END IF;
      RETURN OLD;
    END;
    $$;
    DROP TRIGGER IF EXISTS businesses_prevent_queued_kinfolk_current_review_deletion
      ON businesses;
    CREATE TRIGGER businesses_prevent_queued_kinfolk_current_review_deletion
      BEFORE DELETE ON businesses
      FOR EACH ROW EXECUTE FUNCTION public.prevent_queued_kinfolk_current_review_deletion();

    CREATE OR REPLACE FUNCTION public.prevent_queued_kinfolk_current_review_lifecycle_mutation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF (
        OLD.listing_status IS DISTINCT FROM NEW.listing_status
        OR OLD.status IS DISTINCT FROM NEW.status
        OR OLD.promotion_eligible IS DISTINCT FROM NEW.promotion_eligible
        OR OLD.featured IS DISTINCT FROM NEW.featured
        OR OLD.promoted_until IS DISTINCT FROM NEW.promoted_until
      )
      AND EXISTS (
        SELECT 1
          FROM kinfolk_current_online_presence_reviews review
         WHERE review.business_id::text = OLD.id::text
           AND review.state = 'queued'
      )
      AND COALESCE(current_setting('app.kinfolk_current_review_lifecycle_transition', true), '')
        NOT IN ('apply', 'restore') THEN
        RAISE EXCEPTION 'Business % is in Kinfolk Current Delete Review and its lifecycle can only change through the dedicated review flow', OLD.id;
      END IF;
      RETURN NEW;
    END;
    $$;
    DROP TRIGGER IF EXISTS businesses_prevent_queued_kinfolk_current_review_lifecycle_mutation
      ON businesses;
    CREATE TRIGGER businesses_prevent_queued_kinfolk_current_review_lifecycle_mutation
      BEFORE UPDATE OF listing_status, status, promotion_eligible, featured, promoted_until ON businesses
      FOR EACH ROW EXECUTE FUNCTION public.prevent_queued_kinfolk_current_review_lifecycle_mutation();
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS kinfolk_current_online_presence_review_events (
      id UUID PRIMARY KEY,
      business_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('queued', 'restored')),
      actor_user_id TEXT,
      details JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS kinfolk_current_online_presence_review_events_business_created_idx
      ON kinfolk_current_online_presence_review_events(business_id, created_at DESC)
  `);
  await client.query(`
    CREATE OR REPLACE FUNCTION public.prevent_kinfolk_current_online_presence_review_event_mutation()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'kinfolk_current_online_presence_review_events are immutable';
    END;
    $$;
    DROP TRIGGER IF EXISTS kinfolk_current_online_presence_review_events_immutable
      ON kinfolk_current_online_presence_review_events;
    CREATE TRIGGER kinfolk_current_online_presence_review_events_immutable
      BEFORE UPDATE OR DELETE ON kinfolk_current_online_presence_review_events
      FOR EACH ROW EXECUTE FUNCTION public.prevent_kinfolk_current_online_presence_review_event_mutation();
  `);
}

export async function recordKinfolkCurrentOnlinePresenceReviewEvent(
  client: SqlClient,
  input: Readonly<{
    businessId: string;
    action: "queued" | "restored";
    actorUserId: string | null;
    details: Record<string, unknown>;
  }>,
): Promise<void> {
  await client.query(
    `INSERT INTO kinfolk_current_online_presence_review_events
       (id, business_id, action, actor_user_id, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      randomUUID(),
      input.businessId,
      input.action,
      input.actorUserId,
      JSON.stringify(input.details),
    ],
  );
}
