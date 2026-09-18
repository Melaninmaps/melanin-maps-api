import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(
  process.argv[2] ?? "data/founder-imports/2026-09-18-tri-state-combined-pass",
);
const candidateFile = resolve(root, "source-passes/04-02-shccnj-member-profiles-verified-candidates.jsonl");
const heldFile = resolve(root, "source-passes/04-02-shccnj-member-profiles-verified-held.jsonl");
const reportFile = resolve(root, "source-reports/04-02-shccnj-member-profiles-verified-report.md");
const allowedStates = new Set(["PA", "NJ", "DE"]);
const sourceHosts = new Set(["business.shccnj.org", "shccnj.org", "www.shccnj.org"]);
const sharedDirectoryDestinations = new Set([
  "https://x.com/shccnj",
  "https://twitter.com/shccnj",
  "https://www.instagram.com/shccnj",
  "https://instagram.com/shccnj",
  "https://www.facebook.com/shccnj",
  "https://facebook.com/shccnj",
]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function directCustomerDestination(value) {
  const raw = text(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (sourceHosts.has(host)) return null;
    const comparable = `${parsed.protocol}//${host}${parsed.pathname}`.replace(/\/$/, "").toLowerCase();
    if (sharedDirectoryDestinations.has(comparable)) return null;
    if (["google.com", "facebook.com", "instagram.com", "tiktok.com", "linkedin.com"].includes(host)
      && ["", "/", "/login", "/accounts/login/"].includes(parsed.pathname.toLowerCase())) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function hasDestination(row) {
  return [row.website, row.instagramUrl, row.facebookUrl, row.tiktokUrl, row.socialSourceUrl]
    .some((value) => Boolean(directCustomerDestination(value)));
}

const records = readFileSync(candidateFile, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const retained = [];
const held = [];
for (const row of records) {
  const reasons = [];
  if (!allowedStates.has(text(row.state).toUpperCase())) reasons.push("outside_tri_state_scope");
  if (!hasDestination(row)) reasons.push("missing_direct_customer_destination");
  if (row.targetKind === "online_business" && !text(row.city)) reasons.push("online_listing_missing_service_city");
  if (reasons.length) {
    held.push({
      heldAt: new Date().toISOString(),
      sourcePass: "04-02-shccnj-member-profiles-verified",
      reasons,
      rawRecord: row,
    });
  } else {
    retained.push(row);
  }
}

const targetCounts = retained.reduce((counts, row) => {
  counts[row.targetKind] = (counts[row.targetKind] ?? 0) + 1;
  return counts;
}, {});
const reasonCounts = held.reduce((counts, row) => {
  for (const reason of row.reasons) counts[reason] = (counts[reason] ?? 0) + 1;
  return counts;
}, {});
const holdRows = Object.entries(reasonCounts)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([reason, count]) => `| ${reason.replaceAll("_", " ")} | ${count} |`)
  .join("\n");
writeFileSync(candidateFile, `${retained.map((row) => JSON.stringify(row)).join("\n")}${retained.length ? "\n" : ""}`);
writeFileSync(heldFile, `${held.map((row) => JSON.stringify(row)).join("\n")}${held.length ? "\n" : ""}`);
writeFileSync(reportFile, `# SHCCNJ Business Link Member-Profile Verification Report\n\n| Metric | Count |\n|---|---:|\n| Original profile-derived rows before correction | ${records.length} |\n| Retained in current tri-state candidate input | ${retained.length} |\n| Held in correction ledger | ${held.length} |\n| Retained — business | ${targetCounts.business ?? 0} |\n| Retained — regulated review | ${targetCounts.regulated_review ?? 0} |\n| Retained — online business | ${targetCounts.online_business ?? 0} |\n\n## Correction applied\n\nA source pass audit found that some public SHCCNJ profiles contained a numbered street address and service category but did **not** publish an individual customer-facing website or social destination. Those rows cannot provide the external link the directory promises to members, so they were moved intact to the correction ledger rather than treated as publishable candidates. New York records were also moved from this Philadelphia tri-state batch to the ledger for a future, geographically appropriate New York pass. No candidate was deleted.\n\n| Hold reason | Count |\n|---|---:|\n${holdRows}\n\n## Source and coverage\n\nThe public source is the [Statewide Hispanic Chamber of Commerce of New Jersey Business Link directory][1]. The earlier collection discovered 385 profile URLs through the public root, alphabetic listings, category listings, and individual member-profile pages under /list/member/. The current candidate file keeps only individually sourced tri-state records with a direct customer destination. The source URL remains the individual member profile for each retained row.\n\nThis is **research-only** input. It has not been staged to a database, published to the web or mobile app, placed on a map, or supplied to live Kinfolk recommendations. The correction ledger retains records for a follow-up official-website/social sweep; a held record is not a finding that the organization has closed.\n\n## Files\n\nThe corrected candidate file is \`04-02-shccnj-member-profiles-verified-candidates.jsonl\`. The preserved correction ledger is \`04-02-shccnj-member-profiles-verified-held.jsonl\`.\n\n## References\n\n[1]: https://business.shccnj.org/list "Statewide Hispanic Chamber of Commerce of New Jersey Business Link Directory"\n`);
console.log(JSON.stringify({
  candidateFile,
  heldFile,
  reportFile,
  originalRows: records.length,
  retainedRows: retained.length,
  heldRows: held.length,
  retainedTargetKinds: targetCounts,
  holdReasons: reasonCounts,
}, null, 2));
