import { createHash } from "node:crypto";
import type { ProfileFieldReceiptName } from "./adminBusinessProfilePolicy";

export const KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION = "kinfolk-current-profile-enrichment-v1" as const;
export const KINFOLK_CURRENT_PROFILE_ENRICHMENT_FIELDS = ["description", "hours", "phone", "tags"] as const;
type EnrichmentPatchField = (typeof KINFOLK_CURRENT_PROFILE_ENRICHMENT_FIELDS)[number];
type ReceiptField = Extract<ProfileFieldReceiptName, "description" | "hours" | "phone" | "service_tags">;

export type KinfolkCurrentProfileEnrichmentReceipt = {
  field: ReceiptField;
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  confidence: "high" | "medium";
  note: string;
};

export type KinfolkCurrentProfileEnrichmentCandidate = {
  businessId: string;
  expectedIdentity: { name: string; city: string; state: string; website: string | null };
  patch: Partial<Record<EnrichmentPatchField, string | string[]>>;
  receipts: KinfolkCurrentProfileEnrichmentReceipt[];
};

export type KinfolkCurrentProfileEnrichmentManifest = {
  version: typeof KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION;
  batchId: string;
  generatedAt: string;
  contentFingerprint: string;
  candidates: KinfolkCurrentProfileEnrichmentCandidate[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown, label: string, maximum: number, required = true): string | null {
  if (value === null && !required) return null;
  if (typeof value !== "string") throw new Error(`${label} must be text`);
  const result = value.trim();
  if (!result) {
    if (!required) return null;
    throw new Error(`${label} is required`);
  }
  if (result.length > maximum) throw new Error(`${label} must be ${maximum} characters or fewer`);
  if ([...result].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) throw new Error(`${label} contains invalid control characters`);
  return result;
}

function cleanPublicUrl(value: unknown, label: string): string {
  const candidate = cleanText(value, label, 512) as string;
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error(`${label} must be a public http or https URL`); }
  const host = url.hostname.toLocaleLowerCase();
  const privateHost = host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (!/^https?:$/.test(url.protocol) || !url.hostname || privateHost) throw new Error(`${label} must be a public http or https URL`);
  url.hash = "";
  return url.toString();
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function valueWithoutFingerprint(value: KinfolkCurrentProfileEnrichmentManifest): Record<string, unknown> {
  const { contentFingerprint: _ignored, ...rest } = value;
  return rest;
}

export function kinfolkCurrentProfileEnrichmentFingerprint(value: Omit<KinfolkCurrentProfileEnrichmentManifest, "contentFingerprint"> | KinfolkCurrentProfileEnrichmentManifest): string {
  const withoutFingerprint = isRecord(value) && "contentFingerprint" in value
    ? valueWithoutFingerprint(value as KinfolkCurrentProfileEnrichmentManifest)
    : value;
  return createHash("sha256").update(canonicalJson(withoutFingerprint)).digest("hex");
}

function receiptFieldForPatch(field: EnrichmentPatchField): ReceiptField {
  return field === "tags" ? "service_tags" : field;
}

function parseCandidate(input: unknown): KinfolkCurrentProfileEnrichmentCandidate {
  if (!isRecord(input)) throw new Error("Each enrichment candidate must be an object");
  const businessId = cleanText(input.businessId, "candidate businessId", 255) as string;
  if (!isRecord(input.expectedIdentity)) throw new Error("candidate expectedIdentity is required");
  const expectedIdentity = {
    name: cleanText(input.expectedIdentity.name, "expected identity name", 255) as string,
    city: cleanText(input.expectedIdentity.city, "expected identity city", 100) as string,
    state: cleanText(input.expectedIdentity.state, "expected identity state", 50) as string,
    website: input.expectedIdentity.website == null ? null : cleanPublicUrl(input.expectedIdentity.website, "expected identity website"),
  };
  if (!isRecord(input.patch)) throw new Error("candidate patch is required");
  const patch: KinfolkCurrentProfileEnrichmentCandidate["patch"] = {};
  for (const [field, value] of Object.entries(input.patch)) {
    if (!(KINFOLK_CURRENT_PROFILE_ENRICHMENT_FIELDS as readonly string[]).includes(field)) throw new Error(`Unsupported enrichment field: ${field}`);
    if (field === "tags") {
      if (!Array.isArray(value) || value.length === 0 || value.length > 12) throw new Error("enrichment tags must contain between 1 and 12 values");
      patch.tags = [...new Set(value.map((tag) => cleanText(tag, "enrichment tag", 80) as string))];
    } else {
      const max = field === "description" ? 700 : field === "hours" ? 255 : 30;
      patch[field as Exclude<EnrichmentPatchField, "tags">] = cleanText(value, `enrichment ${field}`, max) as string;
    }
  }
  const changedFields = Object.keys(patch) as EnrichmentPatchField[];
  if (changedFields.length === 0) throw new Error("candidate patch must contain an allowed enrichment field");
  if (!Array.isArray(input.receipts) || input.receipts.length !== changedFields.length) throw new Error("candidate receipts must contain exactly one receipt for each proposed field");
  const receipts = input.receipts.map((receipt): KinfolkCurrentProfileEnrichmentReceipt => {
    if (!isRecord(receipt)) throw new Error("candidate receipt must be an object");
    const field = cleanText(receipt.field, "candidate receipt field", 50) as ReceiptField;
    if (!(["description", "hours", "phone", "service_tags"] as const).includes(field)) throw new Error("candidate receipt field is unsupported");
    const confidence = receipt.confidence;
    if (confidence !== "high" && confidence !== "medium") throw new Error("candidate receipt confidence must be high or medium");
    const observedAt = cleanText(receipt.observedAt, "candidate receipt observedAt", 10) as string;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt) || Number.isNaN(Date.parse(`${observedAt}T00:00:00Z`))) throw new Error("candidate receipt observedAt must use YYYY-MM-DD");
    return {
      field,
      sourceUrl: cleanPublicUrl(receipt.sourceUrl, "candidate receipt sourceUrl"),
      sourceLabel: cleanText(receipt.sourceLabel, "candidate receipt sourceLabel", 255) as string,
      observedAt,
      confidence,
      note: cleanText(receipt.note, "candidate receipt note", 1000) as string,
    };
  });
  const receiptFields = new Set(receipts.map((receipt) => receipt.field));
  if (receiptFields.size !== receipts.length) throw new Error("candidate receipts must not repeat a field");
  for (const field of changedFields) {
    if (!receiptFields.has(receiptFieldForPatch(field))) throw new Error(`candidate patch ${field} is missing its field receipt`);
  }
  return { businessId, expectedIdentity, patch, receipts };
}

