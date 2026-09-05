import { describe, expect, it } from "vitest";
import { assertKinfolkPocCandidatePrivacy } from "../lib/kinfolk-poc-privacy";

function safeCandidate(): Record<string, unknown> {
  return {
    sourceRow: 2,
    personaDataIncluded: false,
    ownershipDesignations: [],
    ownershipEvidence: null,
    culturalSpecialty: null,
    notes: null,
    searchTags: ["Independent bookstore", "Author events"],
  };
}

describe("Kinfolk proof-of-concept candidate privacy boundary", () => {
  it("accepts factual public service tags", () => {
    expect(() => assertKinfolkPocCandidatePrivacy(safeCandidate())).not.toThrow();
  });

  it.each([
    ["nested persona profile", { rawRecord: { profile_id: "P14" } }],
    ["nested match score", { rawRecord: { matchScore: 95 } }],
    ["ownership designation", { ownershipDesignations: ["Woman-Owned"] }],
    ["ownership evidence", { ownershipEvidence: "Founder workbook says so" }],
    ["review-only price", { founderPriceTierReviewOnly: "budget" }],
    ["cultural fit claim", { culturalSpecialty: "community fit" }],
    ["subjective note", { notes: "best for this profile" }],
    ["persona safety signal", { rawRecord: { safety_signal: "safe for profile" } }],
    ["camelCase hair profile", { rawRecord: { hairProfile: "locs" } }],
    ["camelCase travel profile", { rawRecord: { travelProfile: "adventure" } }],
    ["bare safety field", { rawRecord: { safety: "high" } }],
    ["bare accessibility field", { rawRecord: { accessibility: "step free" } }],
    ["bare frugal field", { rawRecord: { frugal: true } }],
    ["bare travel field", { rawRecord: { travel: "frequent" } }],
    ["demographic search tag", { searchTags: ["Books by Black authors"] }],
    ["age and price search tag", { searchTags: ["Arcade pricing available for children under 13"] }],
    ["supplemental audience facts", { reviewedPublicEvidence: { audienceFacts: ["for teens"] } }],
  ])("rejects %s leakage", (_label, unsafe) => {
    expect(() => assertKinfolkPocCandidatePrivacy({ ...safeCandidate(), ...unsafe })).toThrow(/Privacy-unsafe/);
  });
});
