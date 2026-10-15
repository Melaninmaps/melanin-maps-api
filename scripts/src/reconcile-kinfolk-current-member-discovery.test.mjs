import test from "node:test";
import assert from "node:assert/strict";
import { reconcileEvidence } from "./reconcile-kinfolk-current-member-discovery.mjs";

const snapshotHash = "a".repeat(64);

function record(overrides = {}) {
  return {
    businessId: "biz-1",
    businessName: "Example Collective",
    city: "Philadelphia",
    state: "PA",
    currentSnapshotHash: snapshotHash,
    originalLinks: { website: "https://example.test", social: {} },
    sourceSnapshot: { "Business ID": "biz-1", Name: "Example Collective" },
    website: { classification: "HOLD_INCONCLUSIVE", reason: "timeout" },
    social: {},
    ...overrides,
  };
}

test("queues a record with no established qualifying official source instead of treating a timeout as an active source", () => {
  const result = reconcileEvidence({
    presence: [record()],
    discovery: [],
    previousManifest: { deleteReviews: [] },
    generatedAt: "2026-10-15T18:00:00.000Z",
  });
  assert.equal(result.summary.counts.DELETE_REVIEW_REQUIRED, 1);
  assert.equal(result.deleteReviews[0].websiteVerification.classification, "UNVERIFIED_OR_IDENTITY_UNCLEAR");
  assert.equal(result.batches.length, 1);
  assert.equal(result.batches[0].deleteReviews[0].currentSnapshotHash, snapshotHash);
});

test("retains only a direct active identity-matched website or social source", () => {
  const websiteResult = reconcileEvidence({
    presence: [record({ website: { classification: "KEEP_ACTIVE", identity: { status: "matched" } } })],
    discovery: [], previousManifest: { deleteReviews: [] }, generatedAt: "2026-10-15T18:00:00.000Z",
  });
  assert.equal(websiteResult.summary.counts.KEEP_ACTIVE_WEBSITE, 1);
  const socialResult = reconcileEvidence({
    presence: [record({ website: { classification: "HOLD_INCONCLUSIVE" }, social: { facebook: { classification: "KEEP_ACTIVE_SOCIAL", identity: { status: "matched" } } } })],
    discovery: [], previousManifest: { deleteReviews: [] }, generatedAt: "2026-10-15T18:00:00.000Z",
  });
  assert.equal(socialResult.summary.counts.KEEP_ACTIVE_SOCIAL, 1);
});

test("retains a stored link only when discovery directly rechecks that same stored URL and identity", () => {
  const result = reconcileEvidence({
    presence: [record()],
    discovery: [{
      businessId: "biz-1", businessName: "Example Collective", city: "Philadelphia", state: "PA",
      originalLinks: { website: "https://example.test", social: {} },
      candidates: [{ url: "https://example.test", probe: { state: "available" }, identity: { status: "matched" } }],
    }],
    previousManifest: { deleteReviews: [] }, generatedAt: "2026-10-15T18:00:00.000Z",
  });
  assert.equal(result.summary.counts.KEEP_RECONFIRMED_STORED_WEBSITE, 1);
  assert.equal(result.deleteReviews.length, 0);
});

test("does not trust a new candidate URL or prior review manifest record without a fresh live census", () => {
  const newCandidate = reconcileEvidence({
    presence: [record()],
    discovery: [{
      businessId: "biz-1", businessName: "Example Collective", city: "Philadelphia", state: "PA",
      originalLinks: { website: "https://example.test", social: {} },
      candidates: [{ url: "https://new-candidate.test", probe: { state: "available" }, identity: { status: "matched" } }],
    }],
    previousManifest: { deleteReviews: [] }, generatedAt: "2026-10-15T18:00:00.000Z",
  });
  assert.equal(newCandidate.summary.counts.DELETE_REVIEW_REQUIRED, 1);
  const priorScope = reconcileEvidence({
    presence: [record()], discovery: [], previousManifest: { deleteReviews: [{ businessId: "biz-1" }] }, generatedAt: "2026-10-15T18:00:00.000Z",
  });
  assert.equal(priorScope.summary.counts.PREVIOUS_DELETE_REVIEW_SCOPE_REQUIRES_LIVE_CENSUS, 1);
});

test("holds a source-record conflict instead of mutating either record", () => {
  const result = reconcileEvidence({
    presence: [record()],
    discovery: [{ businessId: "biz-1", businessName: "Different Entity", city: "Philadelphia", state: "PA", originalLinks: { website: "https://example.test", social: {} }, candidates: [] }],
    previousManifest: { deleteReviews: [] }, generatedAt: "2026-10-15T18:00:00.000Z",
  });
  assert.equal(result.summary.counts.HOLD_SOURCE_RECORD_CONFLICT, 1);
  assert.equal(result.deleteReviews.length, 0);
});
