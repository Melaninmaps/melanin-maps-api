import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const circlesRoute = readFileSync(new URL("../circles.ts", import.meta.url), "utf8");

describe("Circle private invite-only server policy", () => {
  it("does not publish legacy Circles through the community endpoint", () => {
    expect(circlesRoute).toContain('router.get("/circles/community"');
    expect(circlesRoute).toContain("Circles are intentionally private, invite-only spaces of two to eight");
    expect(circlesRoute).toContain("res.json({ circles: [] });");
  });

  it("forces new and edited Circles to private invite-only state", () => {
    expect(circlesRoute).toContain('const circleType = "private";');
    expect(circlesRoute).toContain('privacy: "invite_only",');
    expect(circlesRoute).toContain('updates.privacy = "invite_only";');
    expect(circlesRoute).toContain('updates.type = "private";');
    expect(circlesRoute).toContain("maxMembers: 8,");
    expect(circlesRoute).toContain("updates.maxMembers = 8;");
  });

  it("rejects self-service joins instead of allowing discovery to bypass a host invitation", () => {
    expect(circlesRoute).toContain('router.post("/circles/:id/join"');
    expect(circlesRoute).toContain("Circles are invite-only. Ask the Circle host to add you.");
    expect(circlesRoute).toContain('code: "CIRCLE_INVITE_REQUIRED"');
  });

  it("does not load another member's account preferences for a Circle plan", () => {
    const preferenceGuard = circlesRoute.indexOf("canUseOwnCirclePlanPreferences(uid(req), curatorMemberId)");
    const preferenceLookup = circlesRoute.indexOf(".from(userPreferencesTable)");

    expect(circlesRoute).toContain('code: "CIRCLE_MEMBER_PREFERENCES_NOT_SHARED"');
    expect(preferenceGuard).toBeGreaterThan(-1);
    expect(preferenceLookup).toBeGreaterThan(preferenceGuard);
  });
});
