import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../prepare-source-backed-inventory-review.ts"),
  "utf8",
);
const linkChecker = readFileSync(
  resolve(import.meta.dirname, "../check-source-backed-review-destinations.mjs"),
  "utf8",
);
const cityAudit = readFileSync(
  resolve(import.meta.dirname, "../audit-55-city-social-recovery.py"),
  "utf8",
);
const cityFilter = readFileSync(
  resolve(import.meta.dirname, "../filter-55-city-social-recovery.py"),
  "utf8",
);

describe("source-backed inventory review builder", () => {
  it("requires address, source, and attributable official social destination", () => {
    expect(source).toContain("missing_public_street_address");
    expect(source).toContain("missing_or_invalid_source_url");
    expect(source).toContain("missing_official_social_destination");
    expect(source).toContain("missing_attributable_official_destination");
  });

  it("preserves a review-only, no-publication boundary", () => {
    expect(source).toContain("This script is intentionally a local-file transform");
    expect(source).toContain("It does not connect to a\n * database");
    expect(source).toContain('publication_status: "NOT PUBLISHED.');
    expect(source).toContain("reviewer-confirmation gates");
  });

  it("normalizes only explicit voluntary ownership claims", () => {
    expect(source).toContain('"owned" / "affiliated" language matters');
    expect(source).toContain("never convert a cuisine");
    expect(source).toContain("Foundational Black American-Owned");
    expect(source).toContain("Latino / Hispanic-Owned");
    expect(source).toContain("Divine Nine-Affiliated");
  });

  it("holds duplicates for review and maintains a reusable link check", () => {
    expect(source).toContain("duplicate_within_consolidated_batch");
    expect(source).toContain('options("--input")');
    expect(source).toContain('option("--output-dir")');
    expect(linkChecker).toContain('option("--manifest")');
    expect(linkChecker).toContain('option("--output")');
    expect(linkChecker).toContain("Review-only evidence");
  });

  it("provides auditable tooling for 55-city social-recovery source files", () => {
    expect(cityAudit).toContain("cross_city_duplicate_dedupe_keys");
    expect(cityAudit).toContain("schema_or_eligibility_issues");
    expect(cityFilter).toContain("missing_attributable_official_social_destination");
    expect(cityFilter).toContain("NOT PUBLISHED");
  });
});
