import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const route = readFileSync(fileURLToPath(new URL("../routes/business-owner-onboarding.ts", import.meta.url)), "utf8");
const migrations = readFileSync(fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)), "utf8");
const routeIndex = readFileSync(fileURLToPath(new URL("../routes/index.ts", import.meta.url)), "utf8");
const schema = readFileSync(`${root}lib/db/src/schema/business-owner-onboarding.ts`, "utf8");

describe("business owner onboarding API contract", () => {
  it("keeps the checklist behind an approved active owner relationship", () => {
    expect(route).toContain('router.get("/businesses/mine/onboarding"');
    expect(route).toContain('router.put("/businesses/mine/onboarding"');
    expect(route).toContain("bol.role = 'owner'");
    expect(route).toContain("bol.status = 'approved'");
    expect(route).toContain("bol.revoked_at IS NULL");
    expect(route).toContain("Approved business owner access is required");
    expect(route).not.toContain("isAdmin(req)");
  });

  it("uses a request-scoped, schema-only readiness gate instead of startup publishing", () => {
    expect(migrations).toContain('name: "business_owner_onboarding_v1"');
    expect(migrations).toContain("export async function ensureBusinessOwnerOnboardingSchema");
    expect(migrations).toContain("SELECT business_id, last_updated_by_user_id, offerings, pricing, availability, media, communication FROM business_owner_onboarding LIMIT 0");
    expect(route).toContain("ensureBusinessOwnerOnboardingSchema");
    expect(route).toContain('error: "BUSINESS_OWNER_ONBOARDING_SCHEMA_UNAVAILABLE"');
    expect(routeIndex).toContain("businessOwnerOnboardingRouter");
  });

  it("stores only private owner-entered setup state and declares no automatic side effects", () => {
    expect(schema).toContain("Private, owner-scoped launch-checklist data");
    expect(route).toContain("autoPublishesBusinessProfile: false");
    expect(route).toContain("createsMarketingContent: false");
    expect(route).toContain("createsCustomerContact: false");
    expect(route).toContain("changesDirectoryEligibility: false");
    expect(route).not.toContain("router.post(\"/businesses/mine/onboarding/publish");
    expect(route).not.toContain("stripe");
    expect(route).not.toContain("kinfolk");
  });
});
