import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../directoryImport/publicationWorker.ts", import.meta.url)),
  "utf8",
);

describe("directory worker controlled-geocoding contract", () => {
  it("uses the strict address matcher at single-worker pace before physical publication", () => {
    expect(source).toContain('import { geocodeDirectoryCandidate }');
    expect(source).toContain("await pause(1_100)");
    expect(source).toContain("geocodeDirectoryCandidate({");
    expect(source).toContain("location_evidence: coordinates");
    expect(source).toContain("directoryWorkerConcurrency(environment)");
  });

  it("holds an unresolved physical address instead of creating a pin or retry loop", () => {
    expect(source).toContain("status='needs_research'");
    expect(source).toContain("geocode_unverified: held for review");
    expect(source).toContain("interval '365 days'");
    expect(source).not.toContain("latitude: 0");
    expect(source).not.toContain("longitude: 0");
  });

  it("hashes the geocoded evidence before exactly-once publication", () => {
    expect(source).toContain("sha256Hex(canonicalDirectoryPayload(enriched))");
    expect(source).toContain("payload: prepared.payload, payloadHash: prepared.payloadHash");
  });
});
