import type { QueryResult, QueryResultRow } from "pg";
import { logger } from "../lib/logger";

const SAFETY_RATING_THRESHOLD = 3;
const SEVERITY_WEIGHTS: Record<string, number> = {
  low: 0.2,
  medium: 0.5,
  high: 1.0,
  critical: 2.0,
};

export interface SafetyProjectionQuery {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export async function updateBusinessSafetyRating(
  businessId: string,
  queryable: SafetyProjectionQuery,
): Promise<void> {
  await queryable.query(
    "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
    [`business-safety-rating|${businessId}`],
  );
  const result = await queryable.query<{ severity: string; count: string }>(
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

  if (totalReports < SAFETY_RATING_THRESHOLD) {
    // Clear the report-derived projection first. If restoring the independent
    // experience aggregate fails, the transaction rolls back rather than
    // acknowledging stale public state.
    await queryable.query("UPDATE businesses SET safety_rating = NULL WHERE id = $1", [businessId]);
    const experienceResult = await queryable.query<{ rating: string | null }>(
      `SELECT ROUND(AVG(overall_safety)::numeric, 2)::text AS rating
       FROM business_safety_submissions
       WHERE business_id = $1`,
      [businessId],
    );
    const fallbackRating = experienceResult.rows[0]?.rating ?? null;
    if (fallbackRating !== null) {
      await queryable.query("UPDATE businesses SET safety_rating = $1 WHERE id = $2", [fallbackRating, businessId]);
    }
    logger.info(
      { businessId, totalReports, fallbackRating },
      "[safety] business safety rating restored after approved evidence changed",
    );
    return;
  }

  const safetyRating = Math.max(0, 5 - totalWeight).toFixed(1);
  await queryable.query("UPDATE businesses SET safety_rating = $1 WHERE id = $2", [safetyRating, businessId]);
  logger.info({ businessId, safetyRating, totalReports }, "[safety] business safety rating updated from approved reports");
}
