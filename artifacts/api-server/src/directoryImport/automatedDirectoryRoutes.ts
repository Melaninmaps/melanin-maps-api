import type { Express, Request, Response } from "express";
import type { Pool } from "pg";
import { isAdmin } from "../lib/adminAuth";
import { authorizeDirectoryOperator } from "./directoryServiceAuth";
import {
  verifyDirectoryIngress, verifyDirectoryManifest, validateDirectorySourceRows, canonicalDirectoryPayload,
} from "./reviewPipeline";
import { classifyAutomatedReviewBatch } from "./automatedReviewPolicy";
import {
  isMwmCorePublicationEnabled,
  validateMwmCorePublicationBatch,
} from "./mwmCorePublicationPolicy";
import { createHash } from "node:crypto";
import {
  COMPLETED_COHORT_MANIFEST_CHECKSUM,
  COMPLETED_COHORT_RECEIPT_ROOT,
  cohortRowsToCsv,
  reconcileCompletedCohortRow,
  summarizeCohortReconciliation,
  type CohortCandidateForReconciliation,
  type CohortDiscoveryState,
  type CohortPublicationProvenance,
} from "./cohortReconciliation";
import {
  COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY,
  activationReceiptHash,
  buildDirectoryOnlyBusinessProfile,
  isDirectoryOnlyDiscoveryCandidate,
  type CompletedCohortHeldCandidate,
} from "./completedCohortDirectoryDiscovery";
import {
  NATIONAL_MASTER_DIRECTORY_EXPECTED_ROWS,
  NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256,
  NATIONAL_MASTER_DIRECTORY_POLICY,
  NATIONAL_MASTER_DIRECTORY_SOURCE,
  assertNationalMasterDirectoryDataset,
  buildNationalMasterDirectoryProfile,
  nationalMasterActivationReceiptHash,
} from "./nationalMasterDirectory";
import {
  LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
  assertLatinxLehighValleyDirectoryDataset,
} from "./latinxLehighValleyDirectory";

// The signed, immutable 4,183-record source-receipted cohort is a 14.673 MiB
// JSON envelope. Keep this ceiling scoped to its protected service ingress;
// ordinary API JSON requests retain Express's default limit.
export const DIRECTORY_REVIEW_INGRESS_JSON_LIMIT = "20mb" as const;

function operator(req: Request, res: Response) {
  const authorization = authorizeDirectoryOperator(req);
  if (!authorization.ok) {
    res.status(authorization.status).json({ error: authorization.error });
    return null;
  }
  return authorization;
}

function admin(req: Request, res: Response): { id: string } | null {
  if (req.user && isAdmin(req)) return { id: req.user.id };
  res.status(req.user ? 403 : 401).json({
    error: req.user ? "Admin access required." : "Authentication required.",
  });
  return null;
}

/**
 * Startup migrations are intentionally best-effort so an unrelated seed cannot
 * prevent the API from booting. This protected activation cannot make that
 * assumption: create/verify only its additive audit table before a preview or
 * a write, rather than treating a missing startup migration as a cohort error.
 */
async function ensureCompletedCohortDirectoryDiscoveryAudit(
  productionPool: Pool,
): Promise<void> {
  await productionPool.query(`
    CREATE TABLE IF NOT EXISTS completed_cohort_directory_discovery_receipts (
      receipt_root    TEXT NOT NULL,
      manifest_sha256 TEXT NOT NULL,
      source_row      INTEGER NOT NULL,
      source_row_id   TEXT NOT NULL,
      business_id     VARCHAR,
      activation_hash TEXT NOT NULL CHECK (char_length(activation_hash) = 64),
      outcome         TEXT NOT NULL CHECK (outcome IN ('created', 'linked_existing', 'skipped_nonpublic_existing')),
      reason_code     TEXT,
      policy_version  TEXT NOT NULL,
      activated_by    TEXT,
      activated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (receipt_root, source_row),
      UNIQUE (receipt_root, source_row_id)
    )
  `);
  await productionPool.query(`
    CREATE INDEX IF NOT EXISTS completed_cohort_directory_discovery_business_idx
      ON completed_cohort_directory_discovery_receipts (business_id, activated_at DESC)
  `);
}

async function ensureNationalMasterDirectoryAudit(
  productionPool: Pool,
): Promise<void> {
  await productionPool.query(`
    CREATE TABLE IF NOT EXISTS national_master_directory_import_receipts (
      source_sha256 TEXT NOT NULL,
      source_row INTEGER NOT NULL,
      source_row_id TEXT NOT NULL,
      business_id VARCHAR NOT NULL,
      activation_hash TEXT NOT NULL CHECK (char_length(activation_hash) = 64),
      outcome TEXT NOT NULL CHECK (outcome IN ('created', 'existing_same_source_id')),
      policy_version TEXT NOT NULL,
      activated_by TEXT,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (source_sha256, source_row),
      UNIQUE (source_sha256, source_row_id)
    )
  `);
  await productionPool.query(`
    CREATE INDEX IF NOT EXISTS national_master_directory_import_business_idx
      ON national_master_directory_import_receipts (business_id, activated_at DESC)
  `);
}

/**
 * The national directory import keeps the source, intake batch, and Kinfolk
 * rationale with each profile so administrators can make a reversible cleanup
 * decision later. Startup migrations are deliberately best-effort; this
 * protected import must therefore ensure its four additive metadata columns
 * before it begins its all-or-nothing transaction. These statements never
 * alter an existing value or listing state.
 */
async function ensureNationalMasterDirectoryBusinessMetadata(
  productionPool: Pool,
): Promise<void> {
  for (const statement of [
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS research_source_label VARCHAR(255)`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS research_source_url TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS kinfolk_recommendation_reason TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS intake_batch_reference VARCHAR(255)`,
  ]) {
    await productionPool.query(statement);
  }
}

