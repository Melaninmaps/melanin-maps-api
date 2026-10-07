import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../../..");
const buildSource = readFileSync(resolve(root, "artifacts/api-server/build.mjs"), "utf8");
const nixpacksSource = readFileSync(resolve(root, "nixpacks.toml"), "utf8");
const dockerIgnoreSource = readFileSync(resolve(root, ".dockerignore"), "utf8");

describe("production web asset build contract", () => {
  it("builds the workspace web source before api-server serves the production SPA", () => {
    expect(buildSource).toContain('const webAppDir = path.resolve(artifactDir, "..", "web")');
    expect(buildSource).toContain('execFileSync("pnpm", ["run", "build"]');
    expect(buildSource).toContain("cwd: webAppDir");
    expect(buildSource).toContain("const webDistDir = path.resolve(webAppDir, \"dist\", \"public\")");
    expect(buildSource).toContain("return cp(webDistDir, webStaticDst, { recursive: true })");
    expect(buildSource).not.toContain('const webStaticSrc = path.resolve(artifactDir, "web-static")');
  });

  it("keeps generated web assets out of the final source-copy layer", () => {
    expect(nixpacksSource).toContain("rm -rf artifacts/web/dist artifacts/api-server/web-static");
    expect(nixpacksSource).toContain('"pnpm --filter @workspace/web run build"');
    expect(nixpacksSource).toContain('"cp -R artifacts/web/dist/public/. artifacts/api-server/web-static/"');
    expect(nixpacksSource).toContain('"pnpm --filter @workspace/api-server run build"');

    for (const generatedPath of [
      "artifacts/web/dist/",
      "artifacts/api-server/dist/",
      "artifacts/api-server/web-static/",
    ]) {
      expect(dockerIgnoreSource).toContain(generatedPath);
    }
  });
});
