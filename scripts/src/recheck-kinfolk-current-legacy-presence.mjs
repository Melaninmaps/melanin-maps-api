#!/usr/bin/env node
/**
 * Rechecks retained first-party official-presence receipts for records that
 * could not be searched during a later read-only discovery pass.
 *
 * This tool never writes or proposes a production mutation. It only produces
 * current, source-linked review evidence after revalidating the saved URL.
 */
import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  assessIdentity,
  normalizeHttpUrl,
  probePublicUrl,
} from "./verify-kinfolk-current-online-presence.mjs";

const DEFAULT_DISCOVERY = "docs/directory-operations/kinfolk-current-official-discovery-2026-10-15/official-presence-discovery.jsonl";
const DEFAULT_LEGACY = "/home/ubuntu/mwm-official-website-enrichment-2026-10-08/official-presence-crawl.jsonl";
const DEFAULT_OUT = "docs/directory-operations/kinfolk-current-official-discovery-2026-10-15/legacy-receipt-recheck";
const SOCIAL_HOST = /(^|\.)(instagram\.com|facebook\.com|fb\.com|tiktok\.com|twitter\.com|x\.com|youtube\.com|pinterest\.com)$/i;
const UNTRUSTED_HOST = /(^|\.)(yelp\.com|yellowpages\.com|tripadvisor\.com|mapquest\.com|foursquare\.com|doordash\.com|ubereats\.com|grubhub\.com|opentable\.com|etsy\.com|amazon\.com)$/i;

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function boundedInt(value, fallback, maximum) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function canonical(value) {
  return cleanText(value)
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isNonSocialPublicWebsite(url) {
  const normalized = normalizeHttpUrl(url);
  if (!normalized.ok) return null;
  const hostname = new URL(normalized.normalized).hostname.replace(/^www\./i, "");
  if (SOCIAL_HOST.test(hostname) || UNTRUSTED_HOST.test(hostname)) return null;
  return normalized.normalized;
}

/**
 * Builds a safe, de-duplicated URL set only from retained receipts whose page
 * had a successful prior public fetch. Social and directory hosts are excluded.
 */
export function urlsFromLegacyReceipt(receipts) {
  const urls = [];
  const seen = new Set();
  for (const receipt of receipts) {
    const priorOkUrls = (receipt.pages ?? [])
      .filter((page) => page?.status === "ok" && Number(page.httpStatus) >= 200 && Number(page.httpStatus) < 300)
      .map((page) => page.finalUrl ?? page.requestedUrl);
    for (const rawUrl of [...(receipt.officialDestinationCandidates ?? []), ...priorOkUrls]) {
      const url = isNonSocialPublicWebsite(rawUrl);
      if (url && !seen.has(url)) {
        seen.add(url);
        urls.push({ url, receiptUnitId: receipt.unitId, priorCheckedAt: receipt.pages?.find((page) => page.finalUrl === rawUrl || page.requestedUrl === rawUrl)?.checkedAt ?? null });
      }
    }
  }
  return urls;
}

function locationSupported(document, city, state) {
  const text = canonical([document?.title, document?.ogTitle, document?.h1, document?.textSample].filter(Boolean).join(" "));
  const cityKey = canonical(city);
  const stateKey = canonical(state);
  return Boolean(cityKey && text.includes(cityKey)) || Boolean(stateKey && stateKey.length === 2 && new RegExp(`\\b${stateKey}\\b`, "i").test(text));
}

async function parseJsonLines(path) {
  const source = await fs.readFile(path, "utf8");
  const parsed = [];
  const errors = [];
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try { parsed.push(JSON.parse(line)); }
    catch (error) { errors.push({ line: index + 1, reason: error instanceof Error ? error.message : String(error) }); }
  }
  return { parsed, errors };
}

