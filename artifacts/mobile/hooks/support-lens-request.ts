import { normalizeOwnershipDesignationFilterIds } from "@workspace/constants";

export function buildBusinessesRequestUrl(
  apiBase: string,
  options: {
    search?: string;
    category?: string;
    city?: string;
    state?: string;
    designations?: readonly string[];
    supportScope?: "all_businesses" | "strict_documented_designations";
  },
): string {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.category && options.category !== "All") params.set("category", options.category);
  if (options.city?.trim()) params.set("city", options.city.trim());
  if (options.state?.trim()) params.set("state", options.state.trim());
  const designationKey = normalizeOwnershipDesignationFilterIds(options.designations ?? []).join(",");
  if (designationKey) params.set("designations", designationKey);
  if (options.supportScope) params.set("supportScope", options.supportScope);
  const query = params.toString();
  return `${apiBase}/api/businesses${query ? `?${query}` : ""}`;
}