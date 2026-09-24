import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authRoute = readFileSync(new URL("../auth.ts", import.meta.url), "utf8");
const usersRoute = readFileSync(new URL("../users.ts", import.meta.url), "utf8");

describe("profile photo sign-in preservation", () => {
  it("does not overwrite an existing MWM-uploaded photo during OIDC sign-in", () => {
    const upsertStart = authRoute.indexOf("async function upsertUser");
    const authUserRoute = authRoute.indexOf('router.get("/auth/user"', upsertStart);
    const upsert = authRoute.slice(upsertStart, authUserRoute);

    expect(upsertStart).toBeGreaterThan(-1);
    expect(authUserRoute).toBeGreaterThan(upsertStart);
    expect(upsert).toContain("COALESCE(${usersTable.profileImageUrl}, EXCLUDED.profile_image_url)");
    expect(upsert).not.toContain("profileImageUrl: userData.profileImageUrl");
  });

  it("persists an uploaded avatar before a subsequent profile read", () => {
    expect(usersRoute).toContain('router.post("/users/avatar", avatarUpload.single("avatar")');
    expect(usersRoute).toContain(".set({ profileImageUrl: avatarUrl, updatedAt: new Date() })");
    expect(usersRoute).toContain('router.get("/users/me"');
  });
});
