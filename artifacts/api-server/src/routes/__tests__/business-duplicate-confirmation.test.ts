import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const businessesRoute = readFileSync(new URL("../businesses.ts", import.meta.url), "utf8");
const mobileIntake = readFileSync(new URL("../../../../mobile/app/list-business.tsx", import.meta.url), "utf8");
const adminIntake = readFileSync(new URL("../../../../web/src/components/AdminAddBusiness.tsx", import.meta.url), "utf8");
const identityPolicy = readFileSync(new URL("../../businesses/businessDuplicateIdentity.ts", import.meta.url), "utf8");

function duplicateRouteSource(): string {
  const start = businessesRoute.indexOf("type BusinessIdentityCandidate");
  const end = businessesRoute.indexOf("// Backward-compatible adapter", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return businessesRoute.slice(start, end);
}

describe("community business duplicate confirmation", () => {
  it("uses high-confidence identity evidence instead of name similarity", () => {
    const route = duplicateRouteSource();
    expect(route).toContain("public.public_businesses");
    expect(route).toContain("highConfidenceBusinessDuplicateReasons");
    expect(identityPolicy).toContain("same_name_and_address");
    expect(identityPolicy).toContain("same_official_domain");
    expect(identityPolicy).toContain("same_official_social");
    expect(identityPolicy).toContain("same_phone");
    expect(route).toContain("identityEvidenceOnly");
    expect(route).not.toContain("similarity(");
    expect(route).not.toContain("step4_fuzzy");
    expect(route).not.toContain("allow_separate");
  });

  it("keeps community matching on public listings only", () => {
    const route = duplicateRouteSource();
    expect(route).toContain('scope === "public" ? "public.public_businesses" : "businesses"');
    expect(businessesRoute).toContain("It only returns already-public listings");
  });

  it("makes server-side canonical matching final for administrator intake", () => {
    expect(businessesRoute).toContain("EXISTING_CANONICAL_BUSINESS");
    expect(businessesRoute).toContain("Could not verify canonical identity");
    expect(adminIntake).toContain("canonicalCandidates");
    expect(adminIntake).toContain("Exact identity evidence is server-enforced");
    expect(adminIntake).not.toContain("These are different — proceed anyway");
  });

  it("uses the shared normalized street-address validator in both address-entry flows", () => {
    expect(identityPolicy).toContain('import { normalizeBusinessStreetAddress } from "@workspace/constants"');
    expect(identityPolicy).toContain("export const normalizeBusinessAddress = normalizeBusinessStreetAddress");
    expect(adminIntake).toContain("validateBusinessStreetAddress(address)");
    expect(mobileIntake).toContain("validateBusinessStreetAddress(form.address)");
    expect(mobileIntake).toContain("address: addressValidation.normalized ?? \"\"");
  });

  it("requires a member confirmation only after exact identity evidence", () => {
    expect(mobileIntake).toContain("checkPotentialDuplicates");
    expect(mobileIntake).toContain("/api/businesses/duplicate-check?");
    expect(mobileIntake).toContain("Is this the place you meant?");
    expect(mobileIntake).toContain("Yes, use this listing");
    expect(mobileIntake).toContain("No, this is a different place");
    expect(mobileIntake).toContain("duplicateReviewAcknowledged");
  });
});
