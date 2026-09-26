import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../routes/businesses.ts", import.meta.url)),
  "utf8",
);

describe("public business directory VIBES filters", () => {
  it("accepts bounded canonical VIBES and combines them with existing directory constraints", () => {
    expect(route).toContain("vibes: vibesParam");
    expect(route).toContain("normalizeOwnerExperienceKey");
    expect(route).toContain("const CANONICAL_VIBE_KEYS");
    expect(route).toContain("CANONICAL_VIBE_KEYS.has(value)");
    expect(route).toContain("const requestedVibes");
    expect(route).toContain("requestedVibes.length > 0");
    expect(route).toContain("businessesTable.vibes} ?| ARRAY");
    expect(route).toContain("conditions.push(...designationConditions)");
  });
});
