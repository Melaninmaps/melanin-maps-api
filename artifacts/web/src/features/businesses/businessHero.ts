export type BusinessHeroRecord = {
  imageUrl?: string | null;
  imageEligibility?: "receipt_verified" | "suppressed_unverified" | "none" | null;
  profileStatus?: string | null;
  listingStatus?: string | null;
  category?: string | null;
  subcategory?: string | null;
};

/**
 * Unclaimed/community-listed records must never display an unverified stock or
 * demo image as if it belongs to that business. A cover can appear only after
 * the API confirms a receipt for that exact image URL.
 */
export function canDisplayBusinessCover(record: BusinessHeroRecord): boolean {
  return record.imageEligibility === "receipt_verified" && Boolean(record.imageUrl?.trim());
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
