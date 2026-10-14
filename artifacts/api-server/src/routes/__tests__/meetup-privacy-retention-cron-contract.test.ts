import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cron = readFileSync(
  fileURLToPath(new URL("../cron.ts", import.meta.url)),
  "utf8",
);
const meetupCron = cron.slice(cron.indexOf('router.post("/cron/meetup-checkins"'));

describe("meetup privacy retention cron", () => {
  it("redacts expired private details instead of reviving automatic arrival or home tracking", () => {
    expect(meetupCron).toContain("retiredAutomaticTracking: true");
    expect(meetupCron).toContain("clearedAt: now");
    expect(meetupCron).toContain("location: null");
    expect(meetupCron).toContain("safetyFriendEmail: null");
    expect(meetupCron).not.toContain("sendMeetupCheckinMissedEmail");
    expect(meetupCron).not.toContain("Arrival Check-In Overdue");
    expect(meetupCron).not.toContain("Home Check-In Overdue");
  });
});
