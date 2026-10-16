import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { pool as defaultPool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import { kinfolkCurrentSqlPredicate } from "./mwmCoreDiscoveryPolicy";
import {
  adminProfileUpdateSqlBinding,
  validateAdminBusinessProfilePatch,
  type ValidatedAdminProfilePatch,
} from "./adminBusinessProfilePolicy";
import {
  ownershipDesignationsForValidatedPresence,
  parseValidatedPresenceBatchRows,
  presencePatchFromValidatedRow,
  validatedPresenceApplyConfirmation,
  validatedPresenceBatchFingerprint,
  validatedPresenceOwnershipReceiptNote,
  type ValidatedPresenceBatchRow,
  type PresencePatch,
} from "./validatedPresenceBatch";

const KINFOLK_CATALOG_COHORT_KEY = "kinfolk_catalog";
const VALIDATED_PRESENCE_BATCH_VERSION = "validated-presence-batch-v1";

type QueryResult<T = Record<string, unknown>> = { rows: T[]; rowCount?: number | null };
type QueryClient = { query<T = Record<string, unknown>>(statement: string, values?: readonly unknown[]): Promise<QueryResult<T>> };
type BatchDatabase = QueryClient & { connect(): Promise<QueryClient & { release(): void }> };
type ListingAuditState = {
  listingStatus: string | null;
  status: string;
  promotionEligible: boolean;
  featured: boolean;
  promotedUntil: string | null;
};

type MatchedBusinessRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  pinterest: string | null;
  description: string | null;
  address: string | null;
  hours: string | null;
  price_range: string | null;
  category: string | null;
  subcategory: string | null;
  tags: unknown;
  vibes: unknown;
  ownership_designations: unknown;
  listing_status: string | null;
  status: string | null;
  promotion_eligible: boolean | null;
  featured: boolean | null;
  promoted_until: string | null;
  is_duplicate: boolean;
  permanently_hidden: boolean;
  permanently_closed: boolean;
  catalog_state: string | null;
  is_kinfolk_current: boolean;
  in_delete_queue: boolean;
  in_delete_review: boolean;
  archive_before_state: ListingAuditState | null;
};

type PreparedCandidate = {
  input: ValidatedPresenceBatchRow;
  status: "ready" | "skipped";
  reason: string;
  businessId: string | null;
  listingStatus: string | null;
  currentCatalogState: string | null;
  proposedFields: string[];
  restorePublicListing: boolean;
  excludeFromKinfolkCurrent: boolean;
  snapshotFingerprint: string | null;
  matchedBusiness?: MatchedBusinessRow;
  validatedPatch?: ValidatedAdminProfilePatch;
};

type PublicCandidate = Omit<PreparedCandidate, "matchedBusiness" | "validatedPatch">;

function normalizeIdentityPart(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");
}

function normalizedText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizedUrl(value: unknown): string {
  const text = normalizedText(value);
  if (!text) return "";
  try {
    const url = new URL(text);
    url.hash = "";
    url.hostname = url.hostname.toLocaleLowerCase();
    if (url.pathname === "/") url.pathname = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return text.toLocaleLowerCase().replace(/\/$/, "");
  }
}

function valuesEquivalent(field: keyof PresencePatch, current: unknown, proposed: string): boolean {
  if (field === "phone") return normalizedText(current).replace(/\D/g, "") === normalizedText(proposed).replace(/\D/g, "");
  return normalizedUrl(current) === normalizedUrl(proposed);
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function existingSnapshot(row: MatchedBusinessRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    phone: row.phone,
    website: row.website,
    instagram: row.instagram,
    tiktok: row.tiktok,
    facebook: row.facebook,
    twitter: row.twitter,
    youtube: row.youtube,
    pinterest: row.pinterest,
    ownershipDesignations: textArray(row.ownership_designations),
    listingStatus: row.listing_status,
    status: row.status,
    promotionEligible: Boolean(row.promotion_eligible),
    featured: Boolean(row.featured),
    promotedUntil: row.promoted_until,
    permanentlyHidden: Boolean(row.permanently_hidden),
    permanentlyClosed: Boolean(row.permanently_closed),
    catalogState: row.catalog_state,
    isKinfolkCurrent: Boolean(row.is_kinfolk_current),
    inDeleteQueue: Boolean(row.in_delete_queue),
    inDeleteReview: Boolean(row.in_delete_review),
    archiveBeforeState: row.archive_before_state,
  };
}

