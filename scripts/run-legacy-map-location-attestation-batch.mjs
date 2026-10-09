#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  assertLegacyMapLocationExecutionAuthorization,
  buildLegacyMapLocationAttestationRequest,
  legacyMapLocationManifestSha256,
  validateLegacyMapLocationAttestationManifest,
} from "./legacy-map-location-attestation-manifest.mjs";

function usage() {
  return `Usage:
  node scripts/run-legacy-map-location-attestation-batch.mjs --manifest <json> [--dry-run] [--receipt <json>]
  node scripts/run-legacy-map-location-attestation-batch.mjs --manifest <json> --execute --execute-manifest <manifestId> [--max-records <n>] [--receipt <json>]

Dry-run is the default and makes no network request. Execute additionally requires:
  LEGACY_MAP_LOCATION_API_BASE=https://api.melaninmaps.com
  LEGACY_MAP_LOCATION_AUTH_BEARER=<admin bearer token>
  LEGACY_MAP_LOCATION_ATTESTATION_BATCH_EXECUTION=<exact manifestId>`;
}
function args(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`Unsupported argument ${key}`);
    if (key === "--dry-run" || key === "--execute") { values.set(key, true); continue; }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    values.set(key, value);
    index += 1;
  }
  return values;
}
function outputPath(manifestPath, manifestId, explicit) {
  return explicit ? resolve(explicit) : resolve(dirname(manifestPath), `${manifestId}-execution-receipt.json`);
}
function safeError(error) { return error instanceof Error ? error.message : "Unknown error"; }
async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({ error: "Non-JSON response" }));
  return { status: response.status, ok: response.ok, body };
}
function mapPinIds(body) {
  const pins = Array.isArray(body?.pins) ? body.pins : Array.isArray(body) ? body : [];
  return [...new Set(pins.map((pin) => pin?.id).filter((id) => typeof id === "string"))].sort();
}

async function run() {
  const parsed = args(process.argv.slice(2));
  if (!parsed.get("--manifest") || (parsed.get("--execute") && parsed.get("--dry-run"))) throw new Error(usage());
  const manifestPath = resolve(String(parsed.get("--manifest")));
  const manifest = validateLegacyMapLocationAttestationManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  const execute = parsed.get("--execute") === true;
  const maximum = parsed.get("--max-records") == null ? manifest.entries.length : Number(parsed.get("--max-records"));
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > manifest.maximumRecords) {
    throw new Error(`--max-records must be 1–${manifest.maximumRecords}`);
  }
  const selected = manifest.entries.slice(0, maximum);
  const receipt = {
    schemaVersion: "mwm-legacy-map-location-attestation-execution-receipt/v1",
    executedAt: new Date().toISOString(),
    mode: execute ? "execute" : "dry_run",
    manifest: {
      manifestId: manifest.manifestId,
      sha256: legacyMapLocationManifestSha256(manifest),
      sourceReleaseSha: manifest.sourceReleaseSha,
      historicalMapBaselineSha: manifest.historicalMapBaselineSha,
      receiptGateSha: manifest.receiptGateSha,
      selectedRecords: selected.length,
      omittedRecords: manifest.entries.length - selected.length,
    },
    prePostMapCounters: { attempted: false, beforeVisiblePinCount: null, afterVisiblePinCount: null },
    entries: [],
    rollbackEvidence: "Attestations and state events are append-only. A later audited revoke removes legacy-map visibility without deleting a business, receipt, coordinate, or historical record.",
  };
  if (!execute) {
    receipt.entries = selected.map((entry) => ({
      businessId: entry.businessId,
      canonicalName: entry.expected.canonicalName,
      expectedBefore: entry.expected,
      request: buildLegacyMapLocationAttestationRequest(entry, manifest),
      disposition: "VALIDATED_DRY_RUN",
    }));
  } else {
    assertLegacyMapLocationExecutionAuthorization(
      manifest.manifestId,
      parsed.get("--execute-manifest"),
      process.env.LEGACY_MAP_LOCATION_ATTESTATION_BATCH_EXECUTION,
    );
    const apiBase = process.env.LEGACY_MAP_LOCATION_API_BASE;
    const bearer = process.env.LEGACY_MAP_LOCATION_AUTH_BEARER;
    if (!apiBase || !bearer) throw new Error("Execution refused: API base and admin bearer token are required");
    const base = new URL(apiBase);
    if (base.protocol !== "https:") throw new Error("Execution refused: LEGACY_MAP_LOCATION_API_BASE must use HTTPS");
    try {
      const before = await fetchJson(new URL("/api/businesses/map-pins", base).toString(), { headers: { accept: "application/json" } });
      receipt.prePostMapCounters = { attempted: true, beforeVisiblePinCount: mapPinIds(before.body).length, afterVisiblePinCount: null };
    } catch { /* execution can proceed only with per-row server guards; receipt records unknown pre-count */ }
    for (const entry of selected) {
      const endpoint = new URL(`/api/admin/businesses/${encodeURIComponent(entry.businessId)}/legacy-map-location-attestation`, base).toString();
      try {
        const response = await fetchJson(endpoint, {
          method: "PUT",
          headers: { authorization: `Bearer ${bearer}`, "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(buildLegacyMapLocationAttestationRequest(entry, manifest)),
        });
        receipt.entries.push({
          businessId: entry.businessId,
          canonicalName: entry.expected.canonicalName,
          expectedBefore: entry.expected,
          status: response.status,
          disposition: response.ok ? (response.body.replayed ? "REPLAYED_NO_MUTATION" : "ATTESTED") : "HELD_BY_GUARD",
          response: response.body,
        });
      } catch (error) {
        receipt.entries.push({ businessId: entry.businessId, canonicalName: entry.expected.canonicalName, disposition: "TRANSPORT_FAILURE_HELD", error: safeError(error) });
      }
    }
    try {
      const after = await fetchJson(new URL("/api/businesses/map-pins", base).toString(), { headers: { accept: "application/json" } });
      const ids = new Set(mapPinIds(after.body));
      receipt.prePostMapCounters.afterVisiblePinCount = ids.size;
      receipt.publicMapVerification = {
        visibleBusinessIds: receipt.entries.filter((entry) => entry.disposition === "ATTESTED" || entry.disposition === "REPLAYED_NO_MUTATION").map((entry) => entry.businessId).filter((id) => ids.has(id)),
        missingBusinessIds: receipt.entries.filter((entry) => entry.disposition === "ATTESTED" || entry.disposition === "REPLAYED_NO_MUTATION").map((entry) => entry.businessId).filter((id) => !ids.has(id)),
      };
    } catch (error) {
      receipt.publicMapVerification = { error: safeError(error), visibleBusinessIds: [], missingBusinessIds: [] };
    }
  }
  const destination = outputPath(manifestPath, manifest.manifestId, parsed.get("--receipt"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const held = receipt.entries.filter((entry) => !["VALIDATED_DRY_RUN", "ATTESTED", "REPLAYED_NO_MUTATION"].includes(entry.disposition));
  console.log(JSON.stringify({ receipt: destination, mode: receipt.mode, processed: receipt.entries.length, heldOrFailed: held.length }, null, 2));
  if (execute && held.length) process.exitCode = 2;
}
run().catch((error) => { console.error(safeError(error)); process.exitCode = 1; });
