import { describe, expect, it } from "vitest";
import { decideSocialFirstIdentityMatch } from "../lib/social-first-ingestion";

describe("social-first identity decision policy", () => {
  it("holds a name-and-locality-only candidate before it can merge social fields", () => {
    expect(decideSocialFirstIdentityMatch(0, 1)).toEqual({
      action: "REVIEW",
      reason: "name_locality_match_requires_identity_review",
    });
  });

  it("holds an ambiguous shared phone domain or social match", () => {
    expect(decideSocialFirstIdentityMatch(2, 0)).toEqual({
      action: "REVIEW",
      reason: "ambiguous_strong_identifier_match",
    });
  });

  it("permits a merge only for one unique strong identifier", () => {
    expect(decideSocialFirstIdentityMatch(1, 1)).toEqual({
      action: "MERGE",
      reason: null,
    });
  });

  it("allows a new candidate only when no canonical identity lead exists", () => {
    expect(decideSocialFirstIdentityMatch(0, 0)).toEqual({
      action: "CREATE",
      reason: null,
    });
  });
});
