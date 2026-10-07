import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk medical retrieval ordering", () => {
  it("defers the generic contextual gate so NIH retrieval can govern medical answers", () => {
    const deferralIndex = routeSource.indexOf(
      "const deferContextualEvidenceGateToHealthRetrieval =",
    );
    const contextualGateIndex = routeSource.indexOf(
      "!deferContextualEvidenceGateToHealthRetrieval &&",
    );
    const healthRetrievalIndex = routeSource.indexOf(
      "const healthCtx = await buildHealthRetrievalContext(",
    );

    expect(deferralIndex).toBeGreaterThan(0);
    expect(contextualGateIndex).toBeGreaterThan(deferralIndex);
    expect(healthRetrievalIndex).toBeGreaterThan(contextualGateIndex);
  });

  it("counts retrieved NIH authority when applying the generic evidence outcome", () => {
    expect(routeSource).toContain("const hasAuthoritativeHealthEvidence = hasRetrievedMedicalEvidence(");
    expect(routeSource).toContain(
      "hasAuthoritativeHealthEvidence ||\n      healthRetrievalSources.some(",
    );
    expect(routeSource).toContain("hasSupportingEvidence: hasLiveWebEvidence");
  });
});
