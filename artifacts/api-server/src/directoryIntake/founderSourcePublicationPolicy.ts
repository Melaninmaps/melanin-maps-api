import type { SourceBackedDirectoryCandidate } from "./sourceBackedDirectoryCandidates";

/**
 * Founder-authorized publication rules for the immutable source-directory packs.
 * A source listing supports its stated ownership designation, but an ordinary MWM
 * listing still needs one member-facing official destination: an official website
 * OR a source-listed official social profile. Address and geocode govern map pins
 * only; they never govern whether a legitimate online/service business is listed.
 */
export const FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION =
  "founder-source-presence-publication-v1" as const;

const REJECTED_OFFICIAL_WEBSITE_HOST_PARTS = [
  "yelp.", "yellowpages.", "google.", "g.page", "bing.", "tripadvisor.",
  "foursquare.", "mapquest.", "doordash.", "ubereats.", "grubhub.", "opentable.",
  "etsy.", "amazon.", "facebook.com/marketplace",
] as const;

const SOCIAL_HOSTS = new Set([
  "instagram.com", "www.instagram.com",
  "facebook.com", "www.facebook.com",
  "tiktok.com", "www.tiktok.com",
  "x.com", "www.x.com", "twitter.com", "www.twitter.com",
  "youtube.com", "www.youtube.com",
  "pinterest.com", "www.pinterest.com",
]);

type SourceSocials = NonNullable<SourceBackedDirectoryCandidate["socialLinks"]>;

export type FounderSourcePresence = Readonly<{
  officialWebsite: string | null;
  officialSocials: Partial<SourceSocials>;
  hasOfficialPresence: boolean;
  rejectedWebsite: string | null;
}>;

function publicHttpUrl(value: string | null | undefined): URL | null {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.username || parsed.password) {
      return null;
    }
    parsed.hash = "";
    return parsed;
  } catch {
    return null;
  }
}

function sourceSocialProfile(value: string | null | undefined): string | null {
  const parsed = publicHttpUrl(value);
  if (!parsed || !SOCIAL_HOSTS.has(parsed.hostname.toLowerCase())) return null;
  const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
  if (!path || path.toLowerCase() === "marketplace") return null;
  return parsed.toString();
}

export function sanitizeFounderSourceOfficialWebsite(value: string | null | undefined): string | null {
  const parsed = publicHttpUrl(value);
  if (!parsed) return null;
  const normalized = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  if (
    SOCIAL_HOSTS.has(parsed.hostname.toLowerCase())
    || REJECTED_OFFICIAL_WEBSITE_HOST_PARTS.some((fragment) => normalized.includes(fragment))
  ) return null;
  return parsed.toString();
}

export function sourceListedOfficialSocials(
  socialLinks: SourceBackedDirectoryCandidate["socialLinks"],
): Partial<SourceSocials> {
  if (!socialLinks) return {};
  return Object.fromEntries(
    Object.entries(socialLinks)
      .map(([platform, value]) => [platform, sourceSocialProfile(value)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  ) as Partial<SourceSocials>;
}

export function founderSourcePresence(
  candidate: Pick<SourceBackedDirectoryCandidate, "officialUrl" | "socialLinks">,
): FounderSourcePresence {
  const officialWebsite = sanitizeFounderSourceOfficialWebsite(candidate.officialUrl);
  const officialSocials = sourceListedOfficialSocials(candidate.socialLinks);
  return {
    officialWebsite,
    officialSocials,
    hasOfficialPresence: Boolean(officialWebsite || Object.keys(officialSocials).length),
    rejectedWebsite: candidate.officialUrl && !officialWebsite ? candidate.officialUrl : null,
  };
}

export function founderSourceObservedAt(batch: string): string {
  const match = batch.match(/(20\d{2})[_-](\d{2})[_-](\d{2})/);
  const date = match ? `${match[1]}-${match[2]}-${match[3]}` : "2026-09-27";
  return `${date}T00:00:00.000Z`;
}

export const FOUNDER_SOURCE_PUBLICATION_RULE =
  "A founder-provided ownership directory receipt supports only its stated ownership designation. Publish a source-backed unclaimed profile when at least one valid official website or source-listed official social profile is present; reject directory/marketplace URLs from the official-website field; require address plus audited geocode only for a map pin.";
