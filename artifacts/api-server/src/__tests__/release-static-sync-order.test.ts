import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const releaseGate = readFileSync(
  fileURLToPath(new URL("../../../../scripts/run-build-115-85-requirements-gate.sh", import.meta.url)),
  "utf8",
);
const artifactVerifier = readFileSync(
  fileURLToPath(new URL("../../../../scripts/verify-release-artifacts.mjs", import.meta.url)),
  "utf8",
);

describe("release static synchronization", () => {
  it("synchronizes web-static before the API embeds the fallback SPA shell", () => {
    const webBuild = releaseGate.indexOf("pnpm --dir artifacts/web run build");
    const staticSync = releaseGate.indexOf("cp -a artifacts/web/dist/public/. artifacts/api-server/web-static/");
    const apiBuild = releaseGate.indexOf("pnpm --dir artifacts/api-server run build");

    expect(webBuild).toBeGreaterThan(-1);
    expect(staticSync).toBeGreaterThan(webBuild);
    expect(apiBuild).toBeGreaterThan(staticSync);
  });

  it("rejects an embedded fallback shell that does not name the current hashed assets", () => {
    expect(artifactVerifier).toContain("generated SPA fallback is missing current asset");
    expect(artifactVerifier).toContain("rebuild API after synchronizing web-static");
    expect(artifactVerifier).toContain("const generatedSpa");
  });
});
