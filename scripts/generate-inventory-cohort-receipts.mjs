#!/usr/bin/env node
/**
 * Offline-only inventory cohort preflight.
 *
 * Reads committed, signed review manifests and emits a deterministic row-level
 * receipt. It does NOT call an API, connect to a database, stage a candidate,
 * modify a listing, or enable publication. It is deliberately conservative:
 * a row is an MWM inclusion candidate only where the package explicitly states
 * a recognized diaspora ownership designation. No identity is inferred from a
 * name, photo, cuisine, language, city, neighborhood, or any other proxy.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const POLICY_VERSION = "source-receipted-directory-publication-v1";
const DIRECTORY_POLICY_VERSION = "directory-auto-review-v1";
const DEFAULT_ROOT = "data/founder-imports";
const DEFAULT_OUT = "artifacts/reports/inventory-cohort-preflight.jsonl";
const DEFAULT_SUMMARY = "artifacts/reports/inventory-cohort-preflight-summary.json";
const CHAMBER_COHORT = "mwm_chamber_backed_candidate";
const INSTITUTIONAL_COHORT = "mwm_institutional_directory_candidate";
const SOURCE_REPUTABLE_LISTING_COHORT = "source_reputable_listing_candidate";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
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
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !url.hostname) return null;
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function exactIdentity(record) {
  const kind = String(record.targetKind ?? record.target_kind ?? "manual_review");
  const name = normalize(record.name);
  const city = normalize(record.city);
  const state = normalize(record.state);
  const country = normalize(record.country ?? "United States");
  if (!name || !city || !country) return null;
  if (kind === "online_business") {
    const host = publicHost(record.website) ?? publicHost(record.socialSourceUrl ?? record.social_source_url);
    return host ? `online|${name}|${city}|${state}|${country}|${host}` : null;
  }
  const address = normalize(record.address);
  return address ? `physical|${name}|${city}|${state}|${country}|${address}` : null;
}

function directoryDecision(record, sourceRow, seenIdentities) {
  const targetKind = String(record.targetKind ?? record.target_kind ?? "manual_review");
  const name = normalize(record.name);
  const city = normalize(record.city);
  const country = normalize(record.country ?? "United States");
  const exceptions = [];
  if (!Number.isInteger(sourceRow) || sourceRow < 1) exceptions.push("invalid_source_row");
  if (!name || !city || !country) exceptions.push("incomplete_identity");
  if (targetKind === "internal_only") exceptions.push("internal_only");
  if (targetKind === "manual_review") exceptions.push("manual_review_target");
  if (targetKind === "cultural_place") exceptions.push("cultural_queue_only");
  if (targetKind === "community_resource") exceptions.push("resource_queue_only");
  if (targetKind === "regulated_review" || record.regulatedProfession === true || record.regulated_profession === true) exceptions.push("regulated_credential_review");
  const designations = Array.isArray(record.ownershipDesignations)
    ? record.ownershipDesignations
    : Array.isArray(record.ownership_designations) ? record.ownership_designations : [];
  if (designations.length) exceptions.push("ownership_evidence_review");
  if (record.destinationReachable === false || record.destination_reachable === false) exceptions.push("customer_destination_requires_review");
  const websiteHost = publicHost(record.website);
  const socialHost = publicHost(record.socialSourceUrl ?? record.social_source_url);
  if (targetKind === "business") {
    if (!String(record.address ?? "").trim() || !/\d/.test(String(record.address))) exceptions.push("numbered_street_address_required");
    if (!websiteHost && !socialHost) exceptions.push("official_customer_destination_required");
  }
  if (targetKind === "online_business") {
    if (String(record.address ?? "").trim()) exceptions.push("online_only_must_be_mapless");
    if (!websiteHost && !socialHost) exceptions.push("official_customer_destination_required");
  }
  const identity = exactIdentity(record);
  if (exceptions.includes("invalid_source_row") || exceptions.includes("incomplete_identity")) {
    return { outcome: "invalid", exceptionCodes: [...new Set(exceptions)], canonicalSourceRow: null, identity };
  }
  if (identity && seenIdentities.has(identity)) {
    return { outcome: "deduplicated", exceptionCodes: ["duplicate_within_batch"], canonicalSourceRow: seenIdentities.get(identity), identity };
  }
  if (identity) seenIdentities.set(identity, sourceRow);
  const uniqueExceptions = [...new Set(exceptions)];
  return {
    outcome: uniqueExceptions.length === 0 ? "auto_ready" : uniqueExceptions.some((code) => ["customer_destination_requires_review", "numbered_street_address_required", "incomplete_identity"].includes(code)) ? "needs_research" : "needs_review",
    exceptionCodes: uniqueExceptions,
    canonicalSourceRow: null,
    identity,
  };
}

/**
 * Source-reported MWM Core designation is deliberately positive-evidence only.
 * These patterns are applied to the explicit ownership/designation field from
 * a traceable source—not to a name, cuisine, language, image, location, or
 * other proxy. A listing without this explicit designation may still be
 * published as an *unverified source-reported listing* when the signed source,
 * physical/online listing contract, dedupe, and safety checks pass. It is not
 * placed in MWM Core designation filters until a source, owner claim, or later
 * verification process supplies the relevant evidence.
 */
