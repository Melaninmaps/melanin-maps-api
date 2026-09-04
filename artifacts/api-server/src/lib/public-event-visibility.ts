/**
 * The `events.date` column is a varchar containing a calendar date, not a
 * timestamp. Parse supported date-only formats directly so the API process
 * timezone cannot shift the stored calendar day.
 */

type CalendarDay = { year: number; month: number; day: number };

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function validCalendarDay(day: CalendarDay): CalendarDay | null {
  if (!Number.isInteger(day.year) || !Number.isInteger(day.month) || !Number.isInteger(day.day)) return null;
  const candidate = new Date(Date.UTC(day.year, day.month - 1, day.day));
  return candidate.getUTCFullYear() === day.year
    && candidate.getUTCMonth() === day.month - 1
    && candidate.getUTCDate() === day.day
    ? day
    : null;
}

export function parseOneOffEventCalendarDay(value: string): CalendarDay | null {
  const text = value.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(text);
  if (iso) {
    return validCalendarDay({ year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) });
  }

  const named = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(text);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    if (!month) return null;
    return validCalendarDay({ year: Number(named[3]), month, day: Number(named[2]) });
  }

  const numeric = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (numeric) {
    return validCalendarDay({ year: Number(numeric[3]), month: Number(numeric[1]), day: Number(numeric[2]) });
  }

  return null;
}

export function isUpcomingOneOffEventDate(value: string, now = new Date()): boolean {
  const eventDate = parseOneOffEventCalendarDay(value);
  if (!eventDate) return false;

  const eventDay = Date.UTC(eventDate.year, eventDate.month - 1, eventDate.day);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return eventDay >= today;
}
