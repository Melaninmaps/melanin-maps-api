import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isSensitiveNotificationPreview,
  preparePushMessageForProvider,
} from "../notification-preview-policy";

function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("notification preview privacy policy", () => {
  it("preserves routine provider previews", () => {
    const message = preparePushMessageForProvider({
      title: "A new article is available",
      body: "Read the latest community guide.",
      data: { screen: "library", articleId: "public-article" },
      preview: { classification: "routine" },
    });

    expect(message.title).toBe("A new article is available");
    expect(message.body).toBe("Read the latest community guide.");
    expect(message.data).toMatchObject({ screen: "library", articleId: "public-article" });
  });

  it("fails closed to a neutral payload for explicitly sensitive member content", () => {
    const message = preparePushMessageForProvider({
      title: "KinfolkAI™ reminder",
      body: "Private member-entered task text",
      data: { screen: "kinfolk-tasks", taskId: "private-task", type: "kinfolk_reminder" },
      preview: { classification: "sensitive", purpose: "member_task" },
    });

    expect(message.title).toBe("A private update is ready");
    expect(message.body).toBe("Open Mapping With Melanin to view it securely.");
    expect(message.data).toEqual({ screen: "notifications", type: "private_update", preview: "neutral" });
    expect(JSON.stringify(message)).not.toContain("private-task");
    expect(JSON.stringify(message)).not.toContain("Private member-entered task text");
  });

  it("automatically neutralizes established safety routes and strips sensitive metadata", () => {
    const original = {
      title: "Safety Check-In Overdue",
      body: "A trusted member's scheduled check-in is overdue.",
      data: { screen: "safety-hub", checkinId: "private-checkin", type: "safety_checkin_overdue", city: "private-city" },
    };
    const message = preparePushMessageForProvider(original);

    expect(isSensitiveNotificationPreview(original)).toBe(true);
    expect(message).toMatchObject({
      title: "A private update is ready",
      body: "Open Mapping With Melanin to view it securely.",
      data: { screen: "safety-hub", type: "private_update", preview: "neutral" },
    });
    expect(JSON.stringify(message)).not.toContain("private-checkin");
    expect(JSON.stringify(message)).not.toContain("private-city");
  });

  it("does not permit a routine label to override an established sensitive safety route", () => {
    const original = {
      title: "Safety report",
      body: "Sensitive details",
      data: { screen: "safety", type: "safety_report" },
      preview: { classification: "routine" as const },
    };

    expect(isSensitiveNotificationPreview(original)).toBe(true);
    expect(preparePushMessageForProvider(original)).toMatchObject({
      title: "A private update is ready",
      data: { screen: "safety", type: "private_update", preview: "neutral" },
    });
  });

  it("routes standard pushes, task reminders, and Family Impact through the neutral preview boundary", () => {
    const push = readSource("../pushNotifications.ts");
    const cron = readSource("../../routes/cron.ts");
    const familyImpact = readSource("../../safety/familyImpactDispatch.ts");

    expect(push).toContain("const providerMessage = preparePushMessageForProvider(message)");
    expect(push).toContain("title: providerMessage.title");
    expect(push).toContain("body: providerMessage.body");
    expect(cron).toContain('preview: { classification: "sensitive", purpose: "member_task" }');
    expect(familyImpact).toContain('preview: { classification: "sensitive", purpose: "family_impact" }');
    expect(familyImpact).toContain("title: providerPreview.title");
    expect(familyImpact).toContain("data: providerPreview.data as Record<string, string>");
  });
});
