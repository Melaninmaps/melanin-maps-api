import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2] ?? "data/audits/public-business-link-coverage.json";
const output = process.argv[3] ?? "data/audits/public-business-website-health.json";
const concurrency = Math.max(1, Math.min(20, Number(process.env.LINK_CHECK_CONCURRENCY ?? 10)));
const timeoutMs = 12_000;

function safeUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "KinfolkAI-link-health/1.0 (+https://www.mappingwithmelanin.com)" },
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "KinfolkAI-link-health/1.0 (+https://www.mappingwithmelanin.com)" },
      });
    }
    return {
      url,
      result: response.ok || response.status < 400 ? "working" : response.status >= 500 ? "server_error" : "broken",
      status: response.status,
      finalUrl: response.url || url,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      url,
      result: error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error",
      status: null,
      finalUrl: null,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

const coverage = JSON.parse(await readFile(source, "utf8"));
const websiteUrls = [...new Set((coverage.websiteRows ?? coverage.allRows ?? []).map((row) => safeUrl(row.website)).filter(Boolean))];
if (websiteUrls.length === 0) {
  const allRows = coverage.rows ?? [];
  websiteUrls.push(...new Set(allRows.map((row) => safeUrl(row.website)).filter(Boolean)));
}
if (websiteUrls.length === 0) {
  throw new Error("Coverage audit needs a complete allRows array to check website health.");
}

await mkdir(resolve(output, ".."), { recursive: true });
let prior = [];
try { prior = JSON.parse(await readFile(output, "utf8")); } catch {}
const completed = new Map(prior.map((entry) => [entry.url, entry]));
const pending = websiteUrls.filter((url) => !completed.has(url));
let cursor = 0;
const results = [...completed.values()];
async function worker() {
  while (cursor < pending.length) {
    const index = cursor++;
    const item = await check(pending[index]);
    results.push(item);
    if ((index + 1) % 100 === 0 || index + 1 === pending.length) {
      await writeFile(output, `${JSON.stringify(results, null, 2)}\n`, "utf8");
      console.log(`checked ${completed.size + index + 1}/${websiteUrls.length}`);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
results.sort((a, b) => a.url.localeCompare(b.url));
await writeFile(output, `${JSON.stringify(results, null, 2)}\n`, "utf8");
const counts = results.reduce((all, item) => ({ ...all, [item.result]: (all[item.result] ?? 0) + 1 }), {});
console.log(JSON.stringify({ source, output, websiteUrls: websiteUrls.length, counts }, null, 2));
