import test from "node:test";
import assert from "node:assert/strict";
import { buildManifests, manifestFingerprint } from "./build-kinfolk-current-profile-enrichment-manifests.mjs";

const packet = {
  businessId: "business-1",
  pages: [{ sourceUrl: "https://communitybooks.example/about", title: "About Community Books", text: "Community Books is an independent bookstore." }],
};
const proposal = {
  businessId: "business-1",
  businessName: "Community Books",
  city: "Philadelphia",
  state: "PA",
  website: "https://communitybooks.example/",
  identityConfirmed: true,
  accepted: [{ field: "description", value: "Independent bookstore.", sourcePageIndex: 0, evidenceQuote: "Community Books is an independent bookstore.", confidence: "high", observedAt: "2026-10-15" }],
};

test("builds a source-receipted fill-only manifest with a stable fingerprint", () => {
  const { candidates, manifests } = buildManifests([proposal], [packet], { generatedAt: "2026-10-15T19:00:00.000Z" });
  assert.equal(candidates.length, 1);
  assert.equal(manifests.length, 1);
  assert.equal(manifests[0].candidates[0].patch.description, "Independent bookstore.");
  assert.equal(manifests[0].candidates[0].receipts[0].field, "description");
  assert.equal(manifests[0].contentFingerprint, manifestFingerprint(manifests[0]));
});

test("holds records without identity confirmation or accepted evidence", () => {
  const { candidates, manifests } = buildManifests([{ ...proposal, identityConfirmed: false }, { ...proposal, businessId: "business-2", accepted: [] }], [packet]);
  assert.equal(candidates.length, 0);
  assert.equal(manifests.length, 0);
});
