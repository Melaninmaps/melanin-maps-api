#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const RECONCILIATION_VERSION = "kinfolk-current-member-discovery-reconciliation-v1";
const MANIFEST_KIND = "kinfolk_current_online_presence_apply_v1";
const DEFAULT_BATCH_SIZE = 500;
const SUPPORTED_SOCIAL = ["instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest"];

export function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${stableJson(value[key])}`,
  ).join(",")}}`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function fingerprint(value) {
  return sha256(stableJson(value));
}

function normalizedText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function normalizedLink(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.hash = "";
    url.hostname = url.hostname.toLocaleLowerCase();
    if (url.pathname === "/") url.pathname = "";
    return url.toString().replace(/\/$/, "").toLocaleLowerCase();
  } catch {
    return raw.replace(/\/$/, "").toLocaleLowerCase();
  }
}

function asLines(input) {
  if (Array.isArray(input)) return input;
  return String(input).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function socialHasVerifiedPresence(record) {
  return Object.values(record.social ?? {}).some((entry) =>
    entry?.classification === "KEEP_ACTIVE_SOCIAL" && entry?.identity?.status === "matched",
  );
}

function exactStoredLinkCandidate(record, discovery) {
  if (!discovery) return null;
  const storedWebsite = normalizedLink(record.originalLinks?.website);
  const storedSocial = new Set(
    Object.values(record.originalLinks?.social ?? {}).map(normalizedLink).filter(Boolean),
  );
  for (const candidate of discovery.candidates ?? []) {
    if (candidate?.probe?.state !== "available" || candidate?.identity?.status !== "matched") continue;
    const candidateLink = normalizedLink(candidate.url);
    if (!candidateLink) continue;
    if (candidateLink === storedWebsite) return { channel: "website", candidate };
    if (storedSocial.has(candidateLink)) return { channel: "social", candidate };
  }
  return null;
}

function sourceIdentityConflicts(record, discovery) {
  if (!discovery) return false;
  return (
    normalizedText(record.businessName) !== normalizedText(discovery.businessName) ||
    normalizedText(record.city) !== normalizedText(discovery.city) ||
    normalizedText(record.state) !== normalizedText(discovery.state) ||
    normalizedLink(record.originalLinks?.website) !== normalizedLink(discovery.originalLinks?.website) ||
    Object.entries(record.originalLinks?.social ?? {}).some(([platform, url]) =>
      normalizedLink(url) !== normalizedLink(discovery.originalLinks?.social?.[platform]),
    )
  );
}

function noQualifyingWebsite(record, discovery) {
  const website = record.website ?? {};
  if (!record.originalLinks?.website) {
    return { classification: "MISSING", reason: "No website is stored for this business." };
  }
  if (website.classification === "REMOVE_CONFIRMED_INACTIVE") return website;
  return {
    classification: "UNVERIFIED_OR_IDENTITY_UNCLEAR",
    sourceClassification: website.classification ?? "UNKNOWN",
    reason: website.reason ?? "Available evidence does not establish a currently active identity-matched official website.",
    probe: website.probe ?? null,
    discoveryCandidates: (discovery?.candidates ?? []).filter((candidate) =>
      normalizedLink(candidate?.url) === normalizedLink(record.originalLinks.website),
    ),
  };
}

function noQualifyingSocial(record, discovery) {
  const output = {};
  for (const [platform, url] of Object.entries(record.originalLinks?.social ?? {})) {
    const evidence = record.social?.[platform] ?? {};
    output[platform] = evidence.classification === "INACTIVE_OR_REMOVED"
      ? evidence
      : {
          classification: "UNVERIFIED_OR_IDENTITY_UNCLEAR",
          sourceClassification: evidence.classification ?? "UNKNOWN",
          reason: evidence.reason ?? "Available evidence does not establish a currently active identity-matched official social profile.",
          probe: evidence.probe ?? null,
          discoveryCandidates: (discovery?.candidates ?? []).filter((candidate) =>
            normalizedLink(candidate?.url) === normalizedLink(url),
          ),
        };
  }
  return output;
}

function directEvidence(record, discovery, recheckedStoredLink) {
  return {
    presenceVerification: {
      website: record.website ?? null,
      social: record.social ?? {},
      checkedAt: record.checkedAt ?? null,
    },
    discovery: discovery ? {
      disposition: discovery.disposition ?? null,
      completedAt: discovery.completedAt ?? null,
      directStoredLinkRecheck: recheckedStoredLink?.candidate ?? null,
      candidateCount: Array.isArray(discovery.candidates) ? discovery.candidates.length : 0,
    } : null,
  };
}

function validateSourceRecord(record) {
  return [record.businessId, record.businessName, record.city, record.state, record.currentSnapshotHash]
    .every((value) => typeof value === "string" && value.trim().length > 0);
}

function deleteReviewItem(record, discovery) {
  return {
    businessId: record.businessId,
    businessName: record.businessName,
    city: record.city,
    state: record.state,
    currentSnapshotHash: record.currentSnapshotHash,
    originalLinks: record.originalLinks,
    websiteVerification: noQualifyingWebsite(record, discovery),
    socialVerification: noQualifyingSocial(record, discovery),
    originalSnapshot: {
      sourceSnapshot: record.sourceSnapshot ?? {},
      presenceCheckedAt: record.checkedAt ?? null,
      discovery: discovery ? {
        disposition: discovery.disposition ?? null,
        completedAt: discovery.completedAt ?? null,
        candidates: discovery.candidates ?? [],
      } : null,
    },
  };
}

export function reconcileEvidence({ presence, discovery = [], previousManifest = null, batchSize = DEFAULT_BATCH_SIZE, generatedAt = new Date().toISOString() }) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1_000) {
    throw new Error("batchSize must be an integer between 1 and 1000.");
  }
  const rows = asLines(presence);
  const discoveryById = new Map(asLines(discovery).map((row) => [row.businessId, row]));
  const previousReviewIds = new Set((previousManifest?.deleteReviews ?? []).map((row) => row.businessId));
  const decisions = [];
  const deleteReviews = [];

  for (const record of rows) {
    const discoveryRecord = discoveryById.get(record.businessId);
    const recheckedStoredLink = exactStoredLinkCandidate(record, discoveryRecord);
    if (!validateSourceRecord(record)) {
      decisions.push({
        businessId: record.businessId ?? null,
        businessName: record.businessName ?? null,
        disposition: "HOLD_SOURCE_RECORD_CONFLICT",
        reason: "The retained source snapshot is missing a required immutable identity field or snapshot hash.",
      });
      continue;
    }
    if (sourceIdentityConflicts(record, discoveryRecord)) {
      decisions.push({
        businessId: record.businessId,
        businessName: record.businessName,
        city: record.city,
        state: record.state,
        disposition: "HOLD_SOURCE_RECORD_CONFLICT",
        reason: "The discovery source does not match the retained business identity or stored contact links.",
        evidence: directEvidence(record, discoveryRecord, recheckedStoredLink),
      });
      continue;
    }
    if (record.website?.classification === "KEEP_ACTIVE" && record.website?.identity?.status === "matched") {
      decisions.push({ businessId: record.businessId, businessName: record.businessName, city: record.city, state: record.state, disposition: "KEEP_ACTIVE_WEBSITE", reason: "A currently active identity-matched official website is retained.", evidence: directEvidence(record, discoveryRecord, null) });
      continue;
    }
    if (socialHasVerifiedPresence(record)) {
      decisions.push({ businessId: record.businessId, businessName: record.businessName, city: record.city, state: record.state, disposition: "KEEP_ACTIVE_SOCIAL", reason: "A currently active identity-matched official social profile is retained.", evidence: directEvidence(record, discoveryRecord, null) });
      continue;
    }
    if (recheckedStoredLink) {
      decisions.push({
        businessId: record.businessId,
        businessName: record.businessName,
        city: record.city,
        state: record.state,
        disposition: recheckedStoredLink.channel === "website" ? "KEEP_RECONFIRMED_STORED_WEBSITE" : "KEEP_RECONFIRMED_STORED_SOCIAL",
        reason: "A retained stored link was later reachable and identity-matched; no new external URL is added automatically.",
        evidence: directEvidence(record, discoveryRecord, recheckedStoredLink),
      });
      continue;
    }
    if (previousReviewIds.has(record.businessId)) {
      decisions.push({
        businessId: record.businessId,
        businessName: record.businessName,
        city: record.city,
        state: record.state,
        disposition: "PREVIOUS_DELETE_REVIEW_SCOPE_REQUIRES_LIVE_CENSUS",
        reason: "This immutable ID was in the prior review manifest; fresh live Admin census must distinguish the already queued records from skipped changed records before any duplicate action.",
        evidence: directEvidence(record, discoveryRecord, null),
      });
      continue;
    }
    const review = deleteReviewItem(record, discoveryRecord);
    deleteReviews.push(review);
    decisions.push({
      businessId: record.businessId,
      businessName: record.businessName,
      city: record.city,
      state: record.state,
      disposition: "DELETE_REVIEW_REQUIRED",
      reason: "Available evidence does not establish a currently active identity-matched official website or social profile.",
      currentSnapshotHash: record.currentSnapshotHash,
      evidence: directEvidence(record, discoveryRecord, null),
    });
  }

  const inputSha256 = sha256(stableJson({
    reconciliationVersion: RECONCILIATION_VERSION,
    presence: rows,
    discovery: asLines(discovery),
    priorManifestFingerprint: previousManifest?.manifestFingerprint ?? null,
  }));
  const batches = [];
  for (let index = 0; index < deleteReviews.length; index += batchSize) {
    const unsigned = {
      kind: MANIFEST_KIND,
      generatedAt,
      source: {
        verifierVersion: RECONCILIATION_VERSION,
        inputSha256,
        completedAt: generatedAt,
      },
      websiteRemovals: [],
      deleteReviews: deleteReviews.slice(index, index + batchSize),
    };
    batches.push({ ...unsigned, manifestFingerprint: fingerprint(unsigned) });
  }
  const counts = Object.fromEntries(
    [...new Set(decisions.map((decision) => decision.disposition))]
      .sort()
      .map((disposition) => [disposition, decisions.filter((decision) => decision.disposition === disposition).length]),
  );
  return { decisions, deleteReviews, batches, summary: {
    reconciliationVersion: RECONCILIATION_VERSION,
    generatedAt,
    inputSha256,
    totalSourceRecords: rows.length,
    totalDiscoveryRecords: discoveryById.size,
    totalPreviousReviewManifestRecords: previousReviewIds.size,
    counts,
    newDeleteReviewRecords: deleteReviews.length,
    batches: batches.map((manifest, index) => ({
      index: index + 1,
      count: manifest.deleteReviews.length,
      manifestFingerprint: manifest.manifestFingerprint,
    })),
    operationalGate: "A fresh authenticated live Admin census is required before any batch is authorized or applied. The apply route rechecks immutable identity and stored links under a serializable transaction.",
  } };
}