async function writeJson(path, value) {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function sleep(milliseconds) {
  await new Promise((resolvePause) => setTimeout(resolvePause, milliseconds));
}

async function mapWithConcurrency(values, concurrency, worker, onProgress) {
  let cursor = 0;
  let complete = 0;
  async function runWorker() {
    while (true) {
      const current = cursor;
      cursor += 1;
      if (current >= values.length) return;
      await worker(values[current]);
      complete += 1;
      if (complete % 10 === 0 || complete === values.length) await onProgress(complete, values.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, runWorker));
}

function classify(rechecks) {
  if (rechecks.some((item) => item.state === "MATCHED_LEGACY_WEBSITE_CANDIDATE")) {
    return { disposition: "WEBSITE_FOUND_REVIEW", reason: "A retained official source passed a current public identity and location check." };
  }
  if (rechecks.some((item) => item.state === "LEGACY_WEBSITE_REVIEW_CANDIDATE")) {
    return { disposition: "WEBSITE_FOUND_REVIEW", reason: "A retained official source matches the business name and requires location review." };
  }
  return { disposition: "NO_NEW_SAFE_LEGACY_CANDIDATE", reason: "Retained receipt candidates did not establish a current safe website match." };
}

function summary(rows) {
  const count = (predicate) => rows.filter(predicate).length;
  return {
    recordsRechecked: rows.length,
    websiteFoundForReview: count((row) => row.disposition.disposition === "WEBSITE_FOUND_REVIEW"),
    noNewSafeLegacyCandidate: count((row) => row.disposition.disposition === "NO_NEW_SAFE_LEGACY_CANDIDATE"),
    currentMatchedWebsiteCandidates: rows.reduce((sum, row) => sum + row.rechecks.filter((candidate) => candidate.state === "MATCHED_LEGACY_WEBSITE_CANDIDATE").length, 0),
    currentNameOnlyWebsiteCandidates: rows.reduce((sum, row) => sum + row.rechecks.filter((candidate) => candidate.state === "LEGACY_WEBSITE_REVIEW_CANDIDATE").length, 0),
  };
}

async function main() {
  const discoveryPath = resolve(argValue("--discovery", DEFAULT_DISCOVERY));
  const legacyPath = resolve(argValue("--legacy", DEFAULT_LEGACY));
  const outputDirectory = resolve(argValue("--out", DEFAULT_OUT));
  const concurrency = boundedInt(argValue("--concurrency", "3"), 3, 4);
  const timeoutMs = boundedInt(argValue("--timeout-ms", "12000"), 12_000, 30_000);
  const { parsed: discoveryRows } = await parseJsonLines(discoveryPath);
  const { parsed: legacyRows, errors: legacyErrors } = await parseJsonLines(legacyPath);
  const legacyByBusinessId = new Map();
  for (const legacy of legacyRows) {
    for (const businessId of legacy.recordIds ?? []) {
      const current = legacyByBusinessId.get(businessId) ?? [];
      current.push(legacy);
      legacyByBusinessId.set(businessId, current);
    }
  }
  const candidates = discoveryRows
    .filter((row) => ["NO_SAFE_CANDIDATE", "HOLD_AMBIGUOUS"].includes(row.disposition?.disposition))
    .map((row) => ({ ...row, legacyReceipts: legacyByBusinessId.get(row.businessId) ?? [] }))
    .filter((row) => urlsFromLegacyReceipt(row.legacyReceipts).length > 0);
  const results = new Map();
  const options = { dnsCache: new Map(), timeoutMs, retryDelayMs: 800 };
  const persist = async (finished, total) => {
    const partial = candidates.map((row) => results.get(row.businessId)).filter(Boolean);
    await writeJson(resolve(outputDirectory, "checkpoint.json"), { checkedAt: new Date().toISOString(), completed: finished, total, readOnly: true, legacyReceiptParseErrors: legacyErrors.length });
    await fs.writeFile(resolve(outputDirectory, "legacy-receipt-recheck.jsonl"), partial.map((row) => JSON.stringify(row)).join("\n") + (partial.length ? "\n" : ""), "utf8");
    process.stdout.write(`${new Date().toISOString()} legacy-recheck ${finished}/${total}\n`);
  };
  await mapWithConcurrency(candidates, concurrency, async (record) => {
    const rechecks = [];
    for (const candidate of urlsFromLegacyReceipt(record.legacyReceipts).slice(0, 2)) {
      const probe = await probePublicUrl(candidate.url, options);
      if (probe.state !== "available") {
        rechecks.push({ ...candidate, state: "UNAVAILABLE_LEGACY_CANDIDATE", reason: probe.reason ?? probe.state, probe });
        continue;
      }
      const identity = assessIdentity({ businessName: record.businessName, finalUrl: probe.finalUrl, document: probe.document });
      if (identity.status !== "matched") {
        rechecks.push({ ...candidate, state: "UNMATCHED_LEGACY_CANDIDATE", reason: "Current public page did not match the recorded business identity.", probe, identity });
        continue;
      }
      rechecks.push({
        ...candidate,
        state: locationSupported(probe.document, record.city, record.state) ? "MATCHED_LEGACY_WEBSITE_CANDIDATE" : "LEGACY_WEBSITE_REVIEW_CANDIDATE",
        reason: locationSupported(probe.document, record.city, record.state) ? "Current public page matches the recorded business name and city/state." : "Current public page matches the business name but needs location review.",
        probe,
        identity,
      });
      await sleep(150);
    }
    results.set(record.businessId, {
      businessId: record.businessId,
      businessName: record.businessName,
      city: record.city,
      state: record.state,
      priorDiscoveryDisposition: record.disposition,
      retainedReceiptUnitIds: record.legacyReceipts.map((receipt) => receipt.unitId),
      rechecks,
      disposition: classify(rechecks),
      checkedAt: new Date().toISOString(),
      productionWrite: false,
    });
  }, persist);
  const rows = candidates.map((candidate) => results.get(candidate.businessId)).filter(Boolean);
  await writeJson(resolve(outputDirectory, "summary.json"), {
    ...summary(rows),
    legacyReceiptsParsed: legacyRows.length,
    legacyReceiptParseErrors: legacyErrors.length,
    sourceDiscoveryRecords: discoveryRows.length,
    readOnly: true,
    completedAt: new Date().toISOString(),
  });
  await persist(rows.length, rows.length);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
