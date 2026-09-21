#!/usr/bin/env node
/**
 * Reads aggregate-only MWM Core directory-publication receipts from the
 * protected review service. It never creates, edits, publishes, hides, or
 * deletes a directory record, and it never starts a worker.
 */
import { createHash, createHmac, randomUUID } from "node:crypto";

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : undefined;
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

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

async function signedGet(apiUrl, route, signingSecret, serviceToken) {
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const signature = hmac(
    signingSecret,
    [timestamp, nonce, "GET", route, sha256("")].join("\n"),
  );
  const response = await fetch(`${apiUrl}${route}`, {
    headers: {
      authorization: `Bearer ${serviceToken}`,
      "x-directory-service-timestamp": timestamp,
      "x-directory-service-nonce": nonce,
      "x-directory-service-signature": signature,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Receipt read failed for ${route} with HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const apiUrl = requiredArg("--api-url").replace(/\/$/, "");
  const expectedRootHash = requiredArg("--expected-receipt-root-hash").toLowerCase();
  if (!isSha256(expectedRootHash)) {
    throw new Error("--expected-receipt-root-hash must be a SHA-256 hash.");
  }

  const signingSecret = process.env.DIRECTORY_REVIEW_SIGNING_SECRET ?? "";
  const serviceToken = process.env.DIRECTORY_SERVICE_TOKEN ?? "";
  if (signingSecret.length < 32 || serviceToken.length < 32) {
    throw new Error("Directory service credentials are not configured in the execution environment.");
  }

  const [summary, diagnostics] = await Promise.all([
    signedGet(apiUrl, "/api/founder/directory-import/service/summary", signingSecret, serviceToken),
    signedGet(apiUrl, "/api/founder/directory-import/service/publication-diagnostics", signingSecret, serviceToken),
  ]);

  // Keep this aligned with the immutable sourceName emitted by
  // submit-mwm-core-publication-manifest.mjs, so a receipt from another batch
  // can never be reported as this source-receipted cohort.
  const expectedBatchPrefix = `source-receipted-directory-${expectedRootHash.slice(0, 12)}`;
  const expectedBatch = Array.isArray(summary.batches)
    ? summary.batches.find((batch) => batch?.source_name === expectedBatchPrefix) ?? null
    : null;

  process.stdout.write(`${JSON.stringify({
    sideEffects: "none",
    expectedReceiptRootHash: expectedRootHash,
    expectedBatchPrefix,
    expectedBatch,
    candidates: summary.candidates ?? [],
    outbox: summary.outbox ?? [],
    diagnostics: diagnostics.diagnostics ?? [],
  }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
