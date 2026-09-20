import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const script = readFileSync(
  fileURLToPath(new URL("../../ingest-signed-directory-review-manifest.mjs", import.meta.url)),
  "utf8",
);
const stageScript = fileURLToPath(
  new URL("../../stage-signed-directory-review-manifests.mjs", import.meta.url),
);
const founderImports = fileURLToPath(new URL("../../../data/founder-imports", import.meta.url));

describe("signed directory review ingress utility", () => {
  it("uses the current bearer-plus-HMAC operator contract", () => {
    expect(script).toContain('requiredEnvironment("DIRECTORY_SERVICE_TOKEN", 32)');
    expect(script).toContain('"authorization": `Bearer ${serviceToken}`');
    expect(script).toContain('"x-directory-service-timestamp": serviceTimestamp');
    expect(script).toContain('"x-directory-service-nonce": serviceNonce');
    expect(script).toContain('"x-directory-service-signature": serviceSignature');
    expect(script).not.toContain("DIRECTORY_RECONCILIATION_SERVICE_TOKEN");
    expect(script).not.toContain('"x-directory-reconciliation-token"');
  });

  it("accepts the current normalized package summary fields without dropping legacy support", () => {
    expect(script).toContain("summary.manifest_sha256 ?? summary.candidateManifest?.sha256");
    expect(script).toContain("summary.accepted_review_only_candidates ?? summary.candidates ?? summary.candidateManifest?.rowCount");
  });

  it("preflights every committed package before staging", () => {
    const result = spawnSync(process.execPath, [
      stageScript,
      "--root", founderImports,
      "--preflight-only",
    ], { encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.preflightPassed).toBe(true);
    expect(report.manifestCount).toBe(33);
    expect(report.rowCount).toBe(6576);
  });

  it("rejects multiple checksum-bearing summaries before ingress", () => {
    const root = mkdtempSync(join(tmpdir(), "directory-preflight-"));
    const packageDir = join(root, "review-package");
    mkdirSync(packageDir);
    const manifest = `${JSON.stringify({ name: "Example", city: "Example City" })}\n`;
    const checksum = createHash("sha256").update(manifest).digest("hex");
    writeFileSync(join(packageDir, "example-review-only-candidates.jsonl"), manifest);
    writeFileSync(join(packageDir, "one-summary.json"), JSON.stringify({
      manifest_sha256: checksum,
      accepted_review_only_candidates: 1,
    }));
    writeFileSync(join(packageDir, "two-summary.json"), JSON.stringify({
      manifest_sha256: checksum,
      accepted_review_only_candidates: 1,
    }));
    writeFileSync(join(packageDir, "example-destination-health.json"), JSON.stringify({
      candidates: 1,
      results: [],
    }));

    const result = spawnSync(process.execPath, [
      stageScript,
      "--root", root,
      "--preflight-only",
    ], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("requires exactly one checksum-bearing summary; found 2");
  });
});
