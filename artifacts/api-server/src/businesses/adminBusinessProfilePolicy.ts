import { normalizeOfficialWebsiteDomain } from "./businessDuplicateIdentity";

export const ADMIN_PROFILE_BLOCKED_FIELDS = new Set([
  "blackOwned", "verified", "verifiedDesignations", "listingStatus", "status", "profileStatus",
  "isDuplicate", "duplicateOfId", "permanentlyHidden", "latitude", "longitude",
]);

/**
 * Aggregate member feedback belongs to its contributor/moderation workflow.  It
 * is never an administrator-owned business-profile fact, and a profile save
 * must neither replace nor clear it.
 */
export const ADMIN_PROFILE_COMMUNITY_SIGNAL_FIELDS = new Set([
  "communityVibes", "communityTags", "communityFeedback", "endorsements",
  "checkins", "reviews", "tiaApproved", "tiaSignals",
]);

export type OwnershipSourceReceiptInput = { sourceUrl: string; sourceLabel: string; observedAt: string; note: string | null };
export type ProfileFieldReceiptName = "identity" | "description" | "category" | "hours" | "price_range" | "phone" | "address" | "website" | "instagram" | "tiktok" | "facebook" | "service_tags" | "ownership";
export type ProfileFieldReceiptInput = { field: ProfileFieldReceiptName; sourceUrl: string; sourceLabel: string; observedAt: string; confidence: "high" | "medium" | "low"; note: string | null };
export type ValidatedAdminProfilePatch = { patch: Record<string, string | string[] | null>; ownershipReceipt: OwnershipSourceReceiptInput | null; fieldReceipts: ProfileFieldReceiptInput[]; requiredReceiptFields: ProfileFieldReceiptName[]; changeNote: string; locationChanged: boolean };

type ExistingProfile = {
  name: string; description?: string | null; address: string | null; city: string | null; state: string | null;
  phone?: string | null; website?: string | null; hours?: string | null; priceRange?: string | null; instagram?: string | null; tiktok?: string | null; facebook?: string | null;
  twitter?: string | null; youtube?: string | null; pinterest?: string | null; category?: string | null; subcategory?: string | null;
  tags?: string[] | null; vibes?: string[] | null; ownershipDesignations: string[] | null;
};

const OPTIONAL_TEXT_FIELDS: Record<string, { column: string; max: number }> = {
  description: { column: "description", max: 5000 }, address: { column: "address", max: 255 }, city: { column: "city", max: 100 }, state: { column: "state", max: 50 }, phone: { column: "phone", max: 30 }, hours: { column: "hours", max: 255 }, priceRange: { column: "price_range", max: 10 }, instagram: { column: "instagram", max: 255 }, tiktok: { column: "tiktok", max: 255 }, facebook: { column: "facebook", max: 255 }, twitter: { column: "twitter", max: 255 }, youtube: { column: "youtube", max: 255 }, pinterest: { column: "pinterest", max: 255 }, category: { column: "category", max: 100 }, subcategory: { column: "subcategory", max: 100 },
};
const RECEIPT_FIELDS = new Set<ProfileFieldReceiptName>(["identity", "description", "category", "hours", "price_range", "phone", "address", "website", "instagram", "tiktok", "facebook", "service_tags", "ownership"]);

function own(input: Record<string, unknown>, key: string): boolean { return Object.prototype.hasOwnProperty.call(input, key); }
function cleanText(value: unknown, field: string, max: number, allowNull = true): string | null {
  if (value === null && allowNull) return null;
  if (typeof value !== "string") throw new Error(`${field} must be text`);
  const trimmed = value.trim();
  if (!trimmed) return allowNull ? null : (() => { throw new Error(`${field} is required`); })();
  if (trimmed.length > max) throw new Error(`${field} must be ${max} characters or fewer`);
  if ([...trimmed].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) throw new Error(`${field} contains invalid control characters`);
  return trimmed;
}
function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase(); if (host === "localhost" || host.endsWith(".localhost") || host === "::1" || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.")) return true;
  const match = host.match(/^172\.(\d{1,3})\./); return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}
