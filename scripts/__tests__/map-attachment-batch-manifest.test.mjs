import assert from "node:assert/strict";
import test from "node:test";
import {
  MAP_ATTACHMENT_BATCH_MANIFEST_VERSION,
  assertExecutionAuthorization,
  buildMapAttachmentRequest,
  manifestSha256,
  validateMapAttachmentBatchManifest,
} from "../map-attachment-batch-manifest.mjs";

const now = new Date("2026-10-09T20:00:00.000Z");

function validManifest() {
  return {
    schemaVersion: MAP_ATTACHMENT_BATCH_MANIFEST_VERSION,
    manifestId: "philadelphia-map-batch-001",
    generatedAt: "2026-10-09T19:55:00.000Z",
    sourceReleaseSha: "e75a217c9682e20ae5218303d6b42437d3905e4f",
    maximumRecords: 2,
    entries: [{
      businessId: "dir-example-001",
      expected: {
        canonicalName: "Example Business",
        storedAddress: "123 Example Street, Philadelphia, PA 19103",
        latitude: null,
        longitude: null,
        readAt: "2026-10-09T19:50:00.000Z",
      },
      decisionReason: "philadelphia-map-batch-001: first-party physical address and approved geocoder match the unchanged canonical record.",
      addressEvidence: {
        field: "address",
        sourceKind: "business_official",
        sourceUrl: "https://example.test/contact",
        observedAt: "2026-10-09T19:40:00.000Z",
        confidence: "high",
        observedValue: {
          address: "123 Example Street, Philadelphia, PA 19103",
          addressType: "physical",
          isServiceArea: false,
          identityMatch: true,
          matchingSignals: ["business_name", "address"],
        },
      },
      mapPinEvidence: {
        field: "map_pin",
        sourceKind: "official_geocoder",
        sourceUrl: "https://nominatim.openstreetmap.org/search?format=jsonv2",
        observedAt: "2026-10-09T19:45:00.000Z",
        confidence: "high",
        observedValue: {
          latitude: 39.9526,
          longitude: -75.1652,
          queryAddress: "123 Example Street, Philadelphia, PA 19103",
          formattedAddress: "123 Example Street, Philadelphia, PA 19103, United States",
          addressMatch: true,
          addressComponents: {
            houseNumber: "123",
            streetName: "Example",
            streetType: "Street",
            city: "Philadelphia",
            state: "PA",
            postalCode: "19103",
          },
        },
      },
    }],
  };
}

test("validates a manifest with immutable preconditions and a minimal map-only request", () => {
  const manifest = validateMapAttachmentBatchManifest(validManifest(), { now });
  assert.equal(manifest.entries.length, 1);
  assert.deepEqual(buildMapAttachmentRequest(manifest.entries[0]), {
    decisionReason: manifest.entries[0].decisionReason,
    addressEvidence: manifest.entries[0].addressEvidence,
    mapPinEvidence: manifest.entries[0].mapPinEvidence,
  });
  assert.match(manifestSha256(manifest), /^[a-f0-9]{64}$/);
});

test("allows only documented directional and street-type equivalents in the local preflight", () => {
  const manifest = validManifest();
  manifest.entries[0].expected.storedAddress = "123 N. Example St, Philadelphia, PA 19103";
  manifest.entries[0].addressEvidence.observedValue.address = "123 North Example Street, Philadelphia, Pennsylvania 19103";
  manifest.entries[0].mapPinEvidence.observedValue.queryAddress = "123 N Example St, Philadelphia, PA 19103";
  assert.doesNotThrow(() => validateMapAttachmentBatchManifest(manifest, { now }));
});

test("rejects a duplicate immutable ID before any server request can be attempted", () => {
  const manifest = validManifest();
  manifest.entries.push(structuredClone(manifest.entries[0]));
  manifest.maximumRecords = 2;
  assert.throws(() => validateMapAttachmentBatchManifest(manifest, { now }), /duplicate immutable businessId/);
});

test("rejects protected profile fields, incomplete evidence, and non-approved geocoders", () => {
  const protectedField = validManifest();
  protectedField.entries[0].status = "published";
  assert.throws(() => validateMapAttachmentBatchManifest(protectedField, { now }), /unsupported key/);

  const addressMismatch = validManifest();
  addressMismatch.entries[0].addressEvidence.observedValue.address = "124 Example Street, Philadelphia, PA 19103";
  assert.throws(() => validateMapAttachmentBatchManifest(addressMismatch, { now }), /must match expected.storedAddress/);

  const unsafeGeocoder = validManifest();
  unsafeGeocoder.entries[0].mapPinEvidence.sourceUrl = "https://www.google.com/maps";
  assert.throws(() => validateMapAttachmentBatchManifest(unsafeGeocoder, { now }), /approved geocoder host/);
});

test("requires two matching per-manifest execution gates", () => {
  assert.throws(() => assertExecutionAuthorization("batch-1", "batch-2", "batch-1"), /--execute-manifest/);
  assert.throws(() => assertExecutionAuthorization("batch-1", "batch-1", "other"), /MAP_ATTACHMENT_BATCH_EXECUTION/);
  assert.doesNotThrow(() => assertExecutionAuthorization("batch-1", "batch-1", "batch-1"));
});
