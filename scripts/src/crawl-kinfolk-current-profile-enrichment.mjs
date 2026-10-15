#!/usr/bin/env node
/**
 * Read-only, resumable first-party website crawler for Kinfolk Current profile
 * enrichment. It never calls a Mapping With Melanin write endpoint. It accepts
 * only the prior verified KEEP_ACTIVE website evidence, follows a small set of
 * same-site information pages, and writes compact page packets for structured
 * field extraction and later source-receipted review.
 *
 * Usage:
 *   node scripts/src/crawl-kinfolk-current-profile-enrichment.mjs \
 *     --input docs/directory-operations/kinfolk-current-online-presence-2026-10-15/presence-verification.jsonl \
 *     --out docs/directory-operations/kinfolk-current-profile-enrichment-2026-10-15
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import { assessIdentity, probePublicUrl } from "./verify-kinfolk-current-online-presence.mjs";

export const PROFILE_ENRICHMENT_CRAWLER_VERSION = "kinfolk-current-profile-enrichment-crawl-v1";
const DEFAULT_INPUT = "docs/directory-operations/kinfolk-current-online-presence-2026-10-15/presence-verification.jsonl";
const DEFAULT_OUT = "docs/directory-operations/kinfolk-current-profile-enrichment-2026-10-15";
const MAX_FOLLOWUP_PAGES = 3;
const PAGE_TEXT_LIMIT = 12_000;
const SOCIAL_HOSTS = Object.freeze({
  instagram: /(^|\.)instagram\.com$/i,
  facebook: /(^|\.)(facebook\.com|fb\.com)$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  twitter: /(^|\.)(twitter\.com|x\.com)$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
  pinterest: /(^|\.)pinterest\.com$/i,
});
const RELEVANT_PAGE_PATTERN = /(?:about|our-story|contact|location|hours|service|menu|price|booking|appointment|visit|faq)/i;

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function extractPageText(html, limit = PAGE_TEXT_LIMIT) {
  const scrubbed = String(html ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|section|article|header|footer|li|h[1-6]|br|tr|td|th)>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
  return cleanText(decodeHtml(scrubbed)).slice(0, limit);
}

function titleFromHtml(html) {
  return cleanText((String(html ?? "").match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1]
    ?.replace(/<[^>]+>/g, " "))?.slice(0, 300) ?? "";
}

function socialPlatform(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return Object.entries(SOCIAL_HOSTS).find(([, matcher]) => matcher.test(host))?.[0] ?? null;
  } catch {
    return null;
  }
}

function hrefCandidates(html) {
  const candidates = [];
  const anchorPattern = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of String(html ?? "").matchAll(anchorPattern)) {
    candidates.push({ href: decodeHtml(match[2]), text: cleanText(match[4].replace(/<[^>]*>/g, " ")) });
  }
  return candidates;
}

export function selectRelevantInternalUrls(html, homeUrl) {
  const home = new URL(homeUrl);
  const seen = new Set([home.toString()]);
  const selected = [];
  for (const candidate of hrefCandidates(html)) {
    let url;
    try { url = new URL(candidate.href, home); } catch { continue; }
    if (!/^https?:$/i.test(url.protocol) || url.origin !== home.origin) continue;
    url.hash = "";
    for (const [key] of [...url.searchParams]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    }
    const normalized = url.toString();
    const relevance = `${url.pathname} ${candidate.text}`;
    if (!RELEVANT_PAGE_PATTERN.test(relevance) || seen.has(normalized)) continue;
    seen.add(normalized);
    selected.push(normalized);
    if (selected.length >= MAX_FOLLOWUP_PAGES) break;
  }
  return selected;
}

export function extractOfficialSocialLinks(html, homeUrl) {
  const links = {};
  for (const candidate of hrefCandidates(html)) {
    let url;
    try { url = new URL(candidate.href, homeUrl); } catch { continue; }
    const platform = socialPlatform(url.toString());
    if (platform && !links[platform]) links[platform] = url.toString();
  }
  return links;
}

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function boundedInt(value, fallback, maximum) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

async function readJson(path, fallback) {
  try { return JSON.parse(await fs.readFile(path, "utf8")); } catch { return fallback; }
}

async function writeJson(path, value) {
  await fs.mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temporary, path);
}

async function sleep(milliseconds) {
  await new Promise((resolvePause) => setTimeout(resolvePause, milliseconds));
}

async function mapWithConcurrency(values, concurrency, worker, onProgress) {
  let cursor = 0;
  let complete = 0;
  async function runWorker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= values.length) return;
      await worker(values[index], index);
      complete += 1;
      if (complete % 10 === 0 || complete === values.length) await onProgress(complete, values.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(values.length, concurrency) }, runWorker));
}

function inputRecords(source) {
  return source.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
    .filter((row) => row?.website?.classification === "KEEP_ACTIVE" && row.website.normalizedUrl)
    .map((row) => ({
      businessId: String(row.businessId),
      businessName: String(row.businessName),
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      website: String(row.website.normalizedUrl),
      sourceSnapshot: row.sourceSnapshot ?? {},
      currentSnapshotHash: row.currentSnapshotHash ?? null,
      verifiedWebsiteEvidence: {
        classification: row.website.classification,
        reason: row.website.reason,
        checkedAt: row.website.probe?.checkedAt ?? null,
      },
    }));
}

function pagePacket(url, html, probe) {
  return {
    sourceUrl: url,
    title: titleFromHtml(html) || probe.document?.title || "",
    text: extractPageText(html),
    checkedAt: probe.checkedAt,
    httpStatus: probe.httpStatus ?? null,
  };
}

function summarize(rows) {
  const count = (predicate) => rows.filter(predicate).length;
  return {
    recordsSelected: rows.length,
    identityMatched: count((row) => row.disposition === "READY_FOR_EXTRACTION"),
    held: count((row) => row.disposition !== "READY_FOR_EXTRACTION"),
    withFollowupPages: count((row) => row.pages?.length > 1),
    withOfficialSocialLinks: count((row) => Object.keys(row.officialSocialLinks ?? {}).length > 0),
  };
}

function reportMarkdown(run, rows, outputDirectory) {
  const summary = summarize(rows);
  return `# Kinfolk Current Official-Site Profile Enrichment Crawl\n\n**Run:** ${run.runStartedAt}\n\nThis is a read-only first-party website crawl for active, identity-matched Kinfolk Current websites. It does not change a Mapping With Melanin record. The resulting page packets are only input to a later structured extraction and source-receipted production review.\n\n| Result | Count |\n|---|---:|\n| Verified active official websites selected | ${summary.recordsSelected.toLocaleString()} |\n| Ready for structured field extraction | ${summary.identityMatched.toLocaleString()} |\n| Held because the current site could not be safely re-read | ${summary.held.toLocaleString()} |\n| Records with relevant internal pages captured | ${summary.withFollowupPages.toLocaleString()} |\n| Records whose official website links an official social profile | ${summary.withOfficialSocialLinks.toLocaleString()} |\n\nThe crawler reads the home page and up to ${MAX_FOLLOWUP_PAGES} same-site pages whose paths or link text indicate About, Contact, Location, Hours, Services, Prices, Booking, or FAQ information. It never follows directory, marketplace, or cross-site links as business-profile evidence.\n\n**Evidence:** \`${outputDirectory}/profile-enrichment-pages.jsonl\`\n`;
}

async function main() {
  const inputPath = resolve(argValue("--input", DEFAULT_INPUT));
  const outputDirectory = resolve(argValue("--out", DEFAULT_OUT));
  const maxRecords = boundedInt(argValue("--max-records", "0"), 0, 100_000);
  const concurrency = boundedInt(argValue("--concurrency", "3"), 3, 4);
  const timeoutMs = boundedInt(argValue("--timeout-ms", "15000"), 15_000, 30_000);
  const resume = hasFlag("--resume");
  const source = await fs.readFile(inputPath, "utf8");
  const inputHash = createHash("sha256").update(source).digest("hex");
  const allRecords = inputRecords(source);
  const records = maxRecords > 0 ? allRecords.slice(0, maxRecords) : allRecords;
  if (!records.length) throw new Error("No verified active Kinfolk Current websites were found in the input evidence.");

  const checkpointPath = resolve(outputDirectory, "checkpoint.json");
  const cachePath = resolve(outputDirectory, "crawl-cache.json");
  const resultPath = resolve(outputDirectory, "profile-enrichment-pages.jsonl");
  const existingCheckpoint = await readJson(checkpointPath, null);
  if (resume && existingCheckpoint?.inputHash && existingCheckpoint.inputHash !== inputHash) {
    throw new Error("Refusing to resume profile enrichment against different website evidence.");
  }
  if (!resume && await fs.stat(resultPath).then(() => true).catch(() => false)) {
    throw new Error(`Output already exists: ${resultPath}. Use --resume or a new output directory.`);
  }

  await fs.mkdir(outputDirectory, { recursive: true });
  const cache = await readJson(cachePath, { records: {} });
  const completed = new Map(Object.entries(cache.records ?? {}));
  const pending = records.filter((record) => !completed.has(record.businessId));
  const run = {
    version: PROFILE_ENRICHMENT_CRAWLER_VERSION,
    inputPath,
    inputHash,
    allVerifiedActiveWebsites: allRecords.length,
    selectedRecords: records.length,
    concurrency,
    timeoutMs,
    readOnly: true,
    runStartedAt: existingCheckpoint?.runStartedAt ?? new Date().toISOString(),
  };
  const dnsCache = new Map();
  const persist = async (finished, total) => {
    await writeJson(cachePath, { version: PROFILE_ENRICHMENT_CRAWLER_VERSION, records: Object.fromEntries(completed) });
    await writeJson(checkpointPath, { ...run, completed: finished, total, updatedAt: new Date().toISOString(), status: finished === total ? "complete" : "running" });
    process.stdout.write(`${new Date().toISOString()} profile-enrichment crawl ${finished}/${total}\n`);
  };

  await mapWithConcurrency(pending, concurrency, async (record) => {
    const options = { dnsCache, timeoutMs, retryDelayMs: 900, includeHtml: true, maxHtmlBytes: 300_000 };
    const homeProbe = await probePublicUrl(record.website, options);
    if (homeProbe.state !== "available" || !homeProbe.html) {
      completed.set(record.businessId, { ...record, disposition: "HOLD_SITE_UNAVAILABLE", homeProbe, pages: [], officialSocialLinks: {}, completedAt: new Date().toISOString(), productionWrite: false });
      return;
    }
    const homeIdentity = assessIdentity({ businessName: record.businessName, finalUrl: homeProbe.finalUrl, document: homeProbe.document });
    if (homeIdentity.status !== "matched") {
      completed.set(record.businessId, { ...record, disposition: "HOLD_IDENTITY_RECHECK", homeProbe: { ...homeProbe, html: undefined }, identity: homeIdentity, pages: [], officialSocialLinks: {}, completedAt: new Date().toISOString(), productionWrite: false });
      return;
    }
    const homeUrl = homeProbe.finalUrl ?? record.website;
    const pages = [pagePacket(homeUrl, homeProbe.html, homeProbe)];
    const observedPageUrls = new Set(pages.map((page) => page.sourceUrl));
    const officialSocialLinks = extractOfficialSocialLinks(homeProbe.html, homeUrl);
    const followups = selectRelevantInternalUrls(homeProbe.html, homeUrl);
    for (const url of followups) {
      await sleep(100);
      const probe = await probePublicUrl(url, options);
      const finalUrl = probe.finalUrl ?? url;
      if (probe.state === "available" && probe.html && !observedPageUrls.has(finalUrl)) {
        pages.push(pagePacket(finalUrl, probe.html, probe));
        observedPageUrls.add(finalUrl);
      }
    }
    completed.set(record.businessId, {
      ...record,
      disposition: "READY_FOR_EXTRACTION",
      identity: homeIdentity,
      pages,
      officialSocialLinks,
      completedAt: new Date().toISOString(),
      productionWrite: false,
    });
    await sleep(150);
  }, persist);

  const rows = records.map((record) => completed.get(record.businessId)).filter(Boolean);
  await fs.writeFile(resultPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  await writeJson(resolve(outputDirectory, "summary.json"), { ...run, ...summarize(rows), completedAt: new Date().toISOString() });
  await fs.writeFile(resolve(outputDirectory, "REPORT.md"), reportMarkdown(run, rows, outputDirectory), "utf8");
  await persist(records.length, records.length);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