function cleanPublicUrl(value: unknown, field: string): string | null {
  const text = cleanText(value, field, 512); if (text === null) return null;
  let url: URL; try { url = new URL(text); } catch { throw new Error(`${field} must be a valid public https or http URL`); }
  if (!/^https?:$/.test(url.protocol) || !url.hostname || isPrivateHostname(url.hostname)) throw new Error(`${field} must be a valid public https or http URL`);
  return url.toString();
}
function cleanOfficialWebsite(value: unknown): string | null {
  const url = cleanPublicUrl(value, "website");
  if (url !== null && !normalizeOfficialWebsiteDomain(url)) {
    throw new Error("website must be the business’s own official website, not a directory or listing");
  }
  return url;
}
function cleanSocial(value: unknown, field: string): string | null {
  const text = cleanText(value, field, 255); if (text === null) return null;
  if (/^@?[a-zA-Z0-9._-]{1,100}$/.test(text)) return text;
  const url = cleanPublicUrl(text, field);
  const hostname = new URL(url as string).hostname.toLowerCase();
  const allowedHosts: Record<string, string[]> = {
    instagram: ["instagram.com"], tiktok: ["tiktok.com"], facebook: ["facebook.com", "fb.com"],
    twitter: ["twitter.com", "x.com"], youtube: ["youtube.com", "youtu.be"], pinterest: ["pinterest.com"],
  };
  const matchesPlatform = (allowedHosts[field] ?? []).some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
  if (!matchesPlatform) throw new Error(`${field} must be an official ${field} handle or URL`);
  return url;
}
function cleanStringList(value: unknown, field: string): string[] { if (!Array.isArray(value)) throw new Error(`${field} must be a list`); if (value.length > 40) throw new Error(`${field} cannot contain more than 40 items`); return [...new Set(value.map((entry) => cleanText(entry, field, 100, false) as string))]; }
function validObservedDate(value: unknown, field: string): string {
  const observedAt = cleanText(value, field, 10, false) as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt) || Number.isNaN(Date.parse(`${observedAt}T00:00:00Z`))) throw new Error(`${field} must use YYYY-MM-DD`);
  return observedAt;
}
function cleanOwnershipReceipt(value: unknown): OwnershipSourceReceiptInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("A source receipt is required for ownership designations");
  const raw = value as Record<string, unknown>;
  return { sourceUrl: cleanPublicUrl(raw.sourceUrl, "ownership source URL") as string, sourceLabel: cleanText(raw.sourceLabel, "ownership source label", 255, false) as string, observedAt: validObservedDate(raw.observedAt, "ownership observation date"), note: cleanText(raw.note, "ownership receipt note", 1000) };
}
function cleanFieldReceipt(value: unknown): ProfileFieldReceiptInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("sourceReceipts entries must be objects");
  const raw = value as Record<string, unknown>; const field = raw.field;
  if (!RECEIPT_FIELDS.has(field as ProfileFieldReceiptName)) throw new Error("source receipt field is invalid");
  const confidence = raw.confidence;
  if (confidence !== "high" && confidence !== "medium" && confidence !== "low") throw new Error("source receipt confidence is invalid");
  return { field: field as ProfileFieldReceiptName, sourceUrl: cleanPublicUrl(raw.sourceUrl, "source receipt URL") as string, sourceLabel: cleanText(raw.sourceLabel, "source receipt label", 255, false) as string, observedAt: validObservedDate(raw.observedAt, "source receipt observation date"), confidence, note: cleanText(raw.note, "source receipt note", 1000) };
}
function sameValue(a: unknown, b: unknown): boolean { return JSON.stringify(a ?? null) === JSON.stringify(b ?? null); }
function receiptFieldForColumn(column: string): ProfileFieldReceiptName | null {
  if (["name", "city", "state"].includes(column)) return "identity";
  if (column === "description") return "description";
  if (["category", "subcategory"].includes(column)) return "category";
  if (column === "hours") return "hours";
  if (column === "price_range") return "price_range";
  if (column === "phone") return "phone";
  if (column === "address") return "address";
  if (column === "website") return "website";
  if (["instagram", "tiktok", "facebook"].includes(column)) return column as ProfileFieldReceiptName;
  if (["twitter", "youtube", "pinterest"].includes(column)) return "service_tags";
  if (["tags", "vibes"].includes(column)) return "service_tags";
  if (column === "ownership_designations") return "ownership";
  return null;
}

