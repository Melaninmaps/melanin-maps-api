import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const businessesRoute = readFileSync(new URL("../businesses.ts", import.meta.url), "utf8");
const mobileIntake = readFileSync(new URL("../../../../mobile/app/list-business.tsx", import.meta.url), "utf8");

describe("community business duplicate confirmation", () => {
  it("checks public listings by name, address, website, and supported social profiles", () => {
    const start = businessesRoute.indexOf('"/businesses/duplicate-check"');
    const end = businessesRoute.indexOf("// Backward-compatible adapter", start);
    const route = businessesRoute.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(route).toContain("public.public_businesses");
    expect(route).toContain("same_name_and_address");
    expect(route).toContain("same_website");
    expect(route).toContain("same_social_profile");
    expect(route).toContain("step5_linkedProfiles");
    expect(route).toContain("candidates");
  });

  it("requires the member to confirm candidates before mobile submission", () => {
    expect(mobileIntake).toContain("checkPotentialDuplicates");
    expect(mobileIntake).toContain("/api/businesses/duplicate-check?");
    expect(mobileIntake).toContain("Is this the place you meant?");
    expect(mobileIntake).toContain("Yes, use this listing");
    expect(mobileIntake).toContain("No, this is a different place");
    expect(mobileIntake).toContain("duplicateReviewAcknowledged");
  });
});
