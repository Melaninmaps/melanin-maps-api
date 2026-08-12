/*
 * Mapping With Melanin — Library Growth Engine
 *
 * Turns aggregate, privacy-safe community need into governed Books, Volumes,
 * Chapters, and Subchapters. Deliberately separated into 4 stages:
 *   1. captureLibraryGrowthSignal   — sanitized signal write (Kinfolk fires this)
 *   2. aggregateLibraryGrowthCandidates — hourly threshold worker
 *   3. recordLibraryGrowthDecision  — curator approve/reject
 *   4. materializeApprovedLibraryCandidate / publishLibraryNodeWhenEvidenceReady
 *
 * Privacy invariants:
 *  • Raw chat text, session IDs, emails, and raw user IDs NEVER enter growth tables.
 *  • Excluded topics never produce signals or candidates.
 *  • Load-test accounts are filtered at every layer.
 *  • Candidates require ≥10 distinct HMAC fingerprints in a 90-day window.
 *  • A published node requires curator approval + an evidence plan + 2+ verified sources.
 */

import { pool } from "@workspace/db";
import { createHash, randomUUID } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GrowthNodeType = "book" | "volume" | "chapter" | "subchapter" | "geography" | "general";
export type SensitivityTier = "standard" | "professional" | "sensitive" | "excluded";

export interface LibraryGrowthSignal {
  canonicalSubject: string;         // e.g. "Black Maternal Health"
  canonicalSubjectKey: string;      // e.g. "black_maternal_health"
  category: string;                 // e.g. "health"
  desiredNodeType: GrowthNodeType;
  parentTopicId?: string | null;
  geographyScope?: string | null;
  sourceSurface: "kinfolk_chat" | "universal_search" | "library_search" | "map_search";
  userId: string;                   // will be fingerprinted before storage
  sensitivityTier: SensitivityTier;
  learningEligible: boolean;
  isLoadTest?: boolean;
}

