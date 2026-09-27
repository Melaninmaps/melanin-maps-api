/**
 * Kinfolk's governed directory can resolve a city, but this chat contract does
 * not receive or retain device coordinates or a route calculation. A request
 * for a place "near" a hotel, venue, or member must never be phrased as though
 * exact distance, walking time, or route evidence was established.
 */
export function requiresDocumentedProximityCaveat(message: string): boolean {
  return /\b(?:near(?:by)?|close to|walking distance|walkable|minutes? (?:away|walk)|around)\b/i.test(
    message,
  );
}

export const DOCUMENTED_PROXIMITY_CAVEAT =
  " I can confirm these are city-level matches, but I do not have a verified distance, walking time, transit time, or route from your named starting point. Use each listing's address or map pin to check exact proximity before you go.";
