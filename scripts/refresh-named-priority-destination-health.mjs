#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const ROOT = "data/founder-imports/2026-09-20-named-priority-listings-review/review-package";
const MANIFEST = `${ROOT}/named-priority-listings-review-only-candidates.jsonl`;
const OUTPUT = `${ROOT}/named-priority-listings-destination-health.json`;
const CONCURRENCY = 6;
const TIMEOUT_MS = 20_000;

function canonicalHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

async function checkDestination(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "MappingWithMelaninDirectoryReview/1.0 (+https://www.mappingwithmelanin.com)" },
    });
    const status = response.status;
    const outcome = status >= 200 && status < 400
      ? "reachable"
      : status === 401 || status === 403 || status === 405 || status === 429
        ? "review_required"
        : "review_required";
    return { url, status, finalUrl: canonicalHttpUrl(response.url), outcome };
  } catch (error) {
    return {
      url,
      status: null,
      finalUrl: null,
      outcome: error?.name === "AbortError" ? "timeout" : "network_error",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function boundedMap(values, mapper) {
  const results = new Array(values.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, values.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= values.length) return;
      results[current] = await mapper(values[current]);
    }
  }));
  return results;
}

async function main() {
  const records = (await readFile(MANIFEST, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const destinations = [...new Set(records.flatMap((record) => [
    record.website,
    record.socialSourceUrl,
    record.instagramUrl,
    record.facebookUrl,
    record.tiktokUrl,
  ].map(canonicalHttpUrl).filter(Boolean)))].sort();
  const results = await boundedMap(destinations, checkDestination);
  const counts = Object.fromEntries(["reachable", "review_required", "network_error", "timeout"].map((outcome) => [
    outcome,
    results.filter((result) => result.outcome === outcome).length,
  ]));
  const report = {
    checkedAt: new Date().toISOString(),
    sourceManifest: "named-priority-listings-review-only-candidates.jsonl",
    candidates: records.length,
    uniqueDestinations: destinations.length,
    counts,
    results,
  };
  await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ candidates: report.candidates, uniqueDestinations: report.uniqueDestinations, counts }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
