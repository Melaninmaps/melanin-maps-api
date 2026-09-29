import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const impactRoute = source("../routes/impact.ts");
const webHome = source("../../../web/src/pages/home.tsx");
const ownerLanding = source("../../../web/src/pages/for-business-owners.tsx");

describe("public impact metrics", () => {
  it("counts only the canonical public directory rather than the broader inventory", () => {
    expect(impactRoute).toContain("FROM public.public_businesses");
    expect(impactRoute).toContain("COUNT(DISTINCT city)");
    expect(impactRoute).toContain("never market that internal total as listings");
    expect(impactRoute).not.toContain("businessesTable.id");
  });

  it("renders live count responses without adding an unsupported plus sign", () => {
    expect(webHome).toContain('label: "Public Listings"');
    expect(webHome).toContain('suffix: ""');
    expect(ownerLanding).toContain("api/impact");
    expect(ownerLanding).toContain("Public Listings");
    expect(ownerLanding).not.toContain("2,400+");
  });
});
