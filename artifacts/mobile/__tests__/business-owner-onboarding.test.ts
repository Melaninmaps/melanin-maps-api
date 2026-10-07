import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const dashboard = readFileSync(`${root}artifacts/mobile/app/business-owner/index.tsx`, "utf8");
const screen = readFileSync(`${root}artifacts/mobile/app/business-owner/onboarding.tsx`, "utf8");
const layout = readFileSync(`${root}artifacts/mobile/app/_layout.tsx`, "utf8");

describe("native business owner onboarding", () => {
  it("exposes the owner checklist as a normal owner-dashboard destination", () => {
    expect(dashboard).toContain("Owner Launch Checklist");
    expect(dashboard).toContain('route: "/business-owner/onboarding"');
    expect(layout).toContain('name="business-owner/onboarding"');
  });

  it("keeps onboarding private and free of automatic outreach or publication", () => {
    expect(screen).toContain("Private, owner-controlled setup");
    expect(screen).toContain("never publishes your profile");
    expect(screen).toContain("No media is uploaded or changed here.");
    expect(screen).toContain("No messages are sent by this checklist.");
    expect(screen).toContain("api/businesses/mine/onboarding");
  });
});
