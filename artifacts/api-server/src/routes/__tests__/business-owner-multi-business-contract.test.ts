import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const businessRoutes = readFileSync(
  new URL("../businesses.ts", import.meta.url),
  "utf8",
);

function managedBusinessRoute(): string {
  const start = businessRoutes.indexOf('router.get("/businesses/mine/managed"');
  const selectedBusinessRead = businessRoutes.indexOf('router.get("/businesses/mine/managed/:businessId"', start);
  return businessRoutes.slice(start, selectedBusinessRead);
}

function managedSpecialtiesRoute(): string {
  const start = businessRoutes.indexOf('router.put("/businesses/mine/managed/:businessId/specialties"');
  const legacyRead = businessRoutes.indexOf('router.get("/businesses/mine",', start);
  return businessRoutes.slice(start, legacyRead);
}

function managedProfilePatch(): string {
  const start = businessRoutes.indexOf('router.patch("/businesses/mine/managed/:businessId/profile"');
  const specialtiesRoute = businessRoutes.indexOf('router.put("/businesses/mine/managed/:businessId/specialties"', start);
  return businessRoutes.slice(start, specialtiesRoute);
}

describe("owner-scoped managed business read contract", () => {
  it("lists every approved, unrevoked owner relationship without mutations", () => {
    const route = managedBusinessRoute();

    expect(route).toContain('router.get("/businesses/mine/managed"');
    expect(route).toContain(".where(approvedOwnerPredicate(String(userId)))");
    expect(route).toContain(".orderBy(asc(businessesTable.name), asc(businessesTable.id))");
    expect(route).toContain("res.json({ businesses });");
    expect(route).not.toContain(".limit(");
    expect(route).not.toMatch(/\.(?:insert|update|delete)\(/);

    expect(businessRoutes).toContain("bol.role = 'owner'");
    expect(businessRoutes).toContain("bol.status = 'approved'");
    expect(businessRoutes).toContain("bol.revoked_at IS NULL");
  });

  it("preserves the legacy single-business read for existing business-specific flows", () => {
    const legacyRead = businessRoutes.slice(
      businessRoutes.indexOf('router.get("/businesses/mine",'),
      businessRoutes.indexOf('router.patch("/businesses/mine/profile"'),
    );

    expect(legacyRead).toContain("resolveLegacySingleManagedBusiness(String(userId))");
    expect(legacyRead).toContain('code: "BUSINESS_SELECTION_REQUIRED"');
    expect(legacyRead).toContain('selection.kind === "selected" ? selection.business : null');
  });

  it("never lets a legacy profile mutation choose one business from multiple approved links", () => {
    const profilePatch = businessRoutes.slice(
      businessRoutes.indexOf('router.patch("/businesses/mine/profile"'),
      businessRoutes.indexOf('router.post(\n  "/businesses/mine/photos"'),
    );

    expect(businessRoutes).toContain("async function resolveLegacySingleManagedBusiness");
    expect(businessRoutes).toContain(".limit(2)");
    expect(profilePatch).toContain('code: "BUSINESS_SELECTION_REQUIRED"');
    expect(profilePatch).toContain("eq(businessesTable.id, selection.business.id)");
    expect(profilePatch).toContain("approvedOwnerPredicate(String(userId))");
  });

  it("requires an explicit approved business ID for selected profile reads and ordinary profile edits", () => {
    const selectedRead = businessRoutes.slice(
      businessRoutes.indexOf('router.get("/businesses/mine/managed/:businessId"'),
      businessRoutes.indexOf('router.patch("/businesses/mine/managed/:businessId/profile"'),
    );
    const selectedPatch = businessRoutes.slice(
      businessRoutes.indexOf('router.patch("/businesses/mine/managed/:businessId/profile"'),
      businessRoutes.indexOf('router.get("/businesses/mine",'),
    );

    expect(selectedRead).toContain('eq(businessesTable.id, businessId)');
    expect(selectedRead).toContain('approvedOwnerPredicate(String(userId))');
    expect(selectedPatch).toContain('eq(businessesTable.id, businessId)');
    expect(selectedPatch).toContain('approvedOwnerPredicate(String(userId))');
    expect(selectedPatch).toContain('res.status(404).json({ error: "Managed business not found." })');
    expect(selectedPatch).not.toContain("listingStatus");
    expect(selectedPatch).not.toContain("ownershipDesignations");
    expect(selectedPatch).not.toContain("latitude");
  });

  it("requires the current selected owner's canonical revision before an ordinary profile write", () => {
    const selectedPatch = managedProfilePatch();
    const revisionRead = selectedPatch.indexOf('.select({ updatedAt: businessesTable.updatedAt })');
    const staleCheck = selectedPatch.indexOf("businessProfileRevisionMatches(current.updatedAt, expectedUpdatedAt)");
    const update = selectedPatch.indexOf(".update(businessesTable)");
    const returning = selectedPatch.indexOf(".returning()", update);

    expect(selectedPatch).toContain("expectedUpdatedAt: expectedUpdatedAtRaw");
    expect(selectedPatch).toContain("parseExpectedBusinessProfileUpdatedAt(expectedUpdatedAtRaw)");
    expect(selectedPatch).toContain('code: "BUSINESS_PROFILE_REVISION_REQUIRED"');
    expect(selectedPatch).toContain("approvedOwnerPredicate(String(userId))");
    expect(revisionRead).toBeGreaterThanOrEqual(0);
    expect(staleCheck).toBeGreaterThan(revisionRead);
    expect(update).toBeGreaterThan(staleCheck);
    expect(selectedPatch).toContain("GREATEST(clock_timestamp(), ${businessesTable.updatedAt} + INTERVAL '1 millisecond')");
    expect(selectedPatch).toContain("date_trunc('milliseconds', ${businessesTable.updatedAt}) = ${expectedUpdatedAt}");
    expect(selectedPatch).toContain("sendBusinessProfileStaleWrite(res)");
    expect(returning).toBeGreaterThan(update);
    expect(businessRoutes).toContain('code: "BUSINESS_PROFILE_STALE_WRITE"');
  });

  it("replaces only the selected approved owner's structured specialties in one locked transaction", () => {
    const route = managedSpecialtiesRoute();

    expect(route).toContain('router.put("/businesses/mine/managed/:businessId/specialties"');
    expect(route).toContain('res.status(401).json({ error: "Unauthorized" })');
    expect(route).toContain('res.status(400).json({ error: "A business selection is required." })');
    expect(route).toContain("eq(businessesTable.id, businessId)");
    expect(route).toContain("approvedOwnerPredicate(String(userId))");
    expect(route).toContain("bol.role = 'owner'");
    expect(route).toContain("bol.status = 'approved'");
    expect(route).toContain("bol.revoked_at IS NULL");
    expect(route).toContain('res.status(404).json({ error: "Managed business not found." })');

    expect(route).toContain("Array.from(");
    expect(route).toContain("Object.prototype.hasOwnProperty.call(rawSpecialties, index)");
    expect(route).toContain("SPECIALTY_SLUG_PATTERN.test(slug)");
    expect(route).toContain("new Set(specialties).size !== specialties.length");
    expect(route.indexOf("const rawSpecialties")).toBeLessThan(
      route.indexOf("const client = await pool.connect()"),
    );

    expect(route).toContain('await client.query("BEGIN")');
    expect(route).toContain("INNER JOIN business_owner_links AS bol");
    expect(route).toContain("FOR UPDATE OF b, bol");
    expect(route).toContain("DELETE FROM business_specialties WHERE business_id = $1::uuid");
    expect(route).toContain("if (specialties.length > 0)");
    expect(route).toContain("SELECT $1::uuid, UNNEST($2::text[])");
    expect(route).toContain("ON CONFLICT DO NOTHING");
    expect(route).toContain("ORDER BY specialty_slug ASC");
    expect(route.indexOf("DELETE FROM business_specialties")).toBeLessThan(
      route.indexOf("INSERT INTO business_specialties"),
    );
    expect(route).toContain('await client.query("COMMIT")');
    expect(route).toContain('await client.query("ROLLBACK").catch(() => undefined)');
    expect(route).toContain("client.release()");
    expect(route).toContain(
      "specialties: savedSpecialtiesResult.rows.map(({ specialty_slug }) => specialty_slug)",
    );

    expect(route).not.toContain("listingStatus");
    expect(route).not.toContain("ownershipDesignations");
    expect(route).not.toContain("latitude");
    expect(route).not.toContain("publication");
    expect(route).not.toContain(".update(");
  });
});
