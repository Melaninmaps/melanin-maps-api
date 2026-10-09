import { describe, expect, it } from "vitest";
import { decideGenericIngestExistingAction } from "../routes/business-ingest";

describe("generic business ingest identity policy", () => {
  it("holds a fuzzy same-locality result instead of updating its profile", () => {
    expect(decideGenericIngestExistingAction(null, "existing-123")).toEqual({
      action: "REVIEW_IDENTITY_CONFLICT",
      businessId: "existing-123",
    });
  });

  it("permits an update only for an exact immutable dedupe match", () => {
    expect(decideGenericIngestExistingAction("exact-123", "similar-456")).toEqual({
      action: "UPDATE_EXISTING",
      businessId: "exact-123",
    });
  });

  it("permits a new record path when no identity candidate exists", () => {
    expect(decideGenericIngestExistingAction(null, null)).toEqual({
      action: "CREATE",
      businessId: null,
    });
  });
});
