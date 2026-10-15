#!/usr/bin/env node
/**
 * Read-only official-presence discovery for source-backed Black-owned records whose stored website is missing, inactive, or inconclusive. Search results discover candidate URLs;
 * they never become profile data without separate source review.
 *
 * Usage:
 *   node scripts/src/discover-kinfolk-current-official-presence.mjs \
 *     --input docs/directory-operations/kinfolk-current-online-presence-2026-10-15/presence-verification.jsonl \
 *     --out docs/directory-operations/kinfolk-current-official-discovery-2026-10-15
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  assessIdentity,
  normalizeHttpUrl,
  probePublicUrl,
} from "./verify-kinfolk-current-online-presence.mjs";

export const DISCOVERY_VERSION = "source-backed-official-discovery-v1";

const DEFAULT_INPUT = "data/operations/black-owned-source-presence-2026-10-15/verification/presence-verification.jsonl";
const DEFAULT_OUT = "data/operations/black-owned-source-presence-2026-10-15/discovery";
const MAX_CANDIDATES_PER_QUERY = 5;
const MAX_CANDIDATES_TO_VERIFY = 2;
const SEARCH_DELAY_MS = 500;
const DISCOVERY_USER_AGENT = "Mozilla/5.0 (compatible; MappingWithMelanin-OfficialPresenceDiscovery/1.0; +https://www.mappingwithmelanin.com)";
const SOCIAL_HOSTS = Object.freeze({
  instagram: /(^|\.)instagram\.com$/i,
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.watch)$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  twitter: /(^|\.)(twitter\.com|x\.com)$/i,
  youtube: /(^|\.)youtube\.com$/i,
  pinterest: /(^|\.)pinterest\.com$/i,
});
const DISCOVERY_ONLY_HOSTS = /(^|\.)(google\.com|bing\.com|duckduckgo\.com|yelp\.com|yellowpages\.com|tripadvisor\.com|mapquest\.com|foursquare\.com|findglocal\.com|loc8nearme\.com|facebook\.com\/pages|instagram\.com\/explore)$/i;
const DIRECTORY_OR_MARKETPLACE_HOSTS = /(^|\.)(yelp\.com|yellowpages\.com|tripadvisor\.com|mapquest\.com|foursquare\.com|doordash\.com|ubereats\.com|grubhub\.com|opentable\.com|etsy\.com|amazon\.com|findglocal\.com|loc8nearme\.com|corporateevents\.at|xhbt\.org)$/i;

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function boundedInt(value, fallback, maximum) {
  const numeric = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(numeric) && numeric > 0 ? Math.min(numeric, maximum) : fallback;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function canonicalKey(value) {
  return cleanText(value)
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

function stripHtml(value) {
  return cleanText(decodeHtml(String(value ?? "").replace(/<[^>]*>/g, " ")));
}

function resolveResultUrl(href) {
  try {
    const resolved = new URL(decodeHtml(href), "https://html.duckduckgo.com");
    const target = resolved.searchParams.get("uddg");
    return target ? decodeURIComponent(target) : resolved.toString();
  } catch {
    return null;
  }
}

/** Extract result title/url pairs from DuckDuckGo's public HTML response. */
export function extractDuckDuckGoResults(html) {
  const matches = [];
  const anchorPattern = /<a\b(?=[^>]*\bclass=["'][^"']*\bresult__a\b[^"']*["'])[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const url = resolveResultUrl(match[1]);
    const title = stripHtml(match[2]);
    if (url && title) matches.push({ url, title });
  }
  const seen = new Set();
  return matches.filter((candidate) => {
    const key = candidate.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readTextLimited(response, maxBytes = 900_000) {
  const buffer = new Uint8Array(await response.arrayBuffer());
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer.slice(0, maxBytes));
}

async function searchPublicWeb(query, timeoutMs) {
  const searchUrl = new URL("https://html.duckduckgo.com/html/");
  searchUrl.searchParams.set("q", query);
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(searchUrl, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent": DISCOVERY_USER_AGENT,
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "accept-language": "en-US,en;q=0.8",
      },
    });
    const html = await readTextLimited(response);
    if (!response.ok) {
      return { query, searchUrl: searchUrl.toString(), checkedAt, state: "search_error", httpStatus: response.status, results: [] };
    }
    return {
      query,
      searchUrl: searchUrl.toString(),
      checkedAt,
      state: "ok",
      httpStatus: response.status,
      results: extractDuckDuckGoResults(html).slice(0, 10),
    };
  } catch (error) {
    return {
      query,
      searchUrl: searchUrl.toString(),
      checkedAt,
      state: "search_error",
      reason: error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 400) : String(error).slice(0, 400),
      results: [],
    };
  }
}

