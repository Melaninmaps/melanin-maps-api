import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Safety reliability release-startup contract", () => {
  it("runs the canonical durable-contact and Family Impact schema gate before traffic in explicit release mode", () => {
    const source = readFileSync(new URL("../index.ts", import.meta.url), "utf8");

    expect(source).toContain("ensureSafetyReliabilitySchema,");
    expect(source).toContain("await ensureSafetyReliabilitySchema(logger);");
    expect(source).not.toContain("await ensureSafetyOperationalSchema(logger);");

    const gate = source.indexOf("await ensureSafetyReliabilitySchema(logger);");
    const releaseModeBranch = source.indexOf("if (explicitFeatureReleaseMode)");
    expect(gate).toBeGreaterThan(-1);
    expect(releaseModeBranch).toBeGreaterThan(gate);
  });
});
