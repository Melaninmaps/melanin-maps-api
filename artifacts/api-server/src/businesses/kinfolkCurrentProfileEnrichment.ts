import { createHash } from "node:crypto";
import type { ProfileFieldReceiptName } from "./adminBusinessProfilePolicy";

/**
 * The original bounded Kinfolk Current manifest remains accepted so an already
 * reviewed batch cannot be invalidated. New manifests use this scope-aware
 * version and the same source-receipt / fingerprint contract.
 */
export const KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION = "kinfolk-current-profile-enrichment-v1" as const;
export const PROFILE_ENRICHMENT_MANIFEST_VERSION = "profile-enrichment-v2" as const;
export const KINFOLK_CURRENT_PROFILE_ENRICHMENT_FIELDS = ["description", "hours", "phone", "tags"] as const;
export const PROFILE_ENRICHMENT_FIELDS = [
  "description", "hours", "phone", "tags", "website",
  "instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest",
] as const;
export const PROFILE_ENRICHMENT_SOCIAL_FIELDS = [
  "instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest",
] as const;

/**
 * `non_kinfolk_current_all` permits the same additive, audited field enrichment
 * for retained staged records without changing their lifecycle or visibility.
 */
export type ProfileEnrichmentScope = "kinfolk_current" | "non_kinfolk_current" | "non_kinfolk_current_all";
export type EnrichmentPatchField = (typeof PROFILE_ENRICHMENT_FIELDS)[number];
export type EnrichmentPatchMode = "fill" | "append" | "replace_generic_directory" | "replace_verified_inactive" | "clear_invalid_social_link";
type ReceiptField = Extract<
  ProfileFieldReceiptName,
  "description" | "hours" | "phone" | "service_tags" | "website" |
  "instagram" | "tiktok" | "facebook" | "twitter" | "youtube" | "pinterest"
>;

export type ProfileEnrichmentReceipt = {
  field: ReceiptField;
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  confidence: "high" | "medium";
  note: string;
};

export type ProfileEnrichmentCandidate = {
  businessId: string;
  /** Current stored identity snapshot, rechecked inside the apply transaction. */
  expectedIdentity: { name: string; city: string; state: string; website: string | null };
  patch: Partial<Record<EnrichmentPatchField, string | string[]>>;
  /** Description can replace only a known generic directory placeholder; tags append only new values. */
  fieldModes: Partial<Record<EnrichmentPatchField, EnrichmentPatchMode>>;
  /** Required for replacing a nonempty website that was independently rechecked as inactive. */
  websiteRecovery?: { priorWebsite: string; priorWebsiteClassification: "REMOVE_CONFIRMED_INACTIVE"; checkedAt: string };
  receipts: ProfileEnrichmentReceipt[];
};

export type ProfileEnrichmentManifest = {
  version: typeof PROFILE_ENRICHMENT_MANIFEST_VERSION;
  scope: ProfileEnrichmentScope;
  batchId: string;
  generatedAt: string;
  contentFingerprint: string;
  candidates: ProfileEnrichmentCandidate[];
};

/** Backwards-compatible public types used by the already deployed Current-only control. */
export type KinfolkCurrentProfileEnrichmentReceipt = ProfileEnrichmentReceipt;
export type KinfolkCurrentProfileEnrichmentCandidate = ProfileEnrichmentCandidate;
export type KinfolkCurrentProfileEnrichmentManifest = {
  version: typeof KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION;
  batchId: string;
  generatedAt: string;
  contentFingerprint: string;
  candidates: ProfileEnrichmentCandidate[];
};

