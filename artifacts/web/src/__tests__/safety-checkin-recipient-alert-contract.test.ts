import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web Safety Check-In recipient alerts", () => {
  const alert = source("../pages/safety-checkin-alert.tsx");
  const notifications = source("../pages/notifications.tsx");
  const app = source("../App.tsx");

  it("uses the recipient-authorized alert endpoint with cookie authentication", () => {
    expect(alert).toContain("api/safety/checkins/received/${encodeURIComponent(notificationId)}");
    expect(alert).toContain('credentials: "include"');
    expect(alert).toContain("api/notifications/${encodeURIComponent(notificationId)}/read");
    expect(alert).toContain('method: "POST"');
  });

  it("routes only private Check-In overdue alerts from the notification list", () => {
    expect(notifications).toContain('notification.entityType === "safety_checkin" && notification.data?.type === "safety_checkin_overdue"');
    expect(notifications).toContain('navigate(`/safety/checkins/received/${encodeURIComponent(notification.id)}`)');
    expect(app).toContain('path="/safety/checkins/received/:notificationId"');
    expect(app).toContain('<ProtectedRoute><SafetyCheckinAlert /></ProtectedRoute>');
  });

  it("keeps recipient alert content private and non-location-based", () => {
    expect(alert).toContain("{alert.privacy}");
    expect(alert).toContain("does not contact emergency services or reveal where anyone is");
    expect(alert).not.toContain("navigator.geolocation");
    expect(alert).not.toContain("createdAt");
    expect(alert).not.toContain("new Date(");
    expect(notifications).toContain("!isPrivateCheckinAlert && (");
  });
});
