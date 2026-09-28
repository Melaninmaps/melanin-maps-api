#!/usr/bin/env node
/**
 * Converts reviewed detail-crawl JSONL evidence into a source-artifact array
 * that can be merged by assemble-source-backed-directory-candidates.ts.
 *
 * The output never creates an identity, designation, category, address,
 * website, or description from inference. It only attaches a crawler-proven
 * detail-page description and direct official social URLs to the original
 * source receipt with the same sourceRecordKey.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_INPUT_DIR = "/home/ubuntu/mwm-audits/directory-source-extraction";
const DEFAULT_CRAWL = "/home/ubuntu/mwm-audits/directory-source-extraction/source-detail-crawl-2026-09-28.jsonl";
const DEFAULT_OUTPUT = "/home/ubuntu/mwm-audits/directory-source-extraction/46-deep-crawl-evidence.json";
const DIRECT_PLATFORMS = new Set(["tiktok", "instagram", "facebook", "youtube"]);

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
function isDirectSocials(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([platform, url]) => DIRECT_PLATFORMS.has(platform) && typeof url === "string" && /^https?:\/\//i.test(url)));
}
async function originalReceipts(inputDir) {
  const files = (await fs.readdir(inputDir))
    .filter((name) => /^\d{2}-.*\.json$/i.test(name))
    .filter((name) => !/-(?:full|sample)\.json$/i.test(name))
    .sort();
  const rows = new Map();
  for (const file of files) {
    const parsed = JSON.parse(await fs.readFile(path.join(inputDir, file), "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`${file} is not a JSON array.`);
    for (const row of parsed) {
      if (typeof row?.sourceRecordKey === "string" && !rows.has(row.sourceRecordKey)) rows.set(row.sourceRecordKey, row);
    }
  }
  return rows;
}
async function crawlEvidence(file) {
  const rows = new Map();
  const text = await fs.readFile(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (typeof row?.sourceRecordKey === "string") rows.set(row.sourceRecordKey, row);
  }
  return rows;
}
async function main() {
  const inputDir = path.resolve(option("--input-dir", DEFAULT_INPUT_DIR));
  const crawlPath = path.resolve(option("--crawl", DEFAULT_CRAWL));
  const output = path.resolve(option("--out", DEFAULT_OUTPUT));
  const sourceRows = await originalReceipts(inputDir);
  const evidenceRows = await crawlEvidence(crawlPath);
  const missingEvidence = [];
  const records = [];
  let withDescription = 0;
  let withSocial = 0;
  for (const [key, source] of sourceRows) {
    const evidence = evidenceRows.get(key);
    if (!evidence) { missingEvidence.push(key); continue; }
    const description = evidence.crawlStatus === "detail_page_readable" && typeof evidence.sourceDescription === "string"
      ? evidence.sourceDescription.trim() || null
      : null;
    const socialLinks = evidence.crawlStatus === "detail_page_readable"
      ? isDirectSocials(evidence.sourceSocialUrls)
      : {};
    if (description) withDescription += 1;
    if (Object.keys(socialLinks).length) withSocial += 1;
    // The original source row is the immutable identity/designation receipt.
    // Add only evidence fields that were directly observed on the listing page.
    records.push({
      ...source,
      sourceDescription: description,
      socialLinks: Object.keys(socialLinks).length ? socialLinks : null,
      detailCrawlEvidence: {
        crawler: "directory-source-detail-v1",
        capturedAt: evidence.capturedAt,
        detailUrl: evidence.sourceListingUrl,
        detailStatus: evidence.crawlStatus,
        detailEvidenceHash: evidence.evidenceHash,
        socialStatus: evidence.socialStatus,
      },
    });
  }
  if (missingEvidence.length) throw new Error(`Missing deep-crawl evidence for ${missingEvidence.length} source receipts.`);
  await fs.writeFile(output, `${JSON.stringify(records, null, 2)}\n`);
  const report = {
    output,
    totalSourceReceipts: sourceRows.size,
    deepCrawlEvidenceRows: evidenceRows.size,
    mergedRows: records.length,
    descriptionsAdded: withDescription,
    socialProfilesAdded: withSocial,
    missingEvidence: missingEvidence.length,
  };
  await fs.writeFile(output.replace(/\.json$/i, ".report.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
main().catch((error) => { console.error(error instanceof Error ? error.stack : String(error)); process.exitCode = 1; });