function restoreState(row: MatchedBusinessRow): ListingAuditState {
  const prior = row.archive_before_state;
  const eligibleListingStatus = prior?.listingStatus === "live_claimed" || prior?.listingStatus === "live_unclaimed"
    ? prior.listingStatus
    : "live_unclaimed";
  return {
    listingStatus: eligibleListingStatus,
    status: prior?.status === "active" ? "active" : "active",
    promotionEligible: typeof prior?.promotionEligible === "boolean" ? prior.promotionEligible : false,
    featured: typeof prior?.featured === "boolean" ? prior.featured : false,
    promotedUntil: typeof prior?.promotedUntil === "string" ? prior.promotedUntil : null,
  };
}

function sourceReceiptForPresence(field: keyof PresencePatch, value: string, row: ValidatedPresenceBatchRow, observedAt: string) {
  const socialNames: Partial<Record<keyof PresencePatch, string>> = {
    instagram: "Instagram profile",
    tiktok: "TikTok profile",
    facebook: "Facebook profile",
    twitter: "X/Twitter profile",
    youtube: "YouTube profile",
    pinterest: "Pinterest profile",
  };
  const identitySignal = field === "website" ? "official_domain" : field === "phone" ? "full_phone" : "official_social_profile";
  return {
    field,
    sourceUrl: field === "phone" ? row.sourceUrl : value,
    sourceLabel: field === "website" ? "Validated official website" : socialNames[field] ?? row.authorizedOwnershipSourceName,
    observedAt,
    confidence: "high" as const,
    note: field === "phone"
      ? `${row.validationRoute} ${row.businessNameEvidence} ${row.locationEvidence}`.slice(0, 1000)
      : `${row.validationRoute} ${row.businessNameEvidence} ${row.locationEvidence}`.slice(0, 1000),
    identityMatch: true,
    identityMatchSignal: identitySignal,
  };
}

async function selectMatches(
  database: QueryClient,
  row: ValidatedPresenceBatchRow,
  lockBusinessRows = false,
): Promise<MatchedBusinessRow[]> {
  const result = await database.query<MatchedBusinessRow>(
    `SELECT b.id, b.name, b.city, b.state, b.phone, b.website,
            b.instagram, b.tiktok, b.facebook, b.twitter, b.youtube, b.pinterest,
            b.description, b.address, b.hours, b.price_range, b.category, b.subcategory,
            COALESCE(b.tags, '[]'::jsonb) AS tags,
            COALESCE(b.vibes, '[]'::jsonb) AS vibes,
            COALESCE(b.ownership_designations, '[]'::jsonb) AS ownership_designations,
            b.listing_status, b.status, b.promotion_eligible, b.featured, b.promoted_until,
            COALESCE(b.is_duplicate, false) AS is_duplicate,
            COALESCE(b.permanently_hidden, false) AS permanently_hidden,
            COALESCE(b.enrichment_note, '') ILIKE '%permanently closed%' AS permanently_closed,
            catalog_membership.state AS catalog_state,
            ${kinfolkCurrentSqlPredicate("b.id")} AS is_kinfolk_current,
            EXISTS (
              SELECT 1 FROM business_delete_queue_entries delete_queue
               WHERE delete_queue.business_id::text = b.id::text
                 AND delete_queue.removed_at IS NULL
                 AND delete_queue.permanent_deleted_at IS NULL
            ) AS in_delete_queue,
            EXISTS (
              SELECT 1 FROM kinfolk_current_online_presence_reviews review
               WHERE review.business_id::text = b.id::text AND review.state = 'queued'
            ) AS in_delete_review,
            (
              SELECT audit.before_state
                FROM business_listing_status_audit_events audit
               WHERE audit.business_id::text = b.id::text
                 AND audit.action = 'remove_public_discovery'
               ORDER BY audit.created_at DESC
               LIMIT 1
            ) AS archive_before_state
       FROM businesses b
       LEFT JOIN business_catalog_cohort_memberships catalog_membership
         ON catalog_membership.business_id::text = b.id::text
        AND catalog_membership.cohort_key = $4
      WHERE regexp_replace(lower(COALESCE(b.name, '')), '[^a-z0-9]', '', 'g') = $1
        AND regexp_replace(lower(COALESCE(b.city, '')), '[^a-z0-9]', '', 'g') = $2
        AND upper(BTRIM(COALESCE(b.state, ''))) = $3
      ORDER BY b.id ASC${lockBusinessRows ? " FOR UPDATE OF b" : ""}`,
    [normalizeIdentityPart(row.businessName), normalizeIdentityPart(row.city), row.state.toUpperCase(), KINFOLK_CATALOG_COHORT_KEY],
  );
  return result.rows;
}

