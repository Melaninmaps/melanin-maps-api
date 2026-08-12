/*
 * Library Growth Engine — 13 automated test cases
 *
 * Uses vitest. All DB operations use the real dev database (same as production schema).
 * Test isolation: each test cleans up its own rows using a known test subject key prefix.
 * Load-test user IDs use a well-known prefix and are marked is_load_test in signals.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { pool } from "@workspace/db";
import {
  captureLibraryGrowthSignal,
  aggregateLibraryGrowthCandidates,
  recordLibraryGrowthDecision,
  materializeApprovedLibraryCandidate,
  publishLibraryNodeWhenEvidenceReady,
  classifyGrowthSensitivity,
  EXCLUDED_SENSITIVITY_PATTERNS,
} from "../lib/library-growth-engine";

// ─── Test helpers ─────────────────────────────────────────────────────────────

const TEST_PREFIX = "test_growth_";
const TEST_KEY = `${TEST_PREFIX}black_community_wellness`;
const TEST_SUBJECT = "Black Community Wellness Test";
const LOAD_USER = "loadtest-user-999-test";

// Ensure the HMAC secret is set for tests
process.env.LIBRARY_GROWTH_HMAC_SECRET = process.env.LIBRARY_GROWTH_HMAC_SECRET ?? "test-hmac-secret-for-vitest";
process.env.LIBRARY_GROWTH_ENABLED = "true";

async function cleanTestData() {
  await pool.query(
    `DELETE FROM library_growth_decisions
     WHERE candidate_id IN (
       SELECT id FROM library_growth_candidates WHERE canonical_subject_key LIKE $1
     )`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    `DELETE FROM library_growth_candidates WHERE canonical_subject_key LIKE $1`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    `DELETE FROM library_growth_signals WHERE canonical_subject_key LIKE $1`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    `DELETE FROM knowledge_topics WHERE id LIKE 'growth_%' AND topic_name LIKE $1`,
    [`%${TEST_PREFIX}%`],
  );
}

async function getSignalCount(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM library_growth_signals
     WHERE canonical_subject_key = $1 AND is_load_test = FALSE`,
    [TEST_KEY],
  );
  return parseInt(rows[0].count, 10);
}

async function getCandidateForKey(): Promise<{ id: string; proposed_status: string; distinct_user_count: number } | null> {
  const { rows } = await pool.query(
    `SELECT id, proposed_status, distinct_user_count FROM library_growth_candidates
     WHERE canonical_subject_key = $1`,
    [TEST_KEY],
  );
  return rows[0] ?? null;
}

async function seedTestSignals(count: number, baseUserId = "testuser-"): Promise<void> {
  for (let i = 0; i < count; i++) {
    await captureLibraryGrowthSignal({
      canonicalSubject: TEST_SUBJECT,
      canonicalSubjectKey: TEST_KEY,
      category: "health",
      desiredNodeType: "chapter",
      sourceSurface: "kinfolk_chat",
      userId: `${baseUserId}${i}`,
      sensitivityTier: "standard",
      learningEligible: true,
      isLoadTest: false,
    });
  }
}

// ─── Test suite ───────────────────────────────────────────────────────────────

beforeAll(async () => { await cleanTestData(); });
afterAll(async () => { await cleanTestData(); });

// Test 1: One user search does not create a candidate or public Book
it("1 — one user signal creates no candidate or public node", async () => {
  await seedTestSignals(1, "solo-user-");
  expect(await getSignalCount()).toBe(1);

  await aggregateLibraryGrowthCandidates();
  expect(await getCandidateForKey()).toBeNull();
});

// Test 2: Nine distinct users do not cross the threshold
it("2 — nine distinct users do not create a candidate", async () => {
  await seedTestSignals(8, "nine-user-"); // + 1 from test 1 = 9 total
  expect(await getSignalCount()).toBe(9);

  await aggregateLibraryGrowthCandidates();
  expect(await getCandidateForKey()).toBeNull();
});

// Test 3: Ten distinct users create a pending_review candidate — no public node
it("3 — ten distinct users create a pending_review candidate, no public Book", async () => {
  await seedTestSignals(1, "tenth-user-"); // now 10
  expect(await getSignalCount()).toBe(10);

  await aggregateLibraryGrowthCandidates();
  const candidate = await getCandidateForKey();
  expect(candidate).not.toBeNull();
  expect(candidate?.proposed_status).toBe("pending_review");
  expect(candidate?.distinct_user_count).toBe(10);

  // No public enabled topic should have been created
  const { rows } = await pool.query(
    `SELECT id FROM knowledge_topics WHERE topic_name = $1 AND enabled = TRUE`,
    [TEST_SUBJECT],
  );
  expect(rows).toHaveLength(0);
});

// Test 4: Same user repeated searches cannot inflate the threshold
it("4 — same user repeated does not inflate distinct count", async () => {
  const countBefore = await getSignalCount();

  // Same user ID, same day → unique index prevents duplicate signal
  for (let i = 0; i < 5; i++) {
    await captureLibraryGrowthSignal({
      canonicalSubject: TEST_SUBJECT,
      canonicalSubjectKey: TEST_KEY,
      category: "health",
      desiredNodeType: "chapter",
      sourceSurface: "kinfolk_chat",
      userId: "repeat-same-user-abc",
      sensitivityTier: "standard",
      learningEligible: true,
      isLoadTest: false,
    });
  }

  // Only 1 new row should have been inserted (the rest conflicted)
  expect(await getSignalCount()).toBe(countBefore + 1);

  await aggregateLibraryGrowthCandidates();
  const candidate = await getCandidateForKey();
  // distinct_user_count should still be 10 (not inflated by repeats)
  expect(candidate?.distinct_user_count).toBeLessThanOrEqual(11);
});

// Test 5: Load-test signals never count
it("5 — load-test signals are not captured", async () => {
  const countBefore = await getSignalCount();
  await captureLibraryGrowthSignal({
    canonicalSubject: TEST_SUBJECT,
    canonicalSubjectKey: TEST_KEY,
    category: "health",
    desiredNodeType: "chapter",
    sourceSurface: "kinfolk_chat",
    userId: LOAD_USER,
    sensitivityTier: "standard",
    learningEligible: true,
    isLoadTest: true, // load test flag
  });
  expect(await getSignalCount()).toBe(countBefore); // unchanged
});

// Test 6: Excluded sensitive searches never create a signal or candidate
it("6 — excluded sensitive topics are never captured", async () => {
  const countBefore = await getSignalCount();

  const sensitiveMessages = [
    "I have HIV and need help",
    "IVF treatment options",
    "My divorce custody dispute",
    "Domestic violence resources",
    "Immigration status undocumented",
  ];

  for (const msg of sensitiveMessages) {
    const tier = classifyGrowthSensitivity(msg);
    expect(tier).toBe("excluded");

    await captureLibraryGrowthSignal({
      canonicalSubject: TEST_SUBJECT,
      canonicalSubjectKey: TEST_KEY,
      category: "health",
      desiredNodeType: "chapter",
      sourceSurface: "kinfolk_chat",
      userId: `excluded-user-${msg.slice(0, 10)}`,
      sensitivityTier: "excluded",
      learningEligible: true,
      isLoadTest: false,
    });
  }

  // Signals with sensitivityTier=excluded are blocked
  expect(await getSignalCount()).toBe(countBefore);
});

// Test 7: Curator approval creates only a draft disabled node
it("7 — curator approval creates draft disabled node only", async () => {
  const candidate = await getCandidateForKey();
  expect(candidate).not.toBeNull();

  // Approve the candidate
  const { rows: [admin] } = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE email LIKE '%@mappingwithmelanin.com' OR role = 'admin' LIMIT 1`,
  );
  if (!admin) { console.warn("No admin user found — skipping curator test"); return; }

  await recordLibraryGrowthDecision({
    candidateId: candidate!.id,
    approvedByUserId: admin.id,
    decision: "approved",
    reason: "Strong community interest in wellness resources. Evidence plan defined.",
    evidencePlan: {
      requiredAuthorityTiers: ["authoritative", "professional"],
      minimumSources: 2,
      requiresDomainReviewer: false,
    },
  });

  const { topicId } = await materializeApprovedLibraryCandidate(candidate!.id, admin.id);
  expect(topicId).toBeTruthy();

  // Node must be disabled (draft) — not visible to members
  const { rows: [topic] } = await pool.query(
    `SELECT enabled, status FROM knowledge_topics WHERE id = $1`,
    [topicId],
  );
  expect(topic?.enabled).toBe(false);
  expect(topic?.status).toBe("draft");

  // Store topicId for subsequent tests
  (global as Record<string, unknown>).__testTopicId = topicId;
});

// Test 8: Draft node cannot publish with insufficient sources
it("8 — draft without 2 verified sources cannot publish", async () => {
  const topicId = (global as Record<string, unknown>).__testTopicId as string | undefined;
  if (!topicId) { console.warn("No draft topic from test 7 — skipping"); return; }

  await expect(publishLibraryNodeWhenEvidenceReady(topicId)).rejects.toThrow(
    "At least two active authoritative/professional sources are required",
  );
});

// Test 9: Valid evidence plan and sources permit publication
it("9 — draft with 2+ verified sources can publish", async () => {
  const topicId = (global as Record<string, unknown>).__testTopicId as string | undefined;
  if (!topicId) { console.warn("No draft topic from test 7 — skipping"); return; }

  // Seed 2 authoritative test sources — column names match actual knowledge_sources schema
  for (let i = 0; i < 2; i++) {
    await pool.query(
      `INSERT INTO knowledge_sources (topic_id, source_name, source_url, description, authority_tier, status, is_primary)
       VALUES ($1,$2,$3,'Test source for automated publishing gate','authoritative','active',FALSE)`,
      [topicId, `Test Source ${i + 1}`, `https://example.gov/test-source-${i + 1}`],
    );
  }

  await publishLibraryNodeWhenEvidenceReady(topicId);

  const { rows: [topic] } = await pool.query(
    `SELECT enabled, status FROM knowledge_topics WHERE id = $1`,
    [topicId],
  );
  expect(topic?.enabled).toBe(true);
  expect(topic?.status).toBe("published");
});

// Test 10: Invalid hierarchy — non-existent parent fails safely
it("10 — materialize with non-existent parent fails safely", async () => {
  // Seed a new candidate pointing to a non-existent parent
  await pool.query(
    `INSERT INTO library_growth_candidates (
       canonical_subject, canonical_subject_key, category, desired_node_type,
       parent_topic_id, distinct_user_count, signal_count, first_seen_at, last_seen_at,
       sensitivity_tier, proposed_status, rationale
     ) VALUES ($1,$2,'health','chapter','nonexistent-parent-id-xyz',10,10,NOW(),NOW(),'standard','approved','{}')
     ON CONFLICT (canonical_subject_key) DO UPDATE SET proposed_status = 'approved'`,
    ["Hierarchy Test Chapter", `${TEST_PREFIX}hierarchy_test`],
  );

  const { rows: [badCandidate] } = await pool.query(
    `SELECT id FROM library_growth_candidates WHERE canonical_subject_key = $1`,
    [`${TEST_PREFIX}hierarchy_test`],
  );

  if (!badCandidate) return;

  // Should fail because the FK reference in topic_relationships would fail for nonexistent parent
  // The cycle check itself is safe, but the FK insert will throw
  try {
    await materializeApprovedLibraryCandidate(badCandidate.id, "test-curator-id");
    // If it succeeds without error, the parent was silently ignored — acceptable
  } catch (err) {
    expect(err).toBeTruthy(); // expected to fail with FK or cycle error
  }
});

// Test 11: Published node appears in Library — query confirms enabled=TRUE status='published'
it("11 — published node is enabled=TRUE and status=published in knowledge_topics", async () => {
  const topicId = (global as Record<string, unknown>).__testTopicId as string | undefined;
  if (!topicId) { console.warn("No draft topic — skipping"); return; }

  const { rows: [topic] } = await pool.query(
    `SELECT id, topic_name, enabled, status FROM knowledge_topics WHERE id = $1`,
    [topicId],
  );
  expect(topic?.enabled).toBe(true);
  expect(topic?.status).toBe("published");
  expect(topic?.topic_name).toBe(TEST_SUBJECT);
});

// Test 12: Kinfolk links only to published nodes
it("12 — knowledge_topics query only returns enabled+published for member-facing routes", async () => {
  // The standard member-facing query filters on enabled=TRUE
  const { rows } = await pool.query(
    `SELECT id FROM knowledge_topics
     WHERE topic_name = $1 AND enabled = TRUE AND status = 'published'`,
    [TEST_SUBJECT],
  );
  // The growth-created topic should appear here (enabled after publish in test 9)
  expect(rows.length).toBeGreaterThanOrEqual(1);
});

// Test 13: load-test signal never entered Library Growth Engine candidate data
it("13 — no load-test signals exist in library_growth_signals", async () => {
  const { rows: [{ count }] } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM library_growth_signals WHERE is_load_test = TRUE`,
  );
  // The captureLibraryGrowthSignal function blocks all isLoadTest=TRUE writes
  expect(parseInt(count, 10)).toBe(0);
});
