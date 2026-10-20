import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  EXPLICIT_FEATURE_RELEASE_MODE_ENV,
  isExplicitFeatureReleaseMode,
} from "../explicitFeatureReleaseMode";

describe("explicit production feature-release mode", () => {
  it("requires the exact opt-in value", () => {
    expect(EXPLICIT_FEATURE_RELEASE_MODE_ENV).toBe("MWM_EXPLICIT_FEATURE_RELEASE_MODE");
    expect(isExplicitFeatureReleaseMode({})).toBe(false);
    expect(isExplicitFeatureReleaseMode({ MWM_EXPLICIT_FEATURE_RELEASE_MODE: "TRUE" })).toBe(false);
    expect(isExplicitFeatureReleaseMode({ MWM_EXPLICIT_FEATURE_RELEASE_MODE: "true" })).toBe(true);
  });

  it("keeps legacy startup writers outside the explicit release path", () => {
    const index = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../index.ts"),
      "utf8",
    );
    expect(index).toContain("if (explicitFeatureReleaseMode)");
    expect(index).toContain("skipping boot-time schema and publication writers");
    expect(index).toContain("skipping automatic startup writers");
    expect(index).toContain("runStartupMigrations(logger)");
    expect(index).toContain("startLatinxLehighValleyPublication");
  });

  it("runs the Business Voice Profile table gate before traffic in normal and explicit release modes", () => {
    const index = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../index.ts"),
      "utf8",
    );
    const ownerLinkGate = index.indexOf("await ensureBusinessOwnerLinkLifecycleSchema(logger)");
    const voiceProfileGate = index.indexOf(
      "await ensureBusinessKinfolkVoiceProfileSchema(logger)",
    );
    const releaseModeBranch = index.indexOf("if (explicitFeatureReleaseMode)");
    const listener = index.indexOf("app.listen");

    expect(index).toContain("ensureBusinessKinfolkVoiceProfileSchema,");
    expect(ownerLinkGate).toBeGreaterThan(-1);
    expect(voiceProfileGate).toBeGreaterThan(ownerLinkGate);
    expect(releaseModeBranch).toBeGreaterThan(voiceProfileGate);
    expect(listener).toBeGreaterThan(voiceProfileGate);
    expect(index).toContain("runStartupMigrations(logger)");
  });
});
