import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function routeSource(): string {
  return readFileSync(fileURLToPath(new URL("../notifications.ts", import.meta.url)), "utf8");
}

describe("notification device registration privacy", () => {
  it("transfers a shared device token to the authenticated account transactionally", () => {
    const route = routeSource();

    expect(route).toContain('router.post("/notifications/register"');
    expect(route).toContain("await db.transaction(async (tx) => {");
    expect(route).toContain("eq(pushTokensTable.token, token)");
    expect(route).toContain("ne(pushTokensTable.userId, req.user!.id)");
    expect(route).toContain("target: pushTokensTable.userId");
  });
});
