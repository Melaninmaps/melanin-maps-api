import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseValidatedPresenceCsv, VALIDATED_PRESENCE_BATCH_SIZE } from "../lib/validatedPresenceCsv";

const component = readFileSync(fileURLToPath(new URL("../components/ValidatedPresenceBatch.tsx", import.meta.url)), "utf8");
const admin = readFileSync(fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)), "utf8");

const csv = `original_row_number,business_name,city,state,address,phone,category,authorized_ownership_status,authorized_ownership_basis,authorized_ownership_source_name,authorized_ownership_source_evidence,qualifying_presence_type,qualifying_urls,validation_route,validation_tier,business_name_evidence,location_evidence,source_url,audit_caveat
2,Community Books,Philadelphia,PA,123 Walnut Street,215-555-0100,Books,Black / African American-Owned,Explicit designation,Validated directory source,Source states Black-owned,website; social,"https://communitybooks.example | https://www.instagram.com/communitybooks",Live validation,Official,Community Books appears,Philadelphia appears,https://directory.example/community-books,No MWM record changed
3,Hold Me,Philadelphia,PA,456 Walnut Street,,Food,Minority-Owned,Generic label,Directory source,Generic source,website,https://hold.example,Live validation,Official,Hold Me appears,Philadelphia appears,https://directory.example/hold-me,No MWM record changed`;

describe("validated presence batch Admin surface", () => {
  it("keeps CSV parsing in the browser, selects only explicitly authorized ownership rows, and omits unused fields", () => {
    const parsed = parseValidatedPresenceCsv(csv);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.heldMinorityOwnedCount).toBe(1);
    expect(parsed.rows[0]).toMatchObject({ businessName: "Community Books", authorizedOwnershipStatus: "Black / African American-Owned" });
    expect(parsed.rows[0]).not.toHaveProperty("email");
    expect(parsed.rows[0]).not.toHaveProperty("address");
    expect(VALIDATED_PRESENCE_BATCH_SIZE).toBe(50);
  });

  it("uses the preview-first, typed-confirmation endpoints and never uploads the CSV file itself", () => {
    expect(component).toContain("Validated Presence Batch — 50 at a time");
    expect(component).toContain("/api/admin/businesses/validated-presence-batch/preview");
    expect(component).toContain("/api/admin/businesses/validated-presence-batch/apply");
    expect(component).toContain("Type exactly to apply this selected batch");
    expect(component).toContain("Minority-Owned rows stay held");
    expect(component).not.toContain("FormData");
    expect(component).not.toContain("email:");
  });

  it("places the control in regular and Archive inventory review, then returns an applied batch to Non-Kinfolk Current", () => {
    expect(admin).toContain('import { ValidatedPresenceBatch } from "@/components/ValidatedPresenceBatch"');
    expect(admin).toContain('<ValidatedPresenceBatch onApplied={() => applyBusinessInventoryFilters({');
    expect(admin).toContain('intakeCohort: "non_kinfolk_current"');
    expect(admin).toContain('status: "active"');
    expect(admin).toContain('bizStatusFilter !== "kinfolk_current_delete_review" && bizStatusFilter !== "delete_queue"');
  });
});