function socialPlatform(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, "");
    return Object.entries(SOCIAL_HOSTS).find(([, matcher]) => matcher.test(hostname))?.[0] ?? null;
  } catch {
    return null;
  }
}

function validCandidateUrl(url) {
  const normalized = normalizeHttpUrl(url);
  if (!normalized.ok) return { ok: false, reason: normalized.reason, url: null };
  const hostname = new URL(normalized.normalized).hostname.replace(/^www\./i, "");
  if (DISCOVERY_ONLY_HOSTS.test(hostname)) return { ok: false, reason: "search_or_directory_host", url: normalized.normalized };
  return { ok: true, reason: null, url: normalized.normalized };
}

function titleMatchesBusiness(title, businessName) {
  const titleKey = canonicalKey(title);
  const nameKey = canonicalKey(businessName);
  if (!nameKey || nameKey.length < 5) return false;
  if (titleKey.includes(nameKey)) return true;
  const tokens = nameKey.split(" ").filter((token) => token.length >= 4 && !["llc", "inc", "company", "services", "service", "shop", "store"].includes(token));
  return tokens.length >= 2 && tokens.every((token) => titleKey.includes(token));
}

function locationMatches(document, city, state) {
  const text = canonicalKey([
    document?.title,
    document?.ogTitle,
    document?.h1,
    document?.textSample,
  ].filter(Boolean).join(" "));
  const cityKey = canonicalKey(city);
  const stateKey = canonicalKey(state);
  return Boolean(cityKey && text.includes(cityKey)) || Boolean(stateKey && stateKey.length === 2 && new RegExp(`\\b${stateKey}\\b`, "i").test(text));
}

async function evaluateCandidate(candidate, record, options) {
  const source = validCandidateUrl(candidate.url);
  if (!source.ok || !source.url) {
    return { ...candidate, state: "REJECTED", reason: source.reason, normalizedUrl: source.url };
  }
  const hostname = new URL(source.url).hostname.replace(/^www\./i, "");
  const platform = socialPlatform(source.url);
  if (DIRECTORY_OR_MARKETPLACE_HOSTS.test(hostname)) {
    return { ...candidate, state: "DISCOVERY_ONLY", reason: "directory_or_marketplace_not_official", normalizedUrl: source.url };
  }
  const probe = await probePublicUrl(source.url, options);
  if (platform) {
    const titleMatch = titleMatchesBusiness(candidate.title, record.businessName);
    const probeIdentity = probe.state === "available"
      ? assessIdentity({ businessName: record.businessName, finalUrl: probe.finalUrl, document: probe.document })
      : null;
    if (probeIdentity?.status === "matched") {
      return {
        ...candidate,
        platform,
        normalizedUrl: source.url,
        state: "MATCHED_SOCIAL_CANDIDATE",
        reason: "Public profile content has matching business identity signals.",
        probe,
        identity: probeIdentity,
      };
    }
    if (titleMatch && probe.state !== "unavailable") {
      return {
        ...candidate,
        platform,
        normalizedUrl: source.url,
        state: "SOCIAL_SEARCH_CANDIDATE_REVIEW",
        reason: "Search result title matches the business, but the social platform did not expose enough public identity evidence for automatic confirmation.",
        probe,
      };
    }
    return { ...candidate, platform, normalizedUrl: source.url, state: "AMBIGUOUS_SOCIAL", reason: "Social result cannot be reliably matched to the business.", probe };
  }
  if (probe.state !== "available") {
    return { ...candidate, normalizedUrl: source.url, state: "UNAVAILABLE_CANDIDATE", reason: `Candidate could not be verified (${probe.reason ?? probe.state}).`, probe };
  }
  const identity = assessIdentity({ businessName: record.businessName, finalUrl: probe.finalUrl, document: probe.document });
  if (identity.status === "matched" && locationMatches(probe.document, record.city, record.state)) {
    return {
      ...candidate,
      normalizedUrl: source.url,
      state: "MATCHED_WEBSITE_CANDIDATE",
      reason: "Public page matches the business name and the recorded city or state.",
      probe,
      identity,
    };
  }
  if (identity.status === "matched") {
    return { ...candidate, normalizedUrl: source.url, state: "WEBSITE_REVIEW_CANDIDATE", reason: "Business name matches, but location evidence needs human review.", probe, identity };
  }
  return { ...candidate, normalizedUrl: source.url, state: "AMBIGUOUS_WEBSITE", reason: "Candidate page did not establish a safe identity match.", probe, identity };
}