async function ensureLatinxLehighValleyDirectoryAudit(
  productionPool: Pool,
): Promise<void> {
  await ensureNationalMasterDirectoryBusinessMetadata(productionPool);
  await productionPool.query(`
    CREATE TABLE IF NOT EXISTS user_supplied_directory_import_receipts (
      source_key TEXT NOT NULL,
      source_sha256 TEXT NOT NULL,
      profile_id VARCHAR NOT NULL,
      source_row INTEGER NOT NULL,
      business_id VARCHAR NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('created', 'existing_same_source_id')),
      policy_version TEXT NOT NULL,
      activated_by TEXT,
      activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (source_key, source_sha256, profile_id)
    )
  `);
  await productionPool.query(`
    CREATE INDEX IF NOT EXISTS user_supplied_directory_import_business_idx
      ON user_supplied_directory_import_receipts (business_id, activated_at DESC)
  `);
}

export function registerAutomatedDirectoryRoutes(
  app: Express,
  reviewPool: Pool,
  productionPool: Pool = reviewPool,
): void {
  app.get("/api/founder/directory-import/batches", async (req, res) => {
    if (!admin(req, res)) return;
    const result = await reviewPool.query(
      `SELECT b.*, COUNT(c.id)::int AS candidate_count
         FROM directory_import_batches b LEFT JOIN directory_import_candidates c ON c.batch_id=b.id
        GROUP BY b.id ORDER BY b.created_at DESC`);
    res.json({ batches: result.rows });
  });
  app.get("/api/founder/directory-import/summary", async (req, res) => {
    if (!admin(req, res)) return;
    const result = await reviewPool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status='deduplicated')::int AS deduplicated,
        COUNT(*) FILTER (WHERE status='linked_existing')::int AS linked_existing,
        COUNT(*) FILTER (WHERE status='created')::int AS created,
        COUNT(*) FILTER (WHERE status='held' OR status IN ('needs_review','needs_research'))::int AS held,
        COUNT(*) FILTER (WHERE status='failed')::int AS failed,
        COUNT(*) FILTER (WHERE status='published')::int AS verified_live
       FROM directory_import_candidates`);
    res.json({ summary: result.rows });
  });
  app.get("/api/founder/directory-import/exceptions", async (req, res) => {
    if (!admin(req, res)) return;
    const result = await reviewPool.query(
      `SELECT * FROM directory_import_candidates
        WHERE status IN ('needs_research','manual_review') ORDER BY updated_at DESC LIMIT 500`);
    res.json({ exceptions: result.rows });
  });
  app.post("/api/founder/directory-import/batches/:batchId/pause", async (req, res) => {
    if (!admin(req, res)) return;
    await reviewPool.query(`UPDATE directory_import_batches SET status='paused',updated_at=now() WHERE id=$1`, [req.params.batchId]);
    res.json({ status: "paused" });
  });
  app.post("/api/founder/directory-import/batches/:batchId/resume", async (req, res) => {
    if (!admin(req, res)) return;
    await reviewPool.query(`UPDATE directory_import_batches SET status='in_review',updated_at=now() WHERE id=$1`, [req.params.batchId]);
    res.json({ status: "in_review" });
  });
  app.get("/api/founder/directory-import/audit-report", async (req, res) => {
    if (!admin(req, res)) return;
    const result = await reviewPool.query(`SELECT * FROM directory_import_decision_events ORDER BY created_at DESC LIMIT 1000`);
    const counts = await reviewPool.query(`SELECT action,COUNT(*)::int AS count
      FROM directory_import_decision_events GROUP BY action`);
    res.json({ events: result.rows, counts: counts.rows });
  });

  app.get("/api/founder/directory-import/service/summary", async (req, res) => {
    if (!operator(req, res)) return;
    const [batches, candidates, outbox] = await Promise.all([
      reviewPool.query(`SELECT id,source_name,source_sha256,source_row_count,manifest_count,status,created_at,updated_at
        FROM directory_import_batches ORDER BY created_at DESC`),
      reviewPool.query(`SELECT status,COUNT(*)::int AS count FROM directory_import_candidates GROUP BY status ORDER BY status`),
      reviewPool.query(`SELECT status,COUNT(*)::int AS count FROM directory_review_outbox GROUP BY status ORDER BY status`),
    ]);
    res.json({ batches: batches.rows, candidates: candidates.rows, outbox: outbox.rows });
  });

  // The release service needs enough information to decide whether a paused
  // one-worker publication run can safely resume. Keep this aggregate-only:
  // do not expose candidate data, event keys, addresses, or raw database error
  // strings through machine credentials.
  app.get("/api/founder/directory-import/service/publication-diagnostics", async (req, res) => {
    if (!operator(req, res)) return;
    const diagnostics = await reviewPool.query(`
      SELECT
        status,
        CASE
          WHEN last_error LIKE 'geocode_unverified:%' THEN 'geocode_unverified'
          WHEN last_error LIKE 'Physical publication requires address and non-zero coordinates.%'
            THEN 'physical_record_incomplete'
          WHEN last_error LIKE 'Publication payload hash mismatch.%' THEN 'payload_hash_mismatch'
          WHEN last_error LIKE 'Command ID payload hash mismatch.%' THEN 'idempotency_hash_mismatch'
          WHEN last_error IS NULL OR last_error = '' THEN 'none_recorded'
          ELSE 'unclassified'
        END AS error_category,
        COUNT(*)::int AS count,
        MAX(attempts)::int AS max_attempts,
        MIN(created_at) AS oldest_created_at,
        MIN(available_at) AS next_available_at
      FROM directory_review_outbox
      WHERE status IN ('failed', 'sending')
      GROUP BY status, error_category
      ORDER BY status, error_category`);
    res.json({ diagnostics: diagnostics.rows });
  });

  /**
   * Read-only reconciliation for the one already-completed protected cohort.
   * This endpoint intentionally cannot stage, enqueue, publish, retry, or edit
   * any source row. It joins the preserved review receipt, outbox state, and
   * production provenance so an administrator can see why each row is public,
   * a duplicate alias, or still held. The receipt root is fixed in code so a
   * caller cannot use this endpoint as a generic backfill/export mechanism.
   */
  app.get("/api/founder/directory-import/completed-cohort/reconciliation", async (req, res) => {
    if (!admin(req, res)) return;
    const requestedRoot = typeof req.query.receiptRoot === "string"
      ? req.query.receiptRoot.trim().toLowerCase()
      : "";
    if (requestedRoot !== COMPLETED_COHORT_RECEIPT_ROOT) {
      res.status(400).json({
        error: "This read-only reconciliation is restricted to the completed immutable cohort receipt root.",
        code: "COMPLETED_COHORT_RECEIPT_ROOT_REQUIRED",
      });
      return;
    }

    try {
      const batch = await reviewPool.query<{ id: string; source_row_count: number; manifest_count: number }>(
        `SELECT id, source_row_count, manifest_count
           FROM directory_import_batches
          WHERE source_sha256=$1
          LIMIT 1`,
        [COMPLETED_COHORT_MANIFEST_CHECKSUM],
      );
      const batchRow = batch.rows[0];
      if (!batchRow) {
        res.status(404).json({
          error: "The completed cohort review receipt is not available in this environment.",
          code: "COMPLETED_COHORT_RECEIPT_NOT_AVAILABLE",
        });
        return;
      }
      if (
        batchRow.source_row_count !== 4183 ||
        batchRow.manifest_count !== 4183
      ) {
        res.status(409).json({
          error: "The retained cohort receipt count is inconsistent; reconciliation is blocked.",
          code: "COMPLETED_COHORT_RECEIPT_COUNT_MISMATCH",
        });
        return;
      }

      const candidates = await reviewPool.query<CohortCandidateForReconciliation>(
        `SELECT c.source_row AS "sourceRow", c.source_row_id AS "sourceRowId",
                c.dedupe_key AS "dedupeKey", c.target_kind AS "targetKind", c.name, c.city, c.state, c.country,
                c.status, c.raw_record AS "rawRecord",
                o.status AS "outboxStatus", o.last_error AS "outboxError"
           FROM directory_import_candidates c
      LEFT JOIN directory_review_outbox o ON o.candidate_id=c.id
          WHERE c.batch_id=$1
          ORDER BY c.source_row ASC`,
        [batchRow.id],
      );
      if (candidates.rows.length !== 4183) {
        res.status(409).json({
          error: "The retained cohort candidate count is inconsistent; reconciliation is blocked.",
          code: "COMPLETED_COHORT_CANDIDATE_COUNT_MISMATCH",
        });
        return;
      }

      const provenance = await productionPool.query<CohortPublicationProvenance>(
        `SELECT source_row AS "sourceRow", record_id AS "recordId", outcome
           FROM directory_publication_provenance
          WHERE source_sha256=$1
            AND outcome IN ('created', 'linked_existing')`,
        [COMPLETED_COHORT_MANIFEST_CHECKSUM],
      );
      const provenanceByRow = new Map(
        provenance.rows.map((row) => [row.sourceRow, row]),
      );
      // `dedupe_key` is the strict batch identity established at protected
      // ingress. A declined row with that key is a source alias. The CSV links
      // it to its earliest non-declined source row, without creating a second
      // business profile or inferring a cross-batch match.
      const canonicalSourceRowByDedupeKey = new Map<string, number>();
      for (const candidate of candidates.rows) {
        if (!candidate.dedupeKey || candidate.status === "declined") continue;
        if (!canonicalSourceRowByDedupeKey.has(candidate.dedupeKey)) {
          canonicalSourceRowByDedupeKey.set(candidate.dedupeKey, candidate.sourceRow);
        }
      }
      const rows = candidates.rows.map((candidate) =>
        reconcileCompletedCohortRow(
          candidate,
          provenanceByRow.get(candidate.sourceRow),
          candidate.dedupeKey
            ? canonicalSourceRowByDedupeKey.get(candidate.dedupeKey) ?? null
            : null,
          candidate.dedupeKey
            ? provenanceByRow.get(canonicalSourceRowByDedupeKey.get(candidate.dedupeKey) ?? -1)
            : undefined,
        ),
      );
      const summary = summarizeCohortReconciliation(rows);
      const requestedState = typeof req.query.state === "string"
        ? req.query.state.trim().toUpperCase()
        : "";
      const rowsForState = requestedState
        ? rows.filter((row) => String(row.state ?? "").toUpperCase() === requestedState)
        : rows;
      const validDiscoveryStates: readonly CohortDiscoveryState[] = [
        "public_listing",
        "duplicate_source_alias",
        "location_hold",
        "publication_error_hold",
        "review_hold",
      ];
      const requestedDiscoveryStates = typeof req.query.discoveryState === "string"
        ? req.query.discoveryState.split(",").map((value) => value.trim()).filter(Boolean)
        : [];
      if (requestedDiscoveryStates.some(
        (value) => !validDiscoveryStates.includes(value as CohortDiscoveryState),
      )) {
        res.status(400).json({
          error: "An unsupported discoveryState filter was requested.",
          code: "COMPLETED_COHORT_DISCOVERY_STATE_INVALID",
        });
        return;
      }
      const filteredRows = requestedDiscoveryStates.length > 0
        ? rowsForState.filter((row) => requestedDiscoveryStates.includes(row.discoveryState))
        : rowsForState;

      if (req.query.format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=completed-cohort-reconciliation.csv",
        );
        res.send(cohortRowsToCsv(filteredRows));
        return;
      }

      const limitValue = Number(req.query.limit ?? 100);
      const offsetValue = Number(req.query.offset ?? 0);
      const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 500) : 100;
      const offset = Number.isInteger(offsetValue) ? Math.max(offsetValue, 0) : 0;
      res.json({
        readonly: true,
        receiptRoot: COMPLETED_COHORT_RECEIPT_ROOT,
        manifestChecksum: COMPLETED_COHORT_MANIFEST_CHECKSUM,
        sourceRowCount: rows.length,
        summary,
        page: { offset, limit, total: filteredRows.length },
        rows: filteredRows.slice(offset, offset + limit),
      });
    } catch (error) {
      res.status(500).json({
        error: "Completed cohort reconciliation failed.",
        code: "COMPLETED_COHORT_RECONCILIATION_FAILED",
      });
    }
  });

  /**
   * Makes receipt-backed, geocode-held business rows searchable without making
   * a map pin. This route never invokes the historical worker, outbox, or
   * publisher. `dryRun` is the default; `apply: true` is admin-only and
   * idempotently writes only directory-only public profiles/audit receipts.
   */
  app.post("/api/founder/directory-import/completed-cohort/activate-directory-discovery", async (req, res) => {
    const actor = admin(req, res);
    if (!actor) return;
    const requestedRoot = typeof req.body?.receiptRoot === "string"
      ? req.body.receiptRoot.trim().toLowerCase()
      : "";
    if (requestedRoot !== COMPLETED_COHORT_RECEIPT_ROOT) {
      res.status(400).json({
        error: "This activation is restricted to the completed immutable cohort receipt root.",
        code: "COMPLETED_COHORT_RECEIPT_ROOT_REQUIRED",
      });
      return;
    }
    const apply = req.body?.apply === true;

    try {
      await ensureCompletedCohortDirectoryDiscoveryAudit(productionPool);
      const batch = await reviewPool.query<{ id: string; source_row_count: number; manifest_count: number }>(
        `SELECT id, source_row_count, manifest_count
           FROM directory_import_batches
          WHERE source_sha256=$1
          LIMIT 1`,
        [COMPLETED_COHORT_MANIFEST_CHECKSUM],
      );
      const batchRow = batch.rows[0];
      if (!batchRow || batchRow.source_row_count !== 4183 || batchRow.manifest_count !== 4183) {
        res.status(409).json({
          error: "The completed cohort receipt is missing or inconsistent; activation is blocked.",
          code: "COMPLETED_COHORT_RECEIPT_INTEGRITY_REQUIRED",
        });
        return;
      }
      const candidates = await reviewPool.query<CompletedCohortHeldCandidate>(
        `SELECT c.source_row AS "sourceRow", c.source_row_id AS "sourceRowId",
                c.dedupe_key AS "dedupeKey", c.target_kind AS "targetKind", c.name, c.city, c.state, c.country,
                c.status, c.raw_record AS "rawRecord", o.last_error AS "outboxError"
           FROM directory_import_candidates c
      LEFT JOIN directory_review_outbox o ON o.candidate_id=c.id
          WHERE c.batch_id=$1
          ORDER BY c.source_row ASC`,
        [batchRow.id],
      );
      if (candidates.rows.length !== 4183) {
        res.status(409).json({
          error: "The retained cohort candidate count is inconsistent; activation is blocked.",
          code: "COMPLETED_COHORT_CANDIDATE_COUNT_MISMATCH",
        });
        return;
      }
      const eligible = candidates.rows.filter(isDirectoryOnlyDiscoveryCandidate);
      const client = apply ? await productionPool.connect() : null;
      const read = client ?? productionPool;
      const summary = {
        eligible: eligible.length,
        created: 0,
        linkedExistingPublic: 0,
        skippedExistingNonpublic: 0,
        alreadyActivated: 0,
      };
      try {
        if (client) await client.query("BEGIN");
        for (const candidate of eligible) {
          const profile = buildDirectoryOnlyBusinessProfile(candidate);
          const receiptHash = activationReceiptHash(candidate);
          const prior = await read.query<{ business_id: string | null; outcome: string }>(
            `SELECT business_id, outcome
               FROM completed_cohort_directory_discovery_receipts
              WHERE receipt_root=$1 AND source_row=$2
              LIMIT 1${client ? " FOR UPDATE" : ""}`,
            [COMPLETED_COHORT_RECEIPT_ROOT, candidate.sourceRow],
          );
          if (prior.rows[0]) {
            summary.alreadyActivated++;
            continue;
          }
          const existing = await read.query<{
            id: string;
            is_public: boolean;
          }>(
            `SELECT id,
                    (COALESCE(is_duplicate,false)=false
                     AND COALESCE(permanently_hidden,false)=false
                     AND listing_status IN ('live_unclaimed','live_claimed')
                     AND COALESCE(status,'') NOT IN ('duplicate','permanently_hidden','removed','deleted')) AS is_public
               FROM businesses
              WHERE dedupe_key=$1
              LIMIT 1${client ? " FOR UPDATE" : ""}`,
            [profile.dedupeKey],
          );
          const existingRow = existing.rows[0];
          if (!existingRow) {
            if (!apply) {
              summary.created++;
              continue;
            }
            const inserted = await client!.query<{ id: string }>(
              `INSERT INTO businesses
                (id,name,category,subcategory,address,city,state,country,is_online_only,
                 listing_status,owner_claim_status,verified,ownership_designations,verified_designations,
                 ownership_claim,black_owned,description,latitude,longitude,website,source_url,
                 dedupe_key,status,profile_status,data_source,is_duplicate,permanently_hidden)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,
                      'live_unclaimed','unclaimed',false,$10::jsonb,'[]'::jsonb,
                      $11,$12,$13,NULL,NULL,$14,$15,
                      $16,'active','community_listed','completed_cohort_directory_discovery',false,false)
               RETURNING id`,
              [profile.id, profile.name, profile.category, profile.subcategory, profile.address,
                profile.city, profile.state, profile.country, profile.isOnlineOnly,
                JSON.stringify(profile.ownershipDesignations), profile.ownershipClaim, profile.blackOwned,
                profile.description, profile.website, profile.sourceUrl, profile.dedupeKey],
            );
            await client!.query(
              `INSERT INTO business_inventory_cohort_receipts
                (business_id,cohort,source_receipt_hash,source_manifest,source_row,reason_codes,receipt_hash,policy_version)
               VALUES($1,'source_backed_held_live',$2,$3,$4,$5::jsonb,$6,$7)
               ON CONFLICT (business_id) DO NOTHING`,
              [inserted.rows[0]!.id, receiptHash, COMPLETED_COHORT_MANIFEST_CHECKSUM,
                candidate.sourceRow, JSON.stringify(["directory_only_unpinned", "geocode_hold"]), receiptHash,
                COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY],
            );
            await client!.query(
              `INSERT INTO completed_cohort_directory_discovery_receipts
                (receipt_root,manifest_sha256,source_row,source_row_id,business_id,activation_hash,outcome,reason_code,policy_version,activated_by)
               VALUES($1,$2,$3,$4,$5,$6,'created','geocode_hold',$7,$8)`,
              [COMPLETED_COHORT_RECEIPT_ROOT, COMPLETED_COHORT_MANIFEST_CHECKSUM,
                candidate.sourceRow, candidate.sourceRowId, inserted.rows[0]!.id, receiptHash,
                COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY, actor.id],
            );
            summary.created++;
            continue;
          }
          if (!existingRow.is_public) {
            if (apply) {
              await client!.query(
                `INSERT INTO completed_cohort_directory_discovery_receipts
                  (receipt_root,manifest_sha256,source_row,source_row_id,business_id,activation_hash,outcome,reason_code,policy_version,activated_by)
                 VALUES($1,$2,$3,$4,$5,$6,'skipped_nonpublic_existing','existing_listing_not_public',$7,$8)`,
                [COMPLETED_COHORT_RECEIPT_ROOT, COMPLETED_COHORT_MANIFEST_CHECKSUM,
                  candidate.sourceRow, candidate.sourceRowId, existingRow.id, receiptHash,
                  COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY, actor.id],
              );
            }
            summary.skippedExistingNonpublic++;
            continue;
          }
          if (apply) {
            // Source designations are additive and never replace verified claims.
            await client!.query(
              `UPDATE businesses
                  SET ownership_designations = (
                        SELECT COALESCE(jsonb_agg(DISTINCT value), '[]'::jsonb)
                          FROM jsonb_array_elements_text(
                            COALESCE(ownership_designations,'[]'::jsonb) || $2::jsonb
                          ) AS designation(value)
                      ),
                      black_owned = COALESCE(black_owned,false) OR $3,
                      ownership_claim = CASE
                        WHEN ownership_claim IS NULL OR ownership_claim = ''
                          OR ownership_claim = 'source_reputable_listing_unverified'
                        THEN $4 ELSE ownership_claim END,
                      updated_at = NOW()
                WHERE id=$1`,
              [existingRow.id, JSON.stringify(profile.ownershipDesignations), profile.blackOwned, profile.ownershipClaim],
            );
            await client!.query(
              `INSERT INTO business_inventory_cohort_receipts
                (business_id,cohort,source_receipt_hash,source_manifest,source_row,reason_codes,receipt_hash,policy_version)
               VALUES($1,'source_backed_held_live',$2,$3,$4,$5::jsonb,$6,$7)
               ON CONFLICT (business_id) DO NOTHING`,
              [existingRow.id, receiptHash, COMPLETED_COHORT_MANIFEST_CHECKSUM,
                candidate.sourceRow, JSON.stringify(["directory_only_link_existing", "geocode_hold"]), receiptHash,
                COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY],
            );
            await client!.query(
              `INSERT INTO completed_cohort_directory_discovery_receipts
                (receipt_root,manifest_sha256,source_row,source_row_id,business_id,activation_hash,outcome,reason_code,policy_version,activated_by)
               VALUES($1,$2,$3,$4,$5,$6,'linked_existing','geocode_hold',$7,$8)`,
              [COMPLETED_COHORT_RECEIPT_ROOT, COMPLETED_COHORT_MANIFEST_CHECKSUM,
                candidate.sourceRow, candidate.sourceRowId, existingRow.id, receiptHash,
                COMPLETED_COHORT_DIRECTORY_DISCOVERY_POLICY, actor.id],
            );
          }
          summary.linkedExistingPublic++;
        }
        if (client) await client.query("COMMIT");
      } catch (error) {
        if (client) await client.query("ROLLBACK");
        throw error;
      } finally {
        client?.release();
      }
      res.json({
        receiptRoot: COMPLETED_COHORT_RECEIPT_ROOT,
        manifestChecksum: COMPLETED_COHORT_MANIFEST_CHECKSUM,
        dryRun: !apply,
        directoryOnly: true,
        mapPinsCreated: 0,
        workerUsed: false,
        summary,
      });
    } catch {
      res.status(500).json({
        error: "Completed cohort directory-discovery activation failed.",
        code: "COMPLETED_COHORT_DIRECTORY_DISCOVERY_FAILED",
      });
    }
  });

  /**
   * Publishes the supplied national master as ordinary MWM directory profiles.
   * This is intentionally separate from the completed 4,183-row cohort: it
   * reads a checksum-locked embedded dataset, never touches the historical
   * review worker/outbox, does not geocode, and retains an idempotent receipt
   * for every source row. Records are discoverable by name and category with
   * an MWM profile; their absent address does not create a map pin.
   */
  app.post("/api/founder/directory-import/national-master-18294/activate-directory", async (req, res) => {
    const actor = admin(req, res);
    if (!actor) return;
    const apply = req.body?.apply === true;
    try {
      await ensureNationalMasterDirectoryAudit(productionPool);
      await ensureNationalMasterDirectoryBusinessMetadata(productionPool);
      const records = assertNationalMasterDirectoryDataset();
      if (records.length !== NATIONAL_MASTER_DIRECTORY_EXPECTED_ROWS) {
        res.status(409).json({
          error: "National master row count is inconsistent; activation is blocked.",
          code: "NATIONAL_MASTER_ROW_COUNT_MISMATCH",
        });
        return;
      }
      const profiles = records.map(buildNationalMasterDirectoryProfile);
      const existingReceipts = await productionPool.query<{ source_row: number }>(
        `SELECT source_row
           FROM national_master_directory_import_receipts
          WHERE source_sha256=$1`,
        [NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256],
      );
      const priorSourceRows = new Set(existingReceipts.rows.map((row) => row.source_row));
      const pending = profiles.filter((profile) => !priorSourceRows.has(profile.sourceRow));
      const summary = {
        sourceRows: profiles.length,
        alreadyActivated: profiles.length - pending.length,
        pending: pending.length,
        created: 0,
        existingSameSourceId: 0,
        mapPinsCreated: 0,
      };

      if (!apply) {
        res.json({
          sourceSha256: NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256,
          policyVersion: NATIONAL_MASTER_DIRECTORY_POLICY,
          dryRun: true,
          directoryOnly: true,
          workerUsed: false,
          summary,
        });
        return;
      }

      const client = await productionPool.connect();
      try {
        await client.query("BEGIN");
        // Keep batches well inside Postgres's parameter limit while avoiding a
        // slow one-query-per-business import. The source rows retain their own
        // permanent IDs, so duplicates are intentionally not collapsed here.
        for (let offset = 0; offset < pending.length; offset += 200) {
          const batch = pending.slice(offset, offset + 200);
          const insertValues: unknown[] = [];
          const tuples = batch.map((profile, index) => {
            const base = index * 21;
            insertValues.push(
              profile.id, profile.name, profile.category, profile.subcategory,
              profile.address, profile.city, profile.state, profile.country,
              false, JSON.stringify(profile.ownershipDesignations), profile.ownershipClaim,
              profile.blackOwned, profile.description, profile.website, profile.sourceUrl,
              profile.sourceRowId, profile.sourceLabel, profile.sourceUrl,
              profile.recommendationReason,
              `${NATIONAL_MASTER_DIRECTORY_SOURCE}:${NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256}`,
              JSON.stringify(profile.tags),
            );
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},
              'live_unclaimed','unclaimed',false,$${base + 10}::jsonb,'[]'::jsonb,$${base + 11},$${base + 12},$${base + 13},NULL,NULL,
              $${base + 14},$${base + 15},$${base + 16},'active','community_listed','${NATIONAL_MASTER_DIRECTORY_SOURCE}',false,false,
              $${base + 17},$${base + 18},$${base + 19},$${base + 20},$${base + 21}::jsonb)`;
          });
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO businesses
              (id,name,category,subcategory,address,city,state,country,is_online_only,
               listing_status,owner_claim_status,verified,ownership_designations,verified_designations,
               ownership_claim,black_owned,description,latitude,longitude,website,source_url,
               dedupe_key,status,profile_status,data_source,is_duplicate,permanently_hidden,
               research_source_label,research_source_url,kinfolk_recommendation_reason,intake_batch_reference,tags)
             VALUES ${tuples.join(",")}
             ON CONFLICT (id) DO NOTHING
             RETURNING id`,
            insertValues,
          );
          const createdIds = new Set(inserted.rows.map((row) => row.id));
          summary.created += createdIds.size;
          summary.existingSameSourceId += batch.length - createdIds.size;

          const receiptValues: unknown[] = [];
          const receiptTuples = batch.map((profile, index) => {
            const base = index * 8;
            receiptValues.push(
              NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256,
              profile.sourceRow,
              profile.sourceRowId,
              profile.id,
              nationalMasterActivationReceiptHash(profile),
              createdIds.has(profile.id) ? "created" : "existing_same_source_id",
              NATIONAL_MASTER_DIRECTORY_POLICY,
              actor.id,
            );
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
          });
          await client.query(
            `INSERT INTO national_master_directory_import_receipts
              (source_sha256,source_row,source_row_id,business_id,activation_hash,outcome,policy_version,activated_by)
             VALUES ${receiptTuples.join(",")}
             ON CONFLICT (source_sha256,source_row) DO NOTHING`,
            receiptValues,
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }

      res.json({
        sourceSha256: NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256,
        policyVersion: NATIONAL_MASTER_DIRECTORY_POLICY,
        dryRun: false,
        directoryOnly: true,
        workerUsed: false,
        summary,
      });
    } catch {
      res.status(500).json({
        error: "National master directory activation failed.",
        code: "NATIONAL_MASTER_DIRECTORY_ACTIVATION_FAILED",
      });
    }
  });

  /**
   * The supplied Lehigh Valley directory is a separate, explicit-source import.
   * It does not inspect or change existing business rows, collapse duplicates,
   * infer ownership, run the historical cohort worker, or fabricate coordinates.
   * `apply` remains false by default so an administrator can inspect the fixed
   * count before creating public directory profiles.
   */
  app.get("/api/founder/directory-import/latinx-lehigh-valley/preview", async (req, res) => {
    if (!admin(req, res)) return;
    try {
      const profiles = assertLatinxLehighValleyDirectoryDataset();
      const byCity = new Map<string, number>();
      for (const profile of profiles) {
        const location = `${profile.city}, ${profile.state}`;
        byCity.set(location, (byCity.get(location) ?? 0) + 1);
      }
      res.json({
        sourceKey: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
        sourceLabel: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL,
        sourceSha256: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
        policyVersion: LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY,
        profileCount: profiles.length,
        sourceReportedOwnership: "Latino / Hispanic-Owned",
        verificationStatus: "source_reported_ownership_unverified",
        addressedProfiles: profiles.filter((profile) => profile.address).length,
        mapPinsCreated: 0,
        cityCounts: [...byCity.entries()]
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city)),
      });
    } catch {
      res.status(500).json({
        error: "Latinx Lehigh Valley directory preview failed.",
        code: "LATINX_LEHIGH_VALLEY_DIRECTORY_PREVIEW_FAILED",
      });
    }
  });

  app.post("/api/founder/directory-import/latinx-lehigh-valley/activate-directory", async (req, res) => {
    const actor = admin(req, res);
    if (!actor) return;
    const apply = req.body?.apply === true;
    try {
      const profiles = assertLatinxLehighValleyDirectoryDataset();
      const summary = {
        sourceProfiles: profiles.length,
        addressedProfiles: profiles.filter((profile) => profile.address).length,
        alreadyActivated: 0,
        pending: profiles.length,
        created: 0,
        existingSameSourceId: 0,
        mapPinsCreated: 0,
      };

      if (!apply) {
        res.json({
          sourceKey: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
          sourceLabel: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL,
          sourceSha256: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
          policyVersion: LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY,
          dryRun: true,
          requiresExplicitApply: true,
          directoryOnly: true,
          workerUsed: false,
          summary,
        });
        return;
      }

      await ensureLatinxLehighValleyDirectoryAudit(productionPool);
      const priorReceipts = await productionPool.query<{ profile_id: string }>(
        `SELECT profile_id
           FROM user_supplied_directory_import_receipts
          WHERE source_key=$1 AND source_sha256=$2`,
        [LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE, LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256],
      );
      const priorProfileIds = new Set(priorReceipts.rows.map((row) => row.profile_id));
      const pending = profiles.filter((profile) => !priorProfileIds.has(profile.id));
      summary.alreadyActivated = profiles.length - pending.length;
      summary.pending = pending.length;

      const client = await productionPool.connect();
      try {
        await client.query("BEGIN");
        for (let offset = 0; offset < pending.length; offset += 50) {
          const batch = pending.slice(offset, offset + 50);
          const values: unknown[] = [];
          const tuples = batch.map((profile, index) => {
            const base = index * 22;
            values.push(
              profile.id, profile.name, profile.category, profile.subcategory,
              profile.address, profile.city, profile.state, profile.country,
              false, JSON.stringify(profile.ownershipDesignations), profile.ownershipClaim,
              profile.description, profile.phone, profile.website, profile.instagram, profile.facebook,
              profile.dedupeKey, profile.sourceLabel, profile.sourceUrl,
              profile.recommendationReason, profile.intakeBatchReference,
              JSON.stringify(["source-reported", "hispanic-owned", "latinx-owned", "lehigh-valley"]),
            );
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},
              'live_unclaimed','unclaimed',false,$${base + 10}::jsonb,'[]'::jsonb,$${base + 11},false,$${base + 12},NULL,NULL,
              $${base + 13},$${base + 14},NULL,$${base + 15},NULL,$${base + 16},$${base + 17},'active','community_listed','${LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE}',false,false,
              $${base + 18},$${base + 19},$${base + 20},$${base + 21},$${base + 22}::jsonb)`;
          });
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO businesses
              (id,name,category,subcategory,address,city,state,country,is_online_only,
               listing_status,owner_claim_status,verified,ownership_designations,verified_designations,
               ownership_claim,black_owned,description,latitude,longitude,phone,website,tiktok,instagram,youtube,facebook,
               dedupe_key,status,profile_status,data_source,is_duplicate,permanently_hidden,
               research_source_label,research_source_url,kinfolk_recommendation_reason,intake_batch_reference,tags)
             VALUES ${tuples.join(",")}
             ON CONFLICT (id) DO NOTHING
             RETURNING id`,
            values,
          );
          const createdIds = new Set(inserted.rows.map((row) => row.id));
          summary.created += createdIds.size;
          summary.existingSameSourceId += batch.length - createdIds.size;

          const receiptValues: unknown[] = [];
          const receiptTuples = batch.map((profile, index) => {
            const base = index * 8;
            receiptValues.push(
              LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
              LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
              profile.id,
              profile.sourceRow,
              profile.id,
              createdIds.has(profile.id) ? "created" : "existing_same_source_id",
              LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY,
              actor.id,
            );
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
          });
          await client.query(
            `INSERT INTO user_supplied_directory_import_receipts
              (source_key,source_sha256,profile_id,source_row,business_id,outcome,policy_version,activated_by)
             VALUES ${receiptTuples.join(",")}
             ON CONFLICT (source_key,source_sha256,profile_id) DO NOTHING`,
            receiptValues,
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }

      res.json({
        sourceKey: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
        sourceLabel: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL,
        sourceSha256: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
        policyVersion: LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY,
        dryRun: false,
        directoryOnly: true,
        workerUsed: false,
        summary,
      });
    } catch {
      res.status(500).json({
        error: "Latinx Lehigh Valley directory activation failed.",
        code: "LATINX_LEHIGH_VALLEY_DIRECTORY_ACTIVATION_FAILED",
      });
    }
  });

  app.post("/api/founder/directory-import/ingress", async (req, res) => {
    const authorized = operator(req, res);
    if (!authorized) return;
    const body = typeof req.body?.jsonl === "string" ? req.body.jsonl : "";
    const manifest = req.body?.manifest;
    const headers = req.headers;
    const verified = verifyDirectoryIngress(body, {
      timestamp: String(headers["x-directory-timestamp"] ?? ""),
      nonce: String(headers["x-directory-nonce"] ?? ""),
      checksum: String(headers["x-directory-checksum"] ?? manifest?.sha256 ?? ""),
      signature: String(headers["x-directory-signature"] ?? ""),
    }, process.env.DIRECTORY_REVIEW_SIGNING_SECRET ?? "");
    if (!verified.ok) { res.status(401).json({ error: verified.reason }); return; }
    let records: unknown[];
    try {
      records = verifyDirectoryManifest(body, manifest);
      validateDirectorySourceRows(records);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid manifest." });
      return;
    }
    const mwmCoreAdmission = validateMwmCorePublicationBatch(records);
    if (!mwmCoreAdmission.ok) {
      res.status(422).json({
        error: mwmCoreAdmission.message,
        code: mwmCoreAdmission.code,
      });
      return;
    }
    const client = await reviewPool.connect();
    try {
      const sourceHash = verified.checksum;
      await client.query("BEGIN");
      const existing = await client.query(`SELECT id,source_row_count,manifest_count,source_name
        FROM directory_import_batches WHERE source_sha256=$1 FOR UPDATE`, [sourceHash]);
      let batchId: string;
      if (existing.rows[0]) {
        const row = existing.rows[0];
        // The signed payload checksum selected this row. Preserve its original
        // source name while allowing a later descriptive alias to reuse it.
        if (row.source_row_count !== records.length || row.manifest_count !== manifest.rowCount)
          throw new Error("Checksum metadata conflict for existing import batch.");
        batchId = row.id;
      } else {
        const inserted = await client.query(`INSERT INTO directory_import_batches
          (source_name,source_sha256,source_row_count,manifest_count,status,created_by)
          VALUES($1,$2,$3,$4,'in_review',$5) RETURNING id`,
          [manifest.sourceName, sourceHash, records.length, manifest.rowCount, authorized.actorId]);
        batchId = inserted.rows[0].id;
      }
      const candidates = records.map((raw, index) => {
        const r = raw as Record<string, unknown>;
        return {
          sourceRow: Number(r.source_row ?? r.sourceRow ?? index + 1),
          sourceRowId: String(r.source_row_id ?? r.sourceRowId ?? r.source_row ?? index + 1),
          targetKind: String(r.target_kind ?? r.targetKind ?? "manual_review") as any,
          name: String(r.name ?? ""), city: String(r.city ?? ""),
          state: r.state == null ? null : String(r.state), country: r.country == null ? null : String(r.country),
          address: r.address == null ? null : String(r.address), website: r.website == null ? null : String(r.website),
          socialSourceUrl: r.social_source_url == null && r.socialSourceUrl == null ? null : String(r.social_source_url ?? r.socialSourceUrl),
          ownershipDesignations: Array.isArray(r.ownership_designations)
            ? r.ownership_designations.map(String)
            : Array.isArray(r.ownershipDesignations) ? r.ownershipDesignations.map(String) : [],
          // This value is derived from protected server configuration after the
          // complete batch passed immutable source-receipt admission above. Raw
          // manifest input cannot opt itself into automatic publication.
          sourceBackedMwmCore: isMwmCorePublicationEnabled(),
          regulatedProfession: r.regulated_profession === true || r.regulatedProfession === true,
          destinationReachable: r.destination_reachable !== false && r.destinationReachable !== false,
          raw,
        };
      });
      const decisions = classifyAutomatedReviewBatch(candidates);
      const counts: Record<string, number> = {};
      for (const candidate of candidates) {
        const decision = decisions.get(candidate.sourceRow)!;
        counts[decision.outcome] = (counts[decision.outcome] ?? 0) + 1;
        const status = decision.outcome === "auto_ready" ? "approved" :
          decision.outcome === "deduplicated" ? "declined" :
          decision.outcome === "needs_research" ? "needs_research" : "pending_review";
        const identity = decision.identityKey ?? `${batchId}:${candidate.sourceRowId}`;
        const inserted = await client.query(`INSERT INTO directory_import_candidates
          (batch_id,source_row,source_row_id,target_kind,status,dedupe_key,name,city,state,country,category,raw_record)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT(batch_id,source_row) DO NOTHING RETURNING id`,
          [batchId,candidate.sourceRow,candidate.sourceRowId,candidate.targetKind,status,identity,
           candidate.name,candidate.city,candidate.state,candidate.country ?? "United States",
           String((candidate.raw as any).category ?? "Other"),candidate.raw]);
        const candidateId = inserted.rows[0]?.id;
        if (!candidateId) continue;
        const payload = { ...candidate.raw as Record<string, unknown>, batch_id: batchId,
          source_row: candidate.sourceRow, source_sha256: sourceHash,
          automatedReviewApproved: decision.outcome === "auto_ready" };
        const payloadHash = createHash("sha256").update(canonicalDirectoryPayload(payload)).digest("hex");
        await client.query(`INSERT INTO directory_import_decision_events
          (candidate_id,batch_id,action,actor_id,idempotency_key,payload_hash)
          VALUES($1,$2,$3,$4,$5,$6)`, [candidateId,batchId,decision.outcome,authorized.actorId,
          `${sourceHash}:${candidate.sourceRowId}:${decision.outcome}`,payloadHash]);
        if (decision.outcome === "auto_ready") await client.query(`INSERT INTO directory_review_outbox
          (event_key,candidate_id,payload,payload_hash) VALUES($1,$2,$3,$4)
          ON CONFLICT(event_key) DO NOTHING`,
          [`${sourceHash}:${candidate.sourceRowId}`,candidateId,payload,payloadHash]);
      }
      await client.query("COMMIT");
      res.status(202).json({ accepted: true, batchId, checksum: sourceHash,
        rowCount: records.length, counts });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid manifest." });
    } finally { client.release(); }
  });
}
