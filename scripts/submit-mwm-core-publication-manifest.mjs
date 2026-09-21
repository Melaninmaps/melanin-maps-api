#!/usr/bin/env node
/**
 * Stages one already-derived source-receipted manifest through the protected review
 * ingress. This script never starts the publication worker and refuses to send
 * anything unless --apply, exact count, and exact receipt root are supplied.
 */
import { createHash, createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const POLICY_VERSION = "source-receipted-directory-publication-v1";
const CHAMBER_COHORT = "mwm_chamber_backed_candidate";
const INSTITUTIONAL_COHORT = "mwm_institutional_directory_candidate";
const SOURCE_REPUTABLE_LISTING_COHORT = "source_reputable_listing_candidate";

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function requiredArg(name) {
  const value = argValue(name);
  if (!value) throw new Error(`Missing required ${name}.`);
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(secret, value) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function parseJsonl(value, label) {
  return value.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSONL in ${label} at line ${index + 1}.`);
    }
  });
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function assertApprovedRows(rows, expectedRootHash, expectedCount, expectedLaneCounts) {
  if (rows.length !== expectedCount) {
    throw new Error(`Manifest row count mismatch: expected ${expectedCount}, received ${rows.length}.`);
  }
  const actualLaneCounts = { chamber: 0, institutional_directory: 0, reputable_source: 0 };
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`Manifest row ${index + 1} is not an object.`);
    }
    const expectedCohort = row.mwm_core_evidence_lane === "chamber"
      ? CHAMBER_COHORT
      : row.mwm_core_evidence_lane === "institutional_directory"
        ? INSTITUTIONAL_COHORT
        : row.mwm_core_evidence_lane === "reputable_source"
          ? SOURCE_REPUTABLE_LISTING_COHORT
        : null;
    if (row.mwm_core_policy_version !== POLICY_VERSION ||
        !expectedCohort ||
        row.mwm_core_cohort !== expectedCohort ||
        (row.mwm_publication_classification !== "source_reported_mwm_designation" &&
          row.mwm_publication_classification !== "unverified_source_listing") ||
        row.mwm_core_receipt_root_hash !== expectedRootHash ||
        !isSha256(row.mwm_core_receipt_hash) ||
        !isSha256(row.mwm_core_source_manifest_sha256) ||
        typeof row.mwm_core_source_manifest !== "string" ||
        !row.mwm_core_source_manifest.trim() ||
        !Number.isInteger(row.mwm_core_source_row) ||
        row.mwm_core_source_row < 1 ||
        (typeof row.mwm_core_source_row_id !== "string" && typeof row.mwm_core_source_row_id !== "number")) {
      throw new Error(`Manifest row ${index + 1} lacks an approved immutable source receipt.`);
    }
    actualLaneCounts[row.mwm_core_evidence_lane] += 1;
  }
  if (actualLaneCounts.chamber !== expectedLaneCounts.chamber ||
      actualLaneCounts.institutional_directory !== expectedLaneCounts.institutional_directory ||
      actualLaneCounts.reputable_source !== expectedLaneCounts.reputable_source) {
    throw new Error(`Evidence lane count mismatch: expected Chamber ${expectedLaneCounts.chamber} / institutional ${expectedLaneCounts.institutional_directory} / reputable source ${expectedLaneCounts.reputable_source}, received Chamber ${actualLaneCounts.chamber} / institutional ${actualLaneCounts.institutional_directory} / reputable source ${actualLaneCounts.reputable_source}.`);
  }
  return actualLaneCounts;
}

async function main() {
  if (!process.argv.includes("--apply")) {
    throw new Error("Refusing to stage a cohort without --apply. This command has no implicit mutation mode.");
  }
  const manifestPath = resolve(requiredArg("--manifest"));
  const apiUrl = requiredArg("--api-url").replace(/\/$/, "");
  const expectedRootHash = requiredArg("--expected-receipt-root-hash").toLowerCase();
  const expectedCount = Number(requiredArg("--expected-candidate-count"));
  const expectedLaneCounts = {
    chamber: Number(requiredArg("--expected-chamber-count")),
    institutional_directory: Number(requiredArg("--expected-institutional-directory-count")),
    reputable_source: Number(requiredArg("--expected-source-listing-count")),
  };
  if (!isSha256(expectedRootHash)) throw new Error("--expected-receipt-root-hash must be a SHA-256 hash.");
  if (!Number.isInteger(expectedCount) || expectedCount < 1 ||
      !Number.isInteger(expectedLaneCounts.chamber) || expectedLaneCounts.chamber < 0 ||
      !Number.isInteger(expectedLaneCounts.institutional_directory) || expectedLaneCounts.institutional_directory < 0 ||
      !Number.isInteger(expectedLaneCounts.reputable_source) || expectedLaneCounts.reputable_source < 0 ||
      expectedCount !== expectedLaneCounts.chamber + expectedLaneCounts.institutional_directory + expectedLaneCounts.reputable_source) {
    throw new Error("Expected total must be positive and equal the Chamber, institutional-directory, and reputable-source lane counts.");
  }

  const signingSecret = process.env.DIRECTORY_REVIEW_SIGNING_SECRET ?? "";
  const serviceToken = process.env.DIRECTORY_SERVICE_TOKEN ?? "";
  if (signingSecret.length < 32 || serviceToken.length < 32) {
    throw new Error("Directory service credentials are not configured in the execution environment.");
  }

  const jsonl = await readFile(manifestPath, "utf8");
  const rows = parseJsonl(jsonl, manifestPath);
  const evidenceLaneCounts = assertApprovedRows(rows, expectedRootHash, expectedCount, expectedLaneCounts);

  const checksum = sha256(jsonl);
  const ingressTimestamp = String(Date.now());
  const ingressNonce = randomUUID();
  const ingressSignature = hmac(
    signingSecret,
    `${ingressTimestamp}.${ingressNonce}.${checksum}.${jsonl}`,
  );
  const payload = {
    jsonl,
    manifest: {
      sourceName: `source-receipted-directory-${expectedRootHash.slice(0, 12)}`,
      sha256: checksum,
      rowCount: rows.length,
    },
  };
  const serviceTimestamp = new Date().toISOString();
  const serviceNonce = randomUUID();
  const route = "/api/founder/directory-import/ingress";
  const servicePayload = [
    serviceTimestamp,
    serviceNonce,
    "POST",
    route,
    sha256(JSON.stringify(payload)),
  ].join("\n");
  const serviceSignature = hmac(signingSecret, servicePayload);

  const response = await fetch(`${apiUrl}${route}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${serviceToken}`,
      "x-directory-service-timestamp": serviceTimestamp,
      "x-directory-service-nonce": serviceNonce,
      "x-directory-service-signature": serviceSignature,
      "x-directory-timestamp": ingressTimestamp,
      "x-directory-nonce": ingressNonce,
      "x-directory-checksum": checksum,
      "x-directory-signature": ingressSignature,
    },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.json().catch(() => ({}));
  if (response.status !== 202 || responseBody?.accepted !== true) {
    throw new Error(`Protected cohort ingress failed with HTTP ${response.status}: ${JSON.stringify(responseBody)}`);
  }

  process.stdout.write(`${JSON.stringify({
    accepted: true,
    batchId: responseBody.batchId ?? null,
    checksum,
    rowCount: rows.length,
    counts: responseBody.counts ?? {},
    evidenceLaneCounts,
    publicationWorkerEnabled: false,
  }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
