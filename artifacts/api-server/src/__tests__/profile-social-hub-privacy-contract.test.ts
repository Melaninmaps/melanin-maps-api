import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("social profile privacy contract", () => {
  const users = source("../routes/users.ts");

  it("keeps profile activity behind the existing follow/privacy gate and returns follow totals only to the owner", () => {
    expect(users).toContain("const canSeeContent = callerId === targetId || (!user.isPrivate || isFollowing)");
    expect(users).toContain("reviews: canSeeContent ? reviews : []");
    expect(users).toContain("tags: canSeeContent ? tags : []");
    expect(users).toContain("canReceiveDirectMessages: Boolean(callerId && callerId !== targetId && allowDm)");
    expect(users).toContain("followersCount: usersTable.followersCount");
    expect(users).toContain("followingCount: usersTable.followingCount");
    expect(users).toContain("...(callerId === targetId ? { followersCount, followingCount } : {})");
  });
});
