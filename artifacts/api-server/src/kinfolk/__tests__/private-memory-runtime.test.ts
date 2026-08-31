import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPrivateMemoryPromptBlock,
  isKinfolkPrivateMemoryEnabled,
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

  it("gates every memory API and session reads/writes with the runtime control", () => {
    const routeFile = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../routes/kinfolk.ts",
    );
    const source = readFileSync(routeFile, "utf8");

    for (const route of ["get", "post", "delete"]) {
      expect(source).toContain(`router.${route}("/kinfolk/memories`);
    }
    expect(source.match(/code: "PRIVATE_MEMORY_DISABLED"/g)).toHaveLength(3);
    expect(source).toContain("if (privateMemoryEnabled && sessionId && req.user?.id)");
    expect(source).toContain("if (req.user?.id && memoryEnabled && sessionPersistenceAvailable)");
    expect(source).toContain("const activePrivateMemories = privateMemoryEnabled && req.user?.id");
  });
});