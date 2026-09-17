import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_MANIFEST = resolve(
  "data/founder-imports/2026-09-17-global-review/global-review-only-candidates.jsonl",
);
const DEFAULT_RESULT = resolve(
  "data/founder-imports/2026-09-17-global-review/destination-health.json",
);
const option = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
};
const manifestPath = resolve(option("--manifest") ?? DEFAULT_MANIFEST);
const resultPath = resolve(option("--output") ?? DEFAULT_RESULT);
const concurrency = 6;
const timeoutMs = 10_000;

const rows = (await readFile(manifestPath, "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

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
    // A number of official websites reject HEAD but provide a normal page.
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

const uniqueUrls = [...new Set(rows.flatMap((row) => [row.website, row.socialSourceUrl]).filter(Boolean))];
const results = [];
for (let index = 0; index < uniqueUrls.length; index += concurrency) {
  const batch = uniqueUrls.slice(index, index + concurrency);
  results.push(...await Promise.all(batch.map(check)));
  if ((index + batch.length) % 50 === 0 || index + batch.length === uniqueUrls.length) {
    console.log(`checked ${index + batch.length}/${uniqueUrls.length}`);
  }
}
const counts = results.reduce((memo, result) => {
  memo[result.outcome] = (memo[result.outcome] ?? 0) + 1;
  return memo;
}, {});
const payload = {
  checkedAt: new Date().toISOString(),
  sourceManifest: manifestPath,
  candidates: rows.length,
  uniqueDestinations: uniqueUrls.length,
  counts,
  results,
  publication: "Review-only evidence. A timeout, network failure, or review-required response must not be treated as a closed business; it must be reviewed before public publication.",
};
await mkdir(dirname(resultPath), { recursive: true });
await writeFile(resultPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ checkedAt: payload.checkedAt, manifestPath, resultPath, candidates: rows.length, uniqueDestinations: uniqueUrls.length, counts }, null, 2));
