import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("data/founder-imports/2026-09-20-hbcu-neighborhood-directory-review/review-package");
const summaryPath = `${root}/hbcu-neighborhood-directory-review-summary.json`;
const candidatePath = `${root}/hbcu-neighborhood-directory-review-only-candidates.jsonl`;
const healthPath = `${root}/hbcu-neighborhood-directory-destination-health.json`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const [summaryText, candidateText, healthText] = await Promise.all([readFile(summaryPath, "utf8"), readFile(candidatePath, "utf8"), readFile(healthPath, "utf8")]);
const summary = JSON.parse(summaryText);
const health = JSON.parse(healthText);
const candidateRows = candidateText.split(/\r?\n/).filter(Boolean).length;
const allowedOutcomes = new Set(["reachable", "review_required", "network_error", "timeout"]);
const outcomeCount = Object.values(health.counts ?? {}).reduce((total, value) => total + Number(value ?? 0), 0);
if (summary.status !== "review_only") throw new Error("Review package status must remain review_only.");
if (summary.candidateManifest?.rowCount !== candidateRows || health.candidates !== candidateRows) throw new Error("Candidate count does not reconcile across summary, manifest, and health ledger.");
if (!Array.isArray(health.results) || health.results.length !== health.uniqueDestinations || outcomeCount !== health.uniqueDestinations) throw new Error("Destination health ledger does not reconcile its result count.");
if (health.results.some((result) => !allowedOutcomes.has(result.outcome))) throw new Error("Destination health ledger contains an unsupported outcome.");
summary.destinationHealth = {
  path: "data/founder-imports/2026-09-20-hbcu-neighborhood-directory-review/review-package/hbcu-neighborhood-directory-destination-health.json",
  sha256: sha256(healthText),
  checkedAt: health.checkedAt,
  candidateRows,
  uniqueDestinations: health.uniqueDestinations,
  counts: health.counts,
  allDestinationsChecked: true,
  publicationGate: "Any review_required, network_error, or timeout result remains a review gate and is not evidence of closure or permission to publish.",
};
summary.invariantResults.destinationHealthRecorded = true;
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ candidateRows, healthSha256: summary.destinationHealth.sha256, uniqueDestinations: health.uniqueDestinations, counts: health.counts }, null, 2));
