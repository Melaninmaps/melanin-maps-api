import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  fileURLToPath(new URL("../app.ts", import.meta.url)),
  "utf8",
);
const buildSource = readFileSync(
  fileURLToPath(new URL("../../build.mjs", import.meta.url)),
  "utf8",
);

describe("compiled build identity contract", () => {
  it("returns the esbuild-substituted identity rather than a generated source file", () => {
    expect(appSource).toContain("declare const __BUILT_FROM_SHA__: string;");
    expect(appSource).toContain("declare const __BUILD_AT__: string;");
    expect(appSource).toContain("const BUILT_FROM_SHA: string = __BUILT_FROM_SHA__;");
    expect(appSource).toContain("const BUILD_AT: string = __BUILD_AT__;");
    expect(appSource).not.toContain('from "./generated/buildIdentity"');
  });

  it("defines both identity values during the production API build", () => {
    expect(buildSource).toContain('"__BUILT_FROM_SHA__": JSON.stringify(_builtFromSha)');
    expect(buildSource).toContain('"__BUILD_AT__": JSON.stringify(_buildAt)');
  });
});
