import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const results = readFileSync(
  new URL("../components/UniversalSearchResults.tsx", import.meta.url),
  "utf8",
);
const discover = readFileSync(
  new URL("../pages/discover-universal.tsx", import.meta.url),
  "utf8",
);
const map = readFileSync(
  new URL("../pages/map.tsx", import.meta.url),
  "utf8",
);

describe("website spelling clarification controls", () => {
  it("renders a catalog-supported did-you-mean action only when a parent provides a retry", () => {
    expect(results).toContain("searchClarification?:");
    expect(results).toContain("onClarification?: (suggestedQuery: string) => void");
    expect(results).toContain("result.searchClarification && onClarification");
    expect(results).toContain("result.searchClarification.prompt");
  });

  it("retries the ordinary Discover and Map search without dropping member context", () => {
    expect(discover).toContain("onClarification={(suggestedQuery) => {");
    expect(discover).toContain("void runSearch(suggestedQuery)");
    expect(map).toContain("void runUniversalSearch(suggestedQuery)");
  });
});