function prepareCandidate(
  input: ValidatedPresenceBatchRow,
  matches: MatchedBusinessRow[],
  observedAt: string,
): PreparedCandidate {
  const base: Omit<PreparedCandidate, "status" | "reason"> = {
    input,
    businessId: null,
    listingStatus: null,
    currentCatalogState: null,
    proposedFields: [],
    restorePublicListing: false,
    excludeFromKinfolkCurrent: false,
    snapshotFingerprint: null,
  };
  if (matches.length === 0) return { ...base, status: "skipped", reason: "No exact retained business match exists for this name, city, and state." };
  if (matches.length > 1) return { ...base, status: "skipped", reason: "More than one retained business shares this exact name, city, and state; manual reconciliation is required." };

  const business = matches[0];
  const snapshotFingerprint = validatedPresenceBatchFingerprint(existingSnapshot(business));
  const candidateBase = {
    ...base,
    businessId: business.id,
    listingStatus: business.listing_status,
    currentCatalogState: business.catalog_state,
    snapshotFingerprint,
    matchedBusiness: business,
  };
  if (business.is_duplicate) return { ...candidateBase, status: "skipped", reason: "Confirmed duplicate records cannot be changed through this batch." };
  if (business.permanently_hidden || business.permanently_closed) return { ...candidateBase, status: "skipped", reason: "A permanently retained or permanently closed record cannot be republished through this batch." };
  if (business.in_delete_queue) return { ...candidateBase, status: "skipped", reason: "This record is in the active Delete Queue and must remain isolated." };
  if (business.in_delete_review) return { ...candidateBase, status: "skipped", reason: "This record is in Kinfolk Current Delete Review and must use that dedicated control." };
  const lifecycleStatus = normalizedText(business.status).toLocaleLowerCase();
  if (["duplicate", "permanently_hidden", "removed", "deleted", "closed", "permanently_closed"].includes(lifecycleStatus)) {
    return { ...candidateBase, status: "skipped", reason: "A terminal lifecycle status cannot be restored through this batch; review it individually first." };
  }
  if (!["archived", "live_unclaimed", "live_claimed"].includes(business.listing_status ?? "")) {
    return { ...candidateBase, status: "skipped", reason: "Only an Archive-vault record or already-public listing can enter this review-first batch." };
  }
  if (business.listing_status === "archived" && lifecycleStatus !== "suspended") {
    return { ...candidateBase, status: "skipped", reason: "Only the standard archived and suspended lifecycle can be restored by this batch; review this legacy state individually first." };
  }
  if (business.listing_status !== "archived" && business.status !== "active") {
    return { ...candidateBase, status: "skipped", reason: "A nonpublic lifecycle state may not be changed by this batch; review it individually first." };
  }

  const proposedPresence = presencePatchFromValidatedRow(input);
  const profilePatch: Record<string, string | string[]> = {};
  for (const [field, proposedValue] of Object.entries(proposedPresence) as Array<[keyof PresencePatch, string]>) {
    const currentValue = business[field] ?? null;
    if (!normalizedText(currentValue)) {
      profilePatch[field] = proposedValue;
      continue;
    }
    if (!valuesEquivalent(field, currentValue, proposedValue)) {
      return { ...candidateBase, status: "skipped", reason: `HOLD_IDENTITY_OR_CONTACT_CONFLICT: ${field} already has a materially different value.` };
    }
  }

  const existingOwnership = textArray(business.ownership_designations);
  const canonicalExisting = new Set(existingOwnership.map((value) => value.trim().toLocaleLowerCase()));
  const ownershipAdditions = ownershipDesignationsForValidatedPresence(input.authorizedOwnershipStatus)
    .filter((designation) => !canonicalExisting.has(designation.toLocaleLowerCase()));
  if (ownershipAdditions.length > 0) profilePatch.ownershipDesignations = [...existingOwnership, ...ownershipAdditions];

  let validatedPatch: ValidatedAdminProfilePatch | undefined;
  if (Object.keys(profilePatch).length > 0) {
    const sourceReceipts = (Object.entries(profilePatch) as Array<[keyof PresencePatch | "ownershipDesignations", string | string[]]>)
      .filter(([field]) => field !== "ownershipDesignations")
      .map(([field, value]) => sourceReceiptForPresence(field as keyof PresencePatch, value as string, input, observedAt));
    try {
      validatedPatch = validateAdminBusinessProfilePatch({
        ...profilePatch,
        ownershipReceipt: ownershipAdditions.length > 0 ? {
          sourceUrl: input.sourceUrl,
          sourceLabel: input.authorizedOwnershipSourceName,
          observedAt,
          note: validatedPresenceOwnershipReceiptNote(input),
        } : undefined,
        sourceReceipts,
        changeNote: `Validated presence batch row ${input.originalRowNumber}: exact identity match, explicit ownership source, and reviewed official presence.`,
      }, {
        name: business.name,
        description: business.description,
        address: business.address,
        city: business.city,
        state: business.state,
        phone: business.phone,
        website: business.website,
        hours: business.hours,
        priceRange: business.price_range,
        instagram: business.instagram,
        tiktok: business.tiktok,
        facebook: business.facebook,
        twitter: business.twitter,
        youtube: business.youtube,
        pinterest: business.pinterest,
        category: business.category,
        subcategory: business.subcategory,
        tags: textArray(business.tags),
        vibes: textArray(business.vibes),
        ownershipDesignations: existingOwnership,
      });
    } catch (error) {
      return { ...candidateBase, status: "skipped", reason: error instanceof Error ? `Validation hold: ${error.message}` : "Validation hold: the proposed source fields are not safe to save." };
    }
  }

  const restorePublicListing = business.listing_status === "archived";
  const excludeFromKinfolkCurrent = business.catalog_state !== "removed";
  const proposedFields = [
    ...(validatedPatch?.changedColumns ?? []),
    ...(restorePublicListing ? ["restore_public_listing"] : []),
    ...(excludeFromKinfolkCurrent ? ["kinfolk_catalog_removed"] : []),
  ];
  if (proposedFields.length === 0) {
    return { ...candidateBase, status: "skipped", reason: "All validated fields already match, the listing is already public, and the record is already excluded from Kinfolk Current." };
  }
  return {
    ...candidateBase,
    status: "ready",
    reason: "Exact match is ready for a separately confirmed, audited apply.",
    proposedFields,
    restorePublicListing,
    excludeFromKinfolkCurrent,
    validatedPatch,
  };
}