const QUALIFYING_OWNERSHIP_PATTERNS = [
  /\bblack\b/,
  /\bafrican american\b/,
  /\bafro american\b/,
  /\blatino\b/,
  /\blatina\b/,
  /\blatinx\b/,
  /\bhispanic\b/,
];

/**
 * Chamber and institutional records remain separately labelled because they
 * can explicitly support MWM Core discovery. Other signed, reputable sources
 * can still produce an unverified listing; publication never upgrades them to
 * a Chamber or owner-verified designation.
 */
const CHAMBER_SOURCE_PATTERNS = [
  /\b(?:black|african american|african-american|hispanic|latino|latina|latinx)\b.*\bchamber\b/,
  /\bchamber\b.*\b(?:black|african american|african-american|hispanic|latino|latina|latinx)\b/,
];
const INSTITUTIONAL_DIRECTORY_SOURCE_PATTERNS = [
  /\bnaacp\b/,
  /\b(?:city|county|municipal|mayor|government|geo ?hub)\b/,
  /\b(?:tourism|tourist|visitor)\b/,
  /^(?:visit|destination)\b/,
  /\b(?:black|african american|african-american|hispanic|latino|latina|latinx)\b.*\b(?:business )?directory\b/,
  /\b(?:black pages|blackbook|black restaurant week|national business league|business network)\b/,
  /\b(?:alliance|association|council|community development|economic development)\b/,
  /\b(?:delta sigma theta|jack and jill|ame church)\b/,
];

function sourceEvidenceLane(record) {
  const sourceName = String(record.sourceName ?? record.source_name ?? "");
  const sourceUrl = String(record.sourceUrl ?? record.source_url ?? "");
  // A source URL path such as `/directory` is not evidence of the source's
  // governance. Classify from the source's declared name, with `.gov` as the
  // sole URL-based institutional signal.
  const sourceText = normalize(sourceName);
  if (CHAMBER_SOURCE_PATTERNS.some((pattern) => pattern.test(sourceText))) {
    return "chamber";
  }
  if (
    INSTITUTIONAL_DIRECTORY_SOURCE_PATTERNS.some((pattern) => pattern.test(sourceText))
    || /(?:^|\.)gov(?:\/|$)/.test(sourceUrl.toLowerCase())
  ) {
    return "institutional_directory";
  }
  return "editorial_or_promotional";
}

