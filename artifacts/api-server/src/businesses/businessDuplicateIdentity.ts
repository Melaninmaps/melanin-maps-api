import { normalizeBusinessStreetAddress } from "@workspace/constants";
import { normalizeText } from "../lib/business-dedup";

/**
 * High-confidence identity policy for business intake and duplicate review.
 *
 * A shared or similar name is never duplicate evidence by itself. The caller
 * must provide one of: same normalized name + complete normalized address,
 * exact official website domain, exact official social profile, or exact phone.
 * These results are candidates for canonical-profile reuse; they never merge or
 * archive any record on their own.
 */
export const BUSINESS_DUPLICATE_IDENTITY_POLICY_VERSION =
  "high-confidence-identity-v1" as const;

export const BUSINESS_DUPLICATE_MATCH_REASONS = [
  "same_name_and_address",
  "same_official_domain",
  "same_official_social",
  "same_phone",
] as const;

export type BusinessDuplicateMatchReason =
  (typeof BUSINESS_DUPLICATE_MATCH_REASONS)[number];

export type BusinessIdentityInput = Readonly<{
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  pinterest?: string | null;
}>;

const REJECTED_OFFICIAL_WEBSITE_HOSTS = [
  "yelp.com",
  "yellowpages.com",
  "google.com",
  "g.page",
  "bing.com",
  "tripadvisor.com",
  "foursquare.com",
  "mapquest.com",
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "opentable.com",
  "etsy.com",
  "amazon.com",
] as const;

const SOCIAL_HOSTS = new Set([
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "pinterest.com",
]);

const SOCIAL_PLATFORM_DEFAULT_HOSTS = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  tiktok: "tiktok.com",
  twitter: "twitter.com",
  youtube: "youtube.com",
  pinterest: "pinterest.com",
} as const;

function publicHttpUrl(value: string | null | undefined): URL | null {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      || parsed.username
      || parsed.password
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function normalizedHost(hostname: string): string {
  return hostname.trim().toLocaleLowerCase("en-US").replace(/^www\./, "");
}

function hostMatches(host: string, candidate: string): boolean {
  return host === candidate || host.endsWith(`.${candidate}`);
}

/** Rejects directories, marketplaces, maps, and social hosts as official websites. */
export function normalizeOfficialWebsiteDomain(value: string | null | undefined): string | null {
  const parsed = publicHttpUrl(value);
  if (!parsed) return null;
  const host = normalizedHost(parsed.hostname);
  if (
    SOCIAL_HOSTS.has(host)
    || REJECTED_OFFICIAL_WEBSITE_HOSTS.some((candidate) => hostMatches(host, candidate))
  ) {
    return null;
  }
  return host || null;
}

/** Returns an exact platform/path key only for a usable public social profile. */
export function normalizeOfficialSocialProfile(value: string | null | undefined): string | null {
  const parsed = publicHttpUrl(value);
  if (!parsed) return null;
  const host = normalizedHost(parsed.hostname);
  if (!SOCIAL_HOSTS.has(host)) return null;
  const path = parsed.pathname.replace(/^\/+|\/+$/g, "").toLocaleLowerCase("en-US");
  if (!path || path === "marketplace") return null;
  return `${host}/${path}`;
}

export function normalizeOfficialSocialProfileForPlatform(
  platform: keyof typeof SOCIAL_PLATFORM_DEFAULT_HOSTS,
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1).replace(/^\/+|\/+$/g, "").toLocaleLowerCase("en-US");
    if (!handle || !/^[a-z0-9._-]+$/i.test(handle)) return null;
    const host = SOCIAL_PLATFORM_DEFAULT_HOSTS[platform];
    return platform === "tiktok" ? `${host}/@${handle}` : `${host}/${handle}`;
  }
  return normalizeOfficialSocialProfile(trimmed);
}

export function normalizeBusinessPhone(value: string | null | undefined): string | null {
  const raw = String(value ?? "").replace(/\D/g, "");
  const normalized = raw.length === 11 && raw.startsWith("1") ? raw.slice(1) : raw;
  // A seven-digit local number is not a globally or even city-wide reliable
  // business identity. Keep only plausible full international/NANP numbers.
  return normalized.length >= 10 && normalized.length <= 15 ? normalized : null;
}

