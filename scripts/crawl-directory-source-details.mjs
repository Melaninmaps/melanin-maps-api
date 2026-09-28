#!/usr/bin/env node
/**
 * Source-directory detail and official-site audit.
 *
 * This is an evidence collector only: it never connects to the app database,
 * changes the protected candidate manifest, or publishes a business. It keeps
 * each source-record receipt intact and writes JSONL evidence that a separate,
 * reviewed reconciliation can merge only as missing factual fields.
 *
 * Usage:
 *   node scripts/crawl-directory-source-details.mjs \
 *     --input-dir /home/ubuntu/mwm-audits/directory-source-extraction \
 *     --out /home/ubuntu/mwm-audits/directory-source-extraction/deep-crawl-v1.jsonl
 */
import { createHash } from "node:crypto";
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_INPUT = "/home/ubuntu/mwm-audits/directory-source-extraction";
const DEFAULT_OUTPUT = "/home/ubuntu/mwm-audits/directory-source-extraction/deep-crawl-v1.jsonl";
const DEFAULT_REPORT = "/home/ubuntu/mwm-audits/directory-source-extraction/DEEP_CRAWL_V1_REPORT.json";
const PLATFORM_HOSTS = Object.freeze({
  tiktok: /(^|\.)tiktok\.com$/i,
  instagram: /(^|\.)instagram\.com$/i,
  facebook: /(^|\.)facebook\.com$/i,
  youtube: /(^|\.)youtube\.com$/i,
});
const SKIP_SOCIAL_PATH = /(?:sharer|share\?|intent\/tweet|dialog\/share|plugins\/like|\/login|\/privacy|\/terms)/i;
const GENERIC_DESCRIPTION = /(?:black[- ]owned business directory|business directory|listing categor(?:y|ies)|all businesses|search listings|submit (?:a )?business|powered by|copyright|find businesses)/i;

