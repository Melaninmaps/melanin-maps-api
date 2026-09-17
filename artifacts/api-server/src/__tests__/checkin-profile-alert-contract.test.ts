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
    expect(route).toContain("Choose either trusted profiles or one legacy email contact, not both");
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

  it("makes an overdue profile alert durable before attempting push delivery", () => {
    expect(cron).toContain("INSERT INTO notifications");
    expect(cron).toContain("UPDATE safety_checkin_recipients");
    expect(cron).toContain("delivery_status = 'delivered'");
    expect(cron).toContain("delivery_status = 'skipped'");
    expect(cron).toContain("void sendPushToUser(recipientUserId");
    expect(cron).not.toContain("latitude");
    expect(cron).not.toContain("longitude");
  });

  it("replaces new mobile email entry with an accessible trusted-profile selector", () => {
    expect(mobile).toContain("/api/safety/checkins/recipients");
    expect(mobile).toContain("recipientShareIds: selectedShareIds");
    expect(mobile).toContain("accessibilityRole=\"checkbox\"");
    expect(mobile).toContain("No email is required");
    expect(mobile).not.toContain("placeholder=\"email@example.com\"");
  });
});
