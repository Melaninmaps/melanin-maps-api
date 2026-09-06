import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalCountryCode, sameRecognizedCountry } from "../lib/country-normalization";

describe("strict founder country normalization", () => {
  it("canonicalizes supported names, codes, aliases, and territories", () => {
    expect(canonicalCountryCode("United States")).toBe("US");
    expect(canonicalCountryCode("USA")).toBe("US");
    expect(canonicalCountryCode("United Kingdom")).toBe("GB");
    expect(canonicalCountryCode("The Gambia")).toBe("GM");
    expect(canonicalCountryCode("U.S. Virgin Islands")).toBe("VI");
    expect(canonicalCountryCode("Curaçao")).toBe("CW");
    expect(canonicalCountryCode("CA")).toBe("CA");
  });

  it("rejects placeholders, pseudo-regions, and ambiguous multi-country labels", () => {
    for (const value of [
      "", "Unknown", "N/A", "Global", "ZZ", "EU", "EZ", "Eurozone", "EA",
      "AC", "Ascension Island", "CP", "Clipperton Island", "DG", "Diego Garcia",
      "QO", "Outlying Oceania", "IC", "TA", "UN", "XA", "XB", "XK",
      "Zimbabwe / Zambia / Botswana",
    ]) {
      expect(canonicalCountryCode(value)).toBeNull();
    }
  });

  it("matches only two recognized countries with the same canonical code", () => {
    expect(sameRecognizedCountry("USA", "United States")).toBe(true);
    expect(sameRecognizedCountry("UK", "Canada")).toBe(false);
    expect(sameRecognizedCountry("Unknown", "Unknown")).toBe(false);
  });

  it("recognizes every explicit locked global-business country except the known multi-country hold", () => {
    const manifest = resolve(import.meta.dirname, "../../../data/founder-imports/2026-09-05-cumulative-content-global/cumulative-content-global-candidates.jsonl");
    const countries = new Set<string>();
    for (const line of readFileSync(manifest, "utf8").trim().split("\n")) {
      const row = JSON.parse(line) as { targetKind?: string; rawRecord?: { country?: unknown } };
      if (row.targetKind === "business" && typeof row.rawRecord?.country === "string" && row.rawRecord.country.trim()) {
        countries.add(row.rawRecord.country.trim());
      }
    }
    const held = [...countries].filter((country) => !canonicalCountryCode(country));
    expect(held).toEqual(["Zimbabwe / Zambia / Botswana"]);
  });
});
