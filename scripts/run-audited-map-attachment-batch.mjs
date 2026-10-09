#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  assertExecutionAuthorization,
  buildMapAttachmentRequest,
  manifestSha256,
  validateMapAttachmentBatchManifest,
} from "./map-attachment-batch-manifest.mjs";

function usage() {
  return `Usage:
  node scripts/run-audited-map-attachment-batch.mjs --manifest <absolute-or-relative-json> [--dry-run] [--receipt <json>]
  node scripts/run-audited-map-attachment-batch.mjs --manifest <json> --execute --execute-manifest <manifestId> [--max-records <n>] [--receipt <json>]

Dry run is the default and sends no network requests. Execute additionally requires:
  MAP_ATTACHMENT_API_BASE=https://api.melaninmaps.com
  MAP_ATTACHMENT_AUTH_BEARER=<admin bearer token>
  MAP_ATTACHMENT_BATCH_EXECUTION=<exact manifestId>
`;
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`Unsupported argument ${key}`);
    if (["--dry-run", "--execute"].includes(key)) {
      values.set(key, true);
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    values.set(key, value);
    index += 1;
  }
  return values;
}

function resultPath(manifestPath, manifestId, explicit) {
  return explicit ? resolve(explicit) : resolve(dirname(manifestPath), `${manifestId}-execution-receipt.json`);
}

function safeError(error) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({ error: "Non-JSON response" }));
  return { status: response.status, ok: response.ok, body };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.get("--manifest")) throw new Error(usage());
  if (args.get("--execute") && args.get("--dry-run")) throw new Error("Choose either --dry-run or --execute");

  const manifestPath = resolve(String(args.get("--manifest")));
  const raw = JSON.parse(await readFile(manifestPath, "utf8"));
  const manifest = validateMapAttachmentBatchManifest(raw);
  const digest = manifestSha256(manifest);
  const execute = args.get("--execute") === true;
  const maximum = args.get("--max-records") == null
    ? manifest.entries.length
    : Number(args.get("--max-records"));
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > manifest.maximumRecords) {
    throw new Error(`--max-records must be an integer from 1 to ${manifest.maximumRecords}`);
  }
  const selected = manifest.entries.slice(0, maximum);
  const receipt = {
    schemaVersion: "mwm-audited-map-attachment-execution-receipt/v1",
    executedAt: new Date().toISOString(),
    mode: execute ? "execute" : "dry_run",
    manifest: {
      manifestId: manifest.manifestId,
      sha256: digest,
      sourceReleaseSha: manifest.sourceReleaseSha,
      generatedAt: manifest.generatedAt,
      declaredMaximumRecords: manifest.maximumRecords,
      selectedRecords: selected.length,
      omittedRecords: manifest.entries.length - selected.length,
    },
    entries: [],
    publicMapVerification: { attempted: false, visibleBusinessIds: [], missingBusinessIds: [] },
    rollbackEvidence: "No receipt or audit history is deleted. A correction requires a separately receipted and authorized map-only event for the same immutable ID.",
  };

  if (!execute) {
    receipt.entries = selected.map((entry) => ({
      businessId: entry.businessId,
      canonicalName: entry.expected.canonicalName,
      expectedBefore: entry.expected,
      request: buildMapAttachmentRequest(entry),
      disposition: "VALIDATED_DRY_RUN",
    }));
  } else {
    const suppliedManifestId = args.get("--execute-manifest");
    assertExecutionAuthorization(manifest.manifestId, suppliedManifestId, process.env.MAP_ATTACHMENT_BATCH_EXECUTION);
    const apiBase = process.env.MAP_ATTACHMENT_API_BASE;
    const bearer = process.env.MAP_ATTACHMENT_AUTH_BEARER;
    if (!apiBase || !bearer) throw new Error("Execution refused: MAP_ATTACHMENT_API_BASE and MAP_ATTACHMENT_AUTH_BEARER are required");
    const parsedBase = new URL(apiBase);
    if (parsedBase.protocol !== "https:") throw new Error("Execution refused: MAP_ATTACHMENT_API_BASE must use HTTPS");

    for (const entry of selected) {
      const endpoint = new URL(`/api/admin/businesses/${encodeURIComponent(entry.businessId)}/map-pin-evidence`, parsedBase).toString();
      const request = buildMapAttachmentRequest(entry);
      try {
        const response = await fetchJson(endpoint, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${bearer}`,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(request),
        });
        receipt.entries.push({
          businessId: entry.businessId,
          canonicalName: entry.expected.canonicalName,
          expectedBefore: entry.expected,
          status: response.status,
          disposition: response.ok ? (response.body.replayed ? "REPLAYED_NO_MUTATION" : "ATTACHED") : "HELD_BY_GUARD",
          response: response.body,
        });
      } catch (error) {
        receipt.entries.push({
          businessId: entry.businessId,
          canonicalName: entry.expected.canonicalName,
          expectedBefore: entry.expected,
          disposition: "TRANSPORT_FAILURE_HELD",
          error: safeError(error),
        });
      }
    }

    const successfulIds = receipt.entries
      .filter((entry) => entry.disposition === "ATTACHED" || entry.disposition === "REPLAYED_NO_MUTATION")
      .map((entry) => entry.businessId);
    if (successfulIds.length > 0) {
      try {
        const map = await fetchJson(new URL("/api/businesses/map-pins?supportScope=all_businesses", parsedBase).toString(), {
          headers: { accept: "application/json" },
        });
        const pins = Array.isArray(map.body?.pins) ? map.body.pins : Array.isArray(map.body) ? map.body : [];
        const visible = new Set(pins.map((pin) => pin?.id).filter((id) => typeof id === "string"));
        receipt.publicMapVerification = {
          attempted: true,
          status: map.status,
          visibleBusinessIds: successfulIds.filter((id) => visible.has(id)),
          missingBusinessIds: successfulIds.filter((id) => !visible.has(id)),
        };
      } catch (error) {
        receipt.publicMapVerification = { attempted: true, error: safeError(error), visibleBusinessIds: [], missingBusinessIds: successfulIds };
      }
    }
  }

  const output = resultPath(manifestPath, manifest.manifestId, args.get("--receipt"));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const failures = receipt.entries.filter((entry) => !["VALIDATED_DRY_RUN", "ATTACHED", "REPLAYED_NO_MUTATION"].includes(entry.disposition));
  console.log(JSON.stringify({ receipt: output, mode: receipt.mode, processed: receipt.entries.length, heldOrFailed: failures.length }, null, 2));
  if (execute && failures.length > 0) process.exitCode = 2;
}

run().catch((error) => {
  console.error(safeError(error));
  process.exitCode = 1;
});
