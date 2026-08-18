import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

export type CommunityVibe = {
  vibeKey: string;
  label: string;
  voices: number;
  evidenceCount: number;
  confidence: "emerging" | "growing" | "established";
  lastEvidenceAt: string;
};

export type CommunityVibesPayload = {
  businessId: string;
  voices: number;
  vibes: CommunityVibe[];
  contributionChoices: Array<{ vibeKey: string; label: string }>;
  updatedAt: string | null;
};

export class CommunityVibesRepository {
  constructor(private readonly pool: Pool) {}

  async getForBusiness(businessId: string): Promise<CommunityVibesPayload | null> {
    const businessResult = await this.pool.query<{ id: string; category: string | null }>(
      `SELECT id, category FROM businesses WHERE id = $1 LIMIT 1`,
      [businessId],
    );
    const business = businessResult.rows[0];
    if (!business) return null;

    const [vibesResult, choicesResult] = await Promise.all([
      this.pool.query<CommunityVibe>(
        `SELECT vibe_key AS "vibeKey", display_label AS label, voice_count AS voices,
                evidence_count AS "evidenceCount", confidence,
                last_evidence_at AS "lastEvidenceAt"
         FROM approved_business_vibes
         WHERE business_id = $1
         ORDER BY weighted_score DESC, voice_count DESC, display_label ASC
         LIMIT 7`,
        [businessId],
      ),
      this.pool.query<{ vibeKey: string; label: string }>(
        `SELECT vibe_key AS "vibeKey", display_label AS label
         FROM community_vibe_definitions
         WHERE active = true
           AND (cardinality(eligible_categories) = 0 OR $1 = ANY(eligible_categories))
         ORDER BY display_label ASC`,
        [business.category?.toLowerCase() ?? ""],
      ),
    ]);

    const vibes = vibesResult.rows;
    return {
      businessId,
      vibes,
      voices: Math.max(0, ...vibes.map((v) => v.voices)),
      contributionChoices: choicesResult.rows.filter(
        (choice) => !vibes.some((vibe) => vibe.vibeKey === choice.vibeKey),
      ),
      updatedAt: vibes[0]?.lastEvidenceAt ?? null,
    };
  }

  async submitMemberTags(input: {
    businessId: string;
    memberId: string;
    sourceId: string;
    vibeKeys: string[];
  }) {
    const vibeKeys = [...new Set(input.vibeKeys)].slice(0, 3);
    if (vibeKeys.length === 0) throw new Error("AT_LEAST_ONE_VIBE_REQUIRED");

    await this.pool.query("BEGIN");
    try {
      for (const vibeKey of vibeKeys) {
        await this.pool.query(
          `INSERT INTO business_vibe_evidence
             (id, business_id, vibe_key, source_type, source_id, contributor_id, moderation_status)
           VALUES ($1, $2, $3, 'member_tag', $4, $5, 'pending')
           ON CONFLICT (source_type, source_id, vibe_key) DO NOTHING`,
          [randomUUID(), input.businessId, vibeKey, input.sourceId, input.memberId],
        );
      }
      await this.pool.query("COMMIT");
    } catch (error) {
      await this.pool.query("ROLLBACK");
      throw error;
    }
  }
}
