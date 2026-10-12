import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const route = source("../routes/persistent-safety-location.ts");
const dispatch = source("../safety/familyImpactDispatch.ts");
const startup = source("../lib/startup-migrations.ts");

describe("Persistent Safety Location API privacy contract", () => {
  it("keeps member consent, encrypted current state, per-contact consent, and audit data additive", () => {
    expect(startup).toContain('name: "mwm_persistent_safety_location_v1"');
    expect(startup).toContain("mwm_persistent_safety_location_authorizations");
    expect(startup).toContain("mwm_persistent_safety_locations");
    expect(startup).toContain("mwm_persistent_safety_location_contact_consents");
    expect(startup).toContain("mwm_persistent_safety_location_audit");
    expect(startup).toContain("encrypted_payload TEXT NOT NULL");
    expect(startup).not.toContain("mwm_persistent_safety_location_retention_worker");
  });

  it("offers only owner-authenticated management controls and no contact coordinate route", () => {
    expect(route).toContain('router.post("/safety/persistent-location/fix"');
    expect(route).toContain('router.delete("/safety/persistent-location/location"');
    expect(route).toContain('router.put("/safety/persistent-location/contacts/:shareId"');
    expect(route).toContain("requireUser(req, res)");
    expect(route).toContain("no-store, private");
    expect(route).not.toContain('router.get("/safety/persistent-location/:');
    expect(route).not.toContain("latitude:");
    expect(route).not.toContain("longitude:");
  });

  it("requires active per-contact authorization and evaluates persistent fixes only inside Family Impact", () => {
    expect(dispatch).toContain("mwm_persistent_safety_location_contact_consents");
    expect(dispatch).toContain("mwm_persistent_safety_location_authorizations");
    expect(dispatch).toContain("openPersistentSafetyLocation");
    expect(dispatch).toContain("persistentSafetyLocationCanMatchEmergency");
    expect(dispatch).toContain("emergency_location_evaluated");
    expect(dispatch).toContain("deliveryRequired(impact.status)");
  });
});
