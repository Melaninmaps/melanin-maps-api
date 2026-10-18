import {
  isDeliberateBusinessNameLookup,
  normalizeOwnershipDesignationFilterIds,
} from "@workspace/constants";

/**
 * Deliberate name lookup is the narrow public-listing exception to ordinary
 * governed discovery. It rejects generic service/category words so ordinary
 * browse cannot become an all-public search.
 */
export function isDeliberateMapBusinessNameSearch(value: string): boolean {
  return isDeliberateBusinessNameLookup(value);
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
    /** Pagination is used only to expose every same-name direct listing. */
    offset?: number;
    limit?: number;
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
  if (typeof options.offset === "number" && Number.isInteger(options.offset) && options.offset > 0) {
    params.set("offset", String(options.offset));
  }
  if (typeof options.limit === "number" && Number.isInteger(options.limit) && options.limit > 0) {
    params.set("limit", String(options.limit));
  }
  const query = params.toString();
  return `${apiBase}/api/businesses${query ? `?${query}` : ""}`;
}