async function buildPreview(database: QueryClient, rows: ValidatedPresenceBatchRow[]): Promise<PreparedCandidate[]> {
  const observedAt = new Date().toISOString().slice(0, 10);
  const candidates: PreparedCandidate[] = [];
  for (const row of rows) candidates.push(prepareCandidate(row, await selectMatches(database, row), observedAt));
  return candidates;
}

function publicCandidate(candidate: PreparedCandidate): PublicCandidate {
  const { matchedBusiness: _business, validatedPatch: _patch, ...safe } = candidate;
  return safe;
}

function batchFingerprint(rows: ValidatedPresenceBatchRow[], candidates: PreparedCandidate[]): string {
  return validatedPresenceBatchFingerprint({
    version: VALIDATED_PRESENCE_BATCH_VERSION,
    rows,
    candidates: candidates.map((candidate) => ({
      originalRowNumber: candidate.input.originalRowNumber,
      status: candidate.status,
      reason: candidate.reason,
      businessId: candidate.businessId,
      listingStatus: candidate.listingStatus,
      currentCatalogState: candidate.currentCatalogState,
      proposedFields: candidate.proposedFields,
      restorePublicListing: candidate.restorePublicListing,
      excludeFromKinfolkCurrent: candidate.excludeFromKinfolkCurrent,
      snapshotFingerprint: candidate.snapshotFingerprint,
    })),
  });
}