export interface CandidateDecision {
  candidateId: string;
  approvedByUserId: string;
  decision: "approved" | "rejected";
  reason: string;
  evidencePlan: {
    requiredAuthorityTiers: Array<"authoritative" | "professional" | "contextual">;
    minimumSources: number;
    requiresDomainReviewer: boolean;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_DISTINCT_USERS = 10;
const MAX_SUBJECT_LENGTH = 140;

// Topics that must never produce a public learning signal.
// Even if 1000 users ask about these, we never create a Library candidate from demand.
export const EXCLUDED_SENSITIVITY_PATTERNS: RegExp[] = [
  /\b(hiv|aids|hiv[\s-]?positive|hiv[\s-]?status)\b/i,
  /\b(infertil|ivf|fertility treatment|egg freezing)\b/i,
  /\b(divorce|custody dispute|child support|alimony)\b/i,
  /\b(domestic violence|abuse|abusive relationship|battered)\b/i,
  /\b(immigration status|undocumented|deportation|daca|asylum seeker)\b/i,
  /\b(minor|child abuse|exploitation|trafficking)\b/i,
  /\b(addiction treatment|rehab|detox|withdrawal|opioid|substance abuse)\b/i,
  /\b(suicide|self.harm|self-harm|ending (?:my|their|his|her) life)\b/i,
  /\b(sexual assault|rape|molestation)\b/i,
  /\b(i (?:was|have been|am) (?:diagnosed|infected|abused|assaulted|arrested|charged|deported))\b/i,
  /\b(my (?:child|daughter|son|wife|husband|partner|mother|father) (?:was|has been|is being))\b/i,
];

// Topics that are professional-tier: only curator-reviewed, never auto-published.
const PROFESSIONAL_PATTERNS: RegExp[] = [
  /\b(medical|health|symptom|diagnos|prescription|medication|treatment|cancer|diabetes|hypertension)\b/i,
  /\b(legal|attorney|lawyer|lawsuit|court|criminal|civil rights violation|contract dispute)\b/i,
  /\b(financial advice|investment|portfolio|tax advice|retirement planning|estate planning)\b/i,
];

// Intent class → Library category mapping
const INTENT_TO_CATEGORY: Record<string, string> = {
  medical_health:       "health",
  legal_regulated:      "legal",
  financial_regulated:  "financial",
  culture_entertainment:"culture",
  business_discovery:   "business",
  hobby_lifestyle:      "lifestyle",
  general_knowledge:    "general",
  current_information:  "general",
  safety_emergency:     "safety",
};

// ─── Privacy fingerprint ──────────────────────────────────────────────────────

/**
 * Converts a user ID into a rotating non-reversible privacy fingerprint.
 * The raw user ID, email, and session are NEVER stored in growth tables.
 * The fingerprint rotates daily so historical signals cannot be linked across days.
 */
function growthFingerprint(userId: string, day = new Date().toISOString().slice(0, 10)): string {
  const secret = process.env.LIBRARY_GROWTH_HMAC_SECRET;
  if (!secret) throw new Error("LIBRARY_GROWTH_HMAC_SECRET is required for Library Growth Engine");
  return createHash("sha256").update(`${secret}:${day}:${userId}`).digest("hex");
}

// ─── Worker health state ──────────────────────────────────────────────────────

interface WorkerHealthState {
  lastRunAt: string | null;
  eligibleSignalsProcessed: number;
  candidatesCreatedOrUpdated: number;
  errorCount: number;
  lastError: string | null;
}

const _workerHealth: WorkerHealthState = {
  lastRunAt: null,
  eligibleSignalsProcessed: 0,
  candidatesCreatedOrUpdated: 0,
  errorCount: 0,
  lastError: null,
};

export function getLibraryGrowthWorkerHealth(): Readonly<WorkerHealthState> {
  return { ..._workerHealth };
}

// ─── Sensitivity classification ───────────────────────────────────────────────

/**
 * Classifies the sensitivity tier of a message.
 * Does NOT retain the message — classification is discarded after this call.
 */
export function classifyGrowthSensitivity(message: string): SensitivityTier {
  for (const pattern of EXCLUDED_SENSITIVITY_PATTERNS) {
    if (pattern.test(message)) return "excluded";
  }
  for (const pattern of PROFESSIONAL_PATTERNS) {
    if (pattern.test(message)) return "professional";
  }
  return "standard";
}

// ─── Canonical subject derivation ────────────────────────────────────────────

/**
 * Derives a safe canonical subject from the classified intent + destination.
 * Does NOT retain raw personal text. Only intent class + optional destination.
 *
 * Returns null if the subject cannot be safely derived (e.g., safety_emergency).
 */
export function deriveGrowthSubject(
  intentClass: string,
  destination: string | null,
): { canonicalSubject: string; canonicalSubjectKey: string; category: string; desiredNodeType: GrowthNodeType } | null {
  // safety_emergency is always excluded
  if (intentClass === "safety_emergency") return null;

  const category = INTENT_TO_CATEGORY[intentClass] ?? "general";

  // Build a safe canonical subject from intent + destination only
  let canonicalSubject: string;
  if (destination && intentClass === "business_discovery") {
    canonicalSubject = `Black-owned businesses in ${destination}`;
  } else if (destination && intentClass === "current_information") {
    canonicalSubject = `Travel information: ${destination}`;
  } else {
    // Use a canonical name derived from the intent class
    const intentLabels: Record<string, string> = {
      medical_health:       "Black Health and Wellness",
      legal_regulated:      "Legal Resources and Rights",
      financial_regulated:  "Financial Wellness and Literacy",
      culture_entertainment:"African Diaspora Culture and Arts",
      business_discovery:   "Black Business Discovery",
      hobby_lifestyle:      "Lifestyle and Community",
      general_knowledge:    "General Knowledge",
      current_information:  "Current Events and Information",
    };
    canonicalSubject = intentLabels[intentClass] ?? "Community Resources";
  }

  const canonicalSubjectKey = canonicalSubject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);

  // Node type based on specificity
  const desiredNodeType: GrowthNodeType = destination ? "chapter" : "book";

  return { canonicalSubject, canonicalSubjectKey, category, desiredNodeType };
}

// ─── Signal capture ───────────────────────────────────────────────────────────

/**
 * Called from the Kinfolk chat handler ONLY after the privacy/policy layer
 * has classified the request. Never pass raw message text.
 * Fire-and-forget from the route handler — errors are swallowed.
 */
export async function captureLibraryGrowthSignal(signal: LibraryGrowthSignal): Promise<void> {
  // Kill switch
  if (process.env.LIBRARY_GROWTH_ENABLED === "false") return;

  // Hard gates — never write excluded or load-test signals
  if (!signal.learningEligible) return;
  if (signal.sensitivityTier === "excluded") return;
  if (signal.isLoadTest === true) return;
  if (!signal.canonicalSubject || signal.canonicalSubject.length > MAX_SUBJECT_LENGTH) return;

  const fingerprint = growthFingerprint(signal.userId);

  await pool.query(
    `INSERT INTO library_growth_signals (
       canonical_subject, canonical_subject_key, suggested_category,
       suggested_node_type, suggested_parent_topic_id, geography_scope,
       source_surface, user_fingerprint, learning_eligible, sensitivity_tier, is_load_test
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
      fingerprint,
      signal.sensitivityTier,
    ],
  );
}

// ─── Threshold aggregation worker ─────────────────────────────────────────────

/**
 * Runs at a controlled interval (hourly). Aggregates eligible sanitized signals
 * into candidates. Never creates a public Book/Chapter — only pending_review.
 */
export async function aggregateLibraryGrowthCandidates(): Promise<number> {
  if (process.env.LIBRARY_GROWTH_ENABLED === "false") return 0;

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
       COUNT(*)::int                          AS signal_count,
       MIN(occurred_at)                       AS first_seen_at,
       MAX(occurred_at)                       AS last_seen_at,
       MAX(sensitivity_tier)                  AS sensitivity_tier
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

  let upsertedCount = 0;
  for (const row of rows) {
    await pool.query(
      `INSERT INTO library_growth_candidates (
         canonical_subject, canonical_subject_key, category, desired_node_type,
         parent_topic_id, geography_scope, distinct_user_count, signal_count,
         first_seen_at, last_seen_at, sensitivity_tier, proposed_status, rationale
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending_review',$12::jsonb)
       ON CONFLICT (canonical_subject_key) DO UPDATE SET
         distinct_user_count = EXCLUDED.distinct_user_count,
         signal_count        = EXCLUDED.signal_count,
         last_seen_at        = EXCLUDED.last_seen_at,
         parent_topic_id     = COALESCE(library_growth_candidates.parent_topic_id, EXCLUDED.parent_topic_id),
         rationale           = EXCLUDED.rationale,
         proposed_status     = CASE
           WHEN library_growth_candidates.proposed_status IN ('materialized','rejected')
             THEN library_growth_candidates.proposed_status
           ELSE 'pending_review'
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
        JSON.stringify({
          threshold: MIN_DISTINCT_USERS,
          distinctUsers: row.distinct_user_count,
          signals: row.signal_count,
          windowDays: 90,
          source: "thresholded_aggregate",
        }),
      ],
    );
    upsertedCount++;
  }

