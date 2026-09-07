import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  fileURLToPath(new URL("../App.tsx", import.meta.url)),
  "utf8",
);

describe("canonical Businesses route", () => {
  it("mounts exactly one gated canonical directory at /businesses", () => {
    const route = /<Route path="\/businesses">([\s\S]*?)<\/Route>/.exec(appSource)?.[1] ?? "";
    expect(route).toContain("<PreLaunchRoute><LocationFirstBusinessDirectory /></PreLaunchRoute>");
    expect((appSource.match(/path="\/businesses"/g) ?? [])).toHaveLength(1);
  });
});