async function persistProfilePatch(
  client: QueryClient,
  candidate: PreparedCandidate,
  actorUserId: string | null,
): Promise<string[]> {
  const business = candidate.matchedBusiness as MatchedBusinessRow;
  const validated = candidate.validatedPatch;
  if (!validated || validated.changedColumns.length === 0) return [];
  const patch = Object.fromEntries(Object.entries(validated.patch).filter(([column]) => validated.changedColumns.includes(column)));
  const allowedColumns: Record<string, string> = {
    phone: "phone", website: "website", instagram: "instagram", tiktok: "tiktok", facebook: "facebook",
    twitter: "twitter", youtube: "youtube", pinterest: "pinterest", ownership_designations: "ownership_designations",
  };
  if (Object.keys(patch).some((column) => !allowedColumns[column])) throw new Error("Validated presence batch attempted an unsupported profile field");
  const entries = Object.entries(patch).map(([key, value]) => [key, adminProfileUpdateSqlBinding(key, value)] as const);
  const setClauses = entries.map(([key, binding], index) => `${allowedColumns[key]} = $${index + 1}${binding.jsonb ? "::jsonb" : ""}`).join(", ");
  const update = await client.query<MatchedBusinessRow>(
    `UPDATE businesses SET ${setClauses}, updated_at = NOW() WHERE id = $${entries.length + 1}
     RETURNING id, name, city, state, phone, website, instagram, tiktok, facebook, twitter, youtube, pinterest,
       ownership_designations, listing_status, status, promotion_eligible, featured, promoted_until`,
    [...entries.map(([, binding]) => binding.value), business.id],
  );
  const updated = update.rows[0];
  if (!updated) throw new Error("Business disappeared during profile update");
  if (validated.ownershipReceipt) {
    await client.query(
      `INSERT INTO business_admin_ownership_source_receipts
         (id, business_id, ownership_designations, source_url, source_label, observed_at, note, actor_user_id)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6::date, $7, $8)`,
      [
        randomUUID(), business.id, JSON.stringify(updated.ownership_designations ?? []), validated.ownershipReceipt.sourceUrl,
        validated.ownershipReceipt.sourceLabel, validated.ownershipReceipt.observedAt, validated.ownershipReceipt.note, actorUserId,
      ],
    );
  }
  for (const receipt of validated.fieldReceipts) {
    await client.query(
      `INSERT INTO business_profile_field_receipts
         (id, business_id, field_name, source_url, source_label, observed_at, confidence, note, observed_value, actor_user_id)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9::jsonb, $10)`,
      [
        randomUUID(), business.id, receipt.field, receipt.sourceUrl, receipt.sourceLabel, receipt.observedAt, receipt.confidence,
        receipt.note, JSON.stringify(validated.receiptObservedValues[receipt.field]), actorUserId,
      ],
    );
  }
  await client.query(
    `INSERT INTO business_admin_profile_edit_audit_events
       (id, business_id, actor_user_id, change_note, changed_fields, before_state, after_state)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)`,
    [
      randomUUID(), business.id, actorUserId, validated.changeNote, JSON.stringify(validated.changedColumns),
      JSON.stringify(existingSnapshot(business)), JSON.stringify(existingSnapshot({ ...business, ...updated })),
    ],
  );
  return validated.changedColumns;
}

