import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildCanonicalBusinessSearchParams } from "../features/businesses/canonicalBusinessSearch";
import { parseBusinessMapSearchPhrase } from "../features/map/parseBusinessMapSearchPhrase";

const directorySource = readFileSync(
  fileURLToPath(new URL("../features/businesses/LocationFirstBusinessDirectory.tsx", import.meta.url)),
  "utf8",
);

describe("structured Business finder phrases", () => {
  it("turns a Black-owned restaurant request into documented filters rather than a literal name search", () => {
    const parsed = parseBusinessMapSearchPhrase("Black owned restaurants");
    const params = buildCanonicalBusinessSearchParams({
      city: "Philadelphia",
      stateCode: "PA",
      category: parsed.category,
      ownership: parsed.ownership,
      searchText: parsed.search,
    });

    expect(Object.fromEntries(params)).toEqual({
      city: "Philadelphia",
      limit: "60",
      offset: "0",
      state: "PA",
      category: "Food & Drink",
      ownership: "black-owned",
    });
  });

  it("uses the shared structured parser in the website finder", () => {
    expect(directorySource).toContain('parseBusinessMapSearchPhrase(searchText)');
    expect(directorySource).toContain("ownership: effectiveOwnership");
    expect(directorySource).toContain("category: effectiveCategory");
    expect(directorySource).toContain("searchText: effectiveSearchText");
  });
});
