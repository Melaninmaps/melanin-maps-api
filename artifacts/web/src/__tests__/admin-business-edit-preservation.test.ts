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

describe("audited admin business editor", () => {
  it("uses the protected profile route with the shared authenticated fetch helper", () => {
    const editor = source();
    expect(editor).toContain('import { authenticatedFetch } from "@/lib/authenticatedFetch"');
    expect(editor).toContain("/api/admin/businesses/${businessId}/profile");
    expect(editor).not.toContain("/api/businesses/${businessId}`");
  });

  it("preserves legacy categories and requires a note plus source receipts", () => {
    const editor = source();
    expect(editor).toContain("const hasLegacyCategory");
    expect(editor).toContain("(current)");
    expect(editor).toContain("ownershipReceipt");
    expect(editor).toContain("sourceReceipts");
    expect(editor).toContain("changeNote");
    expect(editor).toContain("Every changed public fact needs a source before save");
  });

  it("keeps ownership verification, map pins, and lifecycle separate from generic edits", () => {
    const editor = source();
    expect(editor).not.toContain("blackOwned:");
    expect(editor).toContain("A new pin requires separate, audited geocode evidence");
    expect(editor).toContain("Apply audited lifecycle change");
    expect(editor).toContain("It never creates a listing, changes public visibility, or turns a business into an owner-verified profile.");
  });

  it("exposes the separate Kinfolk Catalog review surface while retaining the reconciliation ledger", () => {
    const page = adminPage();
    expect(page).toContain("KinfolkCatalogCohort");
    expect(page).toContain('id: "kinfolk-catalog"');
    expect(page).toContain("Reconciliation ledger:");
    expect(page).toContain("Edit profile");
  });
});
