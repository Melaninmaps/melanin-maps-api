export type BusinessHeroRecord = {
  imageUrl?: string | null;
  profileStatus?: string | null;
  listingStatus?: string | null;
  category?: string | null;
  subcategory?: string | null;
};

/**
 * Unclaimed/community-listed records must never display an unverified stock or
 * demo image as if it belongs to that business. A cover can appear only after
 * the business profile is claimed and an image is present on the approved row.
 */
export function canDisplayBusinessCover(record: BusinessHeroRecord): boolean {
  const profileStatus = record.profileStatus?.trim().toLowerCase();
  const listingStatus = record.listingStatus?.trim().toLowerCase();
  const isOwnerManaged = profileStatus === "claimed" || profileStatus === "participating" || listingStatus === "live_claimed";
  return isOwnerManaged && Boolean(record.imageUrl?.trim());
}

export type BusinessHeroIcon =
  | "food"
  | "beauty"
  | "health"
  | "professional"
  | "arts"
  | "retail"
  | "faith"
  | "education"
  | "home"
  | "travel"
  | "business";

export function getBusinessHeroIcon(record: BusinessHeroRecord): BusinessHeroIcon {
  const value = `${record.category ?? ""} ${record.subcategory ?? ""}`.toLowerCase();
  if (/beauty|barber|salon|hair|spa|nail/.test(value)) return "beauty";
  if (/food|restaurant|cafe|café|bakery|\bbar\b|drink/.test(value)) return "food";
  if (/health|wellness|medical|doctor|dental|fitness/.test(value)) return "health";
  if (/legal|financial|professional|consult|account|technology/.test(value)) return "professional";
  if (/art|culture|music|media|creative|entertainment/.test(value)) return "arts";
  if (/retail|shop|store|fashion/.test(value)) return "retail";
  if (/faith|spiritual|church|mosque|temple|community|nonprofit/.test(value)) return "faith";
  if (/education|school|learning|college|university/.test(value)) return "education";
  if (/home|property|contract|repair|hvac|plumb/.test(value)) return "home";
  if (/travel|hotel|hospitality|transport|auto/.test(value)) return "travel";
  return "business";
}
