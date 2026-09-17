import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = process.env.PUBLIC_DIRECTORY_API ?? "https://www.mappingwithmelanin.com/api/businesses";
const outDir = resolve("data/audits");
const outPath = resolve(outDir, "public-business-link-coverage.json");
const pageSize = 200;

function populated(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseUrl(value) {
  if (!populated(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function fetchPage(offset) {
  const url = `${base}?limit=${pageSize}&offset=${offset}`;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    let responseStatus = null;
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) return response.json();
      responseStatus = response.status;
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 6) {
        throw new Error(`Directory fetch failed at ${offset}: ${response.status}`);
      }
    } catch (error) {
      if (attempt === 6) throw error;
    } finally {
      clearTimeout(timeout);
    }
    await delay(responseStatus === 429 ? attempt * 3_000 : attempt * 1_000);
  }
  throw new Error(`Directory fetch exhausted retries at ${offset}`);
}

async function fetchAllBusinesses() {
  const initial = await fetchPage(0);
  const total = Number(initial.total);
  if (!Number.isFinite(total) || total < 0) throw new Error("Directory response did not include a valid total.");
  const businesses = [...initial.businesses];
  for (let offset = pageSize; offset < total; offset += pageSize) {
    const body = await fetchPage(offset);
    businesses.push(...body.businesses);
    await delay(600);
    if (offset % 1_000 === 0 || offset + pageSize >= total) console.log(`fetched ${Math.min(offset + pageSize, total)}/${total}`);
  }
  return { total, businesses };
}

const { total, businesses } = await fetchAllBusinesses();
const rows = businesses.map((business) => ({
  id: business.id,
  name: business.name,
  city: business.city,
  state: business.state ?? business.province ?? null,
  country: business.country ?? null,
  listingStatus: business.listingStatus ?? business.status ?? null,
  website: business.website ?? null,
  instagram: business.instagram ?? null,
  facebook: business.facebook ?? null,
  tiktok: business.tiktok ?? null,
  sourceUrl: business.sourceUrl ?? null,
  hasWebsite: populated(business.website),
  hasValidWebsiteSyntax: parseUrl(business.website),
  hasInstagram: populated(business.instagram),
  hasFacebook: populated(business.facebook),
  hasTikTok: populated(business.tiktok),
  hasAnySocial: populated(business.instagram) || populated(business.facebook) || populated(business.tiktok),
  hasDestination: populated(business.website) || populated(business.instagram) || populated(business.facebook) || populated(business.tiktok),
}));

const count = (predicate) => rows.filter(predicate).length;
const report = {
  checkedAt: new Date().toISOString(),
  api: base,
  apiReportedTotal: total,
  fetchedRows: rows.length,
  counts: {
    noWebsite: count((row) => !row.hasWebsite),
    noWebsiteButSocial: count((row) => !row.hasWebsite && row.hasAnySocial),
    noWebsiteOrSocial: count((row) => !row.hasDestination),
    malformedWebsite: count((row) => row.hasWebsite && !row.hasValidWebsiteSyntax),
    websitePresent: count((row) => row.hasWebsite),
    socialOnly: count((row) => !row.hasWebsite && row.hasAnySocial),
    websiteAndSocial: count((row) => row.hasWebsite && row.hasAnySocial),
  },
  rowsWithoutWebsite: rows.filter((row) => !row.hasWebsite),
  rowsWithoutDestination: rows.filter((row) => !row.hasDestination),
  malformedWebsiteRows: rows.filter((row) => row.hasWebsite && !row.hasValidWebsiteSyntax),
  websiteRows: rows.filter((row) => row.hasWebsite),
};

await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: outPath, apiReportedTotal: total, fetchedRows: rows.length, counts: report.counts }, null, 2));
