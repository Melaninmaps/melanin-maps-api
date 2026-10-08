import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../business-service-offerings.ts", import.meta.url)), "utf8");
const routerIndex = readFileSync(fileURLToPath(new URL("../index.ts", import.meta.url)), "utf8");

describe("business service offering boundaries", () => {
  it("requires approved owners or administrators and retains an audit receipt", () => {
    expect(source).toContain("bol.role = 'owner'");
    expect(source).toContain("bol.status = 'approved'");
    expect(source).toContain("isAdmin(req)");
    expect(source).toContain("business_service_offering_audit_events");
    expect(source).toContain("before_state");
    expect(source).toContain("after_state");
    expect(routerIndex).toContain("businessServiceOfferingsRouter");
  });
  it("does not change lifecycle, ownership, map pins, or community signals", () => {
    expect(source).toContain("This did not change publication, map pins, ownership, community signals, or lifecycle.");
    expect(source).not.toMatch(/UPDATE\s+businesses/i);
    expect(source).not.toMatch(/community_vibes|approved_business_vibes/i);
  });
});
