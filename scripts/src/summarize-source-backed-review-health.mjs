import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const option = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
};

const manifestPath = resolve(option("--manifest")
  ?? "data/founder-imports/2026-09-17-source-backed-inventory-review/source-backed-inventory-review-only-candidates.jsonl");
const healthPath = resolve(option("--link-health")
  ?? "data/founder-imports/2026-09-17-source-backed-inventory-review/destination-health.json");
const outputPath = resolve(option("--output")
  ?? "data/founder-imports/2026-09-17-source-backed-inventory-review/destination-health-summary.json");

const candidates = (await readFile(manifestPath, "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const health = JSON.parse(await readFile(healthPath, "utf8"));
if (health.candidates !== candidates.length || !Array.isArray(health.results)) {
  throw new Error("Link-health report does not match the review-only candidate manifest.");
}

const byUrl = new Map(health.results.map((result) => [result.url, result]));
const unresolved = candidates.map((candidate, index) => {
  const destinations = [candidate.website, candidate.socialSourceUrl]
    .filter(Boolean)
    .map((url) => byUrl.get(url) ?? { url, outcome: "not_checked", status: null, finalUrl: null });
  const issues = destinations.filter((destination) => destination.outcome !== "reachable");
  return {
    manifestRow: index + 1,
    name: candidate.name,
    city: candidate.city,
    state: candidate.state,
    country: candidate.country,
    targetKind: candidate.targetKind,
    sourceUrl: candidate.sourceUrl,
    website: candidate.website,
    socialSourceUrl: candidate.socialSourceUrl,
    issues,
  };
}).filter((candidate) => candidate.issues.length > 0);

const byKind = candidates.reduce((counts, candidate) => {
  counts[candidate.targetKind] = (counts[candidate.targetKind] ?? 0) + 1;
  return counts;
}, {});
const affectedByKind = unresolved.reduce((counts, candidate) => {
  counts[candidate.targetKind] = (counts[candidate.targetKind] ?? 0) + 1;
  return counts;
}, {});
const outcomeCounts = health.results.reduce((counts, result) => {
  counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;
  return counts;
}, {});
const noAutomatedPreStageHoldCommercialCandidates = candidates.filter((candidate) => {
  if (candidate.targetKind !== "business") return false;
  if (Array.isArray(candidate.ownershipDesignations) && candidate.ownershipDesignations.length > 0) return false;
  return !unresolved.some((held) => held.manifestRow === candidates.indexOf(candidate) + 1);
}).length;

const payload = {
  manifest: manifestPath,
  linkHealth: healthPath,
  candidates: candidates.length,
  candidatesByTargetKind: byKind,
  uniqueDestinations: health.uniqueDestinations,
  destinationOutcomes: outcomeCounts,
  candidatesWithLinkReviewHold: unresolved.length,
  candidatesWithLinkReviewHoldByTargetKind: affectedByKind,
  noAutomatedPreStageHoldCommercialCandidates,
  heldCandidates: unresolved,
  publication: "NOT PUBLISHED. This report identifies candidates requiring reviewer attention. The commercial count without automated pre-stage holds is not an approval or publish authorization; every candidate still needs production duplicate reconciliation and reviewer-confirmed map location evidence. This report never determines that a business is closed and never updates or deletes an existing listing.",
};
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  candidates: payload.candidates,
  candidatesByTargetKind: payload.candidatesByTargetKind,
  uniqueDestinations: payload.uniqueDestinations,
  destinationOutcomes: payload.destinationOutcomes,
  candidatesWithLinkReviewHold: payload.candidatesWithLinkReviewHold,
  candidatesWithLinkReviewHoldByTargetKind: payload.candidatesWithLinkReviewHoldByTargetKind,
  noAutomatedPreStageHoldCommercialCandidates: payload.noAutomatedPreStageHoldCommercialCandidates,
  output: outputPath,
}, null, 2));
