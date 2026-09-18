import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../app/business-search.tsx", import.meta.url),
  "utf8",
);

describe("mobile directory spelling clarification", () => {
  it("accepts only catalog-supported metadata and keeps city, state, category, and handle filters on retry", () => {
    expect(source).toContain("interface SearchClarification");
    expect(source).toContain("data.searchClarification?.kind === \"possible_spelling\"");
    expect(source).toContain("data.searchClarification.source === \"returned_catalog_term\"");
    expect(source).toContain("void handleSearch({ name: searchClarification.suggestedQuery })");
  });

  it("presents the correction as a voluntary action rather than changing the query automatically", () => {
    expect(source).toContain("accessibilityLabel={searchClarification.prompt}");
    expect(source).toContain("{searchClarification.prompt}");
  });
});
