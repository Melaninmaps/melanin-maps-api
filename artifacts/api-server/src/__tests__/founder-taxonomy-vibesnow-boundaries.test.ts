import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const intakeSource = source("../businessIntake/types.ts");
const submissionRoutesSource = source("../businessIntake/registerSubmissionRoutes.ts");
const businessRouteSource = source("../routes/businesses.ts");
const vibesRouteSource = source("../routes/vibes.ts");

describe("API VIBESNOW taxonomy boundaries", () => {
  it("validates new category/subcategory pairs but retains historical values only for amendments", () => {
    expect(intakeSource).toContain("isCanonicalBusinessCategory(category)");
    expect(intakeSource).toContain("isCanonicalSubcategoryForCategory(category, subcategory)");
    expect(intakeSource).toContain("allowLegacyClassification = false");
    expect(submissionRoutesSource).toContain("{ allowLegacyClassification: true }");
    expect(submissionRoutesSource).toContain("submission.subcategory ?? null");
  });

  it("filters directory VIBES by the matching founder-approved category", () => {
    expect(businessRouteSource).toContain("CANONICAL_VIBE_CATEGORIES_BY_KEY");
    expect(businessRouteSource).toContain("function permittedVibeCondition(keys");
    expect(businessRouteSource).toContain("eq(businessesTable.category, category)");
    expect(businessRouteSource).toContain("permittedVibeCondition(requestedVibes)");
  });

  it("prevents owner and admin writes from turning quick-review endorsements into VIBES", () => {
    expect(vibesRouteSource).toContain("const allowed = new Set(policy.vibeChoices.map");
    expect(vibesRouteSource).toContain("Quick");
    expect(businessRouteSource).toContain("Choose up to two VIBES allowed for this business category.");
  });
});
