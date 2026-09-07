import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPrivateMemoryPromptBlock,
  isKinfolkPrivateMemoryEnabled,
  resolveKinfolkMemoryAccess,
  resolvePublicSharedKinfolkSession,
} from "../private-memory";

describe("Kinfolk private-memory production control", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed in production unless the exact enable flag is true", () => {
    expect(isKinfolkPrivateMemoryEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isKinfolkPrivateMemoryEnabled({
      NODE_ENV: "production",
      KINFOLK_PRIVATE_MEMORY_ENABLED: "TRUE",
    })).toBe(false);
    expect(isKinfolkPrivateMemoryEnabled({
      NODE_ENV: "production",
      KINFOLK_PRIVATE_MEMORY_ENABLED: "true",
    })).toBe(true);
  });

  it("preserves private-memory behavior outside production", () => {
    expect(isKinfolkPrivateMemoryEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isKinfolkPrivateMemoryEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  it("cannot inject private content into a prompt when disabled", () => {
    const privateContent = "My unshared medical detail";
    expect(buildPrivateMemoryPromptBlock(false, [{
      content: privateContent,
      purpose: "ongoing_context",
    }])).toBe("");
    expect(buildPrivateMemoryPromptBlock(true, [{
      content: privateContent,
      purpose: "ongoing_context",
    }])).toContain(privateContent);
    expect(buildPrivateMemoryPromptBlock(true, [{
      content: privateContent,
      purpose: "ongoing_context",
    }])).toContain("same member directly asks");
  });

  it("honors the owner opt-out and fails closed when the setting cannot be read", async () => {
    await expect(resolveKinfolkMemoryAccess({
      runtimeEnabled: true,
      authenticatedUserId: "member-1",
      readOwnerSetting: async () => false,
    })).resolves.toBe(false);
    await expect(resolveKinfolkMemoryAccess({
      runtimeEnabled: true,
      authenticatedUserId: "member-1",
      readOwnerSetting: async () => { throw new Error("database unavailable"); },
    })).resolves.toBe(false);
  });

  it("does not resolve retained shared content while the runtime is disabled", async () => {
    const readConsentedOwnerSession = vi.fn(async () => ({ title: "Private trip" }));

    await expect(resolvePublicSharedKinfolkSession({
      runtimeEnabled: false,
      readConsentedOwnerSession,
    })).resolves.toBeNull();
    expect(readConsentedOwnerSession).not.toHaveBeenCalled();
  });

  it("makes opted-out, deleted-owner, and random shared IDs equally unavailable", async () => {
    for (const unavailableReason of [
      "owner opted out",
      "owner no longer exists",
      "random share ID",
    ]) {
      await expect(resolvePublicSharedKinfolkSession({
        runtimeEnabled: true,
        readConsentedOwnerSession: async () => {
          void unavailableReason;
          return null;
        },
      })).resolves.toBeNull();
    }
  });

  it("fails closed when the consented owner lookup fails", async () => {
    await expect(resolvePublicSharedKinfolkSession({
      runtimeEnabled: true,
      readConsentedOwnerSession: async () => {
        throw new Error("consent store unavailable");
      },
    })).resolves.toBeNull();
  });

  it("returns only content selected by a successful consented-owner lookup", async () => {
    const publicSession = {
      title: "Shared trip",
      destination: "Accra",
      messages: [],
    };

    await expect(resolvePublicSharedKinfolkSession({
      runtimeEnabled: true,
      readConsentedOwnerSession: async () => publicSession,
    })).resolves.toBe(publicSession);
  });

  it("gates every memory API and session reads/writes with the runtime control", () => {
    const routeFile = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../routes/kinfolk.ts",
    );
    const source = readFileSync(routeFile, "utf8");

    for (const route of ["get", "post", "delete"]) {
      expect(source).toContain(`router.${route}("/kinfolk/memories`);
    }
    expect((source.match(/code: "PRIVATE_MEMORY_DISABLED"/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(source).toContain("if (memoryEnabled && sessionId && req.user?.id)");
    expect(source).toContain("if (req.user?.id && memoryEnabled && sessionPersistenceAvailable)");
    expect(source).toContain("const activePrivateMemories = memoryEnabled && req.user?.id");
    expect(source).toContain("if (!input.memoryEnabled) return undefined");

    const chatRoute = source.slice(source.indexOf('router.post("/kinfolk/chat"'));
    const ownerSetting = chatRoute.indexOf("const memoryEnabled = await resolveOwnerKinfolkMemoryAccess(req.user.id)");
    const arithmetic = chatRoute.indexOf("deterministicArithmeticAnswer(message)");
    const deterministicDiscovery = chatRoute.indexOf("tryAnswerDeterministicBusinessDiscovery({");
    const sessionRead = chatRoute.indexOf('chatStage = "session_read"');
    expect(ownerSetting).toBeGreaterThan(0);
    expect(ownerSetting).toBeLessThan(arithmetic);
    expect(ownerSetting).toBeLessThan(deterministicDiscovery);
    expect(ownerSetting).toBeLessThan(sessionRead);
  });

  it("keeps public shares behind current owner consent without deleting share IDs", () => {
    const routeFile = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../routes/kinfolk.ts",
    );
    const source = readFileSync(routeFile, "utf8");
    const sharedRoute = source.slice(source.indexOf('router.get("/kinfolk/shared/:shareId"'));

    expect(sharedRoute).toContain("resolvePublicSharedKinfolkSession({");
    expect(sharedRoute).toContain("runtimeEnabled: isKinfolkPrivateMemoryEnabled()");
    expect(sharedRoute).toContain(".innerJoin(usersTable, eq(usersTable.id, kinfolkSessionsTable.userId))");
    expect(sharedRoute).toContain(".leftJoin(userSettingsTable, eq(userSettingsTable.userId, usersTable.id))");
    expect(sharedRoute).toContain("eq(kinfolkSessionsTable.shareId, shareId)");
    expect(sharedRoute).toContain("isNull(userSettingsTable.userId)");
    expect(sharedRoute).toContain("eq(userSettingsTable.kinfolkMemoryEnabled, true)");
    expect(sharedRoute).toContain('res.status(404).json({ error: "Trip not found" })');
    expect(sharedRoute).not.toContain(".delete(kinfolkSessionsTable)");
    expect(sharedRoute).not.toContain(".update(kinfolkSessionsTable)");
  });

  it("keeps share creation owner-isolated and blocked after opt-out", () => {
    const routeFile = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../routes/kinfolk.ts",
    );
    const source = readFileSync(routeFile, "utf8");
    const start = source.indexOf('router.post("/kinfolk/sessions/:id/share"');
    const end = source.indexOf("// ─── View a shared trip (public)", start);
    const shareRoute = source.slice(start, end);

    expect(shareRoute).toContain("const memoryEnabled = await resolveOwnerKinfolkMemoryAccess(req.user.id)");
    expect(shareRoute).toContain("if (!memoryEnabled)");
    expect(shareRoute).toContain("if (!session || session.userId !== req.user.id)");
    expect(shareRoute).toContain('res.status(404).json({ error: "Trip not found" })');
  });
});
