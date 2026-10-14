import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

const adminRoute = source("../routes/admin.ts");
const cityDashboard = source(
  "../../../web/src/components/KinfolkCurrentCityDuplicateReconciliation.tsx",
);
const reconciler = source(
  "../scripts/reconcilePhiladelphiaKinfolkCurrentDuplicates.ts",
);

describe("Kinfolk Current city duplicate reconciliation", () => {
  it("keeps city inventory read-only and requires a city-specific stale-guarded plan for an apply", () => {
    expect(adminRoute).toContain(
      "/admin/businesses/kinfolk-current/city-duplicate-reconciliation",
    );
    expect(adminRoute).toContain("listKinfolkCurrentCityDuplicateInventory");
    expect(adminRoute).toContain(
      "Choose both a city and state for a city-scoped reconciliation preview.",
    );
    expect(adminRoute).toContain("expectedPlanHash !== manifest.planHash");
    expect(adminRoute).toContain("Manual-review records were left unchanged");
    expect(cityDashboard).toContain("Each city receives its own fresh plan");
    expect(cityDashboard).toContain("planHash: preview.planHash");
    expect(reconciler).toContain("buildKinfolkCurrentCityDuplicateManifest");
    expect(reconciler).toContain("applyKinfolkCurrentCityDuplicateManifest");
  });

  it("exposes manual-review evidence through an authenticated read-only report", () => {
    expect(adminRoute).toContain(
      "/admin/businesses/kinfolk-current/city-duplicate-manual-review-report",
    );
    expect(adminRoute).toContain("listKinfolkCurrentCityManualReviewReport");
    expect(adminRoute).toContain(
      "This report is read-only and cannot apply a duplicate consolidation.",
    );
    expect(adminRoute).toContain('res.set("Cache-Control", "no-store")');
    expect(reconciler).toContain(
      "export async function listKinfolkCurrentCityManualReviewReport",
    );
    expect(reconciler).toContain("cases: plan.manualReview");
    expect(reconciler).toContain("evidenceReviewCandidates");
    expect(reconciler).toContain("requiresManualLocationOrGroupDecision");
    expect(reconciler).toContain("hasStoredMapPin: hasStoredMapPin(record)");
    expect(reconciler).not.toContain("ManualReviewReport().then");
  });
});