function missionDecision(record, directory) {
  const designations = Array.isArray(record.ownershipDesignations)
    ? record.ownershipDesignations.map(String)
    : Array.isArray(record.ownership_designations) ? record.ownership_designations.map(String) : [];
  const qualifying = designations.filter((designation) => QUALIFYING_OWNERSHIP_PATTERNS.some((pattern) => pattern.test(normalize(designation))));
  const targetKind = String(record.targetKind ?? record.target_kind ?? "manual_review");
  const sourceUrl = String(record.sourceUrl ?? record.source_url ?? "");
  const remainingDirectoryExceptions = directory.exceptionCodes.filter(
    (code) => code !== "ownership_evidence_review",
  );
  if (directory.outcome === "invalid") {
    return { cohort: "hold_invalid_source", eligibleForReleasePreview: false, reasons: directory.exceptionCodes };
  }
  if (directory.outcome === "deduplicated") {
    return { cohort: "hold_within_package_duplicate", eligibleForReleasePreview: false, reasons: directory.exceptionCodes };
  }
  // A signed source proves where a listing was found. It does not itself prove
  // an owner's identity unless its explicit designation field says so. Both
  // outcomes can be published when the directory contract passes, but only the
  // qualifying designation outcome is eligible for MWM Core filtering.
  if (
    (targetKind === "business" || targetKind === "online_business")
    && publicHost(sourceUrl)
    && remainingDirectoryExceptions.length === 0
  ) {
    const evidenceLane = sourceEvidenceLane(record);
    const publicationClassification = qualifying.length
      ? "source_reported_mwm_designation"
      : "unverified_source_listing";
    if (!qualifying.length) {
      return {
        cohort: SOURCE_REPUTABLE_LISTING_COHORT,
        evidenceLane: "reputable_source",
        eligibleForReleasePreview: true,
        publicationClassification,
        reasons: ["traceable_signed_reputable_source", "unverified_source_listing"],
      };
    }
    if (evidenceLane === "chamber") {
      return {
        cohort: CHAMBER_COHORT,
        evidenceLane,
        eligibleForReleasePreview: true,
        publicationClassification,
        reasons: ["traceable_chamber_source", ...(qualifying.length ? ["explicit_approved_mwm_core_designation"] : ["no_mwm_designation_asserted"]), ...qualifying.map((designation) => `designation:${normalize(designation)}`)],
      };
    }
    if (evidenceLane === "institutional_directory") {
      return {
        cohort: INSTITUTIONAL_COHORT,
        evidenceLane,
        eligibleForReleasePreview: true,
        publicationClassification,
        reasons: ["traceable_institutional_or_community_directory", ...(qualifying.length ? ["explicit_approved_mwm_core_designation"] : ["no_mwm_designation_asserted"]), ...qualifying.map((designation) => `designation:${normalize(designation)}`)],
      };
    }
    return {
      cohort: SOURCE_REPUTABLE_LISTING_COHORT,
      evidenceLane: "reputable_source",
      eligibleForReleasePreview: true,
      publicationClassification,
      reasons: ["traceable_signed_reputable_source", `source_lane:${evidenceLane}`, ...(qualifying.length ? ["explicit_source_reported_designation"] : ["unverified_source_listing"]), ...qualifying.map((designation) => `designation:${normalize(designation)}`)],
    };
  }
  if (remainingDirectoryExceptions.length > 0) {
    return {
      cohort: "hold_directory_evidence_required",
      evidenceLane: null,
      eligibleForReleasePreview: false,
      publicationClassification: qualifying.length ? "source_reported_mwm_designation" : "unverified_source_listing",
      reasons: [...remainingDirectoryExceptions, "source_listing_directory_evidence_incomplete"],
    };
  }
  return {
    cohort: "hold_source_provenance_required",
    evidenceLane: null,
    eligibleForReleasePreview: false,
    publicationClassification: qualifying.length ? "source_reported_mwm_designation" : "unverified_source_listing",
    reasons: ["traceable_source_directory_required"],
  };
}

/**
 * The protected ingress marks only a fully admitted immutable cohort row as
 * `sourceBackedMwmCore` before it invokes the automated review policy. That
 * removes the ordinary ownership-claim hold without changing any other
 * directory safety, address, destination, duplicate, or invalid-row rule.
 *
 * The offline receipt first performs the stricter unauthenticated check above
 * so that it can determine whether the row is eligible at all. Once it is
 * eligible, project the exact ingress outcome here. This keeps the receipt
 * count aligned with the stageable batch and prevents an operator from being
 * told that source-backed rows require individual ownership re-review.
 */
function protectedIngressDirectoryDecision(directory, mission) {
  if (!mission.eligibleForReleasePreview) return directory;
  const exceptionCodes = directory.exceptionCodes.filter(
    (code) => code !== "ownership_evidence_review",
  );
  return {
    ...directory,
    outcome: exceptionCodes.length === 0 ? "auto_ready" : directory.outcome,
    exceptionCodes,
  };
}

