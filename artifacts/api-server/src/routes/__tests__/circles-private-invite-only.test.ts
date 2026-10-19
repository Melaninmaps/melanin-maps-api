import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";

const circlesRoute = readFileSync(
  fileURLToPath(new URL("../circles.ts", import.meta.url)),
  "utf8",
);

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

  it("allows a Free member to create one private Circle before applying the existing cap", () => {
    const start = circlesRoute.indexOf('router.post("/circles"');
    const end = circlesRoute.indexOf("// Return the requesting user's saved businesses", start);
    const createHandler = circlesRoute.slice(start, end);
    const capGuard = createHandler.indexOf("if (isFinite(limits.maxCircles))");
    const createInsert = createHandler.indexOf("db.insert(kinfolkCircles)");

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(circlesRoute).toMatch(/free:\s*\{\s*maxCircles:\s*1,/);
    expect(createHandler).toContain("if (!authed(req, res)) return;");
    expect(createHandler).toContain("Circle name is required (min 2 chars)");
    expect(createHandler).not.toContain('if (tierKey === "free")');
    expect(createHandler).toContain("if (isFinite(limits.maxCircles))");
    expect(createHandler).toContain("if (count >= limits.maxCircles)");
    expect(createHandler).toContain(
      "Your current access includes up to ${limits.maxCircles} private Circle",
    );
    expect(createHandler).toContain('code: "TIER_LIMIT_REACHED"');
    expect(createHandler).toContain("maxMembers: 8,");
    expect(createHandler).toContain('privacy: "invite_only",');
    expect(createHandler).toContain('addCircleMemberWithinCap(circleId, uid(req), "host")');
    expect(createHandler).toContain("Circle host membership could not be created");
    expect(capGuard).toBeGreaterThan(-1);
    expect(createInsert).toBeGreaterThan(capGuard);
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

  it("keeps Circle itineraries grounded in deliberately shared saves and dates, not account preferences", () => {
    const start = circlesRoute.indexOf('router.post("/circles/:id/itineraries"');
    const end = circlesRoute.indexOf("\nexport default router;", start);
    const itineraryHandler = circlesRoute.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(itineraryHandler).toContain("getCircleWithAuth(circleId, uid(req), res)");
    expect(itineraryHandler).toContain("circle_saves");
    expect(itineraryHandler).toContain("circle_important_dates");
    expect(itineraryHandler).toContain("JSON.stringify(plan.branches ?? {})");
    expect(itineraryHandler).not.toContain("user_preferences");
    expect(itineraryHandler).not.toMatch(/favorite_categories|dietary_notes|lifestyle_services|memberProfiles/);
    expect(itineraryHandler).toContain("Do not infer or use any member's account-level interests");
  });
});
