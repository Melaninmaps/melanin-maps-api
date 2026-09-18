import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findSafeSearchClarification } from "@workspace/constants";

const businessRoute = readFileSync(
  new URL("../businesses.ts", import.meta.url),
  "utf8",
);
const universalRoute = readFileSync(
  new URL("../universal-search.ts", import.meta.url),
  "utf8",
);

describe("catalog-supported spelling clarification", () => {
  it("retains the rest of a member's query and makes only a close catalog-backed correction", () => {
    expect(findSafeSearchClarification({
      query: "plumbr in Atlanta",
      catalogTerms: [{ value: "Plumber" }, { value: "Legal" }],
    })).toEqual(expect.objectContaining({
      suggestedQuery: "Plumber in Atlanta",
      catalogTerm: "Plumber",
      source: "returned_catalog_term",
    }));
  });

  it("does not turn an exact term or a distant word into a correction", () => {
    expect(findSafeSearchClarification({
      query: "plumber in Atlanta",
      catalogTerms: [{ value: "Plumber" }],
    })).toBeNull();
    expect(findSafeSearchClarification({
      query: "violin in Atlanta",
      catalogTerms: [{ value: "Plumber" }],
    })).toBeNull();
  });

  it("returns suggestion metadata without replacing direct or universal search results", () => {
    expect(businessRoute).toContain("findSafeSearchClarification");
    expect(businessRoute).toContain("searchClarification,");
    expect(universalRoute).toContain("searchClarification,");
    expect(universalRoute).toContain("catalogTermsFromBusinessResults(businesses)");
  });
});
