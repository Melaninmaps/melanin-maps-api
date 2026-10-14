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

export function communityIntelligenceCollectionEnabled(): boolean {
  return process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED === "true";
}

/**
 * Community Intelligence remains source-disabled until its reviewed additive
 * migration has been explicitly applied. Runtime requests must never create or
 * alter production tables: that would bypass the required migration approval.
 */
export async function communityIntelligenceSchemaAvailable(): Promise<boolean> {
  const result = await pool.query<{
    preferences_table: string | null;
    events_table: string | null;
  }>(`
    SELECT
      to_regclass('public.kinfolk_community_intelligence_preferences') AS preferences_table,
      to_regclass('public.kinfolk_community_intelligence_events') AS events_table
  `);
  const schema = result.rows[0];
  return Boolean(schema?.preferences_table && schema.events_table);
}

export class CommunityIntelligenceStorageUnavailable extends Error {
  constructor(message = "Community Intelligence storage is unavailable until its approved migration is applied.") {
    super(message);
    this.name = "CommunityIntelligenceStorageUnavailable";
  }
}

async function requireCommunityIntelligenceSchema(): Promise<void> {
  if (!(await communityIntelligenceSchemaAvailable())) {
    throw new CommunityIntelligenceStorageUnavailable();
  }
}

async function readCommunityIntelligencePreference(
  userId: string,
): Promise<CommunityIntelligencePreference> {
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

export async function getCommunityIntelligencePreference(
  userId: string,
): Promise<CommunityIntelligencePreference> {
  if (!communityIntelligenceCollectionEnabled()) {
    return { participationEnabled: false, collectionEnabled: false };
  }
  if (!(await communityIntelligenceSchemaAvailable())) {
    return { participationEnabled: false, collectionEnabled: false };
  }
  return readCommunityIntelligencePreference(userId);
}

export async function setCommunityIntelligenceParticipation(
  userId: string,
  participationEnabled: boolean,
): Promise<CommunityIntelligencePreference> {
  if (!communityIntelligenceCollectionEnabled()) {
    throw new CommunityIntelligenceStorageUnavailable(
      "Community Intelligence collection is not enabled in this environment.",
    );
  }
  await requireCommunityIntelligenceSchema();
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
  if (!communityIntelligenceCollectionEnabled()) {
    return { recorded: false, reason: "collection_disabled" };
  }
  if (!(await communityIntelligenceSchemaAvailable())) {
    return { recorded: false, reason: "collection_disabled" };
  }
  const preference = await readCommunityIntelligencePreference(input.userId);
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
  await requireCommunityIntelligenceSchema();
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
  await requireCommunityIntelligenceSchema();
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
