import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const vaultSource = readFileSync(
  fileURLToPath(new URL("../sensitive-memory-vault.ts", import.meta.url)),
  "utf8",
);

describe("sensitive private memory vault contract", () => {
  it("redacts sensitive detail from the ordinary memory-management response", () => {
    const listStart = routeSource.indexOf('router.get("/kinfolk/memories"');
    const listEnd = routeSource.indexOf('router.post("/kinfolk/memory-consent"', listStart);
    const listRoute = routeSource.slice(listStart, listEnd);

    expect(listRoute).toContain("content: memory.isSensitive ? null : memory.content");
    expect(listRoute).toContain("vaultLocked: memory.isSensitive");
    expect(listRoute).toContain("sensitiveRestricted: kinfolkPrivateMemoriesTable.sensitiveRestricted");
  });

  it("requires recent session-scoped reauthentication before protected reads and writes", () => {
    expect(routeSource).toContain('router.post("/kinfolk/sensitive-memory-vault/reauth"');
    expect(routeSource).toContain('router.get("/kinfolk/sensitive-memories/:id"');
    expect(routeSource).toContain('router.patch("/kinfolk/sensitive-memories/:id/restricted-use"');
    expect(routeSource).toContain("requireSensitiveMemoryVaultReauth(req, res)");
    expect(vaultSource).toContain("SENSITIVE_MEMORY_VAULT_REAUTH_TTL_MS = 10 * 60 * 1_000");
    expect(vaultSource).toContain("SENSITIVE_MEMORY_REAUTH_UNAVAILABLE");
    expect(vaultSource).toContain("sensitiveMemoryVaultReauthenticatedAt");
  });

  it("keeps restricted sensitive records out of proactive prompt use", () => {
    expect(routeSource).toContain("explicitlyRequestsRestrictedSensitiveMemoryUse");
    expect(routeSource).toContain("memory.sensitiveRestricted");
    expect(routeSource).toContain("eq(kinfolkPrivateMemoriesTable.sensitiveRestricted, false)");
  });
});
