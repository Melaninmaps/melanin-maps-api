import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  fileURLToPath(new URL("../app/kinfolk-memory.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk preferred-name control", () => {
  it("uses the dedicated authenticated preferred-name lifecycle routes", () => {
    expect(screen).toContain("/api/kinfolk/preferred-name");
    expect(screen).toContain("/api/kinfolk/preferred-name/pause");
    expect(screen).toContain('method: "PUT"');
    expect(screen).toContain('method: "DELETE"');
    expect(screen).toContain("consent: true");
  });
});
