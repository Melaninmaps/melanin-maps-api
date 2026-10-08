import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = () => readFileSync(
  fileURLToPath(new URL("../components/AdminEditBusiness.tsx", import.meta.url)),
  "utf8",
);
const adminPage = () => readFileSync(
  fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)),
  "utf8",
);

describe("admin business edit preservation", () => {
  it("loads the protected administrator profile endpoint with the shared bearer-and-cookie fetch helper", () => {
    const editor = source();
    expect(editor).toContain('import { authenticatedFetch } from "@/lib/authenticatedFetch"');
    expect(editor).toContain("/api/admin/businesses/${businessId}/profile");
    expect(editor).not.toContain("/api/businesses/${businessId}`");
  });

  it("keeps legacy categories visible and does not send blackOwned as a generic profile edit", () => {
    const editor = source();
    expect(editor).toContain("const hasLegacyCategory");
    expect(editor).toContain("(current)");
    expect(editor).not.toContain("blackOwned: ownershipDesignations");
    expect(editor).toContain("ownershipReceipt");
    expect(editor).toContain("sourceReceipts");
    expect(editor).toContain("changeNote");
  });

  it("keeps map pins and lifecycle publication out of the generic save path", () => {
    const editor = source();
    expect(editor).toContain("A new pin requires separate, audited geocode evidence");
    expect(editor).toContain("/listing-status");
    expect(editor).toContain("Apply audited lifecycle change");
    expect(editor).toContain("It never creates a listing, changes public visibility, or turns a business into an owner-verified profile.");
  });

  it("restores the row-level editor in the master inventory while retaining separate status actions", () => {
    const page = adminPage();
    expect(page).toContain("Edit profile");
    expect(page).toContain("setEditingBiz({ id: biz.id, name: biz.name })");
    expect(page).toContain("KinfolkCatalogCohort");
    expect(page).toContain('id: "kinfolk-catalog"');
    expect(page).toContain("Directory eligibility ledger");
    expect(page).toContain("eligibility-ledger");
    expect(page).toContain("bizKinfolkCatalogStateFilter");
    expect(page).toContain("bizEligibilityStateFilter");
  });
});
