import { pool } from "@workspace/db";
import type { MembershipTier } from "../middleware/requireMembership";

export interface TierLimits {
  aiPoolMonthly: number;        // -1 = unlimited
  savedPlaces: number;          // -1 = unlimited
  savedTopicsMax: number;       // -1 = unlimited
  familySeatsIncluded: number;  // free seats beyond primary
  addOnSeatPriceCents: number;  // cents per additional seat/mo
  circlesCreate: number;        // -1 = unlimited
  circlesJoin: number;          // -1 = unlimited
  lifeJourneys: number;         // -1 = unlimited
  showLoveNominationsMonthly: number; // -1 = unlimited
  digestFrequencies: readonly string[];
  familyMemberAccess: string;   // human-readable description
}

export const TIER_LIMITS: Record<MembershipTier, TierLimits> = {
  free: {
    aiPoolMonthly: 0,
    savedPlaces: 30,
    savedTopicsMax: 5,
    familySeatsIncluded: 0,
    addOnSeatPriceCents: 0,
    circlesCreate: 0,
    circlesJoin: 3,
    lifeJourneys: 0,
    showLoveNominationsMonthly: 3,
    digestFrequencies: ["weekly"],
    familyMemberAccess: "Not included",
  },
  navigator: {
    aiPoolMonthly: 30,
    savedPlaces: 150,
    savedTopicsMax: 20,
    familySeatsIncluded: 1,
    addOnSeatPriceCents: 299,
    circlesCreate: 1,
    circlesJoin: 5,
    lifeJourneys: 1,
    showLoveNominationsMonthly: -1,
    digestFrequencies: ["weekly", "daily"],
    familyMemberAccess: "Safety alerts, search, community feed, trip viewing",
  },
  trailblazer: {
    aiPoolMonthly: 100,
    savedPlaces: 500,
    savedTopicsMax: 50,
    familySeatsIncluded: 1,
    addOnSeatPriceCents: 399,
    circlesCreate: 3,
    circlesJoin: 15,
    lifeJourneys: 3,
    showLoveNominationsMonthly: -1,
    digestFrequencies: ["weekly", "daily"],
    familyMemberAccess: "Safety, search, travel planning, location sharing, trip join",
  },
  community_builder: {
    aiPoolMonthly: 300,
    savedPlaces: -1,
    savedTopicsMax: -1,
    familySeatsIncluded: 1,
    addOnSeatPriceCents: 499,
    circlesCreate: 10,
    circlesJoin: -1,
    lifeJourneys: -1,
    showLoveNominationsMonthly: -1,
    digestFrequencies: ["weekly", "daily", "realtime"],
    familyMemberAccess: "Full community, circles, events, AI pool access",
  },
  legacy_member: {
    aiPoolMonthly: -1,
    savedPlaces: -1,
    savedTopicsMax: -1,
    familySeatsIncluded: 1,
    addOnSeatPriceCents: 699,
    circlesCreate: -1,
    circlesJoin: -1,
    lifeJourneys: -1,
    showLoveNominationsMonthly: -1,
    digestFrequencies: ["weekly", "daily", "realtime"],
    familyMemberAccess: "Full platform — unlimited AI from shared pool",
  },
};

export function formatLimit(val: number, unit = ""): string {
  if (val === -1) return "Unlimited";
  if (val === 0) return "Not included";
  return `${val}${unit ? ` ${unit}` : ""}`;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Map a user's memberType string to a canonical MembershipTier. */
export function getTierFromMemberType(memberType: string | null | undefined): MembershipTier {
  const map: Record<string, MembershipTier> = {
    navigator: "navigator",
    trailblazer: "trailblazer",
    community_builder: "community_builder",
    founding: "legacy_member",
    beta: "legacy_member",
    legacy_member: "legacy_member",
  };
  return map[memberType ?? ""] ?? "free";
}

function getCurrentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Get the family circle ID for a user (their own circle ID if owner,
 * or the owner's circle ID if they are a member).
 * Falls back to userId if no circle exists.
 */
export async function getFamilyCircleId(userId: string): Promise<string> {
  try {
    // Check if they own a circle
    const owned = await pool.query(
      `SELECT id FROM family_circles WHERE owner_id = $1 LIMIT 1`,
      [userId]
    );
    if (owned.rows[0]) return owned.rows[0].id as string;

    // Check if they are a member of someone's circle
    const membership = await pool.query(
      `SELECT circle_id FROM family_circle_members WHERE user_id = $1 AND status = 'accepted' LIMIT 1`,
      [userId]
    );
    if (membership.rows[0]) return membership.rows[0].circle_id as string;
  } catch {
    // fall through
  }
  return userId;
}

/**
 * Check AI pool availability for a user.
 * Returns { allowed, used, limit, circleId }
 */
export async function checkAiPool(userId: string, tier: MembershipTier): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  circleId: string;
}> {
  const limit = TIER_LIMITS[tier].aiPoolMonthly;

  // Free tier: no AI
  if (limit === 0) return { allowed: false, used: 0, limit: 0, circleId: userId };

  // Unlimited tier
  if (limit === -1) return { allowed: true, used: 0, limit: -1, circleId: userId };

  const circleId = await getFamilyCircleId(userId);
  const yearMonth = getCurrentYearMonth();

  const row = await pool.query(
    `SELECT requests_used FROM family_ai_usage WHERE circle_id = $1 AND year_month = $2`,
    [circleId, yearMonth]
  );
  const used = (row.rows[0]?.requests_used as number) ?? 0;

  return { allowed: used < limit, used, limit, circleId };
}

/**
 * Increment AI usage for a circle/user after a successful AI call.
 */
export async function incrementAiUsage(circleId: string): Promise<void> {
  const yearMonth = getCurrentYearMonth();
  await pool.query(
    `INSERT INTO family_ai_usage (circle_id, year_month, requests_used, updated_at)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (circle_id, year_month)
     DO UPDATE SET requests_used = family_ai_usage.requests_used + 1, updated_at = now()`,
    [circleId, yearMonth]
  );
}

/**
 * Get current AI usage for display (no side effects).
 */
export async function getAiUsage(userId: string, tier: MembershipTier): Promise<{
  used: number;
  limit: number;
  circleId: string;
  yearMonth: string;
}> {
  const limit = TIER_LIMITS[tier].aiPoolMonthly;
  if (limit === 0) return { used: 0, limit: 0, circleId: userId, yearMonth: getCurrentYearMonth() };

  const circleId = await getFamilyCircleId(userId);
  const yearMonth = getCurrentYearMonth();

  if (limit === -1) return { used: 0, limit: -1, circleId, yearMonth };

  const row = await pool.query(
    `SELECT requests_used FROM family_ai_usage WHERE circle_id = $1 AND year_month = $2`,
    [circleId, yearMonth]
  );
  const used = (row.rows[0]?.requests_used as number) ?? 0;

  return { used, limit, circleId, yearMonth };
}

/** Get total accepted family members for a circle owner */
export async function getFamilyMemberCount(ownerId: string): Promise<number> {
  const circleRow = await pool.query(
    `SELECT id FROM family_circles WHERE owner_id = $1 LIMIT 1`,
    [ownerId]
  );
  if (!circleRow.rows[0]) return 0;

  const countRow = await pool.query(
    `SELECT count(*)::int AS cnt FROM family_circle_members
     WHERE circle_id = $1 AND status = 'accepted' AND role != 'owner'`,
    [circleRow.rows[0].id]
  );
  return (countRow.rows[0]?.cnt as number) ?? 0;
}
