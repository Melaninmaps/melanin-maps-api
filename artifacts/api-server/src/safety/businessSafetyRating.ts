import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const SAFETY_RATING_THRESHOLD = 3;
const SEVERITY_WEIGHTS: Record<string, number> = {
  low: 0.2,
  medium: 0.5,
  high: 1.0,
  critical: 2.0,
};

export async function updateBusinessSafetyRating(businessId: string): Promise<void> {
  try {
    const result = await pool.query<{ severity: string; count: string }>(
      `SELECT severity, COUNT(*)::text AS count
       FROM safety_reports
       WHERE target_id = $1
         AND target_type = 'business'
         AND status = 'approved'
       GROUP BY severity`,
      [businessId],
    );

    let totalReports = 0;
    let totalWeight = 0;
    for (const row of result.rows) {
      const count = Number.parseInt(row.count, 10);
      totalReports += count;
      totalWeight += (SEVERITY_WEIGHTS[row.severity] ?? 0.5) * count;
    }
    if (totalReports < SAFETY_RATING_THRESHOLD) return;

    const safetyRating = Math.max(0, 5 - totalWeight).toFixed(1);
    await pool.query("UPDATE businesses SET safety_rating = $1 WHERE id = $2", [safetyRating, businessId]);
    logger.info({ businessId, safetyRating, totalReports }, "[safety] business safety rating updated from approved reports");
  } catch (error) {
    logger.error({ error }, "[safety] failed to update business safety rating");
  }
}
