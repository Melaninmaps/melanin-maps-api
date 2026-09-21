#!/usr/bin/env node
/**
 * Offline-only MWM Core map-pin readiness report.
 *
 * This report joins signed source rows to the offline MWM Core receipt. It
 * never geocodes, calls an API, stages a candidate, changes a record, enables
 * a worker, or publishes a map pin. A row is "ready for reviewed pinnable
 * publication" only when it is an approved source-backed physical candidate
 * and carries valid supplied coordinates. Address text is not treated as a
 * substitute for coordinates.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const DEFAULT_ROOT = "data/founder-imports";
const DEFAULT_RECEIPTS = "artifacts/reports/mwm-core-source-receipts.jsonl";
const DEFAULT_JSON = "artifacts/reports/mwm-core-pin-readiness.json";
const DEFAULT_MARKDOWN = "artifacts/reports/MWM_CORE_PIN_READINESS.md";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const children = await Promise.all(entries.map(async (entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return [absolute];
  }));
  return children.flat();
}

function publicHost(value) {
  if (!String(value ?? "").trim()) return null;
  try {
    const url = new URL(String(value).trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname) return null;
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function numberedStreetAddress(value) {
  return Boolean(String(value ?? "").trim() && /\d/.test(String(value)));
}

function finiteNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function suppliedCoordinates(record) {
  const latitude = finiteNumber(record.latitude ?? record.lat ?? record.location?.latitude ?? record.coordinates?.latitude ?? record.coordinates?.lat);
  const longitude = finiteNumber(record.longitude ?? record.lng ?? record.lon ?? record.location?.longitude ?? record.location?.lng ?? record.coordinates?.longitude ?? record.coordinates?.lng ?? record.coordinates?.lon);
  if (latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
    return { latitude, longitude };
  }
  if (Array.isArray(record.coordinates) && record.coordinates.length >= 2) {
    const longitudeFromArray = finiteNumber(record.coordinates[0]);
    const latitudeFromArray = finiteNumber(record.coordinates[1]);
    if (latitudeFromArray !== null && longitudeFromArray !== null && Math.abs(latitudeFromArray) <= 90 && Math.abs(longitudeFromArray) <= 180) {
      return { latitude: latitudeFromArray, longitude: longitudeFromArray };
    }
  }
  return null;
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function rowView(record, receipt, manifest) {
  return {
    sourceManifest: manifest,
    sourceRow: Number(record.sourceRow ?? record.source_row),
    name: String(record.name ?? ""),
    targetKind: String(record.targetKind ?? record.target_kind ?? "manual_review"),
    city: String(record.city ?? ""),
    state: String(record.state ?? ""),
    address: String(record.address ?? ""),
    sourceUrl: String(record.sourceUrl ?? record.source_url ?? ""),
    ownershipDesignations: Array.isArray(record.ownershipDesignations)
      ? record.ownershipDesignations.map(String)
      : Array.isArray(record.ownership_designations) ? record.ownership_designations.map(String) : [],
    cohort: receipt.cohort,
    reasonCodes: receipt.reasonCodes,
    directoryOutcome: receipt.directoryOutcome,
    numberedStreetAddress: numberedStreetAddress(record.address),
    officialDestinationHost: publicHost(record.website) ?? publicHost(record.socialSourceUrl ?? record.social_source_url),
    suppliedCoordinates: suppliedCoordinates(record),
  };
}

function markdown(report) {
  const summary = report.summary;
  const table = [
    ["Publishable clickable map pins", summary.readyForReviewedPinnablePublication, "Approved physical MWM Core candidates with a numbered address, official destination, and valid source-supplied coordinates. Still requires isolated-review staging and publication approval."],
    ["Physical MWM Core candidates awaiting authorized geocoding", summary.physicalAwaitingAuthorizedGeocode, "Approved evidence and physical address, but no valid coordinates in the signed source package; no pin may be fabricated."],
    ["Searchable online-only MWM Core candidates", summary.onlineOnlyCandidates, "Approved online businesses that are intentionally mapless once reviewed and published."],
    ["Other held source rows", summary.heldSourceRows, "Held for absent approved evidence, directory/review requirements, duplicates, invalid source data, or non-business target type."],
    ["Total signed source rows reviewed", summary.totalSourceRows, "All rows remain retained; this report makes no publication or visibility change."],
  ];
  const summaryRows = table
    .map(([label, count, explanation]) => `| ${label} | ${count} | ${explanation} |`)
    .join("\n");
  const candidateRows = report.rows.readyForReviewedPinnablePublication;
  const detailRows = candidateRows.length
    ? candidateRows.map((row) => `| ${escapeCell(row.name)} | ${escapeCell(row.city)}, ${escapeCell(row.state)} | ${escapeCell(row.address)} | ${escapeCell(row.ownershipDesignations.join(", "))} | ${escapeCell(row.sourceManifest)}:${row.sourceRow} |`).join("\n")
    : "| No rows | — | — | — | — |";
  return `# MWM Core Pin Readiness Report\n\n**Status:** Offline evidence report only. No API, database, geocoder, staging route, publication worker, or business record was called or changed.\n\n## Approved First-Launch Rule\n\nOnly a **traceable source** that explicitly identifies a business as **Black/African American or Latino/a/x/Hispanic** may qualify for MWM Core. This report does not infer identity from a business name, cuisine, language, image, neighborhood, city, or any other proxy.\n\n## Exact Source-Package Result\n\n| Outcome | Count | Meaning |\n|---|---:|---|\n${summaryRows}\n\n> **The answer to “how many publishable, clickable map pins?” is ${summary.readyForReviewedPinnablePublication}.** A physical address alone is not map-pin proof; the signed package supplies no valid coordinates for the rows counted as awaiting geocoding.\n\n## Why This Is Not Yet a Publication Count\n\nA ready candidate still needs checksum-pinned staging in the isolated review database, deduplication against the target catalog, permitted geocoding where coordinates are absent, a dry-run receipt, and one authorized publication worker. These controls prevent invented pins and duplicate listings. The report does not authorize any of those actions.\n\n## Rows Ready for Reviewed Pinnable Publication\n\n| Business | City/State | Address | Explicit designation | Manifest/source row |\n|---|---|---|---|---|\n${detailRows}\n\n## Reproducibility\n\n- Receipt policy: ${report.receiptPolicyVersion}\n- Receipt root hash: ${report.sourceReceiptRootHash}\n- Signed manifests: ${report.manifestCount}\n- Generated at: ${report.generatedAt}\n`;
}

async function main() {
  const root = resolve(argValue("--root", DEFAULT_ROOT));
  const receiptsPath = resolve(argValue("--receipts", DEFAULT_RECEIPTS));
  const jsonOut = resolve(argValue("--out", DEFAULT_JSON));
  const markdownOut = resolve(argValue("--markdown", DEFAULT_MARKDOWN));
  const receiptLines = (await readFile(receiptsPath, "utf8")).split(/\r?\n/).filter(Boolean);
  const receipts = receiptLines.map((line) => JSON.parse(line));
  const receiptBySourceRow = new Map(receipts.map((receipt) => [
    `${receipt.sourceManifest}:${receipt.sourceRow}`,
    receipt,
  ]));
  const files = (await walk(root))
    .filter((file) => file.endsWith("-review-only-candidates.jsonl"))
    .sort();
  if (!files.length) throw new Error(`No review-only candidate manifests found under ${root}`);

  const rows = [];
  for (const file of files) {
    const manifest = relative(process.cwd(), file);
    const lines = (await readFile(file, "utf8")).split(/\r?\n/).filter(Boolean);
    for (let index = 0; index < lines.length; index += 1) {
      const record = JSON.parse(lines[index]);
      const sourceRow = Number(record.sourceRow ?? record.source_row ?? index + 1);
      const receipt = receiptBySourceRow.get(`${manifest}:${sourceRow}`);
      if (!receipt) throw new Error(`Missing receipt for ${manifest}:${sourceRow}. Generate receipt from this exact root first.`);
      rows.push(rowView(record, receipt, manifest));
    }
  }
  if (rows.length !== receipts.length) throw new Error(`Source/receipt row-count mismatch: ${rows.length} source rows, ${receipts.length} receipt rows.`);

  const mwmCoreCandidates = rows.filter((row) => row.cohort === "mwm_source_backed_candidate");
  const physicalCandidates = mwmCoreCandidates.filter((row) => row.targetKind === "business");
  const onlineOnlyCandidates = mwmCoreCandidates.filter((row) => row.targetKind === "online_business");
  const readyForReviewedPinnablePublication = physicalCandidates.filter((row) => (
    row.numberedStreetAddress && row.officialDestinationHost && row.suppliedCoordinates
  ));
  const physicalAwaitingAuthorizedGeocode = physicalCandidates.filter((row) => !row.suppliedCoordinates);
  const heldSourceRows = rows.filter((row) => row.cohort !== "mwm_source_backed_candidate");
  const cohortCounts = Object.fromEntries(Object.entries(Object.groupBy(rows, (row) => row.cohort)).map(([cohort, values]) => [cohort, values.length]));
  const sourceReceiptRootHash = receipts.map((receipt) => receipt.receiptHash).join("\n");
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "offline_only_pin_readiness_report",
    sideEffects: "none",
    approvedRule: "Explicit traceable Black/African American or Latino/a/x/Hispanic designation only; no proxy inference.",
    receiptPolicyVersion: receipts[0]?.receiptVersion ?? null,
    sourceReceiptRootHash: (await import("node:crypto")).createHash("sha256").update(sourceReceiptRootHash).digest("hex"),
    manifestCount: files.length,
    cohortCounts,
    summary: {
      totalSourceRows: rows.length,
      narrowedMwmCoreCandidates: mwmCoreCandidates.length,
      physicalMwmCoreCandidates: physicalCandidates.length,
      physicalWithNumberedAddress: physicalCandidates.filter((row) => row.numberedStreetAddress).length,
      physicalWithOfficialCustomerDestination: physicalCandidates.filter((row) => Boolean(row.officialDestinationHost)).length,
      physicalWithSuppliedValidCoordinates: physicalCandidates.filter((row) => Boolean(row.suppliedCoordinates)).length,
      readyForReviewedPinnablePublication: readyForReviewedPinnablePublication.length,
      physicalAwaitingAuthorizedGeocode: physicalAwaitingAuthorizedGeocode.length,
      onlineOnlyCandidates: onlineOnlyCandidates.length,
      heldSourceRows: heldSourceRows.length,
    },
    rows: {
      readyForReviewedPinnablePublication,
      physicalAwaitingAuthorizedGeocode,
      onlineOnlyCandidates,
      heldSourceRows,
    },
  };

  await mkdir(dirname(jsonOut), { recursive: true });
  await mkdir(dirname(markdownOut), { recursive: true });
  await writeFile(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownOut, markdown(report));
  process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