async function restorePublicListing(
  client: QueryClient,
  business: MatchedBusinessRow,
  actorUserId: string | null,
): Promise<boolean> {
  if (business.listing_status !== "archived") return false;
  const beforeState: ListingAuditState = {
    listingStatus: business.listing_status,
    status: business.status ?? "suspended",
    promotionEligible: Boolean(business.promotion_eligible),
    featured: Boolean(business.featured),
    promotedUntil: business.promoted_until,
  };
  const nextState = restoreState(business);
  await client.query(
    `UPDATE businesses
        SET listing_status = $1, status = $2, promotion_eligible = $3, featured = $4, promoted_until = $5, updated_at = NOW()
      WHERE id = $6`,
    [nextState.listingStatus, nextState.status, nextState.promotionEligible, nextState.featured, nextState.promotedUntil, business.id],
  );
  await client.query(
    `INSERT INTO business_listing_status_audit_events
       (id, business_id, action, actor_user_id, reason, before_state, after_state)
     VALUES ($1, $2, 'restore_public_discovery', $3, $4, $5::jsonb, $6::jsonb)`,
    [
      randomUUID(), business.id, actorUserId,
      "Validated presence batch restored an exact archived record to public discovery outside Kinfolk Current.",
      JSON.stringify(beforeState), JSON.stringify(nextState),
    ],
  );
  return true;
}

