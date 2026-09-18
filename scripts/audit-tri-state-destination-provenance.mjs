import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(
  process.argv[2] ??
    "data/founder-imports/2026-09-18-tri-state-combined-pass",
);
const candidatesFile = resolve(root, "consolidated/tri-state-consolidated-candidates.jsonl");
const outputFile = resolve(root, "consolidated/tri-state-destination-provenance-audit.json");

function parseRows(file) {
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function normalizeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) return null;
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function destinations(row) {
  return [
    ["website", row.website],
    ["instagram", row.instagramUrl],
    ["facebook", row.facebookUrl],
    ["tiktok", row.tiktokUrl],
    ["socialSource", row.socialSourceUrl],
  ]
    .map(([field, value]) => ({ field, url: normalizeUrl(value) }))
    .filter((entry) => entry.url !== null);
}

const rows = parseRows(candidatesFile);
const destinationCounts = new Map();
for (const row of rows) {
  for (const entry of destinations(row)) {
    const holders = destinationCounts.get(entry.url) ?? [];
    holders.push({
      sourceRow: row.sourceRow,
      name: row.name,
      city: row.city,
      state: row.state,
      field: entry.field,
      sourceUrl: row.sourceUrl,
    });
    destinationCounts.set(entry.url, holders);
  }
}

const genericDestinations = new Set(
  [...destinationCounts.entries()]
    .filter(([, entries]) => new Set(entries.map((entry) => entry.name.trim().toLowerCase())).size >= 3)
    .map(([url]) => url),
);

const rowsWithGenericOnly = [];
const rowsWithAlternative = [];
for (const row of rows) {
  const links = destinations(row);
  const generic = links.filter((entry) => genericDestinations.has(entry.url));
  if (!generic.length) continue;
  const alternatives = links.filter((entry) => !genericDestinations.has(entry.url));
  const item = {
    sourceRow: row.sourceRow,
    name: row.name,
    city: row.city,
    state: row.state,
    targetKind: row.targetKind,
    sourceUrl: row.sourceUrl,
    genericDestinations: generic,
    alternatives,
  };
  if (alternatives.length) rowsWithAlternative.push(item);
  else rowsWithGenericOnly.push(item);
}

const report = {
  generatedAt: new Date().toISOString(),
  candidates: rows.length,
  repeatedCustomerDestinationCount: genericDestinations.size,
  recordsWithRepeatedDestinationOnly: rowsWithGenericOnly.length,
  recordsWithAlternativeCustomerDestination: rowsWithAlternative.length,
  repeatedDestinations: [...genericDestinations]
    .map((url) => ({ url, records: destinationCounts.get(url) }))
    .sort((a, b) => b.records.length - a.records.length),
  rowsWithGenericOnly,
  rowsWithAlternative,
};
writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  outputFile,
  candidates: report.candidates,
  repeatedCustomerDestinationCount: report.repeatedCustomerDestinationCount,
  recordsWithRepeatedDestinationOnly: report.recordsWithRepeatedDestinationOnly,
  recordsWithAlternativeCustomerDestination: report.recordsWithAlternativeCustomerDestination,
  largestRepeatedDestinations: report.repeatedDestinations.slice(0, 12).map((entry) => ({
    url: entry.url,
    records: entry.records.length,
  })),
}, null, 2));
