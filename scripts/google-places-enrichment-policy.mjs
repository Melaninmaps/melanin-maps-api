/**
 * Pure identity policy for Google Places research.
 *
 * Google Places can produce a useful lead, but it is not a field-level receipt
 * and cannot authorize an automatic directory write. A high assessment only
 * prioritizes a record for a reviewer to compare with first-party evidence.
 */
export function normalizePlacesIdentity(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function streetNumber(value) {
  return String(value ?? "").match(/\b\d{1,6}\b/)?.[0] ?? null;
}

export function assessGooglePlacesIdentity({
  businessName,
  businessAddress,
  businessCity,
  businessState,
  placeName,
  placeAddress,
}) {
  const storedName = normalizePlacesIdentity(businessName);
  const returnedName = normalizePlacesIdentity(placeName);
  const returnedAddress = normalizePlacesIdentity(placeAddress);
  const city = normalizePlacesIdentity(businessCity);
  const state = normalizePlacesIdentity(businessState);
  const storedStreetNumber = streetNumber(businessAddress);

  const exactName = Boolean(storedName) && storedName === returnedName;
  const cityMatches = Boolean(city) && returnedAddress.includes(city);
  const stateMatches = !state || returnedAddress.includes(state);
  const streetMatches = !storedStreetNumber || new RegExp(`\\b${storedStreetNumber}\\b`).test(returnedAddress);

  if (exactName && cityMatches && stateMatches && streetMatches) return "HIGH";
  if (exactName && cityMatches) return "REVIEW";
  return "REJECT";
}

/** Automatic contact, address, hours, or coordinate writes are prohibited. */
export function mayAutoApplyGooglePlacesFacts() {
  return false;
}
