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

export function registerAutomatedDirectoryRoutes(app: Express, reviewPool: Pool): void {
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
