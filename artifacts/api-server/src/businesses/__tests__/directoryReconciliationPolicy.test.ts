import { describe, expect, it } from "vitest";
import {
  archiveActionForReason,
  archiveStateForReason,
  isDirectoryArchiveReasonCode,
  isDirectoryReconciliationReasonCode,
} from "../directoryReconciliationPolicy";

describe("directory reconciliation policy", () => {
  it("keeps missing ownership or presence out of archive reason codes", () => {
    expect(isDirectoryReconciliationReasonCode("official_presence_unverified")).toBe(true);
    expect(isDirectoryReconciliationReasonCode("ownership_unverified")).toBe(true);
    expect(isDirectoryArchiveReasonCode("official_presence_unverified")).toBe(false);
    expect(isDirectoryArchiveReasonCode("ownership_unverified")).toBe(false);
  });

  it("allows archive only for concrete confirmed reasons", () => {
    expect(isDirectoryArchiveReasonCode("confirmed_closed")).toBe(true);
    expect(isDirectoryArchiveReasonCode("confirmed_duplicate")).toBe(true);
    expect(isDirectoryArchiveReasonCode("confirmed_fraud_or_unsafe")).toBe(true);
    expect(isDirectoryArchiveReasonCode("documented_safety_or_legal_removal")).toBe(true);
  });

  it("records a distinct archived ledger state and recommended action", () => {
    expect(archiveStateForReason("confirmed_closed")).toBe("archived_confirmed_closed");
    expect(archiveStateForReason("confirmed_duplicate")).toBe("archived_confirmed_duplicate");
    expect(archiveStateForReason("confirmed_fraud_or_unsafe")).toBe("archived_confirmed_fraud_or_unsafe");
    expect(archiveStateForReason("documented_safety_or_legal_removal")).toBe("archived_documented_safety_or_legal");
    expect(archiveActionForReason("confirmed_fraud_or_unsafe")).toBe("archive_confirmed_fraud_or_unsafe");
  });
});