function candidateQueries(record) {
  const identity = [record.businessName, record.city, record.state].filter(Boolean).join(" ");
  return [
    identity,
    `${identity} Instagram Facebook TikTok`,
  ];
}

function recordDisposition(evaluations) {
  const matchedWebsite = evaluations.filter((row) => row.state === "MATCHED_WEBSITE_CANDIDATE");
  const reviewWebsite = evaluations.filter((row) => row.state === "WEBSITE_REVIEW_CANDIDATE");
  const matchedSocial = evaluations.filter((row) => row.state === "MATCHED_SOCIAL_CANDIDATE");
  const reviewSocial = evaluations.filter((row) => row.state === "SOCIAL_SEARCH_CANDIDATE_REVIEW");
  if ((matchedWebsite.length || reviewWebsite.length) && (matchedSocial.length || reviewSocial.length)) return { disposition: "WEBSITE_AND_SOCIAL_FOUND_REVIEW", reason: "New official-presence candidates need a fresh record review before any save." };
  if (matchedWebsite.length) return { disposition: "WEBSITE_FOUND_REVIEW", reason: "A website candidate matches the business and location; it is not automatically written." };
  if (reviewWebsite.length) return { disposition: "WEBSITE_FOUND_REVIEW", reason: "A website candidate matches the business name but still needs location review; it is not automatically written." };
  if (matchedSocial.length || reviewSocial.length) return { disposition: "SOCIAL_FOUND_REVIEW", reason: "A social candidate was found; official identity still requires review before any save." };
  if (evaluations.some((row) => row.state === "UNAVAILABLE_CANDIDATE" || row.state === "AMBIGUOUS_WEBSITE" || row.state === "AMBIGUOUS_SOCIAL")) {
    return { disposition: "HOLD_AMBIGUOUS", reason: "Search produced candidates but did not establish a safe official match." };
  }
  return { disposition: "NO_SAFE_CANDIDATE", reason: "No non-directory candidate could be safely matched from this pass." };
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
      const current = cursor;
      cursor += 1;
      if (current >= values.length) return;
      await worker(values[current], current);
      complete += 1;
      if (complete % 10 === 0 || complete === values.length) await onProgress(complete, values.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, runWorker));
}

