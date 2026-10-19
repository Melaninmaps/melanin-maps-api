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
    expect(isUpcomingOneOffEventDate("Aug 15, 2026", now)).toBe(true);
    expect(isUpcomingOneOffEventDate("2026-08-16", now)).toBe(true);
    expect(isUpcomingOneOffEventDate("2026-08-15T00:00:00-10:00", now)).toBe(true);
    expect(isUpcomingOneOffEventDate("8/15/2026", now)).toBe(true);
    expect(isUpcomingOneOffEventDate("August 14, 2026", now)).toBe(false);
    expect(isUpcomingOneOffEventDate("February 30, 2026", now)).toBe(false);
    expect(isUpcomingOneOffEventDate("not a scheduled date", now)).toBe(false);
  });

  it("uses the same upcoming-date policy for list and direct-detail responses", () => {
    const eventRoutes = source("../routes/events.ts");
    expect(eventRoutes).toContain("events.filter((event) => isUpcomingOneOffEventDate(event.date))");
    expect(eventRoutes).toContain("!event || !isUpcomingOneOffEventDate(event.date)");
  });

  it("keeps authenticated free and Navigator hosting under one neutral monthly cap", () => {
    const eventRoutes = source("../routes/events.ts");
    const postHandler = eventRoutes.slice(
      eventRoutes.indexOf('router.post("/events"'),
      eventRoutes.indexOf('router.patch("/events/:id"'),
    );

    expect(postHandler).toContain('if (!req.user?.id)');
    expect(postHandler).toContain('res.status(401).json({ error: "Authentication required" });');
    expect(postHandler).toContain('if (tier === "free" || tier === "navigator")');
    expect(postHandler).toMatch(/if \(tier === "free" \|\| tier === "navigator"\)[\s\S]*?if \(count >= 3\)/);
    expect(postHandler).toContain('error: "You can host up to 3 events per calendar month."');
    expect(postHandler).not.toMatch(/upgradeUrl|Upgrade to|Explorer\+/);
    expect(postHandler).toContain('if (!title || !date || !city || !state)');
  });

  it("uses recurring_events.active_until as the recurring-event expiry contract", () => {
    const recurringEvents = source("../routes/recurring-events-route.ts");
    expect(recurringEvents).toContain("(active_until IS NULL OR active_until >= CURRENT_DATE)");
    expect(recurringEvents).toMatch(/WHERE id = \$1[\s\S]*?active_until >= CURRENT_DATE/);
  });
});
