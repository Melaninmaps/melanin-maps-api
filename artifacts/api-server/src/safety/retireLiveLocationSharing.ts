import { db, locationSharesTable, pool } from "@workspace/db";
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
  // The former community-alert path separately retained current member
  // coordinates, while old Check-Ins accepted a free-text location. Clear both
  // sources before traffic so no stale Safety record can expose location data.
  const userLocations = await pool.query("DELETE FROM user_locations");
  const checkins = await pool.query(
    "UPDATE safety_checkins SET location = NULL, city = NULL WHERE location IS NOT NULL OR city IS NOT NULL",
  );
  const meetups = await pool.query(
    "UPDATE meetup_verifications SET location = NULL WHERE location IS NOT NULL",
  );
  return retired.length + (userLocations.rowCount ?? 0) + (checkins.rowCount ?? 0) + (meetups.rowCount ?? 0);
}