function summarize(results) {
  const count = (selector) => results.filter(selector).length;
  return {
    recordsExamined: results.length,
    websiteFoundForReview: count((row) => row.disposition.disposition === "WEBSITE_FOUND_REVIEW" || row.disposition.disposition === "WEBSITE_AND_SOCIAL_FOUND_REVIEW"),
    socialFoundForReview: count((row) => row.disposition.disposition === "SOCIAL_FOUND_REVIEW" || row.disposition.disposition === "WEBSITE_AND_SOCIAL_FOUND_REVIEW"),
    ambiguous: count((row) => row.disposition.disposition === "HOLD_AMBIGUOUS"),
    noSafeCandidate: count((row) => row.disposition.disposition === "NO_SAFE_CANDIDATE"),
  };
}

function reportMarkdown({ run, results, outputDirectory }) {
  const summary = summarize(results);
  return `# Source-Backed Black-Owned Official-Presence Discovery\n\n**Run:** ${run.runStartedAt}\n\nThis is a read-only discovery pass for records whose stored website is missing, inactive, or inconclusive. Search results are only leads. No candidate URL is written to a Mapping with Melanin profile by this process.\n\n| Result | Count |\n|---|---:|\n| Missing, inactive, or inconclusive records examined | ${summary.recordsExamined.toLocaleString()} |\n| Website candidates found for review | ${summary.websiteFoundForReview.toLocaleString()} |\n| Social candidates found for review | ${summary.socialFoundForReview.toLocaleString()} |\n| Ambiguous candidates held | ${summary.ambiguous.toLocaleString()} |\n| No safe candidate from this pass | ${summary.noSafeCandidate.toLocaleString()} |\n\n## Operating rules\n\n- A search result is never treated as an official website or official social profile by itself.\n- Directory, marketplace, and generic search hosts are discovery-only and cannot become profile fields.\n- A website candidate requires accessible page-level business identity and city/state support before it is offered for review.\n- A social result that cannot expose enough public identity evidence is held as a review candidate, not saved automatically.\n- The process makes no production changes to business fields, ownership, eligibility, pins, visibility, or records.\n\n## Evidence\n\n- Per-record discovery evidence: \`${outputDirectory}/official-presence-discovery.jsonl\`\n- Resumable checkpoint and search cache: \`${outputDirectory}/checkpoint.json\` and \`${outputDirectory}/discovery-cache.json\`\n`;
}

