/*
 * Mapping With Melanin — Library Growth Engine
 *
 * Reference implementation for a scheduled server-side worker. It deliberately
 * separates: (1) capture of a sanitized signal, (2) threshold aggregation,
 * (3) human/curator approval, and (4) materialization of a Library node.
 *
 * Do not run this as a browser client feature. Mount it in the existing server
 * scheduler/worker process and use the project database client/pool conventions.
 */

import { pool } from "@workspace/db";
import { createHash, randomUUID } from "crypto";

export type GrowthNodeType = "book" | "volume" | "chapter" | "subchapter" | "geography" | "general";
export type SensitivityTier = "standard" | "professional" | "sensitive" | "excluded";

export type LibraryGrowthSignal = {
  canonicalSubject: string;
  canonicalSubjectKey: string;
  category: string;
  desiredNodeType: GrowthNodeType;
  parentTopicId?: string | null;
  geographyScope?: string | null;
  sourceSurface: "kinfolk_chat" | "universal_search" | "library_search" | "map_search";
  userId: string;
  sensitivityTier: SensitivityTier;
  learningEligible: boolean;
  isLoadTest?: boolean;
};

export type CandidateDecision = {
  candidateId: string;
  approvedByUserId: string;
  decision: "approved" | "rejected";
  reason: string;
  evidencePlan: {
    requiredAuthorityTiers: Array<"authoritative" | "professional" | "contextual">;
    minimumSources: number;
    requiresDomainReviewer: boolean;
  };
};

const MIN_DISTINCT_USERS = 10;
const MAX_SUBJECT_LENGTH = 140;

/**
 * Converts a user ID into a rotating non-reversible privacy fingerprint.
 * The source query, email, session, and raw user ID are never written into
 * the growth tables.
 */
function growthFingerprint(userId: string, day = new Date().toISOString().slice(0, 10)): string {
  const secret = process.env.LIBRARY_GROWTH_HMAC_SECRET;
  if (!secret) throw new Error("LIBRARY_GROWTH_HMAC_SECRET is required");
  return createHash("sha256").update(`${secret}:${day}:${userId}`).digest("hex");
}

/**
 * Call from Kinfolk only after the policy/router has classified a request.
 * Never pass raw text. `canonicalSubject` must already be a safe, general
 * subject such as "Black maternal health in New Mexico", not a private
 * individual's situation or an identifying sentence.
 */
export async function captureLibraryGrowthSignal(signal: LibraryGrowthSignal): Promise<void> {
  if (!signal.learningEligible || signal.sensitivityTier === "excluded" || signal.isLoadTest) return;
  if (!signal.canonicalSubject || signal.canonicalSubject.length > MAX_SUBJECT_LENGTH) return;

  const result = await pool.query(
    `INSERT INTO library_growth_signals (
       canonical_subject, canonical_subject_key, suggested_category,
       suggested_node_type, suggested_parent_topic_id, geography_scope,
       source_surface, user_fingerprint, learning_eligible, sensitivity_tier,
       is_load_test
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9,FALSE)
     ON CONFLICT DO NOTHING`,
    [
      signal.canonicalSubject.trim(),
      signal.canonicalSubjectKey.trim().toLowerCase(),
      signal.category,
      signal.desiredNodeType,
      signal.parentTopicId ?? null,
      signal.geographyScope ?? null,
      signal.sourceSurface,
      growthFingerprint(signal.userId),
      signal.sensitivityTier,
    ],
  );

  void result;
}

/**
 * Run at a controlled scheduled interval (for example, hourly). It performs
 * thresholding only—no public Book/Chapter is created here.
 */
