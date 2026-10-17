import { createHash } from "node:crypto";

export const VALIDATED_PRESENCE_BATCH_LIMIT = 50;
export const VALIDATED_PRESENCE_CONFIRMATION_PREFIX = "APPLY";

export type ExplicitOwnershipStatus =
  | "Black / African American-Owned"
  | "Latino / Hispanic-Owned"
  | "Black / African American-Owned; Latino / Hispanic-Owned";

export type AuthorizedOwnershipStatus = ExplicitOwnershipStatus | "Minority-Owned";

export type ValidatedPresenceBatchRow = {
  originalRowNumber: number;
  businessName: string;
  city: string;
  state: string;
  phone: string | null;
  authorizedOwnershipStatus: AuthorizedOwnershipStatus;
  authorizedOwnershipBasis: string;
  authorizedOwnershipSourceName: string;
  authorizedOwnershipSourceEvidence: string | null;
  qualifyingPresenceType: string;
  qualifyingUrls: string;
  validationRoute: string;
  validationTier: string;
  businessNameEvidence: string;
  locationEvidence: string;
  /** A public receipt for an ownership designation, or null for a local-source presence-only row. */
  sourceUrl: string | null;
  auditCaveat: string;
};

export type PresencePatch = Partial<Record<"website" | "phone" | "instagram" | "tiktok" | "facebook" | "twitter" | "youtube" | "pinterest", string>>;

const AUTHORIZED_OWNERSHIP_STATUS = new Set<AuthorizedOwnershipStatus>([
  "Black / African American-Owned",
  "Latino / Hispanic-Owned",
  "Black / African American-Owned; Latino / Hispanic-Owned",
  "Minority-Owned",
]);

/** Known non-URL provenance markers from the founder-approved validation file. */
const LOCAL_SOURCE_REFERENCES = new Set([
  "CURRENT_LOCAL_SEARCH",
  "LOCAL_BUSINESS_SEARCH",
  "LOCAL_BUSINESS_SEARCH_2026",
  "CURRENT LOCAL BUSINESS SEARCH_2026",
  "CURRENT_LOCAL_BUSINESS_EVIDENCE_2026",
]);

const SOCIAL_FIELD_BY_HOST_SUFFIX: Array<[string, Exclude<keyof PresencePatch, "website" | "phone">]> = [
  ["instagram.com", "instagram"],
  ["tiktok.com", "tiktok"],
  ["facebook.com", "facebook"],
  ["fb.com", "facebook"],
  ["twitter.com", "twitter"],
  ["x.com", "twitter"],
  ["youtube.com", "youtube"],
  ["youtu.be", "youtube"],
  ["pinterest.com", "pinterest"],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown, label: string, maximum: number, required = true): string | null {
  if ((value == null || value === "") && !required) return null;
  if (typeof value !== "string") throw new Error(`${label} must be text`);
  const text = value.trim();
  if (!text) {
    if (!required) return null;
    throw new Error(`${label} is required`);
  }
  if (text.length > maximum) throw new Error(`${label} must be ${maximum} characters or fewer`);
  if ([...text].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    throw new Error(`${label} contains invalid control characters`);
  }
  return text;
}

function cleanRowNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error("originalRowNumber must be a positive integer");
  return parsed;
}

