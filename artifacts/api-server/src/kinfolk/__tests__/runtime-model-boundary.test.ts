import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const kinfolkDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routeFile = resolve(kinfolkDirectory, "../routes/kinfolk.ts");

function runtimeSources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === "__tests__" ? [] : runtimeSources(path);
    }
    return path.endsWith(".ts") && !path.endsWith("model-config.ts") ? [path] : [];
  });
}

describe("Kinfolk runtime model boundary", () => {
  it("rejects hardcoded model values at Kinfolk provider call sites", () => {
    const violations = [...runtimeSources(kinfolkDirectory), routeFile]
      .flatMap((path) => {
        const source = readFileSync(path, "utf8");
        return /model\s*:\s*["'][^"']+["']/g.test(source) ? [path] : [];
      });
    expect(violations).toEqual([]);
  });
});