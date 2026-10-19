import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const billingSource = readFileSync(
  new URL("../routes/billing.ts", import.meta.url),
  "utf8",
);
const familySource = readFileSync(
  new URL("../routes/membership-family.ts", import.meta.url),
  "utf8",
);
const websiteSource = readFileSync(
  new URL("../../../web/src/pages/membership.tsx", import.meta.url),
  "utf8",
);
const membershipGateSource = readFileSync(
  new URL("../../../web/src/components/membership-gate.tsx", import.meta.url),
  "utf8",
);

describe("membership price integrity", () => {
  it("retains approved catalog references while checkout initiation is closed", () => {
    expect(familySource).toMatch(
      /navigator:\s*\{[\s\S]*?name: "Navigator",[\s\S]*?monthlyPrice: 7\.99,[\s\S]*?annualPrice: 79\.99/,
    );
    expect(familySource).toMatch(
      /trailblazer:\s*\{[\s\S]*?name: "Trailblazer",[\s\S]*?monthlyPrice: 14\.99,[\s\S]*?annualPrice: 149\.99/,
    );
    expect(websiteSource).toContain(
      'billing === "annual" ? "$79.99" : "$7.99"',
    );
    expect(websiteSource).toContain(
      'billing === "annual" ? "$149.99" : "$14.99"',
    );
    expect(websiteSource).toContain('billing === "annual" ? "$199" : "$19.99"');
    expect(websiteSource).toContain('billing === "annual" ? "$499" : "$49.99"');
    expect(websiteSource).toContain(
      'billing === "annual" ? "$1,499" : "$149.99"',
    );
    expect(membershipGateSource).toContain('price: "$7.99/mo"');
    expect(membershipGateSource).toContain('annualPrice: "$149.99/yr"');
    expect(websiteSource).toContain("approved catalog reference only");
    expect(websiteSource).not.toContain('"$63"');
    expect(websiteSource).not.toContain('"$119"');
  });

  it("does not retain an inline checkout authority behind catalog prices", () => {
    expect(billingSource).toContain(
      "MEMBERSHIP_CHECKOUT_CATALOG_RECONCILIATION_REQUIRED",
    );
    expect(billingSource).not.toContain("stripe.checkout.sessions.create");
    expect(billingSource).not.toContain("PLAN_PRICES_CENTS");
  });
});
