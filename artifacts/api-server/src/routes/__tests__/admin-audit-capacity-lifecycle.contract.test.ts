import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../admin-audit.ts"),
  "utf8",
);
const lifecycleSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../capacity/capacityTestIdentityLifecycle.ts"),
  "utf8",
);
const startupSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/startup-migrations.ts"),
  "utf8",
);

describe("guarded capacity-test identity lifecycle routes", () => {
  it("requires Admin authentication, exact confirmation, an exact 200-user count, and server-side arm guards", () => {
    expect(routeSource).toContain('router.post("/admin/capacity-test-identities/provision"');
    expect(routeSource).toContain('router.post("/admin/capacity-test-identities/cleanup"');
    expect(routeSource).toContain('router.get("/admin/capacity-test-identities/verify"');
    expect(routeSource).toContain("if (!isAdmin(req))");
    expect(routeSource).toContain("req.body?.confirmed === true");
    expect(routeSource).toContain("req.body?.count === CAPACITY_TEST_USER_COUNT");
    expect(routeSource).toContain("isCapacityTestProvisionEnabled(process.env)");
    expect(routeSource).toContain("isCapacityTestCleanupEnabled(process.env)");
    expect(routeSource).toContain("CAPACITY_TEST_PASSWORD_HASH");
    expect(routeSource).toContain("credentialsLogged: false");
    expect(routeSource).not.toContain("req.body?.password");
  });

  it("uses one serializable, advisory-locked transaction and refuses partial provision or cleanup", () => {
    expect(lifecycleSource).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(lifecycleSource).toContain("pg_advisory_xact_lock");
    expect(lifecycleSource).toContain("before.presentAccounts !== 0");
    expect(lifecycleSource).toContain("did not insert exactly 200 accounts; transaction rolled back");
    expect(lifecycleSource).toContain("cleanup requires a complete isolated cohort; transaction rolled back");
    expect(lifecycleSource).toContain("COALESCE(is_load_test, false) = true");
    expect(lifecycleSource).not.toContain("ON CONFLICT");
  });

  it("keeps the capacity lifecycle out of startup writers in explicit feature-release mode", () => {
    expect(startupSource).not.toContain("ensureGuardedCapacityTestIdentityLifecycle");
    expect(startupSource).not.toContain("CAPACITY_TEST_PASSWORD_HASH");
  });
});