function option(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function has(name) { return process.argv.includes(name); }
function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}
function safeText(value, max = 4000) {
  if (typeof value !== "string") return null;
  const normalized = decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ").trim();
  return normalized && normalized.length <= max ? normalized : normalized ? normalized.slice(0, max) : null;
}
function decodeEntities(value) {
  return value.replace(/&(?:amp|#38);/gi, "&")
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}
function normalizedHttpUrl(value, base) {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim().replace(/^www\./i, "https://www.");
  try {
    const result = new URL(raw, base);
    return result.protocol === "http:" || result.protocol === "https:" ? result.toString() : null;
  } catch { return null; }
}
function hostFor(url) {
  try { return new URL(url).hostname.replace(/^www\./i, "").toLowerCase(); } catch { return ""; }
}
function sameDomain(left, right) { return hostFor(left) && hostFor(left) === hostFor(right); }
function sourceHash(value) { return createHash("sha256").update(value).digest("hex"); }
function stripUrlFragment(url) { try { const parsed = new URL(url); parsed.hash = ""; return parsed.toString(); } catch { return url; } }
function extractAttributeTag(html, selector) {
  const match = html.match(selector);
  return match?.[1] ? decodeEntities(match[1]).trim() : null;
}
function extractTitle(html) {
  return safeText(extractAttributeTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i), 500);
}
function extractMetaDescription(html) {
  const matches = [...html.matchAll(/<meta\b[^>]*(?:name|property)\s*=\s*["']?(?:description|og:description)["']?[^>]*>/gi)];
  for (const match of matches) {
    const content = match[0].match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    const text = safeText(content, 2000);
    if (text) return text;
  }
  return null;
}
function jsonLdObjects(html) {
  const results = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const visit = (node) => {
        if (Array.isArray(node)) return node.forEach(visit);
        if (node && typeof node === "object") {
          results.push(node);
          if (node["@graph"]) visit(node["@graph"]);
        }
      };
      visit(parsed);
    } catch { /* malformed source JSON-LD remains non-fatal evidence */ }
  }
  return results;
}
function descriptionFromJsonLd(html, expectedName) {
  const normalizedName = (expectedName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const item of jsonLdObjects(html)) {
    const type = Array.isArray(item["@type"]) ? item["@type"].join(" ") : String(item["@type"] ?? "");
    const candidateName = typeof item.name === "string" ? item.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    const candidate = safeText(item.description, 2000);
    const businessLike = /(?:localbusiness|organization|restaurant|store|service|professionalservice|healthandbeautybusiness)/i.test(type);
    if (candidate && businessLike && (!normalizedName || candidateName.includes(normalizedName) || normalizedName.includes(candidateName))) return candidate;
  }
  return null;
}
function usableDescription(value, sourceLabel) {
  const text = safeText(value, 2000);
  if (!text || text.length < 30 || GENERIC_DESCRIPTION.test(text)) return null;
  if (sourceLabel && text.toLowerCase() === sourceLabel.toLowerCase()) return null;
  return text;
}
function extractLinks(html, baseUrl) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>/gis)) {
    const url = normalizedHttpUrl(decodeEntities(match[2]), baseUrl);
    if (url) links.push(stripUrlFragment(url));
  }
  return [...new Set(links)];
}
function extractSocialLinks(html, baseUrl) {
  const found = {};
  for (const url of extractLinks(html, baseUrl)) {
    if (SKIP_SOCIAL_PATH.test(url)) continue;
    const host = hostFor(url);
    for (const [platform, pattern] of Object.entries(PLATFORM_HOSTS)) {
      if (pattern.test(host) && !found[platform]) found[platform] = url;
    }
  }
  return found;
}
function internalPriorityLinks(html, websiteUrl) {
  return extractLinks(html, websiteUrl)
    .filter((url) => sameDomain(url, websiteUrl))
    .filter((url) => /(?:about|contact|visit|connect|location)/i.test(new URL(url).pathname))
    .slice(0, 2);
}
function meaningfulOfficialPage(result, businessName) {
  if (!result || result.status < 200 || result.status >= 400) return false;
  const normalized = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const sample = `${result.title ?? ""} ${result.description ?? ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized.length >= 4 && (sample.includes(normalized) || normalized.includes(sample.slice(0, normalized.length)));
}
function sourceListingLooksLikeDetail(url, html, businessName) {
  if (!url || !html) return false;
  const parsed = new URL(url);
  // Search, category, map, and landing paths can contain a business name in a
  // result card, but they are not the individual business-detail page required
  // for a provenance-quality contact/description claim.
  if (/(?:\/(?:search|listing-categor(?:y|ies)|listing-location|directory|businesses?)\/?$|[?&](?:s|search|keyword|geodir_search)=)/i.test(`${parsed.pathname}${parsed.search}`)) {
    return false;
  }
  const normalizedName = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedPage = html.slice(0, 250_000).toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalizedName.length >= 4 && normalizedPage.includes(normalizedName);
}
async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "MappingWithMelanin-directory-audit/1.0 (+https://www.mappingwithmelanin.com)",
        accept: "text/html,application/xhtml+xml,application/pdf;q=0.7,*/*;q=0.2",
      },
    });
    const type = response.headers.get("content-type") ?? "";
    const text = /(?:text\/html|application\/xhtml\+xml)/i.test(type)
      ? await response.text()
      : "";
    return { requestedUrl: url, finalUrl: response.url || url, status: response.status, contentType: type, text, error: null };
  } catch (error) {
    return { requestedUrl: url, finalUrl: null, status: null, contentType: null, text: "", error: error instanceof Error ? error.name : "fetch_failed" };
  } finally { clearTimeout(timer); }
}
function createScheduler(concurrency, domainPauseMs) {
  let active = 0;
  const queue = [];
  const lastByDomain = new Map();
  const pump = () => {
    while (active < concurrency && queue.length) {
      const task = queue.shift();
      active += 1;
      void (async () => {
        const domain = hostFor(task.url);
        const wait = Math.max(0, (lastByDomain.get(domain) ?? 0) + domainPauseMs - Date.now());
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
        lastByDomain.set(domain, Date.now());
        try { task.resolve(await fetchText(task.url, task.timeoutMs)); }
        catch (error) { task.reject(error); }
        finally { active -= 1; pump(); }
      })();
    }
  };
  return (url, timeoutMs) => new Promise((resolve, reject) => { queue.push({ url, timeoutMs, resolve, reject }); pump(); });
}
function memoizeFetch(fetcher) {
  const cache = new Map();
  return (url, timeoutMs) => {
    const key = stripUrlFragment(url);
    if (!cache.has(key)) cache.set(key, fetcher(key, timeoutMs));
    return cache.get(key);
  };
}
function relevantRecords(inputDir) {
  return fs.readdir(inputDir).then(async (names) => {
    const sourceFiles = names
      .filter((name) => /^\d{2}-.*\.json$/i.test(name))
      .filter((name) => !/-(?:full|sample)\.json$/i.test(name))
      .sort();
    const byReceipt = new Map();
    for (const name of sourceFiles) {
      const parsed = JSON.parse(await fs.readFile(path.join(inputDir, name), "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${name} is not an array.`);
      for (const row of parsed) {
        if (row && typeof row.sourceRecordKey === "string" && !byReceipt.has(row.sourceRecordKey)) {
          byReceipt.set(row.sourceRecordKey, { ...row, sourceArtifact: name });
        }
      }
    }
    return [...byReceipt.values()].sort((a, b) => String(a.sourceRecordKey).localeCompare(String(b.sourceRecordKey)));
  });
}
async function auditRecord(record, scheduledFetch, options) {
  const listingUrl = normalizedHttpUrl(record.sourceListingUrl ?? record.sourceUrl);
  const websiteUrl = normalizedHttpUrl(record.officialUrl);
  const listing = listingUrl ? await scheduledFetch(listingUrl, options.timeoutMs) : null;
  const listingHtml = listing?.text ?? "";
  const listingIsDetail = Boolean(listing && listing.status >= 200 && listing.status < 400 &&
    sourceListingLooksLikeDetail(listing.finalUrl ?? listingUrl, listingHtml, record.name));
  const listingDescription = usableDescription(
    listingIsDetail
      ? descriptionFromJsonLd(listingHtml, record.name) ?? extractMetaDescription(listingHtml)
      : null,
    record.sourceLabel,
  );
  const listingSocial = listingIsDetail && listing
    ? extractSocialLinks(listingHtml, listing.finalUrl ?? listingUrl)
    : {};
  const websitePages = [];
  let websiteSocial = {};
  let officialWebsiteStatus = "website_not_provided";
  if (websiteUrl && options.withWebsites) {
    const home = await scheduledFetch(websiteUrl, options.timeoutMs);
    const homeDetails = {
      requestedUrl: home.requestedUrl,
      finalUrl: home.finalUrl,
      status: home.status,
      title: extractTitle(home.text),
      description: extractMetaDescription(home.text),
      error: home.error,
    };
    websitePages.push(homeDetails);
    if (meaningfulOfficialPage({ ...homeDetails, status: home.status }, record.name)) {
      officialWebsiteStatus = "official_site_readable";
      websiteSocial = extractSocialLinks(home.text, home.finalUrl ?? websiteUrl);
      const followUps = internalPriorityLinks(home.text, home.finalUrl ?? websiteUrl);
      for (const followUp of followUps) {
        const page = await scheduledFetch(followUp, options.timeoutMs);
        websitePages.push({
          requestedUrl: page.requestedUrl,
          finalUrl: page.finalUrl,
          status: page.status,
          title: extractTitle(page.text),
          description: extractMetaDescription(page.text),
          error: page.error,
        });
        websiteSocial = { ...extractSocialLinks(page.text, page.finalUrl ?? followUp), ...websiteSocial };
      }
    } else {
      officialWebsiteStatus = home.status && home.status < 400 ? "website_identity_not_confirmed" : "website_failed_check";
    }
  }
  const socials = { ...listingSocial, ...websiteSocial };
  const detailStatus = listingIsDetail
    ? "detail_page_readable"
    : listing?.status && listing.status >= 200 && listing.status < 400
      ? "detail_page_not_specific"
      : listingUrl ? "detail_page_failed" : "detail_page_not_provided";
  const description = listingDescription;
  const socialStatus = Object.keys(socials).length
    ? "DIRECT_SOCIAL_VERIFIED"
    : websiteUrl && officialWebsiteStatus === "official_site_readable"
      ? "PENDING_DIRECT_SOCIAL_SEARCH"
      : "SOCIAL_NOT_FOUND_AFTER_SOURCE_AND_SITE_AUDIT";
  const evidence = {
    sourceRecordKey: record.sourceRecordKey,
    sourceArtifact: record.sourceArtifact,
    sourceLabel: record.sourceLabel,
    sourceUrl: record.sourceUrl,
    sourceListingUrl: listingUrl,
    name: record.name,
    city: record.city,
    state: record.state,
    ownershipDesignations: record.ownershipDesignations,
    ownershipEvidence: record.ownershipEvidence,
    capturedAt: new Date().toISOString(),
    crawlStatus: detailStatus,
    parseStatus: description ? "business_specific_description_found" : "description_not_found_or_generic",
    activeSignal: listingIsDetail ? "current_first_party_directory_detail" : null,
    sourceDescription: description,
    sourceSocialUrls: socials,
    officialWebsite: websiteUrl,
    officialWebsiteStatus,
    socialStatus,
    listingEvidence: listing ? {
      requestedUrl: listing.requestedUrl,
      finalUrl: listing.finalUrl,
      status: listing.status,
      title: extractTitle(listing.text),
      metaDescription: extractMetaDescription(listing.text),
      error: listing.error,
    } : null,
    officialSiteEvidence: websitePages,
  };
  return { ...evidence, evidenceHash: sourceHash(JSON.stringify(evidence)) };
}

