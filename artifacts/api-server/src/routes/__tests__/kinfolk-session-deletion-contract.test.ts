import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(new URL("../kinfolk.ts", import.meta.url), "utf8");

function routeBlock(path: string, endMarker: string): string {
  const start = routeSource.indexOf(path);
  const end = routeSource.indexOf(endMarker, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return routeSource.slice(start, end);
}

describe("Kinfolk session deletion owner boundary", () => {
  const bulkDelete = routeBlock(
    'router.delete("/kinfolk/sessions"',
    'router.delete("/kinfolk/sessions/:id"',
  );
  const singleDelete = routeBlock(
    'router.delete("/kinfolk/sessions/:id"',
    'router.patch("/kinfolk/sessions/:id/organization"',
  );

  it("requires authentication before either deletion can reach session storage", () => {
    for (const handler of [bulkDelete, singleDelete]) {
      const authGuard = handler.indexOf("if (!req.user?.id)");
      const deleteCall = handler.indexOf(".delete(kinfolkSessionsTable)");
      expect(authGuard).toBeGreaterThan(-1);
      expect(deleteCall).toBeGreaterThan(authGuard);
    }
  });

  it("deletes only the authenticated member's requested session and hides cross-owner absence", () => {
    expect(singleDelete).toContain("const sessionId = String(req.params.id)");
    expect(singleDelete).toContain("eq(kinfolkSessionsTable.id, sessionId)");
    expect(singleDelete).toContain("eq(kinfolkSessionsTable.userId, req.user.id)");
    expect(singleDelete).toContain('res.status(404).json({ error: "Session not found" })');
    expect(singleDelete).toContain("invalidateSessionsCache(req.user.id)");
    expect(singleDelete).toContain("deletedSessionId: deletedSession.id");
  });

  it("deletes all and only the authenticated member's persisted sessions without requiring continuity", () => {
    expect(bulkDelete).toContain("const userId = req.user.id");
    expect(bulkDelete).toContain("eq(kinfolkSessionsTable.userId, userId)");
    expect(bulkDelete).toContain("invalidateSessionsCache(userId)");
    expect(bulkDelete).toContain("deletedCount: deletedSessions.length");
    expect(bulkDelete).not.toContain("resolveOwnerKinfolkMemoryAccess");
  });

  it("does not couple session deletion to private-memory, feedback, provider, or account reset behavior", () => {
    for (const handler of [bulkDelete, singleDelete]) {
      expect(handler).not.toMatch(/kinfolkPrivateMemoriesTable|kinfolkFeedbackTable|kinfolkResponseFeedbackTable/);
      expect(handler).not.toMatch(/openai|provider|reset|userPreferencesTable/);
    }
  });
});
