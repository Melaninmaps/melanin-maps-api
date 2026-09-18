import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(
  process.argv[2] ?? "data/founder-imports/2026-09-18-tri-state-combined-pass",
);
const sourcePass = resolve(root, "source-passes/04-02-shccnj-member-profiles-verified-candidates.jsonl");
const consolidated = resolve(root, "consolidated/tri-state-consolidated-candidates.jsonl");
const backup = resolve(root, "source-passes/04-02-shccnj-member-profiles-verified-candidates-after-partial-correction.jsonl");

const directProfilePrefix = "https://business.shccnj.org/list/member/";
const rows = readFileSync(consolidated, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((row) => typeof row.sourceUrl === "string" && row.sourceUrl.startsWith(directProfilePrefix));
const byProfile = new Map(rows.map((row) => [row.sourceUrl, row]));
const restored = [...byProfile.values()].sort((a, b) => Number(a.sourceRow ?? 0) - Number(b.sourceRow ?? 0));
if (restored.length < 45) {
  throw new Error(`SHCCNJ_RECOVERY_ABORTED: only ${restored.length} direct-profile rows found in consolidation snapshot`);
}
const stateCounts = restored.reduce((counts, row) => {
  counts[row.state] = (counts[row.state] ?? 0) + 1;
  return counts;
}, {});
renameSync(sourcePass, backup);
writeFileSync(sourcePass, `${restored.map((row) => JSON.stringify(row)).join("\n")}\n`);
console.log(JSON.stringify({
  sourcePass,
  preservedPartialFile: backup,
  restoredRows: restored.length,
  sourceProfilesUnique: byProfile.size,
  stateCounts,
}, null, 2));
