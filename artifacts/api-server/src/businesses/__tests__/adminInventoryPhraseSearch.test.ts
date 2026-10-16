import { describe, expect, it } from "vitest";
import {
  buildAdminBusinessExactPhrasePredicate,
  escapeAdminBusinessSearchPhrase,
  parseAdminBusinessSearchPhrase,
} from "../adminInventoryPhraseSearch";

describe("admin inventory exact phrase search", () => {
  it("preserves one normalized multiword phrase instead of splitting it into separate terms", () => {
    expect(parseAdminBusinessSearchPhrase("  Black   Women  ")).toBe("Black Women");
    expect(parseAdminBusinessSearchPhrase('"Black Women"')).toBe("Black Women");
    expect(parseAdminBusinessSearchPhrase("“Black Women”")).toBe("Black Women");
    expect(parseAdminBusinessSearchPhrase("   ")).toBeNull();
  });

  it("escapes SQL LIKE metacharacters without changing phrase semantics", () => {
    expect(escapeAdminBusinessSearchPhrase("Black_100%\\Women")).toBe("Black\\_100\\%\\\\Women");
  });

  it("searches retained ownership and profile fields while excluding reviews and internal provenance", () => {
    const predicate = buildAdminBusinessExactPhrasePredicate("$4");

    for (const expression of [
      "name ILIKE $4",
      "COALESCE(description, '') ILIKE $4",
      "COALESCE(business_tagline, '') ILIKE $4",
      "COALESCE(owner_bio, '') ILIKE $4",
      "COALESCE(owner_story, '') ILIKE $4",
      "COALESCE(tags::text, '') ILIKE $4",
      "COALESCE(vibes::text, '') ILIKE $4",
      "ownership_designations::text",
      "verified_designations::text",
      "ownership_claim",
      "'Black-Owned Black / African American-Owned'",
      "COALESCE(hours, '') ILIKE $4",
      "COALESCE(website, '') ILIKE $4",
      "COALESCE(instagram, '') ILIKE $4",
    ]) {
      expect(predicate).toContain(expression);
    }

    expect(predicate).not.toContain("reviews");
    expect(predicate).not.toContain("research_source");
    expect(predicate).not.toContain("intake_batch");
  });
});