export function parseKinfolkCurrentProfileEnrichmentManifest(input: unknown): KinfolkCurrentProfileEnrichmentManifest {
  if (!isRecord(input)) throw new Error("A profile enrichment manifest object is required");
  if (input.version !== KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION) throw new Error("Unsupported profile enrichment manifest version");
  const batchId = cleanText(input.batchId, "manifest batchId", 100) as string;
  const generatedAt = cleanText(input.generatedAt, "manifest generatedAt", 40) as string;
  if (Number.isNaN(Date.parse(generatedAt))) throw new Error("manifest generatedAt must be an ISO timestamp");
  const contentFingerprint = cleanText(input.contentFingerprint, "manifest contentFingerprint", 64) as string;
  if (!/^[a-f0-9]{64}$/i.test(contentFingerprint)) throw new Error("manifest contentFingerprint must be a SHA-256 hexadecimal digest");
  if (!Array.isArray(input.candidates) || input.candidates.length === 0 || input.candidates.length > 100) throw new Error("manifest must contain between 1 and 100 enrichment candidates");
  const candidates = input.candidates.map(parseCandidate);
  if (new Set(candidates.map((candidate) => candidate.businessId)).size !== candidates.length) throw new Error("manifest candidates must not repeat a businessId");
  const manifest: KinfolkCurrentProfileEnrichmentManifest = { version: KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION, batchId, generatedAt, contentFingerprint, candidates };
  if (kinfolkCurrentProfileEnrichmentFingerprint(manifest) !== contentFingerprint) throw new Error("manifest content fingerprint does not match its content");
  return manifest;
}

export function isEmptyProfileEnrichmentField(field: EnrichmentPatchField, value: unknown): boolean {
  if (field === "tags") return !Array.isArray(value) || value.length === 0;
  return !String(value ?? "").trim();
}
