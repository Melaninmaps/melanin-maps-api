import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const option = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
};

const manifestPath = resolve(option("--manifest") ?? "data/founder-imports/2026-09-18-tri-state-combined-pass/review-package/tri-state-combined-review-only-candidates.jsonl");
const existingPath = resolve(option("--existing") ?? "data/founder-imports/2026-09-18-tri-state-combined-pass/consolidated/tri-state-combined-destination-health.json");
const outputPath = resolve(option("--output") ?? existingPath);
const concurrency = 6;
const timeoutMs = 10_000;

const rows = (await readFile(manifestPath, "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const previous = JSON.parse(await readFile(existingPath, "utf8"));
const targetUrls = [...new Set(rows.flatMap((row) => [row.website, row.socialSourceUrl]).filter(Boolean))];
const previousByUrl = new Map((previous.results ?? []).map((result) => [result.url, result]));
const pendingUrls = targetUrls.filter((url) => !previousByUrl.has(url));

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
    if (response.status === 405 || response.status === 403 || response.status === 400) {
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

const newResults = [];
for (let index = 0; index < pendingUrls.length; index += concurrency) {
  const batch = pendingUrls.slice(index, index + concurrency);
  newResults.push(...await Promise.all(batch.map(check)));
  const completed = Math.min(index + batch.length, pendingUrls.length);
  if (completed % 50 === 0 || completed === pendingUrls.length) {
    console.log(`checked ${completed}/${pendingUrls.length} new destinations`);
  }
}

for (const result of newResults) previousByUrl.set(result.url, result);
const results = targetUrls.map((url) => previousByUrl.get(url));
const counts = results.reduce((memo, result) => {
  memo[result.outcome] = (memo[result.outcome] ?? 0) + 1;
  return memo;
}, {});

const payload = {
  checkedAt: new Date().toISOString(),
  sourceManifest: manifestPath,
  candidates: rows.length,
  uniqueDestinations: targetUrls.length,
  incremental: {
    carriedForward: targetUrls.length - pendingUrls.length,
    newlyChecked: pendingUrls.length,
  },
  counts,
  results,
  publication: "Review-only evidence. A timeout, network failure, or review-required response must not be treated as a closed business; it must be reviewed before public publication.",
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  checkedAt: payload.checkedAt,
  manifestPath,
  outputPath,
  candidates: rows.length,
  uniqueDestinations: targetUrls.length,
  incremental: payload.incremental,
  counts,
}, null, 2));