  return upsertedCount;
}

// ─── Curator decision ─────────────────────────────────────────────────────────

/**
 * Curator/admin-only. Records approval or rejection of a pending_review candidate.
 * No public node is created here — only the governance record.
 */
export async function recordLibraryGrowthDecision(decision: CandidateDecision): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const candidateResult = await client.query<{
      id: string; proposed_status: string; canonical_subject: string; sensitivity_tier: string;
    }>(
      `SELECT id, proposed_status, canonical_subject, sensitivity_tier
       FROM library_growth_candidates WHERE id = $1 FOR UPDATE`,
      [decision.candidateId],
    );
    if (!candidateResult.rows[0]) throw new Error("Library growth candidate not found");
    if (!["pending_review", "pending_threshold"].includes(candidateResult.rows[0].proposed_status)) {
      throw new Error(`Candidate is not awaiting a decision (status: ${candidateResult.rows[0].proposed_status})`);
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

// ─── Draft node materialization ───────────────────────────────────────────────

/**
 * Curator/admin-only. Creates a disabled draft knowledge_topic node and links
 * it to the approved parent. Will NOT publish — that requires evidence.
 */
export async function materializeApprovedLibraryCandidate(
  candidateId: string,
  curatorUserId: string,
): Promise<{ topicId: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cResult = await client.query<{
      id: string; canonical_subject: string; category: string;
      desired_node_type: GrowthNodeType; parent_topic_id: string | null;
      geography_scope: string | null; proposed_status: string;
    }>(
      `SELECT id, canonical_subject, category, desired_node_type,
              parent_topic_id, geography_scope, proposed_status
       FROM library_growth_candidates WHERE id = $1 FOR UPDATE`,
      [candidateId],
    );
    const c = cResult.rows[0];
    if (!c) throw new Error("Library growth candidate not found");
    if (c.proposed_status !== "approved") throw new Error("Candidate must be curator-approved before materialization");

    // Check for an existing topic with the same name/category to avoid duplication
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
           status, enabled, is_user_created, created_by_user_id,
           tier, search_frequency_days, credibility_score, credibility_tier,
           notification_priority, topic_type, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,'draft',FALSE,FALSE,$7,
           'standard', 30, 0, 'standard', 'low', 'topic', NOW())`,
        [
          topicId,
          c.canonical_subject,
          c.category,
          c.desired_node_type,
          c.geography_scope,
          `Draft Library ${c.desired_node_type}: ${c.canonical_subject}. Pending evidence review.`,
          curatorUserId,
        ],
      );
    }

    // Validate parent/child hierarchy
    if (c.parent_topic_id) {
      // Guard against cycles: the parent must not itself be a child of the new node
      const cycleCheck = await client.query<{ count: string }>(
        `WITH RECURSIVE descendants AS (
           SELECT child_topic_id FROM topic_relationships WHERE parent_topic_id = $1
           UNION
           SELECT tr.child_topic_id FROM topic_relationships tr
           JOIN descendants d ON d.child_topic_id = tr.parent_topic_id
         )
         SELECT COUNT(*)::text AS count FROM descendants WHERE child_topic_id = $2`,
        [topicId, c.parent_topic_id],
      );
      if (parseInt(cycleCheck.rows[0]?.count ?? "0", 10) > 0) {
        throw new Error("Cycle detected: the requested parent is already a descendant of this node");
      }

      await client.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES ($1,$2,$3,'contains',1.0)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
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
       ) VALUES ($1,'materialized',$2,'Draft Library node created; publish requires verified sources.',$3,'{}')`,
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

// ─── Publication gate ─────────────────────────────────────────────────────────

/**
 * Called only after the curator has verified sources via the standard evidence workflow.
 * Requires ≥2 active authoritative/professional sources. Makes the node visible to members.
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
    throw new Error(
      "At least two active authoritative/professional sources are required before a Library node can be published",
    );
  }

  const updateResult = await pool.query(
    `UPDATE knowledge_topics
     SET status = 'published', enabled = TRUE
     WHERE id = $1 AND status = 'draft'
     RETURNING id`,
    [topicId],
  );
  if (updateResult.rowCount === 0) {
    throw new Error("Topic not found or is not in draft status — cannot publish");
  }
}

// ─── Kinfolk action resolution ────────────────────────────────────────────────

/**
 * Server-side lookup: find a published Library topic matching the intent class.
 * Returns a typed action for the Kinfolk response, or null if no match.
 * Never reveals candidate status or search demand information.
 */
export async function findMatchingPublishedLibraryNode(
  category: string,
  destination: string | null,
): Promise<{
  type: "open_library_node";
  topicId: string;
  focus: "evidence";
  label: string;
} | null> {
  try {
    let rows: { id: string; topic_name: string }[];
    if (destination) {
      // Try to find a travel/geography node for the destination
      ({ rows } = await pool.query<{ id: string; topic_name: string }>(
        `SELECT id, topic_name FROM knowledge_topics
         WHERE enabled = TRUE AND status = 'published'
           AND node_type = 'geography'
           AND (
             LOWER(topic_name) LIKE LOWER($1)
             OR LOWER(geography_ref) LIKE LOWER($1)
           )
         LIMIT 1`,
        [`%${destination}%`],
      ));
    } else {
      // Match by category
      ({ rows } = await pool.query<{ id: string; topic_name: string }>(
        `SELECT id, topic_name FROM knowledge_topics
         WHERE enabled = TRUE AND status = 'published'
           AND category = $1
           AND node_type IN ('book', 'general')
         ORDER BY credibility_score DESC NULLS LAST
         LIMIT 1`,
        [category],
      ));
    }

    if (!rows[0]) return null;
    return {
      type: "open_library_node",
      topicId: rows[0].id,
      focus: "evidence",
      label: `Open "${rows[0].topic_name}" in the Library`,
    };
  } catch {
    return null; // non-fatal — Kinfolk response proceeds without action
  }
}
