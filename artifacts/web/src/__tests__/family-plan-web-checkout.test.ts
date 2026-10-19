import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const billing = readFileSync(
  new URL("../pages/billing.tsx", import.meta.url),
  "utf8",
);
const familyPlan = readFileSync(
  new URL("../pages/family-plan.tsx", import.meta.url),
  "utf8",
);
const membership = readFileSync(
  new URL("../pages/membership.tsx", import.meta.url),
  "utf8",
);
const membershipGate = readFileSync(
  new URL("../components/membership-gate.tsx", import.meta.url),
  "utf8",
);

describe("website membership enrollment closure", () => {
  it("registers a protected website family-plan status route", () => {
    expect(app).toContain('import FamilyPlan from "@/pages/family-plan"');
    expect(app).toContain('<Route path="/family-plan">');
    expect(app).toContain(
      "<Layout><ProtectedRoute><FamilyPlan /></ProtectedRoute></Layout>",
    );
    expect(familyPlan).toContain("fetch(`${BASE}api/membership/plan`");
    expect(familyPlan).toContain('credentials: "include"');
    expect(familyPlan).not.toContain("Authorization:");
    expect(familyPlan).not.toContain("auth_session_token");
  });

  it("removes all website checkout initiators while retaining approved catalog references", () => {
    for (const source of [familyPlan, membership, membershipGate]) {
      expect(source).not.toContain("api/billing/checkout");
      expect(source).not.toContain("api/membership/family/add-seat");
      expect(source).not.toContain("checkoutUrl");
    }

    expect(familyPlan).toContain(
      "Additional family-seat enrollment is unavailable",
    );
    expect(familyPlan).toContain("La inscripción de");
    expect(membership).toContain("Membership enrollment unavailable");
    expect(membership).toContain("Inscripción de");
    expect(membership).toContain("membresía");
    expect(membership).toContain("no disponible");
    expect(membershipGate).toContain("Membership enrollment unavailable");
    expect(membershipGate).toContain("Inscripción de");
    expect(membershipGate).toContain("membresía");
    expect(membershipGate).toContain("no disponible");
    expect(membership).toContain('billing === "annual" ? "$79.99" : "$7.99"');
    expect(membership).toContain('billing === "annual" ? "$149.99" : "$14.99"');
    expect(membership).toContain("approved catalog reference only");
    expect(familyPlan).toContain("addOnSeatPriceDisplay");
    expect(familyPlan).toContain(
      "Additional family-seat enrollment is unavailable",
    );
  });

  it("preserves unauthenticated account entry before free-plan routes", () => {
    const planClickHandler = membership.slice(
      membership.indexOf("function handlePlanClick"),
      membership.indexOf("function handleContinue"),
    );
    const testerGuard = planClickHandler.indexOf("if (isTester)");
    const accountEntryGuard = planClickHandler.indexOf("if (!currentUser)");
    const communityRoute = planClickHandler.indexOf('navigate("/discover")');
    const businessRoute = planClickHandler.indexOf(
      'navigate("/business/signup")',
    );

    expect(planClickHandler).toContain(
      'window.location.href = "/login?redirect=/membership"',
    );
    expect(testerGuard).toBeGreaterThanOrEqual(0);
    expect(accountEntryGuard).toBeGreaterThan(testerGuard);
    expect(accountEntryGuard).toBeLessThan(communityRoute);
    expect(accountEntryGuard).toBeLessThan(businessRoute);
  });

  it("retains free Community and business-listing actions plus existing billing management", () => {
    expect(membership).toContain('navigate("/discover")');
    expect(membership).toContain('navigate("/business/signup")');
    expect(membership).toContain("Join Free");
    expect(membership).toContain("Claim Free Listing");
    expect(membership).toContain("isTester");
    expect(membership).toContain("Tester information");
    expect(membership).toContain("handleContinue");

    expect(billing).toContain("billing?.hasSubscription");
    expect(billing).toContain('"Manage Plan"');
    expect(billing).toContain('"View membership status"');
    expect(billing).toContain("api/stripe/portal");
    expect(billing).toContain("Billing History");
  });
});
