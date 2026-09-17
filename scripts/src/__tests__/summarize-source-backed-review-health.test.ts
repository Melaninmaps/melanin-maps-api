import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../summarize-source-backed-review-health.mjs"),
  "utf8",
);

describe("source-backed inventory link-health summary", () => {
  it("requires a matching review-only manifest and health report", () => {
    expect(source).toContain("Link-health report does not match the review-only candidate manifest.");
    expect(source).toContain("health.candidates !== candidates.length");
  });

  it("holds non-reachable destinations without declaring businesses closed", () => {
    expect(source).toContain('destination.outcome !== "reachable"');
    expect(source).toContain("noAutomatedPreStageHoldCommercialCandidates");
    expect(source).toContain("not an approval or publish authorization");
    expect(source).toContain("never determines that a business is closed");
    expect(source).toContain("never updates or deletes an existing listing");
  });
});
