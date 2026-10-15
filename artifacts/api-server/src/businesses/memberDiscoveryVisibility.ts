import { sql, type SQLWrapper } from "drizzle-orm";

/**
 * The public_businesses view is the one discovery gate for non-admin product
 * surfaces. It excludes archived, duplicate, queued-review, and otherwise
 * non-public business records without mutating their retained source history.
 */
export function isMemberDiscoverableBusiness(businessId: SQLWrapper) {
  return sql`EXISTS (
    SELECT 1
      FROM public.public_businesses member_visible_business
     WHERE member_visible_business.id = ${businessId}
  )`;
}
