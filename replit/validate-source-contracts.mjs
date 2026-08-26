import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const checks = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    checks.push({ name: `file:${relativePath}`, passed: false, detail: "missing" });
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

const webCommunity = read("artifacts/web/src/pages/community.tsx");
check(
  "web submits mediaUrls as an array",
  webCommunity.includes("mediaUrls: mediaUrls.length ? mediaUrls : undefined"),
  "prevents upload URLs from being JSON-encoded twice",
);
check(
  "web reload parser accepts legacy shapes",
  webCommunity.includes("function normalizeMediaUrls(value: unknown)") &&
    webCommunity.includes("mediaUrls: normalizeMediaUrls(p.mediaUrls)"),
  "supports arrays, JSON strings, and previously double-encoded values",
);
check(
  "web no longer sends double-encoded media",
  !webCommunity.includes("mediaUrls: mediaUrls.length ? JSON.stringify(mediaUrls) : undefined"),
  "old broken submit expression is absent",
);

const apiCommunity = read("artifacts/api-server/src/routes/community.ts");
check(
  "API normalizes community media input and output",
  apiCommunity.includes("function normalizeCommunityMediaUrls(value: unknown)") &&
    apiCommunity.includes("mediaUrls: normalizeCommunityMediaUrls(r.media_urls)") &&
    apiCommunity.includes("const normalizedMediaUrls = normalizeCommunityMediaUrls(mediaUrls)"),
  "stabilizes the contract while repairing old rows at read time",
);

const canonicalRepository = read("artifacts/api-server/src/routes/directory/canonicalCulturalSiteRepository.ts");
check(
  "canonical cultural-site slugs are schema-free",
  canonicalRepository.includes("const DERIVED_SLUG_SQL") &&
    canonicalRepository.includes("REGEXP_REPLACE(LOWER(name)") &&
    !canonicalRepository.includes("SELECT id, slug, name"),
  "avoids the missing cultural_sites.slug column",
);

const canonicalRoutes = read("artifacts/api-server/src/routes/canonical-cultural-sites.ts");
check(
  "canonical detail response is backward-compatible",
  canonicalRoutes.includes("res.json({ ...detail, site: detail })") &&
    canonicalRoutes.includes("externalUrl: site.learnMoreUrl"),
  "supports both current website and canonical clients",
);

const mobileCommunity = read("artifacts/mobile/app/(tabs)/community.tsx");
check(
  "mobile uses the shared media upload endpoint",
  mobileCommunity.includes("/api/media/upload?purpose=community_post") &&
    mobileCommunity.includes('formData.append("file"'),
  "matches the website/server multipart contract",
);
check(
  "mobile preserves successful partial uploads",
  mobileCommunity.includes("for (const asset of result.assets.slice(0, remainingSlots))") &&
    mobileCommunity.includes("setMediaAttachments((current) =>") &&
    mobileCommunity.includes("remainingSlots = Math.max(0, 5 - mediaAttachments.length)"),
  "commits each completed upload immediately and prevents over-selection",
);
check(
  "mobile upload errors tolerate non-JSON responses",
  mobileCommunity.includes("await res.json().catch(() => ({}))"),
  "keeps upload failures inside a recoverable UI path",
);
check(
  "mobile feed normalizes media shapes",
  /(?:normalize|parse)MediaUrls\(raw\.mediaUrls\)/.test(mobileCommunity),
  "renders array and string response shapes consistently",
);

const mobileProfile = read("artifacts/mobile/app/user/[id].tsx");
check(
  "mobile profile no longer JSON.parse-crashes",
  /mediaUrls:\s*(?:normalize|parse)MediaUrls\(p\.mediaUrls\)/.test(mobileProfile) &&
    !/JSON\.parse\([^\n]*mediaUrls/.test(mobileProfile),
  "malformed post media cannot abort the entire profile load",
);

const culturalMobile = read("artifacts/mobile/app/cultural-heritage.tsx");
check(
  "mobile cultural-site screen accepts canonical list responses",
  culturalMobile.includes("sites?: CulturalSite[]") && culturalMobile.includes("items?: Array<Partial<CulturalSite>") &&
    culturalMobile.includes("data.sites ?? data.items ?? []"),
  "supports legacy and canonical response envelopes",
);
check(
  "mobile cultural-site failures are retryable",
  culturalMobile.includes("const [loadError, setLoadError]") && culturalMobile.includes("Sites unavailable") &&
    culturalMobile.includes("Try Again"),
  "distinguishes an outage from an empty result",
);

const tabLayout = read("artifacts/mobile/app/(tabs)/_layout.tsx");
check(
  "tab layout avoids unavailable unstable exports",
  !tabLayout.includes("unstable-native-tabs") && !tabLayout.includes("NativeTabLayout"),
  "removes the supplied TS2305 blocker without changing the active classic tabs",
);

const mobileFiles = [
  "artifacts/mobile/app/(tabs)/community.tsx",
  "artifacts/mobile/app/cultural-heritage.tsx",
  "artifacts/mobile/components/CommunityPostCard.tsx",
  "artifacts/mobile/components/FullMapView.tsx",
].map((relativePath) => ({ relativePath, source: read(relativePath) }));
const rawOpeners = mobileFiles.flatMap(({ relativePath, source }) =>
  [...source.matchAll(/Linking\.openURL\(/g)].map(() => relativePath),
);
check(
  "audited mobile callers centralize external links",
  rawOpeners.length === 0,
  rawOpeners.length === 0 ? "all audited callers use openExternalUrl" : `raw callers: ${rawOpeners.join(", ")}`,
);

const failures = checks.filter((item) => !item.passed);
for (const item of checks) {
  const status = item.passed ? "PASS" : "FAIL";
  console.log(`${status.padEnd(4)}  ${item.name} — ${item.detail}`);
}
console.log(`\n${checks.length - failures.length}/${checks.length} source-contract checks passed.`);
process.exitCode = failures.length === 0 ? 0 : 1;
