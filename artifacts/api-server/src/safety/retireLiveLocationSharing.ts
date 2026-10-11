import { db, locationSharesTable } from "@workspace/db";
import { eq, isNotNull, or } from "drizzle-orm";

/**
 * Live member-location sharing has been retired. These helpers remove the only
 * fields that could contain current or recent coordinates without touching
 * Safety Check-Ins, trusted-contact relationships, or safety reports.
 */
const retirementValues = {
  isActive: false,
  currentLat: null,
  currentLng: null,
  lastUpdatedAt: null,
} as const;

export async function retireLocationSharesForMember(memberId: string): Promise<void> {
  await db
    .update(locationSharesTable)
    .set(retirementValues)
    .where(eq(locationSharesTable.sharerId, memberId));
}

/**
 * Runs before traffic acceptance. This is deliberately independent of feature
 * release mode: a retired privacy-sensitive capability must not retain legacy
 * coordinates merely because background writers are disabled. The operation is
 * idempotent and affects only legacy location-share rows with an active flag or
 * a retained coordinate.
 */
export async function retireAllLegacyLocationShares(): Promise<number> {
  const retired = await db
    .update(locationSharesTable)
    .set(retirementValues)
    .where(
      or(
        eq(locationSharesTable.isActive, true),
        isNotNull(locationSharesTable.currentLat),
        isNotNull(locationSharesTable.currentLng),
      ),
    )
    .returning({ id: locationSharesTable.id });
  return retired.length;
}
