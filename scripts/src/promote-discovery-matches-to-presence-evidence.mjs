#!/usr/bin/env node
/**
 * Converts only identity-and-location-matched discovery candidates into a new,
 * read-only presence-evidence input for the first-party crawler. It never
 * calls Mapping With Melanin and it excludes every review-only/ambiguous lead.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function candidateUrl(candidate) {
  const value = cleanText(candidate?.probe?.finalUrl ?? candidate?.normalizedUrl ?? candidate?.url);
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || !url.hostname) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function chooseCandidate(row) {
  const candidates = Array.isArray(row?.candidates) ? row.candidates : [];
  const website = candidates.find((candidate) => candidate?.state === "MATCHED_WEBSITE_CANDIDATE" && candidateUrl(candidate));
  if (website) return { kind: "website", candidate: website };
  const social = candidates.find((candidate) => candidate?.state === "MATCHED_SOCIAL_CANDIDATE" && candidateUrl(candidate) && cleanText(candidate.platform));
  return social ? { kind: "social", candidate: social } : null;
}

async function main() {
  const inputPath = resolve(argValue("--input"));
  const verificationPath = resolve(argValue("--verification"));
  const outputPath = resolve(argValue("--out"));
  if (!inputPath || !verificationPath || !outputPath) throw new Error("Usage: --input discovery.jsonl --verification presence-verification.jsonl --out presence-evidence.jsonl");
  const source = await fs.readFile(inputPath, "utf8");
  const verificationSource = await fs.readFile(verificationPath, "utf8");
  const rows = source.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const verificationByBusinessId = new Map(verificationSource.split(/\r?\n/).filter(Boolean).map((line) => {
    const row = JSON.parse(line);
    return [cleanText(row.businessId), row];
  }));
  const selected = [];
  for (const row of rows) {
    const choice = chooseCandidate(row);
    if (!choice) continue;
    const url = candidateUrl(choice.candidate);
    if (!url) continue;
    const prior = verificationByBusinessId.get(cleanText(row.businessId));
    const matchedAt = cleanText(choice.candidate?.probe?.checkedAt ?? row.completedAt ?? new Date().toISOString());
    const record = {
      schemaVersion: "discovery-promoted-first-party-presence-v1",
      businessId: cleanText(row.businessId),
      businessName: cleanText(row.businessName),
      city: cleanText(row.city),
      state: cleanText(row.state),
      originalLinks: row.originalLinks ?? {},
      sourceSnapshot: row.sourceSnapshot ?? {},
      currentSnapshotHash: row.currentSnapshotHash ?? null,
      websiteRecovery: choice.kind === "website" ? {
        priorWebsite: candidateUrl({ normalizedUrl: prior?.website?.normalizedUrl ?? prior?.sourceSnapshot?.Website }) ?? null,
        priorWebsiteClassification: cleanText(prior?.website?.classification),
        checkedAt: cleanText(prior?.website?.probe?.checkedAt ?? prior?.checkedAt).slice(0, 10),
      } : null,
      website: choice.kind === "website" ? {
        classification: "KEEP_ACTIVE",
        normalizedUrl: url,
        reason: "Discovery candidate passed accessible first-party identity and city/state checks.",
        probe: choice.candidate.probe ?? { checkedAt: matchedAt },
      } : { classification: "MISSING" },
      social: choice.kind === "social" ? {
        [choice.candidate.platform]: {
          classification: "KEEP_ACTIVE_SOCIAL",
          normalizedUrl: url,
          reason: "Discovery candidate passed public official-profile identity checks.",
          probe: choice.candidate.probe ?? { checkedAt: matchedAt },
        },
      } : {},
      disposition: {
        disposition: choice.kind === "website" ? "RETAIN" : "RETAIN_SOCIAL_ONLY",
        reason: "Promoted only after first-party discovery identity checks; this file remains read-only evidence.",
      },
      checkedAt: matchedAt,
      execution: "read_only_discovery_promotion",
    };
    if (!record.businessId || !record.businessName || !record.city || !record.state) continue;
    selected.push(record);
  }
  await fs.mkdir(dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${selected.map((row) => JSON.stringify(row)).join("\n")}${selected.length ? "\n" : ""}`, "utf8");
  const summaryPath = outputPath.replace(/\.jsonl$/i, ".summary.json");
  await fs.writeFile(summaryPath, `${JSON.stringify({
    version: "discovery-promoted-first-party-presence-v1",
    inputPath,
    inputSha256: createHash("sha256").update(source).digest("hex"),
    verificationSha256: createHash("sha256").update(verificationSource).digest("hex"),
    discoveryRecords: rows.length,
    promotedRecords: selected.length,
    websiteSources: selected.filter((row) => row.website.classification === "KEEP_ACTIVE").length,
    socialSources: selected.filter((row) => row.website.classification !== "KEEP_ACTIVE").length,
    productionWrite: false,
    generatedAt: new Date().toISOString(),
  }, null, 2)}\n`, "utf8");
  process.stdout.write(`Promoted ${selected.length} strictly matched first-party discovery results. No production records changed.\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