export async function aggregateLibraryGrowthCandidates(): Promise<number> {
  const { rows } = await pool.query<{
    canonical_subject: string;
    canonical_subject_key: string;
    suggested_category: string;
    suggested_node_type: GrowthNodeType;
    suggested_parent_topic_id: string | null;
    geography_scope: string | null;
    distinct_user_count: number;
    signal_count: number;
    first_seen_at: string;
    last_seen_at: string;
    sensitivity_tier: Exclude<SensitivityTier, "excluded">;
  }>(
    `SELECT
       canonical_subject,
       canonical_subject_key,
       suggested_category,
       suggested_node_type,
       suggested_parent_topic_id,
       geography_scope,
       COUNT(DISTINCT user_fingerprint)::int AS distinct_user_count,
       COUNT(*)::int AS signal_count,
       MIN(occurred_at) AS first_seen_at,
       MAX(occurred_at) AS last_seen_at,
       MAX(sensitivity_tier) AS sensitivity_tier
     FROM library_growth_signals
     WHERE learning_eligible = TRUE
       AND is_load_test = FALSE
       AND sensitivity_tier <> 'excluded'
       AND occurred_at >= NOW() - INTERVAL '90 days'
     GROUP BY canonical_subject, canonical_subject_key, suggested_category,
       suggested_node_type, suggested_parent_topic_id, geography_scope
     HAVING COUNT(DISTINCT user_fingerprint) >= $1`,
    [MIN_DISTINCT_USERS],
  );

  for (const row of rows) {
    // A sensitive/professional subject is never auto-approved; it is merely
    // queued with a stricter evidence plan.
    const status = row.sensitivity_tier === "standard" ? "pending_review" : "pending_review";
    await pool.query(
      `INSERT INTO library_growth_candidates (
         canonical_subject, canonical_subject_key, category, desired_node_type,
         parent_topic_id, geography_scope, distinct_user_count, signal_count,
         first_seen_at, last_seen_at, sensitivity_tier, proposed_status, rationale
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
       ON CONFLICT (canonical_subject_key) DO UPDATE SET
         distinct_user_count = EXCLUDED.distinct_user_count,
         signal_count = EXCLUDED.signal_count,
         last_seen_at = EXCLUDED.last_seen_at,
         parent_topic_id = COALESCE(library_growth_candidates.parent_topic_id, EXCLUDED.parent_topic_id),
         rationale = EXCLUDED.rationale,
         proposed_status = CASE
           WHEN library_growth_candidates.proposed_status IN ('materialized','rejected')
             THEN library_growth_candidates.proposed_status
           ELSE EXCLUDED.proposed_status
         END`,
      [
        row.canonical_subject,
        row.canonical_subject_key,
        row.suggested_category,
        row.suggested_node_type,
        row.suggested_parent_topic_id,
        row.geography_scope,
        row.distinct_user_count,
        row.signal_count,
        row.first_seen_at,
        row.last_seen_at,
        row.sensitivity_tier,
        status,
        JSON.stringify({
          threshold: MIN_DISTINCT_USERS,
          distinctUsers: row.distinct_user_count,
          signals: row.signal_count,
          windowDays: 90,
          source: "thresholded_aggregate",
        }),
      ],
    );
  }

  return rows.length;
}

/**
 * Curator/admin-only action. A candidate never becomes a public topic until
 * approval records a source/evidence plan. This prevents popularity from
 * replacing credibility.
 */
