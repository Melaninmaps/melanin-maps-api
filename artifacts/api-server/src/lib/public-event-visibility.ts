/**
 * The `events.date` column is a varchar containing a calendar date, not a
 * timestamp. Compare calendar days in UTC so a date-only value does not become
 * yesterday when the API process runs west of UTC.
 */
export function isUpcomingOneOffEventDate(value: string, now = new Date()): boolean {
  const eventDate = new Date(value);
  if (Number.isNaN(eventDate.getTime())) return false;

  const eventDay = Date.UTC(
    eventDate.getUTCFullYear(),
    eventDate.getUTCMonth(),
    eventDate.getUTCDate(),
  );
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return eventDay >= today;
}