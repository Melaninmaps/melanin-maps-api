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
    expect(mapSource).toContain(") : !isDiscoveryFilterActive && businessSearchActive && !universalResults?.exactDirectorySearch ? (");
  });

  it("places exact directory cards before unrelated universal record types", () => {
    expect(mapSource).toContain("!universalResults?.exactDirectorySearch && (universalResults?.results?.heritage?.length ?? 0) > 0");
    expect(mapSource).toContain("universalResults && !universalResults.exactDirectorySearch");
  });
});
