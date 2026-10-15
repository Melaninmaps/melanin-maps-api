import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(fileURLToPath(new URL("../components/KinfolkCurrentProfileEnrichment.tsx", import.meta.url)), "utf8");
const adminSource = readFileSync(fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)), "utf8");

describe("Kinfolk Current profile enrichment Admin control", () => {
  it("uses authenticated Safari-safe transport and exposes batch outcomes", () => {
    expect(componentSource).toContain('authenticatedAdminFetch("/api/businesses/admin/businesses/kinfolk-current/profile-enrichment-apply"');
    expect(componentSource).toContain("readAdminJson<ApplyResponse>");
    expect(componentSource).toContain("Batch complete.");
    expect(componentSource).toContain("View skipped records");
  });

  it("explains and preserves the fill-only source-backed boundary", () => {
    expect(componentSource).toContain("only fills an empty description, hours, phone number, or service tags");
    expect(componentSource).toContain("never overwrites a profile or changes ownership, category, location, map pins, photos, prices, lifecycle, or Kinfolk eligibility");
    expect(componentSource).toContain("parsed.candidates.length > 100");
  });

  it("is available only in the Kinfolk Current business inventory", () => {
    expect(adminSource).toContain('kinfolkCurrentCohortSelected && bizStatusFilter !== "kinfolk_current_delete_review"');
    expect(adminSource).toContain("<KinfolkCurrentProfileEnrichment");
  });
});
