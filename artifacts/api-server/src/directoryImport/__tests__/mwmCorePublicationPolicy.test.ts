import { describe, expect, it } from "vitest";
import {
  MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH_ENV,
  MWM_CORE_CHAMBER_COHORT,
  MWM_CORE_INSTITUTIONAL_DIRECTORY_COHORT,
  SOURCE_REPUTABLE_LISTING_COHORT,
  MWM_CORE_PUBLICATION_MODE_ENV,
  MWM_CORE_PUBLICATION_POLICY_VERSION,
  validateMwmCorePublicationBatch,
  validateMwmCorePublicationRecord,
} from "../mwmCorePublicationPolicy";

const ROOT_HASH = "c2105d31ab2a9d71f9aefae58441d2cd6a6ac6d1c28c6581c5bbcb821e73ef01";
const RECEIPT_HASH = "a".repeat(64);
const MANIFEST_HASH = "b".repeat(64);

const enabledEnvironment = {
  [MWM_CORE_PUBLICATION_MODE_ENV]: "source_backed",
  [MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH_ENV]: ROOT_HASH,
};

function sourceBackedRow(overrides: Record<string, unknown> = {}) {
  return {
    name: "Proven Neighborhood Business",
    target_kind: "business",
    ownership_designations: ["Black-owned"],
    mwm_core_policy_version: MWM_CORE_PUBLICATION_POLICY_VERSION,
    mwm_core_cohort: MWM_CORE_CHAMBER_COHORT,
    mwm_core_evidence_lane: "chamber",
    mwm_publication_classification: "source_reported_mwm_designation",
    mwm_core_receipt_root_hash: ROOT_HASH,
    mwm_core_receipt_hash: RECEIPT_HASH,
    mwm_core_source_manifest: "data/founder-imports/example-review-only-candidates.jsonl",
    mwm_core_source_manifest_sha256: MANIFEST_HASH,
    mwm_core_source_row: 42,
    mwm_core_source_row_id: "example-42",
    ...overrides,
  };
}

describe("MWM Core publication admission", () => {
  it("preserves the existing directory ingress behavior while publication mode is off", () => {
    expect(validateMwmCorePublicationRecord({ name: "Legacy Listing" }, {})).toEqual({ ok: true });
  });

  it("admits complete source-receipted Chamber, institutional, and reputable-source listings when the mode is enabled", () => {
    expect(validateMwmCorePublicationRecord(sourceBackedRow(), enabledEnvironment)).toEqual({ ok: true });
    expect(validateMwmCorePublicationRecord(sourceBackedRow({
      mwm_core_cohort: MWM_CORE_INSTITUTIONAL_DIRECTORY_COHORT,
      mwm_core_evidence_lane: "institutional_directory",
    }), enabledEnvironment)).toEqual({ ok: true });
    expect(validateMwmCorePublicationRecord(sourceBackedRow({
      ownership_designations: [],
      mwm_core_cohort: SOURCE_REPUTABLE_LISTING_COHORT,
      mwm_core_evidence_lane: "reputable_source",
      mwm_publication_classification: "unverified_source_listing",
    }), enabledEnvironment)).toEqual({ ok: true });
  });

  it("fails closed when the configured root hash is absent or a row belongs to another cohort", () => {
    expect(validateMwmCorePublicationRecord(sourceBackedRow(), {
      [MWM_CORE_PUBLICATION_MODE_ENV]: "source_backed",
    })).toMatchObject({ ok: false, code: "MWM_CORE_PUBLICATION_CONFIGURATION_REQUIRED" });

    expect(validateMwmCorePublicationRecord(sourceBackedRow({
      mwm_core_cohort: "hold_mission_evidence_required",
    }), enabledEnvironment)).toMatchObject({ ok: false, code: "MWM_CORE_APPROVED_EVIDENCE_LANE_REQUIRED" });

    expect(validateMwmCorePublicationRecord(sourceBackedRow({
      mwm_core_cohort: "hold_editorial_corroboration_required",
      mwm_core_evidence_lane: "editorial_or_promotional",
    }), enabledEnvironment)).toMatchObject({ ok: false, code: "MWM_CORE_APPROVED_EVIDENCE_LANE_REQUIRED" });
  });

  it("rejects proxy-only, unqualified, and incomplete receipt rows without inferring identity", () => {
    expect(validateMwmCorePublicationRecord({
      name: "Cuisine Is Not Evidence Cafe",
      category: "Caribbean food",
      ownership_designations: ["BIPOC-owned"],
    }, enabledEnvironment)).toMatchObject({ ok: false, code: "MWM_CORE_POLICY_VERSION_REQUIRED" });

    expect(validateMwmCorePublicationRecord(sourceBackedRow({
      mwm_core_source_row: 0,
    }), enabledEnvironment)).toMatchObject({ ok: false, code: "MWM_CORE_RECEIPT_METADATA_INVALID" });
  });

  it("does not allow a source-reported designation to pose as owner verification", () => {
    expect(validateMwmCorePublicationRecord(sourceBackedRow({
      mwm_publication_classification: "owner_verified",
    }), enabledEnvironment)).toMatchObject({
      ok: false,
      code: "MWM_SOURCE_REPORTED_CLASSIFICATION_REQUIRED",
    });
  });

  it("rejects an entire batch when one row lacks approved receipt evidence", () => {
    expect(validateMwmCorePublicationBatch([
      sourceBackedRow(),
      sourceBackedRow({ mwm_core_receipt_hash: undefined }),
    ], enabledEnvironment)).toMatchObject({ ok: false, code: "MWM_CORE_RECEIPT_METADATA_INVALID" });
  });
});