async function main() {
  const inputPath = resolve(argValue("--input", DEFAULT_INPUT));
  const outputDirectory = resolve(argValue("--out", DEFAULT_OUT));
  const maxRecords = boundedInt(argValue("--max-records", "0"), 0, 100_000);
  const concurrency = boundedInt(argValue("--concurrency", "3"), 3, 4);
  const timeoutMs = boundedInt(argValue("--timeout-ms", "12000"), 12_000, 30_000);
  const resume = hasFlag("--resume");
  const source = await fs.readFile(inputPath, "utf8");
  const inputHash = createHash("sha256").update(source).digest("hex");
  const allRecords = source.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
    .filter((row) => ["MISSING", "REMOVE_CONFIRMED_INACTIVE", "HOLD_INCONCLUSIVE"].includes(row?.website?.classification))
    .map((row) => ({
      businessId: row.businessId,
      businessName: row.businessName,
      city: row.city,
      state: row.state,
      originalLinks: row.originalLinks,
      sourceSnapshot: row.sourceSnapshot,
      currentSnapshotHash: row.currentSnapshotHash,
      priorWebsiteReason: row.website.reason,
    }));
  const records = maxRecords > 0 ? allRecords.slice(0, maxRecords) : allRecords;
  if (!records.length) throw new Error("No missing, inactive, or inconclusive website records found in input evidence.");
  const checkpointPath = resolve(outputDirectory, "checkpoint.json");
  const cachePath = resolve(outputDirectory, "discovery-cache.json");
  const resultsPath = resolve(outputDirectory, "official-presence-discovery.jsonl");
  const existingCheckpoint = await readJson(checkpointPath, null);
  if (resume && existingCheckpoint?.inputHash && existingCheckpoint.inputHash !== inputHash) {
    throw new Error("Refusing to resume against a different evidence input. Use a new output folder.");
  }
  if (!resume && await fs.stat(resultsPath).then(() => true).catch(() => false)) {
    throw new Error(`Output already exists: ${resultsPath}. Use --resume or a new output folder.`);
  }
  await fs.mkdir(outputDirectory, { recursive: true });
  const cache = await readJson(cachePath, { records: {} });
  const completed = new Map(Object.entries(cache.records ?? {}));
  const pending = records.filter((record) => !completed.has(record.businessId));
  const run = {
    version: DISCOVERY_VERSION,
    inputPath,
    inputHash,
    allRecoverableWebsiteRecords: allRecords.length,
    selectedRecords: records.length,
    concurrency,
    timeoutMs,
    readOnly: true,
    runStartedAt: existingCheckpoint?.runStartedAt ?? new Date().toISOString(),
  };
  const options = { dnsCache: new Map(), timeoutMs, retryDelayMs: 900 };
  const persist = async (finished, total) => {
    await writeJson(cachePath, { version: DISCOVERY_VERSION, records: Object.fromEntries(completed) });
    await writeJson(checkpointPath, { ...run, completed: finished, total, updatedAt: new Date().toISOString(), status: finished === total ? "complete" : "running" });
    process.stdout.write(`${new Date().toISOString()} discovery ${finished}/${total}\n`);
  };
  await mapWithConcurrency(pending, concurrency, async (record) => {
    const searches = [];
    const firstQuery = candidateQueries(record)[0];
    const first = await searchPublicWeb(firstQuery, timeoutMs);
    searches.push(first);
    let candidates = first.results.slice(0, MAX_CANDIDATES_PER_QUERY);
    const firstHasPromising = candidates.some((candidate) => {
      const valid = validCandidateUrl(candidate.url);
      return valid.ok
        && !DIRECTORY_OR_MARKETPLACE_HOSTS.test(new URL(valid.url).hostname.replace(/^www\./i, ""))
        && titleMatchesBusiness(candidate.title, record.businessName);
    });
    if (!firstHasPromising) {
      await sleep(SEARCH_DELAY_MS);
      const secondary = await searchPublicWeb(candidateQueries(record)[1], timeoutMs);
      searches.push(secondary);
      candidates = [...candidates, ...secondary.results.slice(0, MAX_CANDIDATES_PER_QUERY)];
    }
    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const normalized = normalizeHttpUrl(candidate.url);
      const key = normalized.ok ? normalized.normalized : candidate.url;
      if (!seen.has(key)) { seen.add(key); unique.push(candidate); }
    }
    const identityRelevant = unique.filter((candidate) => titleMatchesBusiness(candidate.title, record.businessName));
    const candidatesToVerify = (identityRelevant.length ? identityRelevant : unique)
      .slice(0, MAX_CANDIDATES_TO_VERIFY);
    const evaluations = [];
    for (const candidate of candidatesToVerify) {
      evaluations.push(await evaluateCandidate(candidate, record, options));
      await sleep(150);
    }
    completed.set(record.businessId, {
      schemaVersion: DISCOVERY_VERSION,
      ...record,
      searches,
      candidates: evaluations,
      disposition: recordDisposition(evaluations),
      completedAt: new Date().toISOString(),
      productionWrite: false,
    });
    await sleep(SEARCH_DELAY_MS);
  }, async (finished, total) => persist(completed.size, records.length));
  const resultRows = records.map((record) => completed.get(record.businessId)).filter(Boolean);
  await fs.writeFile(resultsPath, `${resultRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  await writeJson(resolve(outputDirectory, "summary.json"), { ...run, ...summarize(resultRows), completedAt: new Date().toISOString() });
  await fs.writeFile(resolve(outputDirectory, "REPORT.md"), reportMarkdown({ run, results: resultRows, outputDirectory }), "utf8");
  await persist(records.length, records.length);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
