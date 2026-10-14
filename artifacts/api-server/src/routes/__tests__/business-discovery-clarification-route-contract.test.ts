import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../kinfolk.ts", import.meta.url)),
  "utf8",
);

const helperStart = source.indexOf(
  "async function tryAnswerDeterministicBusinessDiscovery",
);
const helperEnd = source.indexOf('router.post("/kinfolk/chat"', helperStart);
const helper = source.slice(
  helperStart,
  helperEnd === -1 ? source.length : helperEnd,
);

describe("governed discovery refinement route", () => {
  it("returns optional temporary hair and activity refinements after a completed discovery response", () => {
    expect(helper).toContain("businessDiscoveryClarification({");
    expect(helper).toContain("subjectKey: subject.key");
    expect(helper).toContain("ageBand,");
    expect(helper).toContain("city: scope.city");
    expect(helper).toContain("clarificationSteps:");
    expect(helper).toContain("discoveryClarificationSteps.length > 0");
  });

  it("keeps an optional refinement out of the blocking clarification state", () => {
    const refinement = helper.indexOf("const discoveryClarificationSteps");
    const response = helper.indexOf("input.res.status(200).json({", refinement);

    expect(refinement).toBeGreaterThan(-1);
    expect(response).toBeGreaterThan(refinement);
    expect(helper).toContain("requiresClarification: false");
    expect(helper).toContain("needsClarification: false");
  });
});
