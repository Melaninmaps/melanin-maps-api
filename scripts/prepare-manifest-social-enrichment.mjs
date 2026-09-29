#!/usr/bin/env node
/**
 * Converts a targeted official-site crawl into source-candidate rows that can
 * be safely re-read by assemble-source-backed-directory-candidates.ts.
 *
 * The input candidate file is the exact manifest-backed target set. Output
 * contains only candidates whose existing record can be enriched by either:
 *   - a direct social URL visibly linked from a readable official site or
 *     source-directory detail page; or
 *   - a business-specific description from that same verified evidence.
 *
 * This utility never creates identities, ownership designations, categories,
 * addresses, websites, or inferred social profiles. Receipt keys must match
 * exactly, and all crawl receipts stay outside the application database for
 * review.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const DIRECT_PLATFORMS = new Set(["facebook", "instagram", "tiktok", "youtube"]);
const SOCIAL_HOSTS = Object.freeze({
  facebook: /(^|\.)facebook\.com$/i,
  instagram: /(^|\.)instagram\.com$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  youtube: /(^|\.)youtube\.com$/i,
});

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function directSocialLinks(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([platform, url]) =>
      DIRECT_PLATFORMS.has(platform)
      && typeof url === "string"
      && /^https?:\/\//i.test(url),
    ),
  );
}

function directSocialFromVerifiedOfficialUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return {};
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./i, "");
    const profilePath = parsed.pathname.replace(/\/+$/, "");
    // The source has already verified this as the business's official URL, but
    // require a meaningful profile path so generic platform homes or searches
    // can never be represented as a business social account.
    if (!profilePath || profilePath === "/" || /(?:\/search|\/login|\/share|\/sharer|\/privacy|\/terms)$/i.test(profilePath)) return {};
    for (const [platform, matcher] of Object.entries(SOCIAL_HOSTS)) {
      if (matcher.test(host)) return { [platform]: parsed.toString() };
    }
  } catch {
    // A malformed value is not usable evidence.
  }
  return {};
}

function nonEmptyDescription(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length >= 30 ? normalized : null;
}

async function readJsonArray(file, label) {
  const parsed = JSON.parse(await fs.readFile(file, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
  return parsed;
}

async function readJsonl(file) {
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
  const sourcePath = path.resolve(option("--source", ""));
  const crawlPath = path.resolve(option("--crawl", ""));
  const outputPath = path.resolve(option("--out", ""));
  if (!sourcePath || !crawlPath || !outputPath) {
    throw new Error("Usage: --source <candidate-array.json> --crawl <evidence.jsonl> --out <enriched-candidates.json>");
  }

  const candidates = await readJsonArray(sourcePath, "Source candidate input");
  const sourceByReceipt = new Map();
  for (const candidate of candidates) {
    if (!candidate || typeof candidate.sourceRecordKey !== "string") {
      throw new Error("Every source candidate must include sourceRecordKey.");
    }
    if (sourceByReceipt.has(candidate.sourceRecordKey)) {
      throw new Error(`Duplicate source receipt in target input: ${candidate.sourceRecordKey}`);
    }
    sourceByReceipt.set(candidate.sourceRecordKey, candidate);
  }

  const crawlByReceipt = await readJsonl(crawlPath);
  const missingEvidence = [...sourceByReceipt.keys()].filter((key) => !crawlByReceipt.has(key));
  if (missingEvidence.length) {
    throw new Error(`Missing crawl evidence for ${missingEvidence.length} targeted source receipts.`);
  }

  const enriched = [];
  let descriptionsAdded = 0;
  let socialsAdded = 0;
  let officialSiteDescriptions = 0;
  for (const [key, source] of sourceByReceipt) {
    const evidence = crawlByReceipt.get(key);
    const discoveredSocial = {
      ...directSocialFromVerifiedOfficialUrl(source.officialUrl),
      ...directSocialLinks(evidence?.sourceSocialUrls),
    };
    const sourceDescription = nonEmptyDescription(evidence?.sourceDescription);
    const canUseDescription = evidence?.descriptionOrigin === "source_directory_detail"
      || (evidence?.descriptionOrigin === "official_site" && evidence?.officialWebsiteStatus === "official_site_readable");
    const existingSocial = directSocialLinks(source.socialLinks);
    const socialLinks = { ...discoveredSocial, ...existingSocial };
    const description = nonEmptyDescription(source.sourceDescription) ?? (canUseDescription ? sourceDescription : null);
    const changedSocial = Object.keys(socialLinks).length > Object.keys(existingSocial).length;
    const changedDescription = !nonEmptyDescription(source.sourceDescription) && Boolean(description);
    if (!changedSocial && !changedDescription) continue;

    if (changedSocial) socialsAdded += 1;
    if (changedDescription) {
      descriptionsAdded += 1;
      if (evidence?.descriptionOrigin === "official_site") officialSiteDescriptions += 1;
    }
    enriched.push({
      ...source,
      sourceDescription: description,
      socialLinks: Object.keys(socialLinks).length ? socialLinks : null,
    });
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(enriched, null, 2)}\n`);
  const report = {
    source: sourcePath,
    crawl: crawlPath,
    output: outputPath,
    targetReceipts: sourceByReceipt.size,
    crawlEvidenceReceipts: crawlByReceipt.size,
    enrichedCandidates: enriched.length,
    directSocialProfilesAdded: socialsAdded,
    businessDescriptionsAdded: descriptionsAdded,
    officialSiteDescriptionsAdded: officialSiteDescriptions,
    missingEvidence: missingEvidence.length,
  };
  await fs.writeFile(outputPath.replace(/\.json$/i, ".report.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
