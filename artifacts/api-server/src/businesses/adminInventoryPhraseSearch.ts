/**
 * Admin inventory search is intentionally a single case-insensitive,
 * contiguous phrase. It prevents a query such as "Black Women" from being
 * widened into independent "Black" and "Women" matches in different fields.
 * Paired quotes remain accepted for administrators who used the previous UI.
 */
export function parseAdminBusinessSearchPhrase(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  const quotedPhrase = normalized.match(/^(?:["“])(.+?)(?:["”])$/)?.[1];
  return (quotedPhrase ?? normalized).trim() || null;
}

export function escapeAdminBusinessSearchPhrase(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

const ADMIN_BUSINESS_PROFILE_SEARCH_EXPRESSIONS = [
  "name",
  "COALESCE(business_tagline, '')",
  "COALESCE(description, '')",
  "COALESCE(category, '')",
  "COALESCE(subcategory, '')",
  "COALESCE(address, '')",
  "COALESCE(city, '')",
  "COALESCE(state, '')",
  "COALESCE(country, '')",
  "COALESCE(phone, '')",
  "COALESCE(hours, '')",
  "COALESCE(price_range, '')",
  "COALESCE(tags::text, '')",
  "COALESCE(vibes::text, '')",
  "COALESCE(trust_badges::text, '')",
  "COALESCE(target_audience::text, '')",
  "COALESCE(owner_name, '')",
  "COALESCE(owner_bio, '')",
  "COALESCE(owner_story, '')",
  "COALESCE(website, '')",
  "COALESCE(instagram, '')",
  "COALESCE(tiktok, '')",
  "COALESCE(facebook, '')",
  "COALESCE(twitter, '')",
  "COALESCE(youtube, '')",
  "COALESCE(pinterest, '')",
  "COALESCE(primary_social_platform, '')",
  "COALESCE(location_name, '')",
  "REGEXP_REPLACE(COALESCE(ownership_designations::text, ''), '[_-]+', ' ', 'g')",
  "REGEXP_REPLACE(COALESCE(verified_designations::text, ''), '[_-]+', ' ', 'g')",
  "REGEXP_REPLACE(COALESCE(ownership_claim, ''), '[_-]+', ' ', 'g')",
  "CASE WHEN COALESCE(black_owned, false) THEN 'Black-Owned Black / African American-Owned' ELSE '' END",
] as const;

/**
 * Uses only retained business identity, ownership, and profile fields. It does
 * not search member-authored reviews or internal source/audit metadata.
 */
export function buildAdminBusinessExactPhrasePredicate(parameter: string): string {
  return `(${ADMIN_BUSINESS_PROFILE_SEARCH_EXPRESSIONS
    .map((expression) => `${expression} ILIKE ${parameter} ESCAPE '\\'`)
    .join(" OR ")})`;
}
