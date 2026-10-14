import { pool } from "@workspace/db";
import {
  type CommunityIntelligenceSuggestion,
  type CommunitySuggestionAction,
  rankCommunityIntelligenceSuggestions,
} from "./policy";

export const COMMUNITY_INTELLIGENCE_MIN_COHORT = 5;
const COMMUNITY_INTELLIGENCE_RETENTION_DAYS = 180;

export type CommunityIntelligencePreference = Readonly<{
  participationEnabled: boolean;
  collectionEnabled: boolean;
}>;

export type CommunityIntelligenceGap = Readonly<{
  journeyType: "wedding" | "birthday";
  stage: "inspiration";
  categoryKey: string;
  coverage: "enough_community_input";
  timeWindow: "last_90_days";
  explanation: string;
}>;

let schemaReady: Promise<void> | null = null;

export function communityIntelligenceCollectionEnabled(): boolean {
  return process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED === "true";
}

/**
 * The schema intentionally has no question text, notes, message IDs, location,
 * profile, memory, document, calendar, or sensitive-category fields.
 */
export async function ensureCommunityIntelligenceSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS kinfolk_community_intelligence_preferences (
          user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          participation_enabled BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          revoked_at TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS kinfolk_community_intelligence_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          journey_type VARCHAR(24) NOT NULL CHECK (journey_type IN ('wedding', 'birthday')),
          journey_stage VARCHAR(24) NOT NULL CHECK (journey_stage IN ('inspiration')),
          intent VARCHAR(24) NOT NULL CHECK (intent IN ('planning')),
          category_key VARCHAR(80) NOT NULL,
          action VARCHAR(24) NOT NULL CHECK (action IN ('helpful', 'not_relevant', 'already_handled')),
          collection_version VARCHAR(24) NOT NULL DEFAULT 'v1',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '${COMMUNITY_INTELLIGENCE_RETENTION_DAYS} days'),
          revoked_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS kinfolk_ci_events_active_aggregate_idx
          ON kinfolk_community_intelligence_events (journey_type, journey_stage, category_key, action, created_at DESC)
          WHERE revoked_at IS NULL;
        CREATE INDEX IF NOT EXISTS kinfolk_ci_events_user_active_idx
          ON kinfolk_community_intelligence_events (user_id, created_at DESC)
          WHERE revoked_at IS NULL;
      `)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  await schemaReady;
}

export async function getCommunityIntelligencePreference(userId: string): Promise<CommunityIntelligencePreference> {
  await ensureCommunityIntelligenceSchema();
  const result = await pool.query<{ participation_enabled: boolean }>(
    `SELECT participation_enabled
       FROM kinfolk_community_intelligence_preferences
      WHERE user_id = $1`,
    [userId],
  );
  return {
    participationEnabled: result.rows[0]?.participation_enabled === true,
    collectionEnabled: communityIntelligenceCollectionEnabled(),
  };
}

export async function setCommunityIntelligenceParticipation(
  userId: string,
  participationEnabled: boolean,
): Promise<CommunityIntelligencePreference> {
  await ensureCommunityIntelligenceSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO kinfolk_community_intelligence_preferences
         (user_id, participation_enabled, created_at, updated_at, revoked_at)
       VALUES ($1, $2, NOW(), NOW(), CASE WHEN $2 THEN NULL ELSE NOW() END)
       ON CONFLICT (user_id)
       DO UPDATE SET participation_enabled = EXCLUDED.participation_enabled,
                     updated_at = NOW(),
                     revoked_at = CASE WHEN EXCLUDED.participation_enabled THEN NULL ELSE NOW() END`,
      [userId, participationEnabled],
    );
    if (!participationEnabled) {
      await client.query(
        `UPDATE kinfolk_community_intelligence_events
            SET revoked_at = NOW()
          WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  return { participationEnabled, collectionEnabled: communityIntelligenceCollectionEnabled() };
}

export async function recordCommunityIntelligenceFeedback(input: Readonly<{
  userId: string;
  journeyType: "wedding" | "birthday";
  stage: "inspiration";
  intent: "planning";
  categoryKey: string;
  action: CommunitySuggestionAction;
}>): Promise<Readonly<{ recorded: boolean; reason?: "collection_disabled" | "participation_required" }>> {
  await ensureCommunityIntelligenceSchema();
  if (!communityIntelligenceCollectionEnabled()) {
    return { recorded: false, reason: "collection_disabled" };
  }
  const preference = await getCommunityIntelligencePreference(input.userId);
  if (!preference.participationEnabled) {
    return { recorded: false, reason: "participation_required" };
  }
  await pool.query(
    `INSERT INTO kinfolk_community_intelligence_events
       (user_id, journey_type, journey_stage, intent, category_key, action, created_at, expires_at, revoked_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '${COMMUNITY_INTELLIGENCE_RETENTION_DAYS} days', NULL)`,
    [input.userId, input.journeyType, input.stage, input.intent, input.categoryKey, input.action],
  );
  return { recorded: true };
}

/** Returns only category keys that already clear the member-suppression threshold. */
export async function getSuppressedSafeCategoryKeys(
  journeyType: "wedding" | "birthday",
): Promise<string[]> {
  if (!communityIntelligenceCollectionEnabled()) return [];
  await ensureCommunityIntelligenceSchema();
  const result = await pool.query<{ category_key: string }>(
    `SELECT category_key
       FROM kinfolk_community_intelligence_events
      WHERE journey_type = $1
        AND action = 'helpful'
        AND revoked_at IS NULL
        AND expires_at > NOW()
        AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY category_key
     HAVING COUNT(DISTINCT user_id) >= $2
      LIMIT 12`,
    [journeyType, COMMUNITY_INTELLIGENCE_MIN_COHORT],
  );
  return result.rows.map((row) => row.category_key);
}

export async function rankSuggestionsWithCommunitySignals(
  suggestions: readonly CommunityIntelligenceSuggestion[],
): Promise<CommunityIntelligenceSuggestion[]> {
  if (suggestions.length === 0) return [];
  try {
    const supportedCategoryKeys = await getSuppressedSafeCategoryKeys(suggestions[0].journeyType);
    return rankCommunityIntelligenceSuggestions(suggestions, supportedCategoryKeys);
  } catch {
    // Community learning is additive. A schema/read outage may not suppress the
    // foundational, safe journey guidance or turn it into a fabricated claim.
    return [...suggestions];
  }
}

export async function getCommunityIntelligenceGaps(): Promise<CommunityIntelligenceGap[]> {
  if (!communityIntelligenceCollectionEnabled()) return [];
  await ensureCommunityIntelligenceSchema();
  const result = await pool.query<{
    journey_type: "wedding" | "birthday";
    journey_stage: "inspiration";
    category_key: string;
  }>(
    `SELECT journey_type, journey_stage, category_key
       FROM kinfolk_community_intelligence_events
      WHERE action = 'helpful'
        AND revoked_at IS NULL
        AND expires_at > NOW()
        AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY journey_type, journey_stage, category_key
     HAVING COUNT(DISTINCT user_id) >= $1
      ORDER BY journey_type, category_key
      LIMIT 30`,
    [COMMUNITY_INTELLIGENCE_MIN_COHORT],
  );
  return result.rows.map((row) => ({
    journeyType: row.journey_type,
    stage: row.journey_stage,
    categoryKey: row.category_key,
    coverage: "enough_community_input" as const,
    timeWindow: "last_90_days" as const,
    explanation: "This category has enough opted-in, non-identifying community input to review. It does not identify members or establish a business listing.",
  }));
}
