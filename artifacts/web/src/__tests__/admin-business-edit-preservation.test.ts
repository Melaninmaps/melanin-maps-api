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

  it("preserves legacy categories while allowing direct administrator saves", () => {
    const editor = source();
    expect(editor).toContain("const hasLegacyCategory");
    expect(editor).toContain("(current)");
    expect(editor).toContain("ownershipReceipt");
    expect(editor).toContain("sourceReceipts");
    expect(editor).toContain("changeNote");
    expect(editor).toContain("Field-level source receipts (optional)");
    expect(editor).toContain("Optional profile edit note");
  });

  it("requires an explicit, clickable identity-match signal for official presence receipts", () => {
    const editor = source();
    expect(editor).toContain("ADMIN_PROFILE_RECEIPT_IDENTITY_MATCH_SIGNALS.map");
    expect(editor).toContain('aria-pressed={receipt.identityMatchSignal === value}');
    expect(editor).toContain("Evidence matched by");
    expect(editor).toContain('"twitter", "youtube", "pinterest"');
    expect(editor).not.toContain('disabled={receipt.identityMatch !== true} value={receipt.identityMatchSignal ?? ""}');
  });

  it("keeps ownership verification, map pins, and lifecycle separate from generic edits", () => {
    const editor = source();
    expect(editor).not.toContain("blackOwned:");
    expect(editor).toContain("A new pin requires separate, audited geocode evidence");
    expect(editor).toContain("Save listing lifecycle");
    expect(editor).toContain("Kinfolk Current administrator control");
  });

  it("exposes a separate documented Kinfolk qualification control rather than broadening profile saves", () => {
    const editor = source();
    expect(editor).toContain("AdminKinfolkQualification");
    expect(editor).toContain('tab === "kinfolk"');
    expect(editor).toContain('tab === "catalog" || tab === "kinfolk"');
  });

  it("exposes the separate Kinfolk Catalog review surface while retaining the reconciliation ledger", () => {
    const page = adminPage();
    expect(page).toContain("KinfolkCatalogCohort");
    expect(page).toContain('id: "kinfolk-catalog"');
    expect(page).toContain("Reconciliation ledger:");
    expect(page).toContain("Edit profile");
  });
});
