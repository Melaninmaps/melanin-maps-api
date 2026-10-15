import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  decodeURIComponent(new URL(relativePath, import.meta.url).pathname),
  "utf8",
);

const ownershipBadges = source("../components/OwnershipBadges.tsx");
const designationPicker = source("../components/OwnershipDesignationPicker.tsx");
const improvementPlan = source("../components/BusinessImprovementPlanModal.tsx");

describe("mobile ownership display formatting", () => {
  it("renders canonical and legacy Black ownership values with the shared badge formatter", () => {
    expect(ownershipBadges).toContain("ownershipDesignationBadgeLabel");
    expect(ownershipBadges).toContain('ownershipDesignationFilterId(type) === "black-african-american"');
    expect(ownershipBadges).toContain('label: "Black-Owned"');
  });

  it("formats legacy labels in owner forms and uses sentence case in owner preferences", () => {
    expect(designationPicker).toContain("ownershipDesignationDisplayLabel");
    expect(designationPicker).toContain("label: ownershipDesignationDisplayLabel(id)");
    expect(improvementPlan).toContain('label: "Black-owned businesses"');
  });
});
