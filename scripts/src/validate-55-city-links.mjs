import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MANIFEST = resolve(ROOT, "data/founder-imports/2026-09-16-55-city-research/source-backed-candidates.jsonl");
const OUTPUT = resolve(ROOT, "data/founder-imports/2026-09-16-55-city-research/link-validation.json");
const CONCURRENCY = 20;
const TIMEOUT_MS = 6_000;

function safeUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || !url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function urlsFromManifest() {
  const urls = new Set();
  const input = createInterface({ input: createReadStream(MANIFEST, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    const candidate = JSON.parse(line);
    for (const field of ["website", "sourceUrl", "instagramUrl", "facebookUrl", "tiktokUrl", "socialSourceUrl", "ownershipEvidence"]) {
      const url = safeUrl(candidate[field]);
      if (url) urls.add(url);
    }
  }
  return [...urls].sort();
}

async function check(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "KinfolkAI-directory-validator/1.0 (+https://www.mappingwithmelanin.com)" },
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "KinfolkAI-directory-validator/1.0 (+https://www.mappingwithmelanin.com)" },
      });
    }
    const result = response.status >= 200 && response.status < 400
      ? "ok"
      : response.status >= 500
        ? "server_error"
        : "broken";
    return { url, result, status: response.status, finalUrl: response.url || url, checkedAt: new Date().toISOString() };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return { url, result: aborted ? "timeout" : "network_error", status: null, finalUrl: null, checkedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const urls = await urlsFromManifest();
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const index = cursor++;
      results[index] = await check(urls[index]);
      if ((index + 1) % 100 === 0 || index + 1 === urls.length) console.log(`checked ${index + 1}/${urls.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  results.sort((a, b) => a.url.localeCompare(b.url));
  const output = createWriteStream(OUTPUT, { encoding: "utf8" });
  output.write(`${JSON.stringify(results, null, 2)}\n`);
  await new Promise((resolveWrite, rejectWrite) => output.end((error) => error ? rejectWrite(error) : resolveWrite()));
  const counts = results.reduce((all, result) => ({ ...all, [result.result]: (all[result.result] ?? 0) + 1 }), {});
  console.log(JSON.stringify({ manifest: MANIFEST, output: OUTPUT, urls: results.length, counts }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