async function excludeFromKinfolkCurrent(
  client: QueryClient,
  business: MatchedBusinessRow,
  actorUserId: string | null,
): Promise<boolean> {
  if (business.catalog_state === "removed") return false;
  const before = await client.query<{ state: string; reason: string; updated_at: string }>(
    `SELECT state, reason, updated_at
       FROM business_catalog_cohort_memberships
      WHERE business_id = $1 AND cohort_key = $2
      FOR UPDATE`,
    [business.id, KINFOLK_CATALOG_COHORT_KEY],
  );
  const current = before.rows[0] ?? null;
  const reason = "Validated presence batch: retained outside Kinfolk Current for administrator review in Non-Kinfolk Current.";
  const updated = await client.query<{ business_id: string; state: string; reason: string; created_at: string; updated_at: string }>(
    `INSERT INTO business_catalog_cohort_memberships
       (business_id, cohort_key, state, reason, created_by_user_id, updated_by_user_id)
     VALUES ($1, $2, 'removed', $3, $4, $4)
     ON CONFLICT (business_id, cohort_key) DO UPDATE
       SET state = EXCLUDED.state, reason = EXCLUDED.reason, updated_by_user_id = EXCLUDED.updated_by_user_id, updated_at = NOW()
     RETURNING business_id, state, reason, created_at, updated_at`,
    [business.id, KINFOLK_CATALOG_COHORT_KEY, reason, actorUserId],
  );
  await client.query(
    `INSERT INTO business_catalog_cohort_audit_events
       (id, business_id, cohort_key, action, actor_user_id, reason, before_state, after_state)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
    [
      randomUUID(), business.id, KINFOLK_CATALOG_COHORT_KEY, current ? "state_changed" : "added", actorUserId,
      reason, JSON.stringify(current), JSON.stringify(updated.rows[0]),
    ],
  );
  return true;
}

/**
 * Source-only batch controls. Preview has no side effects; apply requires the
 * exact preview fingerprint, a typed confirmation, current row locks, and one
 * all-or-nothing transaction per business. It does not create records, emails,
 * or automatic Kinfolk Current membership.
 */
export function registerValidatedPresenceBatchRoutes(
  router: ReturnType<typeof Router>,
  database: BatchDatabase = defaultPool as BatchDatabase,
): void {
  router.post("/admin/businesses/validated-presence-batch/preview", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status(403).json({ error: "Admin required" });
    let rows: ValidatedPresenceBatchRow[];
    try {
      rows = parseValidatedPresenceBatchRows(req.body);
    } catch (error) {
      return void res.status(400).json({ error: error instanceof Error ? error.message : "Invalid validated presence batch" });
    }
    try {
      const candidates = await buildPreview(database, rows);
      const fingerprint = batchFingerprint(rows, candidates);
      return void res.json({
        ok: true,
        rowCount: rows.length,
        readyCount: candidates.filter((candidate) => candidate.status === "ready").length,
        skippedCount: candidates.filter((candidate) => candidate.status === "skipped").length,
        batchFingerprint: fingerprint,
        confirmation: validatedPresenceApplyConfirmation(rows.length),
        candidates: candidates.map(publicCandidate),
      });
    } catch (error) {
      req.log.error({ error }, "Failed to preview validated presence batch");
      return void res.status(500).json({ error: "Could not preview the validated presence batch" });
    }
  });

  router.post("/admin/businesses/validated-presence-batch/apply", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status(403).json({ error: "Admin required" });
    let rows: ValidatedPresenceBatchRow[];
    try {
      rows = parseValidatedPresenceBatchRows(req.body);
    } catch (error) {
      return void res.status(400).json({ error: error instanceof Error ? error.message : "Invalid validated presence batch" });
    }
    const confirmation = String(req.body?.confirmation ?? "").trim();
    const expectedConfirmation = validatedPresenceApplyConfirmation(rows.length);
    if (confirmation !== expectedConfirmation) {
      return void res.status(400).json({ error: `Type exactly: ${expectedConfirmation}` });
    }

    let preflight: PreparedCandidate[];
    let currentFingerprint: string;
    try {
      preflight = await buildPreview(database, rows);
      currentFingerprint = batchFingerprint(rows, preflight);
    } catch (error) {
      req.log.error({ error }, "Failed to recheck validated presence batch before apply");
      return void res.status(500).json({ error: "Could not recheck the validated presence batch" });
    }
    if (String(req.body?.batchFingerprint ?? "") !== currentFingerprint) {
      return void res.status(409).json({ error: "The batch changed after preview. Preview it again before applying." });
    }

    const results: Array<{ originalRowNumber: number; businessId: string | null; status: "applied" | "skipped"; reason: string; changedFields?: string[] }> = [];
    for (const preview of preflight) {
      if (preview.status !== "ready") {
        results.push({ originalRowNumber: preview.input.originalRowNumber, businessId: preview.businessId, status: "skipped", reason: preview.reason });
        continue;
      }
      const client = await database.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
        const observedAt = new Date().toISOString().slice(0, 10);
        const locked = prepareCandidate(preview.input, await selectMatches(client, preview.input, true), observedAt);
        if (locked.status !== "ready" || locked.snapshotFingerprint !== preview.snapshotFingerprint) {
          await client.query("ROLLBACK");
          results.push({
            originalRowNumber: preview.input.originalRowNumber,
            businessId: locked.businessId,
            status: "skipped",
            reason: locked.status === "ready" ? "The current business snapshot changed after preview; no fields were written." : locked.reason,
          });
          continue;
        }
        const business = locked.matchedBusiness as MatchedBusinessRow;
        const changedFields = await persistProfilePatch(client, locked, req.user?.id ?? null);
        if (await restorePublicListing(client, business, req.user?.id ?? null)) changedFields.push("restore_public_listing");
        if (await excludeFromKinfolkCurrent(client, business, req.user?.id ?? null)) changedFields.push("kinfolk_catalog_removed");
        await client.query("COMMIT");
        results.push({
          originalRowNumber: preview.input.originalRowNumber,
          businessId: business.id,
          status: "applied",
          reason: "Validated presence, ownership receipt, public lifecycle, and Non-Kinfolk Current exclusion were saved with audit records.",
          changedFields,
        });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        req.log.error({ error, originalRowNumber: preview.input.originalRowNumber }, "Validated presence batch candidate failed");
        results.push({ originalRowNumber: preview.input.originalRowNumber, businessId: preview.businessId, status: "skipped", reason: "Database validation failed; this record was not changed." });
      } finally {
        client.release();
      }
    }
    const appliedCount = results.filter((result) => result.status === "applied").length;
    return void res.json({
      ok: true,
      rowCount: rows.length,
      appliedCount,
      skippedCount: results.length - appliedCount,
      results,
    });
  });
}
