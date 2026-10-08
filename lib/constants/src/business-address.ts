/**
 * Browser-safe street-address normalization shared by every business-intake
 * surface. This is an identity and form-quality helper, not a geocoder and not
 * proof that an address belongs to a business.
 */
const ADDRESS_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(street|st)\b/g, "st"], [/\b(avenue|ave)\b/g, "ave"],
  [/\b(road|rd)\b/g, "rd"], [/\b(boulevard|blvd)\b/g, "blvd"],
  [/\b(drive|dr)\b/g, "dr"], [/\b(lane|ln)\b/g, "ln"],
  [/\b(court|ct)\b/g, "ct"], [/\b(place|pl)\b/g, "pl"],
  [/\b(parkway|pkwy)\b/g, "pkwy"], [/\b(highway|hwy)\b/g, "hwy"],
  [/\b(suite|ste)\b/g, "ste"], [/\b(apartment|apt)\b/g, "apt"],
];

export type BusinessStreetAddressValidation = Readonly<{
  normalized: string | null;
  isUsable: boolean;
}>;

export function normalizeBusinessStreetAddress(value: string | null | undefined): string | null {
  let normalized = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return null;
  for (const [pattern, replacement] of ADDRESS_ALIASES) normalized = normalized.replace(pattern, replacement);
  return normalized.replace(/\s+/g, " ").trim() || null;
}

/** A street number plus at least one street-name token; never implies geocode validity. */
export function validateBusinessStreetAddress(value: string | null | undefined): BusinessStreetAddressValidation {
  const normalized = normalizeBusinessStreetAddress(value);
  return {
    normalized,
    isUsable: Boolean(normalized && /\b\d+[a-z0-9-]*\b/.test(normalized) && normalized.split(" ").length >= 2),
  };
}
