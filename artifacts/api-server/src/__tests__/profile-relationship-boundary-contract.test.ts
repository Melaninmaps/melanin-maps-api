import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("profile relationship block boundary", () => {
  const boundary = source("../social/profileRelationshipAccess.ts");
  const users = source("../routes/users.ts");
  const follows = source("../routes/follows.ts");
  const connections = source("../routes/connections.ts");

  it("makes a block transactional across both relationship directions and dependent safety shares", () => {
    expect(boundary).toContain("export async function usersAreBlocked");
    expect(boundary).toContain("export async function blockMemberAndCleanupRelationships");
    expect(boundary).toContain("return db.transaction");
    expect(boundary).toContain("await tx.delete(userFollowsTable).where(relationPredicate)");
    expect(boundary).toContain("await tx.delete(memberConnections).where(connectionPredicate)");
    expect(boundary).toContain('status: "revoked", revokedAt: now');
    expect(boundary).toContain("acceptedFollowCount");
    expect(users).toContain("blockMemberAndCleanupRelationships(req.user.id, targetId)");
    expect(users).toContain('if (!result.targetFound) { res.status(404).json({ error: "User not found" }); return; }');
  });

  it("prevents blocked members from creating, accepting, or reading follow relationships", () => {
    expect(follows).toContain("import { filterBlockedRelationships, usersAreBlocked }");
    expect(follows).toContain("if (await usersAreBlocked(followerId, followingId))");
    expect(follows).toContain("filterBlockedRelationships(viewerId, rows)");
    expect(follows).toContain("filterBlockedRelationships(req.user.id, rows)");
    expect(follows).toContain("if (await usersAreBlocked(req.user.id, row.followerId))");
    expect(follows).not.toContain('router.get("/users/:id/profile"');
  });

  it("prevents blocked members from creating, accepting, or listing member connections", () => {
    expect(connections).toContain('import { usersAreBlocked } from "../social/profileRelationshipAccess"');
    expect(connections).toContain("if (await usersAreBlocked(requesterId, recipientId))");
    expect(connections).toContain("if (await usersAreBlocked(conn.requesterId, conn.recipientId))");
    expect(connections).toContain("!row.otherId || !await usersAreBlocked(userId, row.otherId)");
  });
});
