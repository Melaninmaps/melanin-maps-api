// ── Community Business Submission — Input Types ────────────────────────────
// PERMANENT RULE: community submissions always start as pending_review.
// They are invisible on the map, in search, in Kinfolk results, and in
// every public API until an administrator explicitly publishes them.

import { OWNERSHIP_DESIGNATIONS } from "@workspace/db";
import { isIP } from "node:net";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SubmissionSocialProfiles = Partial<Record<SocialPlatform, string>>;
export type SubmissionLocationSource = "member_entered" | "mwm_directory" | "google_places";

export interface CommunityBusinessSubmissionInput {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  phone?: string;
  socialProfiles?: SubmissionSocialProfiles;
  mediaUrls?: string[];
  ownershipDesignations?: string[];
  priceRange?: string;
  hours?: string;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  providerPlaceId?: string;
  locationSource?: SubmissionLocationSource;
  sourceCampaign?: string;
  sourceChannel?: string;
  submitterNote?: string;
  clientRequestId?: string;
}

const OWNERSHIP_ALIASES: Record<string, string> = {
  "black-owned": "Black / African American-Owned",
  "african-american-owned": "Black / African American-Owned",
  "african-owned": "African-Owned",
  "ethiopian-owned": "Ethiopian-Owned",
  "caribbean-owned": "Caribbean / West Indian-Owned",
  "hispanic-owned": "Latino / Hispanic-Owned",
  "latino-owned": "Latino / Hispanic-Owned",
  "brazilian-owned": "Brazilian-Owned",
  "indigenous-owned": "Indigenous / Native-Owned",
  "asian-owned": "Asian American-Owned",
  "immigrant-owned": "Immigrant-Owned",
  "woman-owned": "Woman-Owned",
  "lgbtq-owned": "LGBTQIA+-Owned",
  "lgbtqia-owned": "LGBTQIA+-Owned",
  "veteran-owned": "Veteran-Owned",
  "family-owned": "Family-Owned",
  "minority-owned": "Minority-Owned (general / legacy)",
};

const CANONICAL_OWNERSHIP = new Map(
  OWNERSHIP_DESIGNATIONS.map((designation) => [designation.toLowerCase(), designation]),
);

const SOCIAL_HOSTS: Record<SocialPlatform, readonly string[]> = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com"],
  tiktok: ["tiktok.com"],
  youtube: ["youtube.com", "youtu.be"],
};

const SOCIAL_ORIGIN: Record<SocialPlatform, string> = {
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  tiktok: "https://www.tiktok.com/@",
  youtube: "https://www.youtube.com/@",
};

function objectBody(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("submission body is required");
  }
  return input as Record<string, unknown>;
}

