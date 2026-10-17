import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(
  fileURLToPath(new URL("../pages/map.tsx", import.meta.url)),
  "utf8",
);

describe("exact directory-to-Map handoff", () => {
  it("keeps a structured directory query ahead of broad universal results", () => {
    expect(mapSource).toContain('import { parseBusinessMapSearchPhrase }');
    expect(mapSource).toContain("const parsed = parseBusinessMapSearchPhrase(q)");
    expect(mapSource).toContain('bp.set("state", parsed.stateCode)');
    expect(mapSource).toContain("usedExactDirectorySearch = phraseBusinesses.length > 0");
    expect(mapSource).toContain("exactDirectorySearch: usedExactDirectorySearch");
  });

  it("renders only the exact records as the direct search cards and pins", () => {
    expect(mapSource).toContain("universalResults?.exactDirectorySearch");
    expect(mapSource).toContain("applyLocalMapViewport(makeMapAdapter(), {");
    expect(mapSource).toContain("latitude: detectedLocation.lat");
    expect(mapSource).toContain("!universalResults?.exactDirectorySearch");
  });

  it("does not cover a governed directory handoff with the unrelated global pin loader", () => {
    expect(mapSource).toContain("(!ready || (isLoading && !handoffQuery))");
  });

  it("renders the exact directory records as Map cards instead of the location empty state", () => {
    expect(mapSource).toContain(") : !directNameLookupOwnsNoPins && !isDiscoveryFilterActive && businessSearchActive && !universalResults?.exactDirectorySearch ? (");
  });

  it("places exact directory cards before unrelated universal record types", () => {
    expect(mapSource).toContain("!universalResults?.exactDirectorySearch && (universalResults?.results?.heritage?.length ?? 0) > 0");
    expect(mapSource).toContain("universalResults && !universalResults.exactDirectorySearch");
  });

  it("recognizes a direct public-directory fallback without turning it into a Map pin", () => {
    expect(mapSource).toContain('isDeliberateBusinessNameLookup');
    expect(mapSource).toContain("function literalDirectNameCandidate(query: string, hasParsedLocation: boolean): string");
    expect(mapSource).toContain("const directNameQuery = literalDirectNameCandidate(q, Boolean(localIntent.city));");
    expect(mapSource).toContain("const deliberateDirectNameLookup = isDeliberateBusinessNameLookup(directNameQuery)\n      && !parsed.ownership;");
    expect(mapSource).not.toContain("&& !parsed.category");
    expect(mapSource).toContain("if (deliberateDirectNameLookup)");
    expect(mapSource).toContain('lookup: "direct_name"');
    expect(mapSource).toContain('directPayload?.searchScope === "direct_named_safety_context"');
    expect(mapSource).toContain("const DIRECT_NAME_PAGE_SIZE = 20");
    expect(mapSource).toContain("const [directNamePage, setDirectNamePage]");
    expect(mapSource).toContain("offset: String(directNameOffset)");
    expect(mapSource).toContain('aria-label="More exact-name listings"');
    expect(mapSource).toContain('aria-label="Previous exact-name listings"');
    expect(mapSource).toContain("directNameLookup: true,");
    const directLookupStart = mapSource.indexOf("if (deliberateDirectNameLookup) {");
    const universalSearchStart = mapSource.indexOf("const res = await fetch(`${apiBase}/api/search/universal?");
    expect(directLookupStart).toBeGreaterThan(0);
    expect(directLookupStart).toBeLessThan(universalSearchStart);
    expect(mapSource.indexOf("const directRes = await fetch(`${apiBase}/api/businesses?${direct}`")).toBeLessThan(universalSearchStart);
    expect(mapSource).toContain("A direct lookup failure is an honest empty exact result.");
    expect(mapSource).toContain("setDirectNamePage(directNamePagination);");
    expect(mapSource).toContain("const finalBusinesses = phraseBusinesses.length > 0");
    expect(mapSource).toContain("if (parsed.ownership || parsed.category || parsed.city)");
    expect(mapSource).toContain("const directNameLookupOwnsNoPins = businessSearchActive");
    expect(mapSource).toContain("const activeMapSearchIntent = parseLocalMapSearch(search)");
    expect(mapSource).toContain("const activeOwnershipFilter = parseBusinessMapSearchPhrase(search).ownership;");
    expect(mapSource).toContain("const activeDirectNameQuery = literalDirectNameCandidate(search, Boolean(activeMapSearchIntent.city));");
    expect(mapSource).toContain("&& isDeliberateBusinessNameLookup(activeDirectNameQuery)");
    expect(mapSource).toContain("&& !activeOwnershipFilter;");
    expect(mapSource).not.toContain("activeDirectNamePhrase");
    expect(mapSource).toContain("const markerBusinesses = directNameLookupOwnsNoPins");
    expect(mapSource).toContain("const showBiz = !directNameLookupOwnsNoPins");
    expect(mapSource).toContain("!directNameLookupOwnsNoPins && !isDiscoveryFilterActive && businessSearchActive && !universalResults?.exactDirectorySearch");
    expect(mapSource).toContain("const isDirectListingResult = universalResults?.directNameLookup === true;");
    expect(mapSource).toContain("if (!apiKeyError && !isDirectListingResult) selectBusiness(biz.id, biz);");
    expect(mapSource).toContain("{!isDirectListingResult && (");
    expect(mapSource).toContain("directNameLookupOwnsNoPins && displayedBusinessResults.length === 0");
    expect(mapSource).toContain("No exact Directory listing found");
    expect(mapSource).toContain("Exact lookup does not substitute nearby or recommended businesses.");
    const directNoMatchStart = mapSource.indexOf("directNameLookupOwnsNoPins && displayedBusinessResults.length === 0");
    const genericNoMatchStart = mapSource.indexOf(") : displayedBusinessResults.length === 0 ? (", directNoMatchStart);
    expect(directNoMatchStart).toBeGreaterThan(0);
    expect(genericNoMatchStart).toBeGreaterThan(directNoMatchStart);
    expect(mapSource.slice(directNoMatchStart, genericNoMatchStart)).not.toContain("Ask KinfolkAI™ instead");
    expect(mapSource).toContain("universalResults.directNameLookup || !detectedLocation");
    expect(mapSource).toContain("const universalSearchRequestIdRef = useRef(0)");
    expect(mapSource).toContain("const requestId = ++universalSearchRequestIdRef.current");
    expect(mapSource).toContain("const isCurrentRequest = () => universalSearchRequestIdRef.current === requestId");
    expect(mapSource.match(/if \(!isCurrentRequest\(\)\) return;/g)?.length).toBeGreaterThanOrEqual(6);
    expect(mapSource).toContain("if (isCurrentRequest()) setUniversalLoading(false);");
    expect(mapSource).toContain("const invalidateUniversalSearch = useCallback");
    expect(mapSource).toContain("invalidateUniversalSearch();\n                    setSearch(e.target.value);");
    expect(mapSource).toContain("setUniversalResults(null);\n                    setDirectNamePage(null);");
    const removeDesignationStart = mapSource.indexOf("const removeMapDesignation = async");
    const removeDesignationAwait = mapSource.indexOf("await persistReducedSupportLensRemoval", removeDesignationStart);
    expect(mapSource.indexOf("invalidateUniversalSearch();", removeDesignationStart)).toBeLessThan(removeDesignationAwait);
    const resetLensStart = mapSource.indexOf("body: JSON.stringify({ preferredOwnershipTypes: [], supportLensMode: \"all_businesses\" })");
    const resetLensInvalidate = mapSource.lastIndexOf("invalidateUniversalSearch();", resetLensStart);
    expect(resetLensInvalidate).toBeGreaterThan(0);
    expect(resetLensInvalidate).toBeLessThan(resetLensStart);
  });
});
