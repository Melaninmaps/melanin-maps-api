import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const option = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
};

const manifestPath = resolve(option("--manifest") ?? "data/founder-imports/2026-09-18-tri-state-combined-pass/review-package/tri-state-combined-review-only-candidates.jsonl");
const outputPath = resolve(option("--output") ?? "data/founder-imports/2026-09-18-tri-state-combined-pass/review-package/tri-state-diaspora-evidence-audit.json");

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseNotes(value) {
  try {
    const parsed = JSON.parse(text(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const BLACK_SOURCE_PATTERNS = [
  /\bblack[ -]owned\b/i,
  /\bafrican[ -]american[ -]owned\b/i,
  /\bbuy[ -]?black\b/i,
];
const LATINO_SOURCE_PATTERNS = [
  /\b(?:latino|latina|latinx|hispanic|latin)[ -]owned\b/i,
];
const OTHER_DIASPORA_SOURCE_PATTERNS = [
  /\bafro[ -]caribbean[ -]owned\b/i,
  /\bcaribbean[ -]owned\b/i,
  /\bafro[ -]latino[ -]owned\b/i,
  /\bafrican[ -]owned\b/i,
  /\bindigenous[ -]owned\b/i,
];

function hasPattern(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function evidenceFor(row) {
  const designations = Array.isArray(row.ownershipDesignations) ? row.ownershipDesignations.filter((item) => text(item)) : [];
  const notes = parseNotes(row.notes);
  const recordText = [
    ...designations,
    text(row.ownershipEvidence),
    text(notes.original_designation_text),
    text(notes.evidence_summary),
  ].join(" ");
  const sourceText = [text(row.sourceName), text(row.sourceStatus), text(row.sourceUrl)].join(" ");

  if (designations.length > 0 || hasPattern(recordText, [...BLACK_SOURCE_PATTERNS, ...LATINO_SOURCE_PATTERNS, ...OTHER_DIASPORA_SOURCE_PATTERNS])) {
    return {
      tier: "record_specific_or_explicit_designation",
      designationBasis: designations.length > 0 ? designations : ["Explicit ownership evidence text"],
      evidenceUrl: text(row.ownershipEvidence) || text(row.sourceUrl),
    };
  }
  if (hasPattern(sourceText, BLACK_SOURCE_PATTERNS)) {
    return { tier: "source_list_explicitly_black_owned", designationBasis: ["Black / African American-Owned (source-listed)"], evidenceUrl: text(row.sourceUrl) };
  }
  if (hasPattern(sourceText, LATINO_SOURCE_PATTERNS)) {
    return { tier: "source_list_explicitly_latino_owned", designationBasis: ["Latino / Hispanic-Owned (source-listed)"], evidenceUrl: text(row.sourceUrl) };
  }
  if (hasPattern(sourceText, OTHER_DIASPORA_SOURCE_PATTERNS)) {
    return { tier: "source_list_explicitly_diaspora_owned", designationBasis: ["Diaspora-owned (source-listed)"], evidenceUrl: text(row.sourceUrl) };
  }
  return { tier: "designation_not_established", designationBasis: [], evidenceUrl: null };
}

const rows = (await readFile(manifestPath, "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const candidates = rows.map((row) => ({
  sourceRow: row.sourceRow,
  name: row.name,
  targetKind: row.targetKind,
  city: row.city,
  state: row.state,
  sourceUrl: row.sourceUrl,
  sourceName: row.sourceName,
  website: row.website,
  socialSourceUrl: row.socialSourceUrl,
  ...evidenceFor(row),
}));

const commercial = candidates.filter((row) => row.targetKind === "business" || row.targetKind === "online_business");
const counts = (values, key) => Object.fromEntries([...new Map(values.map((item) => [item[key], 0])).keys()].sort().map((value) => [value, values.filter((item) => item[key] === value).length]));
const byTier = counts(candidates, "tier");
const commercialByTier = counts(commercial, "tier");
const sourceRollup = new Map();
for (const candidate of commercial) {
  const key = `${candidate.tier}\u0000${candidate.sourceName}`;
  const entry = sourceRollup.get(key) ?? { tier: candidate.tier, sourceName: candidate.sourceName, count: 0, samples: [] };
  entry.count += 1;
  if (entry.samples.length < 10) entry.samples.push({ name: candidate.name, city: candidate.city, state: candidate.state, sourceUrl: candidate.sourceUrl });
  sourceRollup.set(key, entry);
}

const output = {
  generatedAt: new Date().toISOString(),
  publicationStatus: "RESEARCH_AND_REVIEW_ONLY_NOT_PUBLISHED",
  manifestPath,
  manifestSha256: createHash("sha256").update(await readFile(manifestPath)).digest("hex"),
  totalCandidates: candidates.length,
  commercialOrOnlineCandidates: commercial.length,
  allCandidatesByEvidenceTier: byTier,
  commercialOrOnlineByEvidenceTier: commercialByTier,
  notes: [
    "Record-specific or explicit designation evidence may be used only as a reviewer-confirmation input, never as an inferred identity claim.",
    "A source-list tier means that the source itself expressly frames its listed entries as Black-owned, Latino-owned, or otherwise diaspora-owned. It is not a separate claimed business certification.",
    "Designation-not-established candidates may be valid local listings, but must not be represented in member-facing filters as Black-owned, Latino-owned, or diaspora-owned until explicit evidence is added.",
    "This audit does not publish, stage, geocode, modify, or delete any database, user, authentication, password, session, access, or waitlist record.",
  ],
  commercialSourceRollup: [...sourceRollup.values()].sort((a, b) => a.tier.localeCompare(b.tier) || b.count - a.count || a.sourceName.localeCompare(b.sourceName)),
  candidates,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  outputPath,
  totalCandidates: output.totalCandidates,
  commercialOrOnlineCandidates: output.commercialOrOnlineCandidates,
  commercialOrOnlineByEvidenceTier: output.commercialOrOnlineByEvidenceTier,
}, null, 2));