async function main() {
  const arg = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
  };
  const presencePath = arg("--presence");
  const discoveryPath = arg("--discovery");
  const previousManifestPath = arg("--previous-manifest");
  const outputDirectory = arg("--out");
  const requestedBatchSize = arg("--batch-size");
  if (!presencePath || !discoveryPath || !previousManifestPath || !outputDirectory) {
    throw new Error("Usage: reconcile-kinfolk-current-member-discovery.mjs --presence <jsonl> --discovery <jsonl> --previous-manifest <json> --out <directory> [--batch-size 500]");
  }
  const [presenceText, discoveryText, previousManifestText] = await Promise.all([
    readFile(resolve(presencePath), "utf8"),
    readFile(resolve(discoveryPath), "utf8"),
    readFile(resolve(previousManifestPath), "utf8"),
  ]);
  const result = reconcileEvidence({
    presence: presenceText,
    discovery: discoveryText,
    previousManifest: JSON.parse(previousManifestText),
    batchSize: requestedBatchSize ? Number(requestedBatchSize) : DEFAULT_BATCH_SIZE,
  });
  const output = resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  await Promise.all([
    writeFile(resolve(output, "reconciliation-decisions.jsonl"), `${result.decisions.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8"),
    writeFile(resolve(output, "candidate-delete-review-records.json"), `${JSON.stringify(result.deleteReviews, null, 2)}\n`, "utf8"),
    writeFile(resolve(output, "summary.json"), `${JSON.stringify(result.summary, null, 2)}\n`, "utf8"),
    ...result.batches.map((manifest, index) =>
      writeFile(resolve(output, `member-discovery-delete-review-batch-${String(index + 1).padStart(2, "0")}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    ),
  ]);
  console.log(JSON.stringify({ output, ...result.summary }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
