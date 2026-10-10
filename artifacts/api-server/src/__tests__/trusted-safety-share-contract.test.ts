import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  expoPushProviderReceipt,
  expoPushRequestState as invitePushRequestState,
  isFiniteTrustedSafetySession,
  normalizeTrustedContactEmail,
  normalizeTrustedContactPhone,
  providerReceiptFingerprint,
} from "../routes/trusted-safety-share";
import {
  expoPushRequestState,
  isTrustedSafetyAlertPayload,
  trustedSafetyInAppNotification,
} from "../lib/trustedSafetyShareAlerts";
import { publicLocationShare } from "../routes/location-shares";

describe("Trusted Safety Share contact and delivery privacy", () => {
  it("normalizes cosmetic email and phone differences before deduplication", () => {
    expect(normalizeTrustedContactEmail(" Mom@Example.COM ")).toBe("mom@example.com");
    expect(normalizeTrustedContactPhone("(415) 555-0123")).toBe("+14155550123");
    expect(normalizeTrustedContactPhone("+1 415-555-0123")).toBe("+14155550123");
  });

  it("uses a privacy-safe in-app fallback when push is unavailable", () => {
    const notification = trustedSafetyInAppNotification(
      "share-1", "weather", "Atlanta", "Georgia", "Safety Alert — Amina", "Amina is currently in Atlanta, Georgia.",
    );
    expect(notification).toEqual({
      type: "safety",
      title: "Safety Alert — Amina",
      body: "Amina is currently in Atlanta, Georgia.",
      data: { alertType: "weather", locationCity: "Atlanta", locationRegion: "Georgia", shareId: "share-1" },
    });
    expect(JSON.stringify(notification)).not.toMatch(/ownerId|latitude|longitude|token|search|checkin/i);
  });

  it("requires a finite recent authorization session and rejects GPS or behavioral dispatch input", () => {
    const now = Date.parse("2026-10-10T12:00:00.000Z");
    expect(isFiniteTrustedSafetySession(new Date(now - 29 * 24 * 60 * 60 * 1000), now)).toBe(true);
    expect(isFiniteTrustedSafetySession(new Date(now - 30 * 24 * 60 * 60 * 1000), now)).toBe(false);
    expect(isFiniteTrustedSafetySession(null, now)).toBe(false);

    const alert = {
      ownerId: "owner-1",
      ownerFirstName: "Amina",
      locationCity: "Atlanta",
      locationRegion: "Georgia",
      alertTitle: "Tornado warning",
      alertDescription: "Seek shelter now.",
      alertType: "weather" as const,
    };
    expect(isTrustedSafetyAlertPayload(alert)).toBe(true);
    expect(isTrustedSafetyAlertPayload({ ...alert, latitude: 33.749 })).toBe(false);
    expect(isTrustedSafetyAlertPayload({ ...alert, activity: "searched restaurants" })).toBe(false);
  });

  it("records provider acknowledgement rather than claiming device delivery", async () => {
    const accepted = { ok: true, json: async () => ({ data: { status: "ok", id: "expo-ticket-123" } }) } as never;
    const rejected = { ok: true, json: async () => ({ data: { status: "error" } }) } as never;
    const missingReceipt = { ok: true, json: async () => ({ data: { status: "ok" } }) } as never;
    await expect(expoPushRequestState(accepted)).resolves.toBe("provider_accepted");
    await expect(expoPushRequestState(rejected)).resolves.toBe("provider_rejected");
    await expect(invitePushRequestState(accepted)).resolves.toBe("provider_accepted");
    await expect(expoPushProviderReceipt(accepted)).resolves.toEqual({
      state: "provider_accepted",
      receipt: "expo-ticket-123",
    });
    await expect(expoPushProviderReceipt(missingReceipt)).resolves.toEqual({
      state: "provider_rejected",
      receipt: null,
    });
    const fingerprint = providerReceiptFingerprint("expo-ticket-123");
    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(fingerprint).not.toContain("expo-ticket-123");
  });

  it("persists invitation attempts as audit-only accepted or failed evidence", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../routes/trusted-safety-share.ts", import.meta.url)),
      "utf8",
    );
    const migrations = readFileSync(
      fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)),
      "utf8",
    );
    const auditMigration = migrations.slice(
      migrations.indexOf('name: "trusted_safety_invitation_delivery_audit_v1"'),
      migrations.indexOf('name: "safety_checkin_profile_recipients_v1"'),
    );

    expect(route).toContain("beginInviteDeliveryAttempt(shareId, channel, provider)");
    expect(route).toContain("finishInviteDeliveryAttempt");
    expect(route).toContain("providerReceiptFingerprint");
    expect(route).toContain('push.state === "provider_accepted" ? "accepted" : "failed"');
    expect(auditMigration).toContain("trusted_safety_invitation_delivery_attempts");
    expect(auditMigration).toContain("CHECK (state IN ('attempted', 'accepted', 'failed'))");
    expect(auditMigration).toContain("provider_receipt_fingerprint CHAR(64)");
    expect(auditMigration).toContain("provider = 'in_app' OR provider_receipt_fingerprint IS NOT NULL");
    expect(auditMigration).not.toMatch(/contact_phone|contact_email|invite_token|push_token|provider_receipt_id/);
  });

  it("keeps the recipient-authorized location payload free of account identity", () => {
    const view = publicLocationShare({
      label: "Safe arrival",
      currentLat: 33.749,
      currentLng: -84.388,
      lastUpdatedAt: new Date("2026-01-02T03:04:05.000Z"),
      expiresAt: new Date("2026-01-02T04:04:05.000Z"),
    });
    expect(view).not.toHaveProperty("sharerId");
    expect(view).not.toHaveProperty("recipientEmail");
    expect(view).not.toHaveProperty("shareToken");
  });

  it("cannot resume a pending or declined contact without acceptance", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../routes/trusted-safety-share.ts", import.meta.url)),
      "utf8",
    );
    expect(route).toContain('current.status !== "paused_manual" || current.contact_accepted !== true');
    expect(route).toContain("AND ($1 != 'active' OR (contact_accepted = true AND owner_enabled = true))");
    expect(route.match(/AND status = 'pending'/g)).toHaveLength(2);
    expect(route.match(/AND contact_accepted = false/g)).toHaveLength(2);
    expect(route.match(/AND invite_expires_at > NOW\(\)/g)).toHaveLength(2);
    expect(route).toContain("AND trusted_safety_shares.contact_user_id = $3");
    const delivery = readFileSync(
      fileURLToPath(new URL("../lib/trustedSafetyShareAlerts.ts", import.meta.url)),
      "utf8",
    );
    expect(delivery).toContain("AND contact_accepted = true");
  });

  it("enforces mutual blocks, preferences, finite sessions, and private lifecycle responses", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../routes/trusted-safety-share.ts", import.meta.url)),
      "utf8",
    );
    const delivery = readFileSync(
      fileURLToPath(new URL("../lib/trustedSafetyShareAlerts.ts", import.meta.url)),
      "utf8",
    );
    expect(route).toContain('router.patch("/safety/trusted-shares/:id/enabled"');
    expect(route).toContain("invite_token = NULL");
    expect(route).toContain("UPDATE location_shares");
    expect(route).toContain("current_lat = NULL");
    expect(route).toContain("current_lng = NULL");
    expect(route).toContain("owner_blocks.id IS NULL");
    expect(route).toContain("contact_blocks.id IS NULL");
    expect(route).toContain("ownerShareResponse");
    expect(route).toContain("receivedShareResponse");
    expect(delivery).toContain("notification_preferences");
    expect(delivery).toContain("np.topics @> ARRAY['safety']::text[]");
    expect(delivery).toContain("activated_at > NOW() - INTERVAL '30 days'");
    expect(delivery).toContain("provider_accepted");
    expect(delivery).toContain("in_app_created");
    expect(delivery).not.toContain('deliveryStatus = "sent"');
    expect(delivery).not.toContain('deliveryStatus = "delivered"');
  });

  it("does not expose a copyable bearer link for precise location access", () => {
    const mobile = readFileSync(
      fileURLToPath(new URL("../../../mobile/app/location-share.tsx", import.meta.url)),
      "utf8",
    );
    expect(mobile).toContain("Accepted Kinfolk Contact");
    expect(mobile).toContain("recipientTrustedShareId: selectedRecipientId");
    expect(mobile).not.toContain("Copy Share Link");
    expect(mobile).not.toContain("Copy Pending Link");
    expect(mobile).not.toContain("expo-clipboard");
  });
});
