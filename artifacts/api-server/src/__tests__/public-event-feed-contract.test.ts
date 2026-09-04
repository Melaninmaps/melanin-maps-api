import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isUpcomingOneOffEventDate } from "../lib/public-event-visibility";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("public event feed visibility contract", () => {
  const now = new Date("2026-08-15T12:00:00.000Z");

  it("keeps valid upcoming one-off dates and excludes expired or malformed varchar dates", () => {
    expect(isUpcomingOneOffEventDate("August 15, 2026", now)).toBe(true);
    expect(isUpcomingOneOffEventDate("2026-08-16", now)).toBe(true);
    expect(isUpcomingOneOffEventDate("August 14, 2026", now)).toBe(false);
    expect(isUpcomingOneOffEventDate("not a scheduled date", now)).toBe(false);
  });

  it("uses recurring_events.active_until as the recurring-event expiry contract", () => {
    const recurringEvents = source("../routes/recurring-events-route.ts");
    expect(recurringEvents).toContain("(active_until IS NULL OR active_until >= CURRENT_DATE)");
    expect(recurringEvents).toMatch(/WHERE id = \$1[\s\S]*?active_until >= CURRENT_DATE/);
  });
});