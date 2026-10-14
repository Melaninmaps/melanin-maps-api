import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RELEASE_DB_GATE_TEST_FILES } from "../lib/releaseDbGate";

const apiServerDirectory = fileURLToPath(new URL("../../", import.meta.url));
const readApiFile = (relativePath: string) =>
  readFileSync(new URL(relativePath, `file://${apiServerDirectory}/`), "utf8");

describe("release database test isolation", () => {
  it("keeps release-gate files out of the ordinary Vitest configuration", () => {
    expect(readApiFile("vitest.config.ts")).toContain('"**/*-release-gate.test.ts"');
  });

  it("selects exactly the two guarded Kinfolk database suites", () => {
    const releaseConfig = readApiFile("vitest.release-db-gate.config.ts");
    expect(RELEASE_DB_GATE_TEST_FILES).toEqual([
      "src/kinfolk/__tests__/alias-release-gate.test.ts",
      "src/kinfolk/__tests__/cultural-context-release-gate.test.ts",
    ]);
    expect(releaseConfig).toContain("include: [...RELEASE_DB_GATE_TEST_FILES]");
  });
});
