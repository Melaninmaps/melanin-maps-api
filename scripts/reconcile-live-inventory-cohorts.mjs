#!/usr/bin/env node
/**
 * Read-only reconciliation of public business responses against the offline
 * signed-manifest receipt. This script never writes to the API or database.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const DEFAULT_RECEIPTS = "/home/ubuntu/mwm-inventory-cohort-preflight-6576.jsonl";
const DEFAULT_OUTPUT = "/home/ubuntu/mwm-live-inventory-cohort-reconciliation.json";
const API = process.env.MWM_API_BASE_URL ?? "https://api.melaninmaps.com";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function publicHost(value) {
  if (!String(value ?? "").trim()) return "";
  try {
    const url = new URL(String(value).trim());
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function strongKey(record) {
  const name = normalize(record.name);
  const city = normalize(record.city);
  const state = normalize(record.state);
  const host = publicHost(record.website ?? record.websiteUrl ?? record.website_url);
  return name && city && state && host ? `${name}|${city}|${state}|${host}` : "";
}

function basicKey(record) {
  const name = normalize(record.name);
  const city = normalize(record.city);
  const state = normalize(record.state);
  return name && city && state ? `${name}|${city}|${state}` : "";
}

async function fetchAll() {
  const records = [];
  let offset = 0;
  const limit = 200;
  let expectedTotal = null;
  while (expectedTotal === null || offset < expectedTotal) {
    const url = new URL("/api/businesses", API);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    let response;
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        response = await fetch(url, { headers: { accept: "application/json" } });
        if (response.ok) break;
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
    }
    if (!response) {
      const detail = lastError instanceof Error ? `${lastError.message}${lastError.cause ? `: ${String(lastError.cause)}` : ""}` : String(lastError);
      throw new Error(`Live business fetch failed at offset ${offset} after three attempts: ${detail}`);
    }
    if (!response.ok) throw new Error(`Live business fetch failed at offset ${offset}: HTTP ${response.status}`);
    const body = await response.json();
    const businesses = Array.isArray(body.businesses) ? body.businesses : [];
    if (!Number.isInteger(body.total)) throw new Error("Live business response did not provide an integer total.");
    expectedTotal = body.total;
    records.push(...businesses);
    if (businesses.length === 0) break;
    offset += businesses.length;
  }
  if (expectedTotal !== records.length) {
    throw new Error(`Incomplete live inventory fetch: expected ${expectedTotal}, received ${records.length}.`);
  }
  return records;
}

async function main() {
  const receiptPath = resolve(argValue("--receipts", DEFAULT_RECEIPTS));
  const outputPath = resolve(argValue("--out", DEFAULT_OUTPUT));
  const receiptLines = (await readFile(receiptPath, "utf8")).split(/\r?\n/).filter(Boolean);
  const receipts = receiptLines.map((line) => JSON.parse(line));
  const automaticMwmCohorts = new Set([
    "mwm_chamber_backed_candidate",
    "mwm_institutional_directory_candidate",
  ]);
  const sourceStrong = new Map();
  const sourceBasic = new Map();
  for (const receipt of receipts) {
    const identity = receipt.recordIdentity ?? {};
    const strong = strongKey(identity);
    const basic = basicKey(identity);
    if (strong) sourceStrong.set(strong, receipt);
    if (basic) {
      const current = sourceBasic.get(basic) ?? [];
      current.push(receipt);
      sourceBasic.set(basic, current);
    }
  }
  const live = await fetchAll();
  const buckets = {
    sourceBackedMwmCandidateLive: [],
    sourceBackedHeldLive: [],
    ambiguousSourceMatchLive: [],
    legacyOrUnattributedLive: [],
  };
  const liveReceipts = [];
  for (const business of live) {
    const strong = strongKey(business);
    const basic = basicKey(business);
    const strongMatch = strong ? sourceStrong.get(strong) : null;
    const basicMatches = basic ? sourceBasic.get(basic) ?? [] : [];
    const uniqueSourceMatch = strongMatch ?? (basicMatches.length === 1 ? basicMatches[0] : null);
    const publicRecord = {
      id: business.id,
      name: business.name,
      city: business.city,
      state: business.state,
      website: business.website ?? business.websiteUrl ?? null,
      listingStatus: business.listingStatus ?? business.listing_status ?? null,
      ownershipDesignations: business.ownershipDesignations ?? business.ownership_designations ?? [],
    };
    let cohort;
    let sourceReceipt = null;
    if (uniqueSourceMatch && automaticMwmCohorts.has(uniqueSourceMatch.cohort)) {
      cohort = "source_backed_mwm_candidate_live";
      sourceReceipt = uniqueSourceMatch;
    } else if (uniqueSourceMatch) {
      cohort = "source_backed_held_live";
      sourceReceipt = uniqueSourceMatch;
    } else if (basicMatches.length > 1) {
      cohort = "ambiguous_source_match_live";
    } else {
      cohort = "legacy_or_unattributed_live";
    }
    const receiptWithoutHash = {
      receiptVersion: "mwm-live-inventory-cohort-reconciliation-v1",
      business: publicRecord,
      cohort,
      sourceReceiptHash: sourceReceipt?.receiptHash ?? null,
      sourceManifest: sourceReceipt?.sourceManifest ?? null,
      sourceRow: sourceReceipt?.sourceRow ?? null,
      sourceEvidenceLane: sourceReceipt?.evidenceLane ?? null,
      ambiguousSourceReceiptCount: cohort === "ambiguous_source_match_live" ? basicMatches.length : 0,
    };
    const receipt = { ...receiptWithoutHash, receiptHash: sha256(canonicalJson(receiptWithoutHash)) };
    liveReceipts.push(receipt);
    if (cohort === "source_backed_mwm_candidate_live") buckets.sourceBackedMwmCandidateLive.push(receipt);
    if (cohort === "source_backed_held_live") buckets.sourceBackedHeldLive.push(receipt);
    if (cohort === "ambiguous_source_match_live") buckets.ambiguousSourceMatchLive.push(receipt);
    if (cohort === "legacy_or_unattributed_live") buckets.legacyOrUnattributedLive.push(receipt);
  }
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "read_only_reconciliation",
    sideEffects: "none",
    livePublicBusinessCount: live.length,
    signedSourceReceiptCount: receipts.length,
    liveReceiptCount: liveReceipts.length,
    liveReceiptRootHash: sha256(liveReceipts.map((receipt) => receipt.receiptHash).join("\n")),
    liveCohortCounts: Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, value.length])),
    interpretation: {
      sourceBackedMwmCandidateLive: "Live record exactly matches one of the signed Chamber or institutional-directory MWM candidate receipts. This does not claim it was created in this session.",
      sourceBackedHeldLive: "Live record matches a signed source receipt but that source row is held from automatic future publication.",
      ambiguousSourceMatchLive: "Live record has more than one possible name/city/state source match; ownership/provenance cannot be asserted automatically.",
      legacyOrUnattributedLive: "No unique match in the current 6,576-row receipt set. It may be a historic seed, a community record, an owner-created record, or an import not included in the current package; it must not be silently hidden.",
    },
    liveReceipts,
    buckets,
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ livePublicBusinessCount: report.livePublicBusinessCount, signedSourceReceiptCount: report.signedSourceReceiptCount, liveCohortCounts: report.liveCohortCounts }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
