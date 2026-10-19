import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const conversationsSource = readFileSync(
  resolve(process.cwd(), "src/routes/conversations.ts"),
  "utf8",
);

function routeSlice(action: "accept" | "decline"): string {
  const marker = `router.post("/conversations/:id/${action}"`;
  const start = conversationsSource.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${action} route`);
  const nextRoute = conversationsSource.indexOf("// ───", start + marker.length);
  return conversationsSource.slice(start, nextRoute < 0 ? undefined : nextRoute);
}

function expectRetainedRecipientGuards(route: string, selfRequesterMessage: string) {
  const guardOrder = [
    'if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });',
    'if (isNaN(convId)) return void res.status(400).json({ error: "Invalid ID" });',
    "const [conv] = await db",
    'if (!conv) return void res.status(404).json({ error: "Not found" });',
    'if (!ids.includes(req.user.id)) return void res.status(403).json({ error: "Forbidden" });',
    'if (conv.type !== "dm") return void res.status(400).json({ error: "Not a direct-message request" });',
    "if (await dmConversationIsBlocked(conv, req.user.id))",
    selfRequesterMessage,
  ];
  const positions = guardOrder.map((guard) => route.indexOf(guard));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions.every((position, index) => index === 0 || position > positions[index - 1]!)).toBe(true);
}

describe("conversation request pending recipient authorization", () => {
  it("retains authentication, ID, participant, DM, blocked, and self-requester checks before accept state mutation", () => {
    const accept = routeSlice("accept");
    expectRetainedRecipientGuards(
      accept,
      'if (conv.requestedBy === req.user.id) return void res.status(400).json({ error: "Cannot accept your own request" });',
    );
    expect(accept.indexOf('if (conv.requestStatus !== "pending") return void pendingRequestConflict(res);'))
      .toBeLessThan(accept.indexOf("const [updated] = await db"));
  });

  it("atomically accepts only a pending request and returns the neutral conflict for a zero-row race", () => {
    const accept = routeSlice("accept");
    expect(accept).toMatch(/\.where\(and\(\s*eq\(conversationsTable\.id, convId\),\s*eq\(conversationsTable\.requestStatus, "pending"\),\s*\)\)/s);
    expect(accept).toContain("if (!updated) return void pendingRequestConflict(res);");
    expect(accept.indexOf("if (!updated) return void pendingRequestConflict(res);"))
      .toBeLessThan(accept.indexOf("res.json({ conversation: updated });"));
  });

  it("retains recipient safeguards and atomically declines only a pending request without false success", () => {
    const decline = routeSlice("decline");
    expectRetainedRecipientGuards(
      decline,
      'if (conv.requestedBy === req.user.id) return void res.status(400).json({ error: "Cannot decline your own request" });',
    );
    expect(decline.indexOf('if (conv.requestStatus !== "pending") return void pendingRequestConflict(res);'))
      .toBeLessThan(decline.indexOf("const [deleted] = await db"));
    expect(decline).toMatch(/\.where\(and\(\s*eq\(conversationsTable\.id, convId\),\s*eq\(conversationsTable\.requestStatus, "pending"\),\s*\)\)/s);
    expect(decline).toContain("if (!deleted) return void pendingRequestConflict(res);");
    expect(decline.indexOf("if (!deleted) return void pendingRequestConflict(res);"))
      .toBeLessThan(decline.indexOf("res.json({ ok: true });"));
  });

  it("uses one client-safe neutral 409 conflict response for non-pending and raced recipient actions", () => {
    expect(conversationsSource).toContain("function pendingRequestConflict(res: Response): void {");
    expect(conversationsSource).toContain('res.status(409).json({ error: "This message request is no longer available", code: "REQUEST_ACTION_CONFLICT" });');
    expect((conversationsSource.match(/pendingRequestConflict\(res\)/g) ?? [])).toHaveLength(4);
  });
});
