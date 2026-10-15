import test from "node:test";
import assert from "node:assert/strict";
import { buildManifests, manifestFingerprint } from "./build-kinfolk-current-profile-enrichment-manifests.mjs";

const packet = {
  businessId: "business-1",
  disposition: "READY_FOR_EXTRACTION",
  sourceSnapshot: { Instagram: "" },
  pages: [{ sourceUrl: "https://communitybooks.example/about", title: "About Community Books", text: "Community Books is an independent bookstore." }],
  officialSocialLinks: { instagram: "https://www.instagram.com/communitybooks/" },
};
const proposal = {
  businessId: "business-1",
  businessName: "Community Books",
  city: "Philadelphia",
  state: "PA",
  website: "https://communitybooks.example/",
  identityConfirmed: true,
  sourceSnapshot: { Description: "Bookstore business in Philadelphia." },
  accepted: [{ field: "description", value: "Independent bookstore.", sourcePageIndex: 0, evidenceQuote: "Community Books is an independent bookstore.", confidence: "high", observedAt: "2026-10-15" }],
};

test("builds a scoped, source-receipted manifest with a stable fingerprint", () => {
  const { candidates, manifests } = buildManifests([proposal], [packet], { scope: "non_kinfolk_current", generatedAt: "2026-10-15T19:00:00.000Z" });
  assert.equal(candidates.length, 1);
  assert.equal(manifests.length, 1);
  assert.equal(manifests[0].scope, "non_kinfolk_current");
  assert.equal(manifests[0].candidates[0].patch.description, "Independent bookstore.");
  assert.equal(manifests[0].candidates[0].patch.instagram, "https://www.instagram.com/communitybooks/");
  assert.equal(manifests[0].candidates[0].fieldModes.description, "replace_generic_directory");
  assert.equal(manifests[0].candidates[0].receipts.find((receipt) => receipt.field === "instagram")?.sourceUrl, "https://communitybooks.example/about");
  assert.equal(manifests[0].contentFingerprint, manifestFingerprint(manifests[0]));
});

test("does not duplicate a stored social account", () => {
  const existingSocialPacket = { ...packet, sourceSnapshot: { Instagram: "https://www.instagram.com/communitybooks/" } };
  const { candidates } = buildManifests([{ ...proposal, accepted: [] }], [existingSocialPacket], { scope: "non_kinfolk_current" });
  assert.equal(candidates.length, 0);
});

test("holds records without identity confirmation or accepted evidence", () => {
  const noIdentityPacket = { ...packet, disposition: "HOLD_IDENTITY_RECHECK", officialSocialLinks: {} };
  const { candidates, manifests } = buildManifests([{ ...proposal, identityConfirmed: false }, { ...proposal, businessId: "business-2", accepted: [] }], [noIdentityPacket]);
  assert.equal(candidates.length, 0);
  assert.equal(manifests.length, 0);
});
