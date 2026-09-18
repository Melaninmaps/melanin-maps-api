import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const billingSource = readFileSync(new URL("../routes/billing.ts", import.meta.url), "utf8");
const familySource = readFileSync(new URL("../routes/membership-family.ts", import.meta.url), "utf8");
const websiteSource = readFileSync(new URL("../../../web/src/pages/membership.tsx", import.meta.url), "utf8");

describe("membership price integrity", () => {
  it("keeps checkout authority at the published Navigator and Trailblazer prices", () => {
    expect(billingSource).toContain('navigator:    { monthly: 799,  annual: 7999');
    expect(billingSource).toContain('trailblazer:  { monthly: 1499, annual: 14999');
  });

  it("matches every member-facing website and family-plan price label to checkout", () => {
    expect(familySource).toContain('navigator: { name: "Navigator", monthlyPrice: 7.99, annualPrice: 79.99');
    expect(familySource).toContain('trailblazer: { name: "Trailblazer", monthlyPrice: 14.99, annualPrice: 149.99');
    expect(websiteSource).toContain('billing === "annual" ? "$79.99" : "$7.99"');
    expect(websiteSource).toContain('billing === "annual" ? "$149.99" : "$14.99"');
    expect(websiteSource).toContain('Save 16%');
    expect(websiteSource).toContain('label: "Trailblazer", sub: "$14.99/mo"');
    expect(websiteSource).not.toContain('"$63"');
    expect(websiteSource).not.toContain('"$119"');
    expect(websiteSource).not.toContain('Save 34%');
  });
});
