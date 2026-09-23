import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const submissionSource = readFileSync(
  fileURLToPath(new URL("../pages/submit-business.tsx", import.meta.url)),
  "utf8",
);

describe("community business ownership designation parity", () => {
  it("offers the mobile community-submission ownership taxonomy on the website", () => {
    for (const designation of [
      "black-owned",
      "hispanic-owned",
      "ethiopian-owned",
      "caribbean-owned",
      "brazilian-owned",
      "indigenous-owned",
      "asian-owned",
      "african-owned",
      "immigrant-owned",
      "woman-owned",
      "lgbtq-owned",
      "veteran-owned",
      "family-owned",
    ]) {
      expect(submissionSource).toContain(`value: "${designation}"`);
    }
  });

  it("keeps multi-designation community reports distinct from owner verification", () => {
    expect(submissionSource).toContain("communityReportedOwnership");
    expect(submissionSource).toContain("ownershipDesignations");
    expect(submissionSource).toContain("Ownership information is community-reported, never identity verification");
  });
});
