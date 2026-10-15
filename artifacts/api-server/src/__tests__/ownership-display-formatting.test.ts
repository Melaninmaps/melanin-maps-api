import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const kinfolkRoute = source("../routes/kinfolk.ts");
const businessImprovementRoute = source("../routes/business-improvement.ts");

describe("server ownership display formatting", () => {
  it("formats Black identity labels in Kinfolk responses without altering filter identifiers", () => {
    expect(kinfolkRoute).toContain('ownershipDesignationFilterId(id) === "black-african-american"');
    expect(kinfolkRoute).toContain("return ownershipDesignationDisplayLabel(id)");
  });

  it("formats stored provider labels only while preparing owner-facing plan responses", () => {
    expect(businessImprovementRoute).toContain("ownershipDesignationDisplayLabel(designations[0] ?? \"Minority-Owned\")");
    expect(businessImprovementRoute).toContain('? "Black-Owned"');
  });
});
