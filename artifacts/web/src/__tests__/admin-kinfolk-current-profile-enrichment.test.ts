import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(fileURLToPath(new URL("../components/KinfolkCurrentProfileEnrichment.tsx", import.meta.url)), "utf8");
const adminSource = readFileSync(fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)), "utf8");

describe("audited profile enrichment Admin control", () => {
  it("uses authenticated transport, verifies scope, and exposes batch outcomes", () => {
    expect(componentSource).toContain('authenticatedAdminFetch("/api/admin/businesses/profile-enrichment-apply"');
    expect(componentSource).toContain("manifestScope !== scope");
    expect(componentSource).toContain("readAdminJson<ApplyResponse>");
    expect(componentSource).toContain("Batch complete.");
    expect(componentSource).toContain("View skipped records");
  });

  it("explains the source-backed additive boundary", () => {
    expect(componentSource).toContain("replace only a known generic directory description");
    expect(componentSource).toContain("never changes ownership, category, location, map pins, photos, prices, lifecycle, or Kinfolk eligibility");
    expect(componentSource).toContain("parsed.candidates.length > 100");
  });

  it("provides an accessible, visible file input for a reviewed manifest", () => {
    expect(componentSource).toContain('aria-label="Upload reviewed profile enrichment manifest"');
    expect(componentSource).toContain('type="file"');
    expect(componentSource).not.toContain('className="sr-only"');
  });

  it("is available in the Current or noncurrent inventory selected by the Admin", () => {
    expect(adminSource).toContain('bizIntakeCohortFilter === "non_kinfolk_current"');
    expect(adminSource).toContain('get("profile_enrichment")');
    expect(adminSource).toContain('requested === "kinfolk_current" || requested === "non_kinfolk_current"');
    expect(adminSource).toContain('get("admin_section") === "businesses"');
    expect(adminSource).toContain("useState<Tab>(initialAdminTab)");
    expect(adminSource).toContain("profileEnrichmentScope && bizStatusFilter");
    expect(adminSource).toContain('id="profile-enrichment"');
    expect(adminSource).toContain('getElementById("profile-enrichment")?.scrollIntoView');
    expect(adminSource).toContain("<KinfolkCurrentProfileEnrichment scope={profileEnrichmentScope}");
  });

  it("does not reload the page-wide inventory after a bounded enrichment request", () => {
    expect(adminSource).not.toContain("onApplied={() => { void loadBusinesses({}); }}");
  });
});