function optionalText(
  body: Record<string, unknown>,
  key: string,
  maximumLength: number,
): string | undefined {
  const value = body[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be text`);
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maximumLength) {
    throw new Error(`${key} must be ${maximumLength} characters or fewer`);
  }
  return normalized;
}

function requiredText(
  body: Record<string, unknown>,
  key: string,
  maximumLength: number,
): string {
  const value = optionalText(body, key, maximumLength);
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function isPublicHostname(hostname: string): boolean {
  if (
    hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || hostname.endsWith(".home")
    || hostname.endsWith(".lan")
  ) return false;

  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    const [a, b, c] = hostname.split(".").map(Number);
    return !(
      a === 0
      || a === 10
      || a === 127
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 192 && b === 0 && (c === 0 || c === 2))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113)
      || a >= 224
    );
  }
  if (ipVersion === 6) {
    const normalized = hostname.toLowerCase();
    return !(
      normalized === "::"
      || normalized === "::1"
      || normalized.startsWith("fc")
      || normalized.startsWith("fd")
      || /^fe[89ab]/.test(normalized)
      || normalized.startsWith("ff")
      || normalized.startsWith("::ffff:")
      || normalized.startsWith("2001:db8:")
    );
  }
  return hostname.includes(".");
}

function normalizeHttpsUrl(raw: string, field: string): string {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error(`${field} must be a valid web address`);
  }
  if (!parsed.hostname || parsed.username || parsed.password) {
    throw new Error(`${field} must be a valid public web address`);
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!isPublicHostname(hostname)) {
    throw new Error(`${field} must be a public web address`);
  }
  if (parsed.protocol === "http:") parsed.protocol = "https:";
  if (parsed.protocol !== "https:") {
    throw new Error(`${field} must use https`);
  }
  const normalized = parsed.toString();
  if (normalized.length > 512) throw new Error(`${field} is too long`);
  return normalized;
}

function normalizeSocialUrl(platform: SocialPlatform, value: string): string {
  const trimmed = value.trim();
  const isHandle = trimmed.startsWith("@") || (!trimmed.includes(".") && !trimmed.includes("/"));
  const raw = isHandle
    ? `${SOCIAL_ORIGIN[platform]}${trimmed.replace(/^@/, "")}`
    : trimmed;
  const normalized = normalizeHttpsUrl(raw, platform);
  const hostname = new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
  if (!SOCIAL_HOSTS[platform].some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    throw new Error(`${platform} must link to ${SOCIAL_HOSTS[platform][0]}`);
  }
  return normalized;
}

function normalizeSocialProfiles(body: Record<string, unknown>): SubmissionSocialProfiles | undefined {
  const nested = body.socialProfiles;
  if (nested !== undefined && (typeof nested !== "object" || nested === null || Array.isArray(nested))) {
    throw new Error("socialProfiles must be an object");
  }
  const source = (nested ?? {}) as Record<string, unknown>;
  const profiles: SubmissionSocialProfiles = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const candidate = source[platform] ?? body[platform];
    if (candidate === undefined || candidate === null || candidate === "") continue;
    if (typeof candidate !== "string") throw new Error(`${platform} must be text`);
    if (candidate.trim().length > 512) throw new Error(`${platform} is too long`);
    profiles[platform] = normalizeSocialUrl(platform, candidate);
  }
  return Object.keys(profiles).length > 0 ? profiles : undefined;
}

function normalizeOwnership(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error("ownershipDesignations must be a list");
  const normalized: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") throw new Error("ownershipDesignations must contain text values");
    const raw = item.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const designation = OWNERSHIP_ALIASES[key] ?? CANONICAL_OWNERSHIP.get(key);
    if (!designation) throw new Error(`Unsupported ownership designation: ${raw}`);
    if (!normalized.includes(designation)) normalized.push(designation);
  }
  return normalized.slice(0, 20);
}

function normalizeStringList(value: unknown, field: string, maximum: number, maximumLength: number): string[] {
  if (value === undefined || value === null || value === "") return [];
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : null;
  if (!items) throw new Error(`${field} must be a list`);
  const normalized: string[] = [];
  for (const item of items) {
    if (typeof item !== "string") throw new Error(`${field} must contain text values`);
    const text = item.trim();
    if (!text) continue;
    if (text.length > maximumLength) throw new Error(`${field} entries must be ${maximumLength} characters or fewer`);
    if (!normalized.includes(text)) normalized.push(text);
  }
  if (normalized.length > maximum) throw new Error(`${field} accepts at most ${maximum} entries`);
  return normalized;
}

function normalizeMediaUrls(value: unknown): string[] {
  const urls = normalizeStringList(value, "mediaUrls", 3, 512);
  return urls.map((url) => normalizeHttpsUrl(url, "mediaUrls"));
}

function optionalCoordinate(
  body: Record<string, unknown>,
  key: "latitude" | "longitude",
  minimum: number,
  maximum: number,
): number | undefined {
  const value = body[key] ?? (key === "latitude" ? body.lat : body.lng);
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < minimum || numeric > maximum) {
    throw new Error(`${key} is invalid`);
  }
  return numeric;
}

export function validateSubmission(input: unknown): CommunityBusinessSubmissionInput {
  const body = objectBody(input);
  const website = optionalText(body, "website", 512);
  const mediaUrls = normalizeMediaUrls(body.mediaUrls);
  const tags = normalizeStringList(body.tags, "tags", 20, 50);
  const latitude = optionalCoordinate(body, "latitude", -90, 90);
  const longitude = optionalCoordinate(body, "longitude", -180, 180);
  if ((latitude === undefined) !== (longitude === undefined)) {
    throw new Error("latitude and longitude must be provided together");
  }

  const rawPriceRange = optionalText(body, "priceRange", 10);
  if (rawPriceRange && !["$", "$$", "$$$", "$$$$"].includes(rawPriceRange)) {
    throw new Error("priceRange is invalid");
  }

  const rawLocationSource = optionalText(body, "locationSource", 32);
  if (rawLocationSource && !["member_entered", "mwm_directory", "google_places"].includes(rawLocationSource)) {
    throw new Error("locationSource is invalid");
  }

  const clientRequestId = optionalText(body, "clientRequestId", 128);
  if (clientRequestId && !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(clientRequestId)) {
    throw new Error("clientRequestId is invalid");
  }

  return {
    name: requiredText(body, "name", 255),
    category: requiredText(body, "category", 100),
    subcategory: optionalText(body, "subcategory", 100),
    description: optionalText(body, "description", 4_000),
    address: optionalText(body, "address", 255),
    city: requiredText(body, "city", 100),
    state: optionalText(body, "state", 100),
    postalCode: optionalText(body, "postalCode", 32) ?? optionalText(body, "zip", 32),
    country: optionalText(body, "country", 100),
    website: website ? normalizeHttpsUrl(website, "website") : undefined,
    phone: optionalText(body, "phone", 40),
    socialProfiles: normalizeSocialProfiles(body),
    mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    ownershipDesignations: normalizeOwnership(body.ownershipDesignations),
    priceRange: rawPriceRange,
    hours: optionalText(body, "hours", 255),
    tags: tags.length > 0 ? tags : undefined,
    latitude,
    longitude,
    providerPlaceId: optionalText(body, "providerPlaceId", 255),
    locationSource: (rawLocationSource as SubmissionLocationSource | undefined) ?? "member_entered",
    sourceCampaign: optionalText(body, "sourceCampaign", 255),
    sourceChannel: optionalText(body, "sourceChannel", 100),
    submitterNote: optionalText(body, "submitterNote", 2_000),
    clientRequestId,
  };
}