async function main() {
  const root = resolve(argValue("--root", DEFAULT_ROOT));
  const out = resolve(argValue("--out", DEFAULT_OUT));
  const summaryOut = resolve(argValue("--summary", DEFAULT_SUMMARY));
  const files = (await walk(root))
    .filter((file) => file.endsWith("-review-only-candidates.jsonl"))
    .sort();
  if (!files.length) throw new Error(`No review-only candidate manifests found under ${root}`);

  const receipts = [];
  const manifestSummaries = [];
  const globalFingerprints = new Map();
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const sourceSha256 = sha256(raw);
    const sourceName = relative(process.cwd(), file);
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const localIdentities = new Map();
    const counts = {};
    for (let index = 0; index < lines.length; index += 1) {
      const record = JSON.parse(lines[index]);
      const sourceRow = Number(record.sourceRow ?? record.source_row ?? index + 1);
      const sourceRowId = String(record.sourceRowId ?? record.source_row_id ?? sourceRow);
      const directory = directoryDecision(record, sourceRow, localIdentities);
      const mission = missionDecision(record, directory);
      const publicationDirectory = protectedIngressDirectoryDecision(directory, mission);
      const recordFingerprint = sha256(canonicalJson(record));
      const firstManifestFingerprint = globalFingerprints.get(recordFingerprint);
      if (firstManifestFingerprint && mission.eligibleForReleasePreview) {
        mission.cohort = "hold_cross_package_duplicate";
        mission.evidenceLane = null;
        mission.eligibleForReleasePreview = false;
        mission.reasons = ["duplicate_across_signed_packages", `first_seen:${firstManifestFingerprint}`];
      } else if (!firstManifestFingerprint) {
        globalFingerprints.set(recordFingerprint, `${sourceName}:${sourceRowId}`);
      }
      const receiptWithoutHash = {
        receiptVersion: POLICY_VERSION,
        sourceManifestSha256: sourceSha256,
        sourceManifest: sourceName,
        sourceRow,
        sourceRowId,
        recordFingerprint,
        directoryPolicyVersion: DIRECTORY_POLICY_VERSION,
        // `directoryOutcome` predicts protected ingress after its immutable
        // source-receipt admission. Keep the unauthenticated pre-admission
        // result as evidence rather than leaving an artificial manual queue.
        directoryOutcome: publicationDirectory.outcome,
        directoryExceptionCodes: publicationDirectory.exceptionCodes,
        directoryCanonicalSourceRow: publicationDirectory.canonicalSourceRow,
        preAdmissionDirectoryOutcome: directory.outcome,
        preAdmissionDirectoryExceptionCodes: directory.exceptionCodes,
        cohort: mission.cohort,
        evidenceLane: mission.evidenceLane ?? null,
        publicationClassification: mission.publicationClassification ?? null,
        eligibleForReleasePreview: mission.eligibleForReleasePreview,
        reasonCodes: mission.reasons,
        recordIdentity: {
          name: String(record.name ?? ""),
          city: String(record.city ?? ""),
          state: String(record.state ?? ""),
          country: String(record.country ?? "United States"),
          websiteHost: publicHost(record.website),
        },
        evidence: {
          sourceName: String(record.sourceName ?? record.source_name ?? ""),
          sourceUrl: String(record.sourceUrl ?? record.source_url ?? ""),
          sourceHost: publicHost(record.sourceUrl ?? record.source_url ?? ""),
          ownershipDesignations: Array.isArray(record.ownershipDesignations) ? record.ownershipDesignations : Array.isArray(record.ownership_designations) ? record.ownership_designations : [],
          targetKind: String(record.targetKind ?? record.target_kind ?? "manual_review"),
        },
      };
      const receipt = { ...receiptWithoutHash, receiptHash: sha256(canonicalJson(receiptWithoutHash)) };
      receipts.push(receipt);
      counts[receipt.cohort] = (counts[receipt.cohort] ?? 0) + 1;
    }
    manifestSummaries.push({ sourceManifest: sourceName, sourceManifestSha256: sourceSha256, rowCount: lines.length, cohorts: counts });
  }

  const cohorts = {};
  const directoryOutcomes = {};
  const evidenceLaneCounts = {};
  for (const receipt of receipts) {
    cohorts[receipt.cohort] = (cohorts[receipt.cohort] ?? 0) + 1;
    directoryOutcomes[receipt.directoryOutcome] = (directoryOutcomes[receipt.directoryOutcome] ?? 0) + 1;
    if (receipt.evidenceLane) evidenceLaneCounts[receipt.evidenceLane] = (evidenceLaneCounts[receipt.evidenceLane] ?? 0) + 1;
  }
  const rootHash = sha256(receipts.map((receipt) => receipt.receiptHash).join("\n"));
  const summary = {
    receiptVersion: POLICY_VERSION,
    generatedAt: new Date().toISOString(),
    mode: "offline_preflight_only",
    sideEffects: "none",
    publicationWorkerEnabled: false,
    stagingPerformed: false,
    manifests: manifestSummaries,
    manifestCount: files.length,
    sourceRowCount: receipts.length,
    cohortCounts: cohorts,
    evidenceLaneCounts,
    directoryOutcomeCounts: directoryOutcomes,
    rootReceiptHash: rootHash,
    releaseRule: "No record is authorized for staging, publication, or public visibility by this file. A separately signed source-receipted launch cohort may stage physical and online listings that pass the directory contract. Source-reported ownership is displayed as unverified unless and until an owner or approved verification process confirms it.",
  };
  await mkdir(dirname(out), { recursive: true });
  await mkdir(dirname(summaryOut), { recursive: true });
  await writeFile(out, `${receipts.map((receipt) => JSON.stringify(receipt)).join("\n")}\n`);
  await writeFile(summaryOut, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
