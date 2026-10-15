#!/usr/bin/env node
/**
 * Build bounded, fingerprinted, source-receipted Admin manifests from official
 * website extraction packets. This is read-only: the audited Admin apply route
 * performs current identity, scope, receipt, conflict, and lifecycle checks.
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

function boundedBatchSize(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("--batch-size must be an integer between 1 and 100");
  }
  return parsed;
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

function hasControlCharacter(value) {
  return /[\u0000-\u001F\u007F]/.test(String(value ?? ""));
}

function strictText(value, maximum) {
  if (typeof value !== "string" || hasControlCharacter(value)) return null;
  const result = value.trim();
  return result && result.length <= maximum ? result : null;
}

function displayText(value, maximum, fallback) {
  const result = String(value ?? "").replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
  return result || fallback;
}

function publicHttpUrl(value) {
  const text = strictText(value, 512);
  if (!text) return null;
  try {
    const url = new URL(text);
    const host = url.hostname.toLocaleLowerCase();
    const privateHost = host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    if (!/^https?:$/.test(url.protocol) || !host || privateHost) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function observationDate(value) {
  const text = strictText(value, 10);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? text : null;
}

function validFieldValue(field, value) {
  if (field === "tags") {
    if (!Array.isArray(value) || value.length === 0 || value.length > 12) return null;
    const tags = [...new Set(value.map((tag) => strictText(tag, 80)).filter(Boolean))];
    return tags.length ? tags : null;
  }
  const maximum = field === "description" ? 700 : field === "hours" ? 255 : 30;
  const text = strictText(value, maximum);
  if (!text) return null;
  if (field === "phone") {
    const digitCount = text.replace(/\D/g, "").length;
    if (digitCount < 7 || digitCount > 15) return null;
  }
  return text;
}

function receiptFor(field, accepted, page, observedAt, sourceUrl) {
  const evidenceQuote = displayText(accepted.evidenceQuote, 900, "Official website page evidence.");
  return {
    field: FIELD_TO_RECEIPT[field],
    sourceUrl,
    sourceLabel: displayText(`Official ${page.title?.trim() || "website"} page`, 255, "Official website page"),
    observedAt,
    confidence: accepted.confidence,
    note: displayText(`Official page evidence: ${evidenceQuote}`, 1000, "Official website page evidence."),
  };
}

function socialReceipt(field, url, page, observedAt, sourceUrl) {
  return {
    field: FIELD_TO_RECEIPT[field],
    sourceUrl,
    sourceLabel: displayText(`Official ${page.title?.trim() || "website"} page`, 255, "Official website page"),
    observedAt,
    confidence: "high",
    note: displayText(`The official website includes this ${field} profile link: ${url}`, 1000, "Official website social link."),
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

/**
 * Converts a validated extraction and its matching website packet to a bounded
 * manifest candidate. Social URLs come only from an anchor on the verified
 * official website; unknown or existing stored social links are not changed.
 */
export function candidateFromProposal(proposal, pagePacket) {
  const pages = pagePacket?.pages ?? [];
  const identityConfirmed = proposal?.identityConfirmed || pagePacket?.disposition === "READY_FOR_EXTRACTION";
  const businessId = strictText(proposal?.businessId, 255);
  const name = strictText(proposal?.businessName, 255);
  const city = strictText(proposal?.city, 100);
  const state = strictText(proposal?.state, 50);
  const website = proposal?.website ? publicHttpUrl(proposal.website) : null;
  const observedAt = observationDate(proposal?.observedAt ?? pagePacket?.completedAt?.slice(0, 10));
  if (!identityConfirmed || !businessId || !name || !city || !state || !observedAt || (proposal?.website && !website)) return null;

  const patch = {};
  const fieldModes = {};
  const receipts = [];
  for (const accepted of proposal?.accepted ?? []) {
    const field = accepted?.field;
    if (!FIELD_TO_RECEIPT[field] || Object.hasOwn(patch, field)) continue;
    const page = pages[accepted.sourcePageIndex];
    const sourceUrl = publicHttpUrl(page?.sourceUrl);
    const value = validFieldValue(field, accepted?.value);
    if (!sourceUrl || !value || !strictText(accepted?.evidenceQuote, 600) || !["high", "medium"].includes(accepted?.confidence)) continue;
    patch[field] = value;
    // The verified source packet does not include every stored profile
    // description. The server freshly checks the current value and only
    // replaces its closed list of generic directory labels; all substantive
    // descriptions remain untouched.
    fieldModes[field] = field === "tags"
      ? "append"
      : field === "description" && accepted.confidence === "high"
        ? "replace_generic_directory"
        : "fill";
    receipts.push(receiptFor(field, accepted, page, observedAt, sourceUrl));
  }
  const socialPage = pages[0];
  const socialSourceUrl = publicHttpUrl(socialPage?.sourceUrl);
  for (const [field, rawUrl] of Object.entries(pagePacket?.officialSocialLinks ?? {})) {
    const url = publicHttpUrl(rawUrl);
    if (!SOCIAL_FIELDS.has(field) || !url || !socialSourceUrl || Object.hasOwn(patch, field)) continue;
    if (sourceSnapshotValue(pagePacket.sourceSnapshot, field)) continue;
    patch[field] = url;
    fieldModes[field] = "fill";
    receipts.push(socialReceipt(field, url, socialPage, observedAt, socialSourceUrl));
  }
  if (Object.keys(patch).length === 0 || receipts.length !== Object.keys(patch).length) return null;
  return {
    businessId,
    expectedIdentity: { name, city, state, website },
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
  if (!["kinfolk_current", "non_kinfolk_current", "non_kinfolk_current_all"].includes(scope)) {
    throw new Error("scope must be kinfolk_current, non_kinfolk_current, or non_kinfolk_current_all");
  }
  const packetById = new Map(packets.map((packet) => [packet.businessId, packet]));
  const candidates = proposals.map((proposal) => candidateFromProposal(proposal, packetById.get(proposal.businessId))).filter(Boolean);
  const manifests = [];
  for (let index = 0; index < candidates.length; index += batchSize) {
    const batchNumber = String(Math.floor(index / batchSize) + 1).padStart(3, "0");
    const base = { version: VERSION, scope, batchId: `${batchPrefix}-${batchNumber}`, generatedAt, candidates: candidates.slice(index, index + batchSize) };
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
  const batchSize = boundedBatchSize(argValue("--batch-size", "100"));
  const [proposalsText, pagesText] = await Promise.all([fs.readFile(proposalsPath, "utf8"), fs.readFile(pagesPath, "utf8")]);
  const { candidates, manifests } = buildManifests(readJsonl(proposalsText), readJsonl(pagesText), { scope, batchPrefix, generatedAt, batchSize });
  await fs.mkdir(outputDirectory, { recursive: true });
  for (const manifest of manifests) await fs.writeFile(resolve(outputDirectory, `${manifest.batchId}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const summary = { version: VERSION, scope, productionWrite: false, generatedAt, proposalsPath, pagesPath, candidateCount: candidates.length, batchCount: manifests.length, batches: manifests.map((manifest) => ({ batchId: manifest.batchId, candidateCount: manifest.candidates.length, contentFingerprint: manifest.contentFingerprint })) };
  await fs.writeFile(resolve(outputDirectory, "manifest-index.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`Built ${manifests.length} ${scope} source-receipted profile enrichment manifests for ${candidates.length} business profiles. No production records were changed.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