export type ParsedProfileEnrichmentManifest = {
  version: typeof KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION | typeof PROFILE_ENRICHMENT_MANIFEST_VERSION;
  scope: ProfileEnrichmentScope;
  batchId: string;
  generatedAt: string;
  contentFingerprint: string;
  candidates: ProfileEnrichmentCandidate[];
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

function isProfileEnrichmentSocialField(field: EnrichmentPatchField): field is (typeof PROFILE_ENRICHMENT_SOCIAL_FIELDS)[number] {
  return (PROFILE_ENRICHMENT_SOCIAL_FIELDS as readonly string[]).includes(field);
}

function isSupportedSocialHostname(field: (typeof PROFILE_ENRICHMENT_SOCIAL_FIELDS)[number], hostname: string): boolean {
  const allowedHosts: Record<(typeof PROFILE_ENRICHMENT_SOCIAL_FIELDS)[number], string[]> = {
    instagram: ["instagram.com"],
    tiktok: ["tiktok.com"],
    facebook: ["facebook.com", "fb.com"],
    twitter: ["twitter.com", "x.com"],
    youtube: ["youtube.com", "youtu.be"],
    pinterest: ["pinterest.com"],
  };
  return allowedHosts[field].some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
}

/**
 * Social anchors sometimes point to a platform share widget, rather than a
 * business profile. Those URLs must never be published as an official account.
 */
export function isProfileEnrichmentNonProfileSocialControlUrl(field: EnrichmentPatchField, value: unknown): boolean {
  if (!isProfileEnrichmentSocialField(field) || typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLocaleLowerCase();
    if (!/^https?:$/.test(url.protocol) || !isSupportedSocialHostname(field, hostname)) return false;
    const pathname = url.pathname.toLocaleLowerCase().replace(/\/+$/, "") || "/";
    const patterns: Partial<Record<(typeof PROFILE_ENRICHMENT_SOCIAL_FIELDS)[number], RegExp[]>> = {
      facebook: [/^\/(?:share|sharer)(?:\/|$)/, /^\/dialog\/share(?:\/|$)/],
      twitter: [/^\/(?:share|intent)(?:\/|$)/],
      pinterest: [/^\/pin\/create(?:\/|$)/],
    };
    return (patterns[field] ?? []).some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

/** Permits a handle or an actual profile URL, but not a share/intent widget. */
export function isProfileEnrichmentOfficialSocialLink(field: EnrichmentPatchField, value: unknown): boolean {
  if (!isProfileEnrichmentSocialField(field) || typeof value !== "string") return false;
  const text = value.trim();
  if (/^@?[a-zA-Z0-9._-]{1,100}$/.test(text)) return true;
  try {
    const url = new URL(text);
    const hostname = url.hostname.toLocaleLowerCase();
    if (!/^https?:$/.test(url.protocol) || !isSupportedSocialHostname(field, hostname)) return false;
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return pathname !== "/" && !isProfileEnrichmentNonProfileSocialControlUrl(field, text);
  } catch {
    return false;
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function valueWithoutFingerprint(value: Record<string, unknown>): Record<string, unknown> {
  const { contentFingerprint: _ignored, ...rest } = value;
  return rest;
}

export function profileEnrichmentFingerprint(value: Record<string, unknown>): string {
  const withoutFingerprint = "contentFingerprint" in value ? valueWithoutFingerprint(value) : value;
  return createHash("sha256").update(canonicalJson(withoutFingerprint)).digest("hex");
}

export function kinfolkCurrentProfileEnrichmentFingerprint(
  value: Omit<KinfolkCurrentProfileEnrichmentManifest, "contentFingerprint"> | KinfolkCurrentProfileEnrichmentManifest,
): string {
  const raw = value as unknown as Record<string, unknown>;
  const candidates = Array.isArray(raw.candidates)
    ? raw.candidates.map((candidate) => {
      if (!isRecord(candidate)) return candidate;
      const { fieldModes: _ignored, ...legacyCandidate } = candidate;
      return legacyCandidate;
    })
    : raw.candidates;
  return profileEnrichmentFingerprint({ ...raw, candidates });
}

function receiptFieldForPatch(field: EnrichmentPatchField): ReceiptField {
  return field === "tags" ? "service_tags" : field;
}

function defaultMode(field: EnrichmentPatchField): EnrichmentPatchMode {
  return field === "tags" ? "append" : "fill";
}

function parseFieldModes(input: unknown, patch: ProfileEnrichmentCandidate["patch"]): ProfileEnrichmentCandidate["fieldModes"] {
  if (input === undefined) return Object.fromEntries(Object.keys(patch).map((field) => [field, defaultMode(field as EnrichmentPatchField)]));
  if (!isRecord(input)) throw new Error("candidate fieldModes must be an object");
  const fieldModes: ProfileEnrichmentCandidate["fieldModes"] = {};
  for (const field of Object.keys(patch) as EnrichmentPatchField[]) {
    const mode = input[field] ?? defaultMode(field);
    if (mode !== "fill" && mode !== "append" && mode !== "replace_generic_directory" && mode !== "replace_verified_inactive" && mode !== "clear_invalid_social_link") throw new Error(`Unsupported enrichment mode for ${field}`);
    if (field === "tags" && mode !== "append") throw new Error("Service tags must use append mode");
    if (field !== "tags" && mode === "append") throw new Error(`${field} cannot use append mode`);
    if (field !== "description" && mode === "replace_generic_directory") throw new Error("Only descriptions may replace a generic directory placeholder");
    if (field !== "website" && mode === "replace_verified_inactive") throw new Error("Only websites may replace a verified inactive URL");
    if (mode === "clear_invalid_social_link" && !isProfileEnrichmentSocialField(field)) throw new Error("Only social profile fields may clear an invalid social link");
    if (mode === "clear_invalid_social_link" && !isProfileEnrichmentNonProfileSocialControlUrl(field, patch[field])) throw new Error("Invalid-social-link remediation must identify a social share or intent control URL");
    fieldModes[field] = mode;
  }
  for (const field of Object.keys(input)) {
    if (!(field in patch)) throw new Error(`fieldModes may only describe a proposed field: ${field}`);
  }
  return fieldModes;
}

function parseCandidate(input: unknown, allowedFields: readonly EnrichmentPatchField[]): ProfileEnrichmentCandidate {
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
  const patch: ProfileEnrichmentCandidate["patch"] = {};
  for (const [field, value] of Object.entries(input.patch)) {
    if (!(allowedFields as readonly string[]).includes(field)) throw new Error(`Unsupported enrichment field: ${field}`);
    if (field === "tags") {
      if (!Array.isArray(value) || value.length === 0 || value.length > 12) throw new Error("enrichment tags must contain between 1 and 12 values");
      patch.tags = [...new Set(value.map((tag) => cleanText(tag, "enrichment tag", 80) as string))];
      continue;
    }
    const max = field === "description" ? 700 : field === "hours" ? 255 : field === "phone" ? 30 : 512;
    patch[field as Exclude<EnrichmentPatchField, "tags">] = cleanText(value, `enrichment ${field}`, max) as string;
  }
  const changedFields = Object.keys(patch) as EnrichmentPatchField[];
  if (changedFields.length === 0) throw new Error("candidate patch must contain an allowed enrichment field");
  const fieldModes = parseFieldModes(input.fieldModes, patch);
  let websiteRecovery: ProfileEnrichmentCandidate["websiteRecovery"];
  if (fieldModes.website === "replace_verified_inactive") {
    if (!isRecord(input.websiteRecovery)) throw new Error("websiteRecovery is required for a verified inactive website replacement");
    const priorWebsite = cleanPublicUrl(input.websiteRecovery.priorWebsite, "websiteRecovery priorWebsite");
    const priorWebsiteClassification = cleanText(input.websiteRecovery.priorWebsiteClassification, "websiteRecovery classification", 80) as string;
    const checkedAt = cleanText(input.websiteRecovery.checkedAt, "websiteRecovery checkedAt", 10) as string;
    if (priorWebsiteClassification !== "REMOVE_CONFIRMED_INACTIVE") throw new Error("websiteRecovery requires a confirmed inactive prior website");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedAt) || Number.isNaN(Date.parse(`${checkedAt}T00:00:00Z`))) throw new Error("websiteRecovery checkedAt must use YYYY-MM-DD");
    if (!expectedIdentity.website || expectedIdentity.website !== priorWebsite) throw new Error("websiteRecovery prior website must match the expected current website");
    websiteRecovery = { priorWebsite, priorWebsiteClassification: "REMOVE_CONFIRMED_INACTIVE", checkedAt };
  } else if (input.websiteRecovery !== undefined) {
    throw new Error("websiteRecovery is only permitted for a verified inactive website replacement");
  }
  if (!Array.isArray(input.receipts) || input.receipts.length !== changedFields.length) throw new Error("candidate receipts must contain exactly one receipt for each proposed field");
  const receipts = input.receipts.map((receipt): ProfileEnrichmentReceipt => {
    if (!isRecord(receipt)) throw new Error("candidate receipt must be an object");
    const field = cleanText(receipt.field, "candidate receipt field", 50) as ReceiptField;
    if (!( ["description", "hours", "phone", "service_tags", "website", "instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest"] as const).includes(field)) throw new Error("candidate receipt field is unsupported");
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
  return { businessId, expectedIdentity, patch, fieldModes, ...(websiteRecovery ? { websiteRecovery } : {}), receipts };
}

function parseMetadata(input: Record<string, unknown>): Pick<ParsedProfileEnrichmentManifest, "batchId" | "generatedAt" | "contentFingerprint"> {
  const batchId = cleanText(input.batchId, "manifest batchId", 100) as string;
  const generatedAt = cleanText(input.generatedAt, "manifest generatedAt", 40) as string;
  if (Number.isNaN(Date.parse(generatedAt))) throw new Error("manifest generatedAt must be an ISO timestamp");
  const contentFingerprint = cleanText(input.contentFingerprint, "manifest contentFingerprint", 64) as string;
  if (!/^[a-f0-9]{64}$/i.test(contentFingerprint)) throw new Error("manifest contentFingerprint must be a SHA-256 hexadecimal digest");
  return { batchId, generatedAt, contentFingerprint };
}

function assertCandidateBounds(candidates: ProfileEnrichmentCandidate[]): void {
  if (candidates.length === 0 || candidates.length > 100) throw new Error("manifest must contain between 1 and 100 enrichment candidates");
  if (new Set(candidates.map((candidate) => candidate.businessId)).size !== candidates.length) throw new Error("manifest candidates must not repeat a businessId");
}

export function parseKinfolkCurrentProfileEnrichmentManifest(input: unknown): KinfolkCurrentProfileEnrichmentManifest {
  if (!isRecord(input)) throw new Error("A profile enrichment manifest object is required");
  if (input.version !== KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION) throw new Error("Unsupported profile enrichment manifest version");
  const { batchId, generatedAt, contentFingerprint } = parseMetadata(input);
  if (!Array.isArray(input.candidates)) throw new Error("manifest candidates are required");
  const candidates = input.candidates.map((candidate) => parseCandidate(candidate, KINFOLK_CURRENT_PROFILE_ENRICHMENT_FIELDS));
  assertCandidateBounds(candidates);
  const legacyCandidates = candidates.map(({ fieldModes: _ignored, ...candidate }) => candidate);
  const fingerprintPayload = { version: KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION, batchId, generatedAt, candidates: legacyCandidates };
  if (profileEnrichmentFingerprint(fingerprintPayload as unknown as Record<string, unknown>) !== contentFingerprint) throw new Error("manifest content fingerprint does not match its content");
  return { version: KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION, batchId, generatedAt, contentFingerprint, candidates };
}

export function parseProfileEnrichmentManifest(input: unknown): ParsedProfileEnrichmentManifest {
  if (!isRecord(input)) throw new Error("A profile enrichment manifest object is required");
  if (input.version === KINFOLK_CURRENT_PROFILE_ENRICHMENT_MANIFEST_VERSION) {
    const legacy = parseKinfolkCurrentProfileEnrichmentManifest(input);
    return { ...legacy, scope: "kinfolk_current" };
  }
  if (input.version !== PROFILE_ENRICHMENT_MANIFEST_VERSION) throw new Error("Unsupported profile enrichment manifest version");
  if (input.scope !== "kinfolk_current" && input.scope !== "non_kinfolk_current" && input.scope !== "non_kinfolk_current_all") {
    throw new Error("manifest scope must be kinfolk_current, non_kinfolk_current, or non_kinfolk_current_all");
  }
  const { batchId, generatedAt, contentFingerprint } = parseMetadata(input);
  if (!Array.isArray(input.candidates)) throw new Error("manifest candidates are required");
  const candidates = input.candidates.map((candidate) => parseCandidate(candidate, PROFILE_ENRICHMENT_FIELDS));
  assertCandidateBounds(candidates);
  const manifest: ProfileEnrichmentManifest = {
    version: PROFILE_ENRICHMENT_MANIFEST_VERSION,
    scope: input.scope,
    batchId,
    generatedAt,
    contentFingerprint,
    candidates,
  };
  if (profileEnrichmentFingerprint(manifest as unknown as Record<string, unknown>) !== contentFingerprint) throw new Error("manifest content fingerprint does not match its content");
  return manifest;
}

export function isEmptyProfileEnrichmentField(field: EnrichmentPatchField, value: unknown): boolean {
  if (field === "tags") return !Array.isArray(value) || value.length === 0;
  return !String(value ?? "").trim();
}

function normalizedPlaceholderText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * An automated official-site enrichment may replace only a short generic
 * description that contributes no business-specific information. This keeps a
 * high-confidence first-party fact from being blocked by legacy import labels
 * such as "Barber" while preserving every substantive existing description.
 */
export function isGenericProfileEnrichmentDescriptionPlaceholder(
  value: unknown,
): boolean {
  const normalized = normalizedPlaceholderText(value);
  if (!normalized) return false;
  const genericLabels = new Set([
    "business",
    "barber",
    "barbershop",
    "hair salon",
    "restaurant",
    "beauty hair",
    "beauty personal care",
    "food drink",
    "food beverage",
    "health wellness",
    "professional services",
    "arts culture",
    "retail shopping",
    "faith community",
    "home trades",
    "childcare education",
    "fashion",
    "retail",
    "store",
    "shop",
    "not provided",
    "not available",
    "n a",
    "tbd",
    "coming soon",
  ]);
  if (genericLabels.has(normalized)) return true;

  // Imported source cohorts sometimes placed a short ownership/cuisine label
  // or a source-directory boilerplate sentence in `description`. Those are
  // not business-specific profile copy, so a high-confidence first-party
  // description may replace them. This remains a closed, deliberately narrow
  // set; a descriptive sentence that happens to mention Black ownership is
  // still preserved.
  const genericOwnershipLabels = new Set([
    "black owned",
    "black owned jamaican caribbean",
    "black american southern",
  ]);
  if (genericOwnershipLabels.has(normalized)) return true;
  return [
    /^black owned directory listing .+$/,
    /^black owned black business ecosystem directory evidence (?:is )?current to \d{4} .+$/,
  ].some((pattern) => pattern.test(normalized));
}
