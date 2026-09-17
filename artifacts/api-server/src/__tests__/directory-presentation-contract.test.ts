import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("directory presentation and history contracts", () => {
  const historyRoute = source("../routes/smart-search.ts");
  const historyHook = source("../../../mobile/hooks/useSearchHistory.ts");
  const nativeSearch = source("../../../mobile/app/business-search.tsx");
  const webDirectory = source("../../../web/src/features/businesses/LocationFirstBusinessDirectory.tsx");
  const webResponse = source("../../../web/src/features/businesses/canonicalBusinessSearch.ts");

  it("allows members to remove one or all saved search history entries", () => {
    expect(historyRoute).toMatch(/router\.delete\("\/search\/history"/);
    expect(historyHook).toContain('method: "DELETE"');
    expect(historyHook).toContain("const remove = useCallback");
    expect(historyHook).toContain("return { history, loaded, add, clear, remove };");
    expect(nativeSearch).toContain("Clear all");
    expect(nativeSearch).toContain("removeHistoryEntry(h)");
  });

  it("uses only owner-managed image covers and clear category fallbacks", () => {
    expect(webResponse).toContain("imageUrl?: string | null");
    expect(webResponse).toContain("profileStatus?: string | null");
    expect(webDirectory).toContain("canDisplayBusinessCover(record)");
    expect(webDirectory).toContain("getBusinessHeroIcon(record)");
    expect(webDirectory).toContain("fallbackSymbol[heroIcon]");
    expect(webDirectory).toContain("DIRECTORY_HISTORY_KEY");
    expect(webDirectory).toContain("Clear all");
  });
});
