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
});
