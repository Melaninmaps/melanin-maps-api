export const ADMIN_PROFILE_BLOCKED_FIELDS = new Set([
  "blackOwned",
  "verified",
  "verifiedDesignations",
  "listingStatus",
  "status",
  "profileStatus",
  "isDuplicate",
  "duplicateOfId",
  "permanentlyHidden",
  "latitude",
  "longitude",
]);

export type OwnershipSourceReceiptInput = {
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  note: string | null;
};

export type ValidatedAdminProfilePatch = {
  patch: Record<string, string | string[] | null>;
  ownershipReceipt: OwnershipSourceReceiptInput | null;
  changeNote: string;
  locationChanged: boolean;
};

type ExistingIdentity = {
  name: string;
  city: string | null;
  state: string | null;
  address: string | null;
  ownershipDesignations: string[] | null;
};

const OPTIONAL_TEXT_FIELDS: Record<string, { column: string; max: number }> = {
  description: { column: "description", max: 5000 },
  address: { column: "address", max: 255 },
  city: { column: "city", max: 100 },
  state: { column: "state", max: 50 },
  phone: { column: "phone", max: 30 },
  hours: { column: "hours", max: 255 },
  priceRange: { column: "price_range", max: 10 },
  instagram: { column: "instagram", max: 255 },
  tiktok: { column: "tiktok", max: 255 },
  facebook: { column: "facebook", max: 255 },
  twitter: { column: "twitter", max: 255 },
  youtube: { column: "youtube", max: 255 },
  pinterest: { column: "pinterest", max: 255 },
  category: { column: "category", max: 100 },
  subcategory: { column: "subcategory", max: 100 },
};

function own(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function cleanText(value: unknown, field: string, max: number, allowNull = true): string | null {
  if (value === null && allowNull) return null;
  if (typeof value !== "string") throw new Error(`${field} must be text`);
  const trimmed = value.trim();
  if (!trimmed) return allowNull ? null : (() => { throw new Error(`${field} is required`); })();
  if (trimmed.length > max) throw new Error(`${field} must be ${max} characters or fewer`);
  if ([...trimmed].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    throw new Error(`${field} contains invalid control characters`);
  }
  return trimmed;
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.")) return true;
  const match = host.match(/^172\.(\d{1,3})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

function cleanPublicUrl(value: unknown, field: string): string | null {
  const text = cleanText(value, field, 512);
  if (text === null) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${field} must be a valid public https or http URL`);
  }
  if (!/^https?:$/.test(url.protocol) || !url.hostname || isPrivateHostname(url.hostname)) {
    throw new Error(`${field} must be a valid public https or http URL`);
  }
  return url.toString();
}

function cleanSocial(value: unknown, field: string): string | null {
  const text = cleanText(value, field, 255);
  if (text === null) return null;
  if (/^@?[a-zA-Z0-9._-]{1,100}$/.test(text)) return text;
  return cleanPublicUrl(text, field);
}

function cleanStringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be a list`);
  if (value.length > 40) throw new Error(`${field} cannot contain more than 40 items`);
  const entries = value.map((entry) => cleanText(entry, field, 100, false) as string);
  return [...new Set(entries)];
}

function cleanOwnershipReceipt(value: unknown): OwnershipSourceReceiptInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("A source receipt is required for ownership designations");
  }
  const raw = value as Record<string, unknown>;
  const sourceUrl = cleanPublicUrl(raw.sourceUrl, "ownership source URL");
  const sourceLabel = cleanText(raw.sourceLabel, "ownership source label", 255, false) as string;
  const observedAt = cleanText(raw.observedAt, "ownership observation date", 10, false) as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt) || Number.isNaN(Date.parse(`${observedAt}T00:00:00Z`))) {
    throw new Error("ownership observation date must use YYYY-MM-DD");
  }
  return {
    sourceUrl: sourceUrl as string,
    sourceLabel,
    observedAt,
    note: cleanText(raw.note, "ownership receipt note", 1000),
  };
}

export function normalizeBusinessIdentityPart(value: string | null | undefined): string {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function validateAdminBusinessProfilePatch(
  input: unknown,
  existing: ExistingIdentity,
): ValidatedAdminProfilePatch {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("A profile patch object is required");
  }
  const raw = input as Record<string, unknown>;
  for (const blocked of ADMIN_PROFILE_BLOCKED_FIELDS) {
    if (own(raw, blocked)) {
      throw new Error(`${blocked} is governed by a separate reviewed workflow and cannot be changed here`);
    }
  }

  const changeNote = cleanText(raw.changeNote, "change note", 1000, false) as string;
  const patch: Record<string, string | string[] | null> = {};
  if (own(raw, "name")) patch.name = cleanText(raw.name, "name", 255, false) as string;
  if (own(raw, "website")) patch.website = cleanPublicUrl(raw.website, "website");
  for (const [field, config] of Object.entries(OPTIONAL_TEXT_FIELDS)) {
    if (!own(raw, field)) continue;
    const requiredStoredField = ["description", "city", "category", "subcategory"].includes(field);
    patch[config.column] = ["instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest"].includes(field)
      ? cleanSocial(raw[field], field)
      : cleanText(raw[field], field, config.max, !requiredStoredField);
  }
  if (own(raw, "priceRange") && patch.price_range && !["$", "$$", "$$$", "$$$$"].includes(String(patch.price_range))) {
    throw new Error("priceRange must be one of $, $$, $$$, or $$$$");
  }
  if (own(raw, "tags")) patch.tags = cleanStringList(raw.tags, "tags");
  if (own(raw, "vibes")) patch.vibes = cleanStringList(raw.vibes, "vibes");
  if (own(raw, "ownershipDesignations")) patch.ownership_designations = cleanStringList(raw.ownershipDesignations, "ownership designations");

  if (Object.keys(patch).length === 0) throw new Error("No editable profile fields were provided");

  const nextDesignations = (patch.ownership_designations ?? existing.ownershipDesignations ?? []) as string[];
  const priorDesignations = existing.ownershipDesignations ?? [];
  const designationChanged = JSON.stringify([...priorDesignations].sort()) !== JSON.stringify([...nextDesignations].sort());
  const hasReceipt = own(raw, "ownershipReceipt") && raw.ownershipReceipt !== null;
  const ownershipReceipt = hasReceipt ? cleanOwnershipReceipt(raw.ownershipReceipt) : null;
  if (designationChanged && nextDesignations.length > 0 && !ownershipReceipt) {
    throw new Error("A public source receipt is required before changing ownership designations");
  }

  const locationChanged = ["address", "city", "state"].some((column) =>
    own(patch, column) && String(patch[column] ?? "") !== String(existing[column as keyof ExistingIdentity] ?? ""),
  );
  return { patch, ownershipReceipt, changeNote, locationChanged };
}
