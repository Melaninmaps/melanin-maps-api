import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const familyPlan = readFileSync(new URL("../pages/family-plan.tsx", import.meta.url), "utf8");

describe("website family membership payment handoff", () => {
  it("registers a protected website family plan route", () => {
    expect(app).toContain('import FamilyPlan from "@/pages/family-plan"');
    expect(app).toContain('<Route path="/family-plan">');
    expect(app).toContain('<Layout><ProtectedRoute><FamilyPlan /></ProtectedRoute></Layout>');
  });

  it("creates the family-seat checkout only from the authenticated website", () => {
    expect(familyPlan).toContain('fetch(`${BASE}api/membership/family/add-seat`');
    expect(familyPlan).toContain('credentials: "include"');
    expect(familyPlan).toContain('window.location.assign(data.checkoutUrl)');
    expect(familyPlan).not.toContain("Authorization:");
    expect(familyPlan).not.toContain("auth_session_token");
  });
});
