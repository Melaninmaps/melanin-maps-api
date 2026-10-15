#!/usr/bin/env node
/**
 * Build bounded, fingerprinted, source-receipted Admin manifests from official
 * website extraction packets. This is read-only: the audited Admin apply route
 * performs the current identity, scope, receipt, conflict, and lifecycle checks.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";

export const VERSION = "profile-enrichment-v2";
const DEFAULT_BASE = "docs/directory-operations/profile-enrichment";
const SOCIAL_FIELDS = new Set(["instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest"]);
const FIELD_TO_RECEIPT = {
  description: "description",
  hours: "hours",
  phone: "phone",
  tags: "service_tags",
  website: "website",
  instagram: "instagram",
  tiktok: "tiktok",
  facebook: "facebook",
  twitter: "twitter",
  youtube: "youtube",
  pinterest: "pinterest",
};

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function manifestFingerprint(value) {
  const { contentFingerprint: _ignored, ...withoutFingerprint } = value;
  return createHash("sha256").update(canonicalJson(withoutFingerprint)).digest("hex");
}

function readJsonl(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function receiptFor(field, accepted, page) {
  return {
    field: FIELD_TO_RECEIPT[field],
    sourceUrl: page.sourceUrl,
    sourceLabel: `Official ${page.title?.trim() || "website"} page`,
    observedAt: accepted.observedAt,
    confidence: accepted.confidence,
    note: `Official page evidence: ${accepted.evidenceQuote}`.slice(0, 1000),
  };
}

function socialReceipt(field, url, page, observedAt) {
  return {
    field: FIELD_TO_RECEIPT[field],
    sourceUrl: page.sourceUrl,
    sourceLabel: `Official ${page.title?.trim() || "website"} page`,
    observedAt,
    confidence: "high",
    note: `The official website includes this ${field} profile link: ${url}`.slice(0, 1000),
  };
}

function sourceSnapshotValue(snapshot, field) {
  const candidates = {
    instagram: ["Instagram", "instagram"],
    tiktok: ["TikTok", "Tiktok", "tiktok"],
    facebook: ["Facebook", "facebook"],
    twitter: ["Twitter", "X", "twitter"],
    youtube: ["YouTube", "Youtube", "youtube"],
    pinterest: ["Pinterest", "pinterest"],
  }[field] ?? [];
  return candidates.map((key) => String(snapshot?.[key] ?? "").trim()).find(Boolean) ?? "";
}

function genericDirectoryDescription(value) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
  return /\bbusiness in\b|\blisted by\b|\bblack business directory\b|\bcurrent public source\b/.test(normalized);
}

/**
 * Converts a validated extraction and its matching website packet to a bounded
 * manifest candidate. Social URLs come only from an anchor on the verified
 * official website; unknown or existing stored social links are not changed.
 */
export function candidateFromProposal(proposal, pagePacket) {
  const pages = pagePacket?.pages ?? [];
  const identityConfirmed = proposal.identityConfirmed || pagePacket?.disposition === "READY_FOR_EXTRACTION";
  if (!identityConfirmed || !pages[0]?.sourceUrl) return null;
  const patch = {};
  const fieldModes = {};
  const receipts = [];
  for (const accepted of proposal.accepted ?? []) {
    if (!FIELD_TO_RECEIPT[accepted.field] || Object.hasOwn(patch, accepted.field)) continue;
    const page = pages[accepted.sourcePageIndex];
    if (!page?.sourceUrl || !accepted.evidenceQuote || !accepted.observedAt) continue;
    patch[accepted.field] = accepted.value;
    fieldModes[accepted.field] = accepted.field === "tags"
      ? "append"
      : accepted.field === "description" && genericDirectoryDescription(proposal.sourceSnapshot?.Description)
        ? "replace_generic_directory"
        : "fill";
    receipts.push(receiptFor(accepted.field, accepted, page));
  }
  for (const [field, url] of Object.entries(pagePacket?.officialSocialLinks ?? {})) {
    if (!SOCIAL_FIELDS.has(field) || typeof url !== "string" || !url.trim() || Object.hasOwn(patch, field)) continue;
    if (sourceSnapshotValue(pagePacket.sourceSnapshot, field)) continue;
    patch[field] = url;
    fieldModes[field] = "fill";
    receipts.push(socialReceipt(field, url, pages[0], proposal.observedAt ?? pagePacket.completedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)));
  }
  if (Object.keys(patch).length === 0 || receipts.length !== Object.keys(patch).length) return null;
  return {
    businessId: proposal.businessId,
    expectedIdentity: {
      name: proposal.businessName,
      city: proposal.city,
      state: proposal.state,
      website: proposal.website || null,
    },
    patch,
    fieldModes,
    receipts,
  };
}

export function buildManifests(proposals, packets, {
  scope = "kinfolk_current",
  batchPrefix = "official-site-profile",
  generatedAt = new Date().toISOString(),
  batchSize = 100,
} = {}) {
  if (!["kinfolk_current", "non_kinfolk_current"].includes(scope)) throw new Error("scope must be kinfolk_current or non_kinfolk_current");
  const packetById = new Map(packets.map((packet) => [packet.businessId, packet]));
  const candidates = proposals.map((proposal) => candidateFromProposal(proposal, packetById.get(proposal.businessId))).filter(Boolean);
  const manifests = [];
  for (let index = 0; index < candidates.length; index += batchSize) {
    const batchNumber = String(Math.floor(index / batchSize) + 1).padStart(3, "0");
    const base = {
      version: VERSION,
      scope,
      batchId: `${batchPrefix}-${batchNumber}`,
      generatedAt,
      candidates: candidates.slice(index, index + batchSize),
    };
    manifests.push({ ...base, contentFingerprint: manifestFingerprint(base) });
  }
  return { candidates, manifests };
}

async function main() {
  const base = resolve(argValue("--base", DEFAULT_BASE));
  const proposalsPath = resolve(argValue("--proposals", `${base}/profile-enrichment-proposals.jsonl`));
  const pagesPath = resolve(argValue("--pages", `${base}/profile-enrichment-pages.jsonl`));
  const outputDirectory = resolve(argValue("--out", `${base}/apply-manifests`));
  const scope = argValue("--scope", "kinfolk_current");
  const batchPrefix = argValue("--batch-prefix", "official-site-profile");
  const generatedAt = argValue("--generated-at", new Date().toISOString());
  const [proposalsText, pagesText] = await Promise.all([fs.readFile(proposalsPath, "utf8"), fs.readFile(pagesPath, "utf8")]);
  const { candidates, manifests } = buildManifests(readJsonl(proposalsText), readJsonl(pagesText), { scope, batchPrefix, generatedAt });
  await fs.mkdir(outputDirectory, { recursive: true });
  for (const manifest of manifests) await fs.writeFile(resolve(outputDirectory, `${manifest.batchId}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const summary = {
    version: VERSION,
    scope,
    productionWrite: false,
    generatedAt,
    proposalsPath,
    pagesPath,
    candidateCount: candidates.length,
    batchCount: manifests.length,
    batches: manifests.map((manifest) => ({ batchId: manifest.batchId, candidateCount: manifest.candidates.length, contentFingerprint: manifest.contentFingerprint })),
  };
  await fs.writeFile(resolve(outputDirectory, "manifest-index.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`Built ${manifests.length} ${scope} profile enrichment manifests for ${candidates.length} business profiles. No production records were changed.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
