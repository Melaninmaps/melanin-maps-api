import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const script = readFileSync(
  fileURLToPath(new URL("../../ingest-signed-directory-review-manifest.mjs", import.meta.url)),
  "utf8",
);

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
});