export async function recordLibraryGrowthDecision(decision: CandidateDecision): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const candidate = await client.query<{
      id: string;
      proposed_status: string;
      canonical_subject: string;
      sensitivity_tier: string;
    }>(
      `SELECT id, proposed_status, canonical_subject, sensitivity_tier
       FROM library_growth_candidates WHERE id = $1 FOR UPDATE`,
      [decision.candidateId],
    );
    if (!candidate.rows[0]) throw new Error("Library growth candidate not found");
    if (!['pending_review', 'pending_threshold'].includes(candidate.rows[0].proposed_status)) {
      throw new Error("Candidate is not awaiting a decision");
    }

    const finalStatus = decision.decision === "approved" ? "approved" : "rejected";
    await client.query(
      `UPDATE library_growth_candidates SET proposed_status = $2 WHERE id = $1`,
      [decision.candidateId, finalStatus],
    );
    await client.query(
      `INSERT INTO library_growth_decisions (
         candidate_id, decision, decided_by_user_id, reason, evidence_plan
       ) VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [
        decision.candidateId,
        decision.decision,
        decision.approvedByUserId,
        decision.reason,
        JSON.stringify(decision.evidencePlan),
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Curator/admin-only action. It creates a disabled/pending node and connects
 * it to the approved parent. It does NOT publish without validated sources.
 */
export async function materializeApprovedLibraryCandidate(
  candidateId: string,
  curatorUserId: string,
): Promise<{ topicId: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const candidateResult = await client.query<{
      id: string;
      canonical_subject: string;
      category: string;
      desired_node_type: GrowthNodeType;
      parent_topic_id: string | null;
      geography_scope: string | null;
      proposed_status: string;
    }>(
      `SELECT id, canonical_subject, category, desired_node_type,
              parent_topic_id, geography_scope, proposed_status
       FROM library_growth_candidates WHERE id = $1 FOR UPDATE`,
      [candidateId],
    );
    const c = candidateResult.rows[0];
    if (!c) throw new Error("Library growth candidate not found");
    if (c.proposed_status !== "approved") throw new Error("Candidate must be curator-approved first");

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM knowledge_topics
       WHERE LOWER(topic_name) = LOWER($1)
         AND category = $2
         AND COALESCE(geography_ref, '') = COALESCE($3, '')
       LIMIT 1 FOR UPDATE`,
      [c.canonical_subject, c.category, c.geography_scope],
    );

    const topicId = existing.rows[0]?.id ?? `growth_${randomUUID()}`;
    if (!existing.rows[0]) {
      await client.query(
        `INSERT INTO knowledge_topics (
           id, topic_name, category, node_type, geography_ref, description,
           status, enabled, is_user_created, created_by_user_id, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,'draft',FALSE,FALSE,$7,NOW(),NOW())`,
        [
          topicId,
          c.canonical_subject,
          c.category,
          c.desired_node_type,
          c.geography_scope,
          `Candidate Library ${c.desired_node_type}: ${c.canonical_subject}`,
          curatorUserId,
        ],
      );
    }

    if (c.parent_topic_id) {
      await client.query(
        `INSERT INTO topic_relationships (
           id, parent_topic_id, child_topic_id, relationship_type, weight
         ) VALUES ($1,$2,$3,'contains',1.0)
         ON CONFLICT DO NOTHING`,
        [`rel_${randomUUID()}`, c.parent_topic_id, topicId],
      );
    }

    await client.query(
      `UPDATE library_growth_candidates SET proposed_status = 'materialized' WHERE id = $1`,
      [candidateId],
    );
    await client.query(
      `INSERT INTO library_growth_decisions (
         candidate_id, decision, decided_by_user_id, reason, materialized_topic_id, evidence_plan
       ) VALUES ($1,'materialized',$2,'Created draft Library node; publish requires approved evidence.',$3,'{}'::jsonb)`,
      [candidateId, curatorUserId, topicId],
    );
    await client.query("COMMIT");
    return { topicId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Publication gate. Call only after the existing source workflow has verified
 * the required authoritative/professional sources for this draft node.
 */
export async function publishLibraryNodeWhenEvidenceReady(topicId: string): Promise<void> {
  const result = await pool.query<{ source_count: number }>(
    `SELECT COUNT(*)::int AS source_count
     FROM knowledge_sources
     WHERE topic_id = $1
       AND status = 'active'
       AND authority_tier IN ('authoritative', 'professional')`,
    [topicId],
  );
  if ((result.rows[0]?.source_count ?? 0) < 2) {
    throw new Error("At least two active authoritative/professional sources are required before publication");
  }
  await pool.query(
    `UPDATE knowledge_topics
     SET status = 'published', enabled = TRUE, updated_at = NOW()
     WHERE id = $1 AND status = 'draft'`,
    [topicId],
  );
}

/*
 * Integration policy for the Kinfolk chat handler:
 *
 * 1. Router returns a classified canonical subject plus `learningEligible`.
 * 2. Call captureLibraryGrowthSignal only when:
 *      - user explicitly allows learning, AND
 *      - request has no direct identifier, AND
 *      - sensitivityTier is 'standard' or policy allows aggregate professional use, AND
 *      - raw question is not about HIV, fertility, divorce, abuse, domestic violence,
 *        immigration status, a minor, or another excluded sensitive theme.
 * 3. Never disclose candidate status or aggregated searches to community members,
 *    businesses, circles, or profiles.
 * 4. `aggregateLibraryGrowthCandidates` can prepare review candidates at threshold.
 * 5. Only a curator with an evidence plan can create a draft node.
 * 6. Only verified evidence can publish a node.
 */
