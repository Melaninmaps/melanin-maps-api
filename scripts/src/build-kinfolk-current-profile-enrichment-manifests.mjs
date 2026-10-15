#!/usr/bin/env node
/**
 * Build bounded, fingerprinted admin apply manifests from validated source-only
 * profile proposals. This script does not call the MWM API or write production
 * data; the server rechecks identity, scope, receipts, and empty-field status.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";

const VERSION = "kinfolk-current-profile-enrichment-v1";
const DEFAULT_BASE = "docs/directory-operations/kinfolk-current-profile-enrichment-2026-10-15";
const FIELD_TO_RECEIPT = { description: "description", hours: "hours", phone: "phone", tags: "service_tags" };

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

export function candidateFromProposal(proposal, pagePacket) {
  if (!proposal.identityConfirmed || !Array.isArray(proposal.accepted) || proposal.accepted.length === 0) return null;
  const pages = pagePacket?.pages ?? [];
  const patch = {};
  const receipts = [];
  for (const accepted of proposal.accepted) {
    if (!FIELD_TO_RECEIPT[accepted.field] || Object.hasOwn(patch, accepted.field)) continue;
    const page = pages[accepted.sourcePageIndex];
    if (!page?.sourceUrl || !accepted.evidenceQuote || !accepted.observedAt) continue;
    patch[accepted.field] = accepted.value;
    receipts.push(receiptFor(accepted.field, accepted, page));
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
    receipts,
  };
}

export function buildManifests(proposals, packets, { batchPrefix = "official-site-profile", generatedAt = new Date().toISOString(), batchSize = 100 } = {}) {
  const packetById = new Map(packets.map((packet) => [packet.businessId, packet]));
  const candidates = proposals.map((proposal) => candidateFromProposal(proposal, packetById.get(proposal.businessId))).filter(Boolean);
  const manifests = [];
  for (let index = 0; index < candidates.length; index += batchSize) {
    const batchNumber = String(Math.floor(index / batchSize) + 1).padStart(3, "0");
    const base = {
      version: VERSION,
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
  const batchPrefix = argValue("--batch-prefix", "official-site-profile");
  const generatedAt = argValue("--generated-at", new Date().toISOString());
  const [proposalsText, pagesText] = await Promise.all([fs.readFile(proposalsPath, "utf8"), fs.readFile(pagesPath, "utf8")]);
  const { candidates, manifests } = buildManifests(readJsonl(proposalsText), readJsonl(pagesText), { batchPrefix, generatedAt });
  await fs.mkdir(outputDirectory, { recursive: true });
  for (const manifest of manifests) await fs.writeFile(resolve(outputDirectory, `${manifest.batchId}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const summary = {
    version: VERSION,
    productionWrite: false,
    generatedAt,
    proposalsPath,
    pagesPath,
    candidateCount: candidates.length,
    batchCount: manifests.length,
    batches: manifests.map((manifest) => ({ batchId: manifest.batchId, candidateCount: manifest.candidates.length, contentFingerprint: manifest.contentFingerprint })),
  };
  await fs.writeFile(resolve(outputDirectory, "manifest-index.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`Built ${manifests.length} fill-only profile enrichment manifests for ${candidates.length} business profiles. No production records were changed.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
