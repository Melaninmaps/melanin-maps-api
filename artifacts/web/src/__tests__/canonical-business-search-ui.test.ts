import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  appendUniqueCanonicalBusinesses,
  buildCanonicalBusinessSearchParams,
  readCanonicalBusinessSearchResponse,
} from "../features/businesses/canonicalBusinessSearch";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("routed canonical business directory", () => {
  it("sends name, specialty, category, city, state, ownership, offset, and a bounded limit", () => {
    const params = buildCanonicalBusinessSearchParams({
      city: "Philadelphia",
      stateCode: "pa",
      category: "Food & Drink",
      specialty: "Restaurant",
      ownership: "Woman-Owned",
      searchText: "AMINA",
      offset: 60,
      limit: 500,
    });
    expect(Object.fromEntries(params)).toEqual({
      city: "Philadelphia",
      limit: "200",
      offset: "60",
      state: "PA",
      category: "Food & Drink",
      search: "AMINA Restaurant",
      ownership: "Woman-Owned",
    });
  });

  it("validates canonical results and deduplicates later pages", () => {
    const first = { id: "a", name: "AMINA" };
    const second = { id: "b", name: "Uncle Bobbie's Coffee & Books" };
    expect(readCanonicalBusinessSearchResponse({ businesses: [first, null, second], total: 12 }))
      .toEqual({ businesses: [first, second], total: 12 });
    expect(appendUniqueCanonicalBusinesses([first], [first, second])).toEqual([first, second]);
    expect(() => readCanonicalBusinessSearchResponse({ records: [] })).toThrow("invalid response");
  });

  it("routes the member Businesses page to canonical searchable inventory", () => {
    const app = source("../App.tsx");
    const directory = source("../features/businesses/LocationFirstBusinessDirectory.tsx");
    expect(app).toContain("<LocationFirstBusinessDirectory />");
    expect(directory).toContain("api/businesses?");
    expect(directory).not.toContain("api/discovery/query");
    expect(directory).toContain("requestIdRef.current");
    expect(directory).toContain("queryKeyRef.current");
    expect(directory).toContain("Load more (");
    expect(directory).toContain("Community/founder-listed · Unclaimed · Not verified");
    expect(directory).not.toContain("verified businesses in");
  });
});