export const normalizeBusinessAddress = normalizeBusinessStreetAddress;

function normalizedValue(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizedBusinessName(value: string | null | undefined): string | null {
  // Possessive apostrophes do not distinguish an identity (Amina's/Amina’s),
  // whereas word boundaries still do. This intentionally avoids fuzzy matching.
  const normalized = normalizeText(String(value ?? "").replace(/[\u0027\u2018\u2019]/g, ""));
  return normalized || null;
}

function socialProfileKeys(input: BusinessIdentityInput): Set<string> {
  return new Set(
    [
      ["instagram", input.instagram] as const,
      ["facebook", input.facebook] as const,
      ["tiktok", input.tiktok] as const,
      ["twitter", input.twitter] as const,
      ["youtube", input.youtube] as const,
      ["pinterest", input.pinterest] as const,
    ]
      .map(([platform, value]) => normalizeOfficialSocialProfileForPlatform(platform, value))
      .filter((value): value is string => Boolean(value)),
  );
}

function sameLocation(input: BusinessIdentityInput, candidate: BusinessIdentityInput): boolean {
  const inputCity = normalizedValue(input.city);
  const candidateCity = normalizedValue(candidate.city);
  const inputState = normalizedValue(input.state);
  const candidateState = normalizedValue(candidate.state);
  return Boolean(
    inputCity
    && candidateCity
    && inputCity === candidateCity
    && (!inputState || !candidateState || inputState === candidateState),
  );
}

/**
 * Lists exact, independently sufficient identity evidence. An empty result is
 * deliberate: name similarity, a shared city, a shared building address, and a
 * directory/marketplace URL must not block an otherwise distinct business.
 */
export function highConfidenceBusinessDuplicateReasons(
  input: BusinessIdentityInput,
  candidate: BusinessIdentityInput,
): BusinessDuplicateMatchReason[] {
  const reasons: BusinessDuplicateMatchReason[] = [];
  const inputName = normalizedBusinessName(input.name);
  const candidateName = normalizedBusinessName(candidate.name);
  const inputAddress = normalizeBusinessAddress(input.address);
  const candidateAddress = normalizeBusinessAddress(candidate.address);
  if (
    inputName
    && candidateName
    && inputName === candidateName
    && inputAddress
    && candidateAddress
    && inputAddress === candidateAddress
    && sameLocation(input, candidate)
  ) {
    reasons.push("same_name_and_address");
  }

  const inputWebsiteDomain = normalizeOfficialWebsiteDomain(input.website);
  const candidateWebsiteDomain = normalizeOfficialWebsiteDomain(candidate.website);
  if (inputWebsiteDomain && candidateWebsiteDomain && inputWebsiteDomain === candidateWebsiteDomain) {
    reasons.push("same_official_domain");
  }

  const inputPhone = normalizeBusinessPhone(input.phone);
  const candidatePhone = normalizeBusinessPhone(candidate.phone);
  if (inputPhone && candidatePhone && inputPhone === candidatePhone) {
    reasons.push("same_phone");
  }

  const inputSocials = socialProfileKeys(input);
  const candidateSocials = socialProfileKeys(candidate);
  if ([...inputSocials].some((profile) => candidateSocials.has(profile))) {
    reasons.push("same_official_social");
  }

  return reasons;
}

export function hasHighConfidenceBusinessDuplicate(
  input: BusinessIdentityInput,
  candidate: BusinessIdentityInput,
): boolean {
  return highConfidenceBusinessDuplicateReasons(input, candidate).length > 0;
}

export const BUSINESS_DUPLICATE_IDENTITY_RULE =
  "A business is a duplicate candidate only with same normalized name plus same normalized full address, exact official website domain, exact official social profile, or exact normalized phone. Similar names, a shared city, a shared address with a different name, directory links, and marketplace links never block intake by themselves.";
