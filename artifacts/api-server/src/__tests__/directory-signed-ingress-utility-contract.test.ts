import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../../../../scripts/ingest-signed-directory-review-manifest.mjs", import.meta.url)),
  "utf8",
);

describe("signed directory ingress utility contract", () => {
  it("keeps original manifest provenance while signing an enriched ingress payload", () => {
    expect(source).toContain("source_manifest_sha256: sourceManifestSha256");
    expect(source).toContain("destinationHealthSha256");
    expect(source).toContain("summaryManifestSha256 !== sourceManifestSha256");
    expect(source).toContain("healthReport.candidates !== records.length");
  });

  it("does not publish directly to the production database", () => {
    expect(source).toContain("/api/founder/directory-import/ingress");
    expect(source).toContain('"authorization": `Bearer ${serviceToken}`');
    expect(source).toContain('"x-directory-service-signature": serviceSignature');
    expect(source).toContain("x-directory-signature");
    expect(source).not.toContain("INSERT INTO businesses");
    expect(source).not.toContain("DATABASE_URL");
  });

  it("uses checked customer destinations instead of treating untested links as live", () => {
    expect(source).toContain('result.outcome === "reachable"');
    expect(source).toContain("destination_reachable: reachable");
    expect(source).toContain("destination_health");
  });
});
