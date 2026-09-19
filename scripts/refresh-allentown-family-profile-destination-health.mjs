import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "data/founder-imports/2026-09-19-allentown-family-profile-review");
const manifestFile = resolve(root, "review-package/allentown-family-profile-combined-review-only-candidates.jsonl");
const healthFile = resolve(root, "consolidated/allentown-family-profile-combined-destination-health.json");
const outputFile = resolve(root, "consolidated/allentown-family-profile-combined-destination-health.json");
const concurrency = 6;
const timeoutMs = 10_000;

function canonicalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

const rows = (await readFile(manifestFile, "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const destinations = [...new Set(rows.flatMap((row) => [row.website, row.socialSourceUrl].map(canonicalUrl).filter(Boolean)))];
let prior = { results: [] };
try {
  prior = JSON.parse(await readFile(healthFile, "utf8"));
} catch {
  // An absent prior report simply makes every destination an incremental check.
}
const priorByUrl = new Map((prior.results ?? []).map((result) => [canonicalUrl(result.url) ?? result.url, result]));
const fresh = [];
for (const url of destinations) {
  const previous = priorByUrl.get(url);
  if (previous?.outcome === "reachable") continue;
  fresh.push(url);
}

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "KinfolkAI listing verification/1.0 (+https://www.mappingwithmelanin.com)" },
    });
    if ([400, 403, 405].includes(response.status)) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "KinfolkAI listing verification/1.0 (+https://www.mappingwithmelanin.com)" },
      });
    }
    return {
      url,
      status: response.status,
      finalUrl: response.url,
      outcome: response.status >= 200 && response.status < 400 ? "reachable" : "review_required",
    };
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

const newResults = new Map();
for (let index = 0; index < fresh.length; index += concurrency) {
  const batch = fresh.slice(index, index + concurrency);
  const outcomes = await Promise.all(batch.map(check));
  for (const outcome of outcomes) newResults.set(outcome.url, outcome);
  if (index + batch.length === fresh.length || (index + batch.length) % 50 === 0) {
    console.log(`checked ${index + batch.length}/${fresh.length}`);
  }
}
const results = destinations.map((url) => newResults.get(url) ?? priorByUrl.get(url) ?? {
  url,
  status: null,
  finalUrl: null,
  outcome: "not_checked",
});
const counts = results.reduce((totals, result) => {
  totals[result.outcome] = (totals[result.outcome] ?? 0) + 1;
  return totals;
}, {});
const payload = {
  checkedAt: new Date().toISOString(),
  sourceManifest: manifestFile,
  candidates: rows.length,
  uniqueDestinations: destinations.length,
  reusedReachableResults: destinations.length - fresh.length,
  freshlyCheckedDestinations: fresh.length,
  counts,
  results,
  publication: "Review-only evidence. A timeout, network failure, or non-success response is a review gate, not a closure determination. This file cannot publish any record.",
};
await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  outputFile,
  candidates: payload.candidates,
  uniqueDestinations: payload.uniqueDestinations,
  reusedReachableResults: payload.reusedReachableResults,
  freshlyCheckedDestinations: payload.freshlyCheckedDestinations,
  counts: payload.counts,
}, null, 2));