export function normalizeBusinessIdentityPart(value: string | null | undefined): string { return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

export function validateAdminBusinessProfilePatch(input: unknown, existing: ExistingProfile): ValidatedAdminProfilePatch {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("A profile patch object is required");
  const raw = input as Record<string, unknown>;
  for (const blocked of ADMIN_PROFILE_BLOCKED_FIELDS) if (own(raw, blocked)) throw new Error(`${blocked} is governed by a separate reviewed workflow and cannot be changed here`);
  for (const field of ADMIN_PROFILE_COMMUNITY_SIGNAL_FIELDS) if (own(raw, field)) throw new Error(`${field} is community member information and cannot be changed by an official profile save`);
  const changeNote = cleanText(raw.changeNote, "change note", 1000, false) as string;
  const patch: Record<string, string | string[] | null> = {};
  if (own(raw, "name")) patch.name = cleanText(raw.name, "name", 255, false) as string;
  if (own(raw, "website")) patch.website = cleanOfficialWebsite(raw.website);
  for (const [field, config] of Object.entries(OPTIONAL_TEXT_FIELDS)) {
    if (!own(raw, field)) continue;
    const requiredStoredField = ["description", "city", "category", "subcategory"].includes(field);
    patch[config.column] = ["instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest"].includes(field) ? cleanSocial(raw[field], field) : cleanText(raw[field], field, config.max, !requiredStoredField);
  }
  if (own(raw, "priceRange") && patch.price_range && !["$", "$$", "$$$", "$$$$"].includes(String(patch.price_range))) throw new Error("priceRange must be one of $, $$, $$$, or $$$$");
  if (own(raw, "tags")) patch.tags = cleanStringList(raw.tags, "tags");
  if (own(raw, "vibes")) patch.vibes = cleanStringList(raw.vibes, "vibes");
  if (own(raw, "ownershipDesignations")) patch.ownership_designations = cleanStringList(raw.ownershipDesignations, "ownership designations");
  if (!Object.keys(patch).length) throw new Error("No editable profile fields were provided");
  const priorDesignations = existing.ownershipDesignations ?? [];
  const nextDesignations = (patch.ownership_designations ?? priorDesignations) as string[];
  const designationChanged = !sameValue([...priorDesignations].sort(), [...nextDesignations].sort());
  const ownershipReceipt = own(raw, "ownershipReceipt") && raw.ownershipReceipt !== null ? cleanOwnershipReceipt(raw.ownershipReceipt) : null;
  if (designationChanged && nextDesignations.length > 0 && !ownershipReceipt) throw new Error("A public source receipt is required before changing ownership designations");
  const rawReceipts = raw.sourceReceipts == null ? [] : raw.sourceReceipts;
  if (!Array.isArray(rawReceipts)) throw new Error("sourceReceipts must be a list");
  if (rawReceipts.length > 20) throw new Error("sourceReceipts cannot contain more than 20 items");
  const fieldReceipts = rawReceipts.map(cleanFieldReceipt);
  if (ownershipReceipt && !fieldReceipts.some((receipt) => receipt.field === "ownership")) fieldReceipts.push({ field: "ownership", sourceUrl: ownershipReceipt.sourceUrl, sourceLabel: ownershipReceipt.sourceLabel, observedAt: ownershipReceipt.observedAt, confidence: "high", note: ownershipReceipt.note });
  const receiptFields = new Set(fieldReceipts.map((receipt) => receipt.field));
  if (fieldReceipts.length !== receiptFields.size) throw new Error("Submit at most one source receipt per public fact field per save");
  const existingValue: Record<string, unknown> = { ...existing, price_range: existing.priceRange ?? null, ownership_designations: existing.ownershipDesignations ?? [] };
  const changedColumns = Object.entries(patch).filter(([column, next]) => !sameValue(existingValue[column], next)).map(([column]) => column);
  const requiredReceiptFields = [...new Set(changedColumns.map(receiptFieldForColumn).filter((field): field is ProfileFieldReceiptName => Boolean(field)))];
  const missing = requiredReceiptFields.filter((field) => !receiptFields.has(field));
  if (missing.length) throw new Error(`A public source receipt is required for: ${missing.join(", ")}`);
  const locationChanged = ["address", "city", "state"].some((column) => changedColumns.includes(column));
  return { patch, ownershipReceipt, fieldReceipts, requiredReceiptFields, changeNote, locationChanged };
}
