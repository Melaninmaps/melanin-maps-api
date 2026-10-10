import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("profile-based Safety Check-In contract", () => {
  const route = readSource("../routes/safety-checkins.ts");
  const cron = readSource("../routes/cron.ts");
  const safetyCheckinCron = cron.slice(
    cron.indexOf("type SafetyCheckinNotificationResult"),
    cron.indexOf('router.post("/cron/referral-stats"'),
  );
  const push = readSource("../lib/pushNotifications.ts");
  const schema = readSource("../../../../lib/db/src/schema/safety-checkins.ts");
  const migration = readSource("../lib/startup-migrations.ts");
  const mobile = readSource("../../../mobile/app/checkin.tsx");

  it("permits selected accepted profiles without a placeholder email", () => {
    expect(route).toContain('router.get("/safety/checkins/recipients", requireFamilySafety');
    expect(route).toContain("recipientShareIds");
    expect(schema).toContain('trustedContactEmail: varchar("trusted_contact_email", { length: 255 }),');
    expect(schema).not.toContain("trustedContactEmail: varchar(\"trusted_contact_email\", { length: 255 }).notNull()");
    expect(migration).toContain("ALTER COLUMN trusted_contact_email DROP NOT NULL");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS safety_checkin_recipients");
    expect(route).toContain("Email recipients are not supported for Safety Check-Ins");
  });

  it("limits selectable recipients to consented active in-app safety shares", () => {
    expect(route).toContain("MAX_PROFILE_RECIPIENTS = 5");
    expect(route).toContain("tss.contact_type = 'mwm_user'");
    expect(route).toContain("tss.status = 'active'");
    expect(route).toContain("tss.contact_accepted = true");
    expect(route).toContain("owner_blocks.id IS NULL");
    expect(route).toContain("recipient_blocks.id IS NULL");
    expect(route).toContain("np.topics @> ARRAY['safety']::text[]");
    expect(route).not.toContain("recipientUserIds");
  });

  it("records retryable in-app and provider attempts without claiming device delivery", () => {
    expect(cron).toContain("INSERT INTO notifications");
    expect(cron).toContain("UPDATE safety_checkin_recipients");
    expect(cron).toContain("delivery_status = 'in_app_created'");
    expect(cron).toContain("delivery_status = 'push_pending'");
    expect(cron).toContain("delivery_status = 'push_attempting'");
    expect(cron).toContain("delivery_status = 'push_submitted'");
    expect(cron).toContain("delivery_status = 'push_failed'");
    expect(cron).toContain("in_app_notification_create_failed");
    expect(cron).toContain("push_submission_failed");
    expect(cron).toContain("push_token_unavailable");
    expect(cron).toContain("MAX_IN_APP_ATTEMPTS = 3");
    expect(cron).toContain("MAX_PUSH_ATTEMPTS = 3");
    expect(cron).toContain("recipient_no_longer_eligible");
    expect(cron).toContain("delivery_status = 'skipped'");
    expect(cron).toContain('submission === "submitted"');
    expect(cron).toContain("A trusted member's scheduled check-in is overdue");
    expect(cron).not.toContain("delivery_status = 'delivered'");
    expect(schema).toContain("inAppAttemptCount");
    expect(schema).toContain("pushAttemptCount");
    expect(schema).toContain('"push_pending"');
    expect(schema).toContain("pushSubmittedAt");
    expect(schema).not.toContain('"delivered"');
    expect(cron).not.toContain("latitude");
    expect(cron).not.toContain("longitude");
  });

  it("claims overdue lifecycle before delivery and keeps states, retries, and location disclosure truthful", () => {
    const lifecycleClaim = cron.indexOf('.set({ status: "overdue" })');
    const recipientDelivery = cron.indexOf("const notificationResult = await notifySelectedCheckinProfiles");
    const parentNotificationStamp = cron.indexOf(".set({ notifiedAt: now })");

    expect(lifecycleClaim).toBeGreaterThan(-1);
    expect(recipientDelivery).toBeGreaterThan(lifecycleClaim);
    expect(parentNotificationStamp).toBeGreaterThan(recipientDelivery);
    expect(cron).toContain("checkin.status = 'overdue'");
    expect(cron).toContain("checkin.confirmed_at IS NULL");
    expect(cron).toContain("FOR UPDATE OF scr");
    expect(cron).toContain("scr.in_app_attempt_count < $3");
    expect(cron).toContain("push_attempt_id = NULL");
    expect(safetyCheckinCron).toContain("stored location text can be an address or raw coordinates");
    expect(safetyCheckinCron).not.toContain("row.location");
    expect(safetyCheckinCron).not.toContain("row.city");
    expect(safetyCheckinCron).not.toContain("locationPhrase");
  });

  it("marks push submitted only for an accepted provider ticket, never as a device receipt", () => {
    expect(push).toContain("function isAcceptedProviderSubmission");
    expect(push).toContain('(result as { status?: unknown }).status === "ok"');
    expect(push).toContain("not proof that a");
    expect(push).toContain("Expo push submission was not accepted");
    expect(cron).toContain('submission === "submitted"');
    expect(cron).toContain("delivery_status = 'push_submitted'");
    expect(cron).not.toContain("delivery_status = 'delivered'");
  });

  it("replaces new mobile email entry with an accessible trusted-profile selector", () => {
    expect(mobile).toContain("/api/safety/checkins/recipients");
    expect(mobile).toContain("recipientShareIds: selectedShareIds");
    expect(mobile).toContain("accessibilityRole=\"checkbox\"");
    expect(mobile).toContain("No email is required");
    expect(mobile).not.toContain("placeholder=\"email@example.com\"");
  });

  it("suppresses historical email delivery without accepted recipient authorization", () => {
    expect(route).toContain("Choose at least one accepted trusted Kinfolk profile");
    expect(cron).toContain("Suppressed legacy email check-in delivery without accepted recipient authorization");
    expect(cron).not.toContain("await sendCheckinOverdueEmail(");
  });
});
