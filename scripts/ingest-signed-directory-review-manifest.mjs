#!/usr/bin/env node
import { createHash, createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requiredOption(name) {
  const value = option(name);
  if (!value?.trim()) throw new Error(`Missing ${name}.`);
  return value.trim();
}

function requiredEnvironment(name, minimumLength = 1) {
  const value = process.env[name] ?? "";
  if (value.length < minimumLength) throw new Error(`${name} must be configured in the operator environment.`);
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    return /^https?:$/.test(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function jsonlRecords(bytes) {
  const rows = [];
  for (const [index, line] of bytes.toString("utf8").split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("not an object");
      rows.push(row);
    } catch {
      throw new Error(`Invalid JSONL at line ${index + 1}.`);
    }
  }
  return rows;
}

function healthIndex(report) {
  if (!report || typeof report !== "object" || !Array.isArray(report.results)) {
    throw new Error("Destination-health report must include results.");
  }
  return new Map(report.results
    .filter((result) => result && typeof result.url === "string")
    .map((result) => [canonicalHttpUrl(result.url), result]));
}

function destinations(record) {
  return [
    record.website,
    record.socialSourceUrl,
    record.instagramUrl,
    record.facebookUrl,
    record.tiktokUrl,
  ].map(canonicalHttpUrl).filter(Boolean);
}

function prepareRecords(records, sourceManifestSha256, health) {
  return records.map((record) => {
    const matchedHealth = destinations(record)
      .map((url) => ({ url, result: health.get(url) }))
      .filter((entry) => entry.result);
    const reachable = matchedHealth.some(({ result }) => result.outcome === "reachable");
    return {
      ...record,
      // These additions preserve the original row and provenance; they do not
      // replace the checksum-pinned source manifest or invent business facts.
      source_manifest_sha256: sourceManifestSha256,
      destination_reachable: reachable,
      destination_health: matchedHealth.map(({ url, result }) => ({
        url,
        outcome: result.outcome,
        status: result.status ?? null,
        finalUrl: canonicalHttpUrl(result.finalUrl) ?? null,
        checkedAt: result.checkedAt ?? health.checkedAt ?? null,
      })),
    };
  });
}

async function main() {
  const manifestPath = resolve(requiredOption("--manifest"));
  const summaryPath = resolve(requiredOption("--summary"));
  const healthPath = resolve(requiredOption("--health"));
  const sourceName = requiredOption("--source-name");
  const api = requiredOption("--api").replace(/\/+$/, "");
  const signingSecret = requiredEnvironment("DIRECTORY_REVIEW_SIGNING_SECRET", 32);
  const serviceToken = requiredEnvironment("DIRECTORY_SERVICE_TOKEN", 32);

  const manifestBytes = readFileSync(manifestPath);
  const records = jsonlRecords(manifestBytes);
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const healthReport = JSON.parse(readFileSync(healthPath, "utf8"));
  const sourceManifestSha256 = sha256(manifestBytes);

  const summaryManifestSha256 = summary.manifest_sha256 ?? summary.candidateManifest?.sha256;
  if (summaryManifestSha256 !== sourceManifestSha256) {
    throw new Error("Review summary checksum does not match the source manifest.");
  }
  const expectedCount = summary.accepted_review_only_candidates ?? summary.candidates ?? summary.candidateManifest?.rowCount;
  if (!Number.isInteger(expectedCount) || expectedCount !== records.length) {
    throw new Error("Review summary row count does not match the source manifest.");
  }
  if (healthReport.candidates !== records.length) {
    throw new Error("Destination-health report count does not match the source manifest.");
  }

  const prepared = prepareRecords(records, sourceManifestSha256, healthIndex(healthReport));
  const jsonl = `${prepared.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const checksum = sha256(jsonl);
  const timestamp = String(Date.now());
  const nonce = randomUUID();
  const signature = createHmac("sha256", signingSecret)
    .update(`${timestamp}.${nonce}.${checksum}.${jsonl}`)
    .digest("hex");
  const requestPath = "/api/founder/directory-import/ingress";
  const requestBody = JSON.stringify({
    jsonl,
    manifest: {
      sha256: checksum,
      rowCount: prepared.length,
      sourceName,
      sourceManifestSha256,
      destinationHealthSha256: sha256(readFileSync(healthPath)),
    },
  });
  const serviceTimestamp = new Date().toISOString();
  const serviceNonce = randomUUID();
  const serviceSignature = createHmac("sha256", signingSecret)
    .update([
      serviceTimestamp,
      serviceNonce,
      "POST",
      requestPath,
      sha256(requestBody),
    ].join("\n"))
    .digest("hex");

  const response = await fetch(`${api}${requestPath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${serviceToken}`,
      "x-directory-service-timestamp": serviceTimestamp,
      "x-directory-service-nonce": serviceNonce,
      "x-directory-service-signature": serviceSignature,
      "x-directory-timestamp": timestamp,
      "x-directory-nonce": nonce,
      "x-directory-checksum": checksum,
      "x-directory-signature": signature,
    },
    body: requestBody,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Ingress failed (${response.status}): ${payload.error ?? "unknown error"}`);
  if (!payload.accepted || payload.rowCount !== prepared.length || payload.checksum !== checksum) {
    throw new Error("Ingress receipt did not match the submitted enriched payload.");
  }
  console.log(JSON.stringify({
    accepted: true,
    batchId: payload.batchId,
    sourceName,
    sourceManifestSha256,
    ingressPayloadSha256: checksum,
    rowCount: prepared.length,
    counts: payload.counts,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
