import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  new URL("../routes/kinfolk.ts", import.meta.url),
  "utf8",
);

describe("Kinfolk life-intent route contract", () => {
  it("adds life-intent guidance without replacing existing evidence, sources, or response contracts", () => {
    expect(routeSource).toContain("getLifeIntentGuidance(message)");
    expect(routeSource).toContain("buildLifeIntentSourceQuery(message, lifeGuidance)");
    expect(routeSource).toContain("lifeGuidance.responseInstruction");
    expect(routeSource).toContain("followUpSuggestions = [...lifeGuidance.followUpSuggestions]");
    expect(routeSource).toContain("sourceContext: lifeGuidance?.sourceContext ?? undefined");
    expect(routeSource).toContain("sources: [");
    expect(routeSource).toContain("provenanceNote:");
  });
});
