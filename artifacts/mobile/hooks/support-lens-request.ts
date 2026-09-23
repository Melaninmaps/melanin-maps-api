import { normalizeOwnershipDesignationFilterIds } from "@workspace/constants";

const MAP_DIRECT_NAME_GENERIC_TERMS = new Set([
  "a", "an", "and", "attorney", "bar", "bars", "bookstore", "business",
  "businesses", "cafe", "clothes", "club", "clubs", "doctor", "doctors",
  "food", "girls", "hair", "hospital", "hospitals", "near", "me", "pharmacy",
  "restaurant", "restaurants", "salon", "service", "services", "shop", "stores",
]);

/**
 * Deliberate name lookup is the narrow public-listing exception to ordinary
 * governed discovery. It rejects generic service/category words so ordinary
 * browse cannot become an all-public search.
 */
export function isDeliberateMapBusinessNameSearch(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < 3 || normalized.length > 100) return false;
  const words = normalized
    .toLocaleLowerCase("en-US")
    .split(" ")
    .map((word) => word.replace(/[^a-z0-9'&-]/g, ""))
    .filter(Boolean);
  return words.length > 0 && words.length <= 7 && words.some(
    (word) => !MAP_DIRECT_NAME_GENERIC_TERMS.has(word),
  );
}

export function buildBusinessesRequestUrl(
  apiBase: string,
  options: {
    search?: string;
    category?: string;
    city?: string;
    state?: string;
    designations?: readonly string[];
    supportScope?: "all_businesses" | "strict_documented_designations";
    /** Validated direct-name lookup: public listing discovery, never promotion. */
    directName?: boolean;
  },
): string {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.directName) params.set("lookup", "direct_name");
  if (options.category && options.category !== "All") params.set("category", options.category);
  if (options.city?.trim()) params.set("city", options.city.trim());
  if (options.state?.trim()) params.set("state", options.state.trim());
  const designationKey = normalizeOwnershipDesignationFilterIds(options.designations ?? []).join(",");
  if (designationKey) params.set("designations", designationKey);
  if (options.supportScope) params.set("supportScope", options.supportScope);
  const query = params.toString();
  return `${apiBase}/api/businesses${query ? `?${query}` : ""}`;
}
