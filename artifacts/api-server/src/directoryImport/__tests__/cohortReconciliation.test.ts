import { describe, expect, it } from "vitest";
import {
  COMPLETED_COHORT_MANIFEST_CHECKSUM,
  COMPLETED_COHORT_RECEIPT_ROOT,
  cohortRowsToCsv,
  reconcileCompletedCohortRow,
  summarizeCohortReconciliation,
} from "../cohortReconciliation";

const candidate = (overrides = {}) => ({
  sourceRow: 7,
  sourceRowId: "row-7",
  dedupeKey: "physical|source-backed-business|philadelphia|pa|united-states|100-main-street",
  targetKind: "business",
  name: "Source-backed business",
  city: "Philadelphia",
  state: "PA",
  country: "United States",
  status: "needs_research",
  rawRecord: {
    ownership_designations: ["Black-owned"],
    source_url: "https://directory.example/source-backed-business",
  },
  outboxStatus: "failed",
  outboxError: "geocode_unverified: street match failed",
  ...overrides,
});

describe("completed cohort reconciliation", () => {
  it("locks reconciliation to the known immutable receipt identity", () => {
    expect(COMPLETED_COHORT_RECEIPT_ROOT).toHaveLength(64);
    expect(COMPLETED_COHORT_MANIFEST_CHECKSUM).toHaveLength(64);
    expect(COMPLETED_COHORT_RECEIPT_ROOT).not.toBe(COMPLETED_COHORT_MANIFEST_CHECKSUM);
  });

  it("keeps a published record public and links it to provenance", () => {
    const result = reconcileCompletedCohortRow(
      candidate(),
      { sourceRow: 7, recordId: "business-7", outcome: "created" },
    );
    expect(result).toMatchObject({
      discoveryState: "public_listing",
      publicBusinessId: "business-7",
      publicationOutcome: "created",
      holdReason: null,
      sourceDesignationCount: 1,
    });
  });

  it("makes an unresolved map location visible as a location hold rather than inventing a pin", () => {
    const result = reconcileCompletedCohortRow(candidate(), undefined);
    expect(result).toMatchObject({
      discoveryState: "location_hold",
      publicBusinessId: null,
      holdReason: "geocode_unverified",
    });
  });

  it("preserves a duplicate source row as a searchable-alias candidate rather than a second profile", () => {
    const result = reconcileCompletedCohortRow(
      candidate({ status: "declined", rawRecord: {}, outboxError: null }),
      undefined,
      6,
      { sourceRow: 6, recordId: "business-6", outcome: "created" },
    );
    expect(result).toMatchObject({
      discoveryState: "duplicate_source_alias",
      holdReason: "duplicate_within_completed_cohort",
      canonicalSourceRow: 6,
      publicBusinessId: "business-6",
    });
  });

  it("creates a safe CSV report without source payload blobs", () => {
    const rows = [
      reconcileCompletedCohortRow(candidate(), undefined),
      reconcileCompletedCohortRow(
        candidate({ sourceRow: 8, sourceRowId: "row-8" }),
        { sourceRow: 8, recordId: "business-8", outcome: "linked_existing" },
      ),
      {
        ...reconcileCompletedCohortRow(candidate(), undefined),
        name: "=HYPERLINK(\"https://unsafe.example\")",
        sourceUrl: "+unsafe-source-url",
      },
    ];
    expect(summarizeCohortReconciliation(rows)).toMatchObject({
      location_hold: 2,
      public_listing: 1,
    });
    const csv = cohortRowsToCsv(rows);
    expect(csv).toContain("canonical_source_row");
    expect(csv).toContain("discovery_state");
    expect(csv).toContain("geocode_unverified");
    expect(csv).not.toContain("street match failed");
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+unsafe-source-url");
  });
});
