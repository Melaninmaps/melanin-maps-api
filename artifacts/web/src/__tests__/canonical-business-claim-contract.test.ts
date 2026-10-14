import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("canonical business ownership claim contract", () => {
  const claimPage = source("../pages/business-claim.tsx");
  const detailPage = source("../pages/business-detail.tsx");
  const claimRoute = source("../../../api-server/src/routes/claims.ts");

  it("uses the one canonical server-enforced claim endpoint from both web entry points", () => {
    expect(claimPage).toContain("/claims`");
    expect(claimPage).not.toContain("api/businesses/${businessId}/claim`");
    expect(detailPage).toContain("/claims`, {");
    expect(claimRoute).toContain('router.post("/businesses/:id/claims"');
    expect(claimRoute).toContain("One-open-claim-per-member-per-business guard");
  });

  it("submits the exact authorization fields accepted by the canonical route", () => {
    for (const field of ["ownerName", "businessEmail", "claimantPhone", "verificationMethod", "attestation: true"]) {
      expect(claimPage).toContain(field);
    }
    expect(claimPage).toContain("officialUrl:");
    expect(claimPage).toContain("socialHandle:");
    expect(claimPage).toContain("notes:");
    expect(detailPage).toContain("officialUrl:");
    expect(detailPage).toContain("socialHandle:");
    expect(detailPage).toContain("notes:");
    expect(claimPage).toContain("claim-eligibility");
    expect(claimPage).toContain("never added to the public listing");
  });

  it("does not promise verification or public-record mutation from a claim request", () => {
    expect(claimPage).toContain("does not change public details, verification, ownership designations, ranking, safety information, or publication");
    expect(claimPage).toContain("does not verify the business, ownership designation, safety, or public eligibility");
    expect(claimRoute).toContain("does NOT set verified = true");
    expect(claimRoute).toContain("does NOT alter verified_designations");
  });
});