async function main() {
  const inputDir = path.resolve(option("--input-dir", DEFAULT_INPUT));
  const output = path.resolve(option("--out", DEFAULT_OUTPUT));
  const reportPath = path.resolve(option("--report", DEFAULT_REPORT));
  const limit = positiveInteger(option("--limit"), Number.POSITIVE_INFINITY);
  const concurrency = positiveInteger(option("--concurrency"), 4);
  const domainPauseMs = positiveInteger(option("--domain-pause-ms"), 350);
  const timeoutMs = positiveInteger(option("--timeout-ms"), 15_000);
  const withWebsites = !has("--skip-websites");
  const records = (await relevantRecords(inputDir)).slice(0, limit);
  await fs.mkdir(path.dirname(output), { recursive: true });
  const stream = createWriteStream(output, { flags: "w" });
  const scheduledFetch = memoizeFetch(createScheduler(concurrency, domainPauseMs));
  const summary = {
    crawler: "directory-source-detail-v1",
    startedAt: new Date().toISOString(),
    inputDir,
    output,
    totalReceipts: records.length,
    withWebsites,
    concurrency,
    domainPauseMs,
    complete: 0,
    detailPageReadable: 0,
    descriptionsFound: 0,
    socialsFound: 0,
    websiteReadable: 0,
    socialPendingDirectSearch: 0,
    failures: 0,
  };
  let next = 0;
  const worker = async () => {
    while (next < records.length) {
      const index = next++;
      const evidence = await auditRecord(records[index], scheduledFetch, { timeoutMs, withWebsites });
      stream.write(`${JSON.stringify(evidence)}\n`);
      summary.complete += 1;
      if (evidence.crawlStatus === "detail_page_readable") summary.detailPageReadable += 1;
      if (evidence.sourceDescription) summary.descriptionsFound += 1;
      if (Object.keys(evidence.sourceSocialUrls).length) summary.socialsFound += 1;
      if (evidence.officialWebsiteStatus === "official_site_readable") summary.websiteReadable += 1;
      if (evidence.socialStatus === "PENDING_DIRECT_SOCIAL_SEARCH") summary.socialPendingDirectSearch += 1;
      if (evidence.crawlStatus === "detail_page_failed") summary.failures += 1;
      if (summary.complete % 25 === 0 || summary.complete === records.length) {
        process.stdout.write(JSON.stringify({ progress: summary.complete, total: records.length, descriptionsFound: summary.descriptionsFound, socialsFound: summary.socialsFound, failures: summary.failures }) + "\n");
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, records.length) }, worker));
  await new Promise((resolve, reject) => stream.end((error) => error ? reject(error) : resolve()));
  summary.finishedAt = new Date().toISOString();
  await fs.writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
main().catch((error) => { console.error(error instanceof Error ? error.stack : String(error)); process.exitCode = 1; });