function cleanPublicUrl(value: unknown, label: string): string {
  const text = cleanText(value, label, 2048) as string;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${label} must be a public http or https URL`);
  }
  const host = url.hostname.toLocaleLowerCase();
  const privateHost = host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (!/^https?:$/.test(url.protocol) || !host || privateHost) throw new Error(`${label} must be a public http or https URL`);
  url.hash = "";
  return url.toString();
}

/**
 * Local-source markers are allowed only for presence-only updates. They never
 * become an ownership receipt and cannot support a phone change.
 */
function cleanOwnershipSourceUrl(value: unknown): string | null {
  const text = cleanText(value, "sourceUrl", 2048) as string;
  try {
    return cleanPublicUrl(text, "sourceUrl");
  } catch {
    if (LOCAL_SOURCE_REFERENCES.has(text.toUpperCase())) return null;
    throw new Error("sourceUrl must be a public http or https URL or an approved local-source reference");
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function normalizedIdentityPart(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");
}

function sameHostOrSubdomain(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith(`.${suffix}`);
}

function socialFieldForUrl(value: string): Exclude<keyof PresencePatch, "website" | "phone"> | null {
  try {
    const host = new URL(value).hostname.toLocaleLowerCase();
    return SOCIAL_FIELD_BY_HOST_SUFFIX.find(([suffix]) => sameHostOrSubdomain(host, suffix))?.[1] ?? null;
  } catch {
    return null;
  }
}

function qualifyingUrls(value: string): string[] {
  const rawUrls = value.match(/https?:\/\/[^\s|]+/gi) ?? [];
  const normalized: string[] = [];
  for (const raw of rawUrls) {
    const url = raw.replace(/[),.;]+$/g, "");
    try {
      const normalizedUrl = cleanPublicUrl(url, "qualifying URL");
      if (!normalized.includes(normalizedUrl)) normalized.push(normalizedUrl);
    } catch {
      // A malformed extra token must not turn a separately valid source URL into
      // a stored fact. The complete row still fails below if no valid URL remains.
    }
  }
  return normalized;
}

export function ownershipDesignationsForValidatedPresence(status: AuthorizedOwnershipStatus): string[] {
  if (status === "Black / African American-Owned") return [status];
  if (status === "Latino / Hispanic-Owned") return [status];
  if (status === "Minority-Owned") return [status];
  return ["Black / African American-Owned", "Latino / Hispanic-Owned"];
}

/**
 * The browser sends only a selected slice of the founder-approved CSV. This
 * parser remains bound to 50 known rows and never accepts an email payload.
 * A local source marker permits directly validated website/social presence only;
 * it cannot become an ownership receipt or authorize a phone change.
 */
export function parseValidatedPresenceBatchRows(input: unknown): ValidatedPresenceBatchRow[] {
  if (!isRecord(input) || !Array.isArray(input.rows)) throw new Error("A validated presence batch with rows is required");
  if (input.rows.length < 1 || input.rows.length > VALIDATED_PRESENCE_BATCH_LIMIT) {
    throw new Error(`A validated presence batch must contain between 1 and ${VALIDATED_PRESENCE_BATCH_LIMIT} rows`);
  }

  const rows = input.rows.map((candidate): ValidatedPresenceBatchRow => {
    if (!isRecord(candidate)) throw new Error("Each validated presence row must be an object");
    if (Object.prototype.hasOwnProperty.call(candidate, "email")) throw new Error("Validated presence batches do not accept email fields");
    const ownership = cleanText(candidate.authorizedOwnershipStatus, "authorizedOwnershipStatus", 120) as string;
    if (!AUTHORIZED_OWNERSHIP_STATUS.has(ownership as AuthorizedOwnershipStatus)) {
      throw new Error("Only approved Black / African American-Owned, Latino / Hispanic-Owned, or Minority-Owned rows may be submitted in this batch");
    }
    const row: ValidatedPresenceBatchRow = {
      originalRowNumber: cleanRowNumber(candidate.originalRowNumber),
      businessName: cleanText(candidate.businessName, "businessName", 255) as string,
      city: cleanText(candidate.city, "city", 100) as string,
      state: (cleanText(candidate.state, "state", 50) as string).toUpperCase(),
      phone: cleanText(candidate.phone, "phone", 30, false),
      authorizedOwnershipStatus: ownership as AuthorizedOwnershipStatus,
      authorizedOwnershipBasis: cleanText(candidate.authorizedOwnershipBasis, "authorizedOwnershipBasis", 1000) as string,
      authorizedOwnershipSourceName: cleanText(candidate.authorizedOwnershipSourceName, "authorizedOwnershipSourceName", 255) as string,
      authorizedOwnershipSourceEvidence: cleanText(candidate.authorizedOwnershipSourceEvidence, "authorizedOwnershipSourceEvidence", 1000, false),
      qualifyingPresenceType: cleanText(candidate.qualifyingPresenceType, "qualifyingPresenceType", 100) as string,
      qualifyingUrls: cleanText(candidate.qualifyingUrls, "qualifyingUrls", 4096) as string,
      validationRoute: cleanText(candidate.validationRoute, "validationRoute", 1000) as string,
      validationTier: cleanText(candidate.validationTier, "validationTier", 1000) as string,
      businessNameEvidence: cleanText(candidate.businessNameEvidence, "businessNameEvidence", 1000) as string,
      locationEvidence: cleanText(candidate.locationEvidence, "locationEvidence", 1000) as string,
      sourceUrl: cleanOwnershipSourceUrl(candidate.sourceUrl),
      auditCaveat: cleanText(candidate.auditCaveat, "auditCaveat", 1000) as string,
    };
    if (qualifyingUrls(row.qualifyingUrls).length === 0) throw new Error("Each validated presence row must contain at least one public qualifying URL");
    return row;
  });

  const uniqueIdentities = new Set<string>();
  for (const row of rows) {
    const identity = [normalizedIdentityPart(row.businessName), normalizedIdentityPart(row.city), normalizedIdentityPart(row.state)].join("|");
    if (!identity || uniqueIdentities.has(identity)) throw new Error("Validated presence batch rows must have unique business name, city, and state identities");
    uniqueIdentities.add(identity);
  }
  return rows;
}

/** Returns only website/social/phone fields directly represented by the validation row. */
export function presencePatchFromValidatedRow(row: ValidatedPresenceBatchRow): PresencePatch {
  const patch: PresencePatch = {};
  const urls = qualifyingUrls(row.qualifyingUrls);
  for (const url of urls) {
    const socialField = socialFieldForUrl(url);
    if (socialField) {
      patch[socialField] ??= url;
      continue;
    }
    if (/website/i.test(row.qualifyingPresenceType)) patch.website ??= url;
  }
  // A phone value needs the public source receipt that ties it to this business.
  if (row.phone && row.sourceUrl) patch.phone = row.phone;
  return patch;
}

export function validatedPresenceOwnershipReceiptNote(row: ValidatedPresenceBatchRow): string {
  const parts = [
    row.authorizedOwnershipBasis,
    row.authorizedOwnershipSourceEvidence,
    `Validated presence: ${row.validationTier}.`,
  ].filter((value): value is string => Boolean(value?.trim()));
  return parts.join(" ").slice(0, 1000);
}

export function validatedPresenceBatchFingerprint(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function validatedPresenceApplyConfirmation(rowCount: number): string {
  return `${VALIDATED_PRESENCE_CONFIRMATION_PREFIX} ${rowCount} VALIDATED PRESENCE ${rowCount === 1 ? "RECORD" : "RECORDS"}`;
}
