import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(resolve(process.cwd(), "src/routes/meetup-verifications.ts"), "utf8");
const cronSource = readFileSync(resolve(process.cwd(), "src/routes/cron.ts"), "utf8");

describe("consent-first meetup route contract", () => {
  it("requires adult/guardian eligibility, an accepted connection, consent, and safety restrictions", () => {
    expect(routeSource).toContain("getMeetupEligibility(userId)");
    expect(routeSource).toContain("requireAcceptedConnection(userId, normalizedPartnerId, connectionId)");
    expect(routeSource).toContain("meetupRestrictedBetween(userId, normalizedPartnerId)");
    expect(routeSource).toContain("acknowledgedSafetyNotice !== true");
  });

  it("accepts only existing accepted Safety Hub contacts and retires ad-hoc sharing", () => {
    expect(routeSource).toContain('contact_accepted = true');
    expect(routeSource).toContain('contact_type = \'mwm_user\'');
    expect(routeSource).toContain('router.post("/meetups/:id/share"');
    expect(routeSource).toContain("410");
  });

  it("keeps schedule/location fields bounded and rejects likely street addresses", () => {
    expect(routeSource).toContain("validateMeetingPlace(city, venueName)");
    expect(routeSource).toContain("parseOptionalFutureDate(rawScheduledFor");
    expect(routeSource).toContain("MAX_MEETUP_NOTE_LENGTH");
    expect(routeSource).not.toContain("latitude:");
    expect(routeSource).not.toContain("longitude:");
  });

  it("supports confirm, decline, reschedule, cancellation, and fixed-retention cleanup", () => {
    expect(routeSource).toContain('router.patch("/meetups/:id/respond"');
    expect(routeSource).toContain('router.patch("/meetups/:id/reschedule"');
    expect(routeSource).toContain('router.patch("/meetups/:id/cancel"');
    expect(cronSource).toContain('router.post("/cron/meetup-retention"');
    expect(cronSource).toContain("DELETE FROM meetup_verifications");
  });

  it("sends missed check-in alerts only to the selected trusted contact", () => {
    expect(cronSource).toContain("sendPushToUser(row.safetyWatcherId");
    expect(cronSource).not.toContain("sendPushToUser(row.initiatorId");
    expect(cronSource).toContain("never to the meetup partner");
  });

  it("stores newly supplied clear codes as hashes and never returns them", () => {
    expect(routeSource).toContain("bcrypt.hash(clearCode, 10)");
    expect(routeSource).toContain("bcrypt.compare(suppliedClearCode, verification.clearCode)");
    expect(routeSource).toContain("clearCode: undefined");
  });

  it("rate-limits sensitive meetup mutations", () => {
    expect(routeSource).toContain("MEETUP_MUTATION_LIMIT = 12");
    expect(routeSource).toContain("allowMeetupMutation(userId, res)");
    expect(routeSource).toContain("res.status(429)");
  });

  it("requires an authorized manual review before an active report restricts a pair", () => {
    expect(routeSource).toContain('router.patch("/admin/meetups/safety-reports"');
    expect(routeSource).toContain("requireAdmin(req, res)");
    expect(routeSource).toContain("action !== \"restrict\" && action !== \"dismiss\"");
  });
});
