import { describe, expect, it } from "vitest";
import {
  getKinfolkVisualEvidenceProviderReadiness,
  parseKinfolkVisualEvidence,
  resolveCurrentTurnVisualIntent,
  resolveKinfolkVisualEvidence,
} from "../visual-evidence";

const verifiedEvidence = {
  id: "visual-evidence-0001",
  assetPath: "/api/kinfolk/visual-evidence/assets/visual-evidence-0001",
  altText: "A labeled close-up showing a single braided hairstyle.",
  sourceName: "Example Museum",
  sourcePageUrl: "https://museum.example.org/collection/braids",
  sourceTitle: "Braided hair reference",
  caption: "A source-reviewed braided hairstyle reference.",
  subject: "braided hairstyle",
  category: "cultural",
  sourcePublishedAt: "2026-09-01T00:00:00Z",
  sourceReviewedAt: "2026-10-08T00:00:00Z",
  rights: "publisher_permission",
  rightsNotice: "Displayed with publisher permission.",
  whyThisImageFits: "The source page and visual review both identify the requested hairstyle.",
  verification: {
    exactSubject: true,
    correctCategory: true,
    sourceIdentityConfirmed: true,
    visualReviewCompleted: true,
  },
} as const;

describe("Kinfolk verified visual evidence", () => {
  it("does not treat an arbitrary configured provider name as a working retrieval integration", () => {
    expect(getKinfolkVisualEvidenceProviderReadiness({})).toEqual({ ready: false, reason: "not_configured" });
    expect(getKinfolkVisualEvidenceProviderReadiness({ KINFOLK_VISUAL_EVIDENCE_PROVIDER: "unreviewed-search" })).toEqual({
      ready: false,
      reason: "provider_not_integrated",
    });
  });

  it.each([
    "Show me a reference photo of a starter loc style.",
    "What does a French braid look like?",
    "Can I see a museum photograph of that artist?",
    "Please show a labeled diagram for the learning concept.",
    "I need a picture that compares these two hair styles.",
  ])("recognizes a direct current-turn visual request: %s", (message) => {
    expect(resolveCurrentTurnVisualIntent(message).requested).toBe(true);
  });

  it.each([
    "Rewrite this note so it sounds calmer.",
    "I feel overwhelmed by work and do not know what I need.",
    "What is 12 times 8?",
    "Can you upload the photo I just attached?",
    "Create a birthday graphic for my cousin.",
  ])("does not turn unrelated or separately-governed work into image discovery: %s", (message) => {
    expect(resolveCurrentTurnVisualIntent(message).requested).toBe(false);
  });

  it("accepts only an internally approved asset with complete rights and source verification", () => {
    expect(parseKinfolkVisualEvidence([verifiedEvidence])).toEqual([
      expect.objectContaining({
        id: "visual-evidence-0001",
        assetPath: "/api/kinfolk/visual-evidence/assets/visual-evidence-0001",
        sourcePageUrl: "https://museum.example.org/collection/braids",
        rights: "publisher_permission",
      }),
    ]);
  });

  it.each([
    ["a generic third-party image URL", { ...verifiedEvidence, assetPath: "https://images.example.org/anything.jpg" }],
    ["missing rights", { ...verifiedEvidence, rights: "unknown" }],
    ["a wrong hairstyle category", { ...verifiedEvidence, verification: { ...verifiedEvidence.verification, correctCategory: false } }],
    ["an unreviewed person photo", { ...verifiedEvidence, verification: { ...verifiedEvidence.verification, sourceIdentityConfirmed: false } }],
    ["a scriptable source page", { ...verifiedEvidence, sourcePageUrl: "javascript:alert(1)" }],
    ["a missing review date", { ...verifiedEvidence, sourceReviewedAt: "" }],
  ])("fails closed for %s", (_label, candidate) => {
    expect(parseKinfolkVisualEvidence([candidate])).toEqual([]);
  });

  it("returns an honest no-image result when the provider supplies no verified source", () => {
    expect(resolveKinfolkVisualEvidence({
      currentMessage: "Show me a clear reference photo of a protective hairstyle.",
      answerStrategy: "stable_knowledge",
      highConsequence: false,
      candidates: [],
    })).toEqual({
      state: "unavailable_no_verified_evidence",
      evidence: [],
      notice: "I don’t have a verified image source for this request, so I won’t show an unverified image.",
    });
  });

  it("allows a matching verified cultural reference without any profile or history input", () => {
    const response = resolveKinfolkVisualEvidence({
      currentMessage: "Show me a reference photo of a braided hairstyle.",
      answerStrategy: "stable_knowledge",
      highConsequence: false,
      candidates: [verifiedEvidence],
    });
    expect(response.state).toBe("verified_evidence");
    expect(response.notice).toBeNull();
    expect(response.evidence).toHaveLength(1);
    expect(response.evidence[0]?.subject).toBe("braided hairstyle");
  });

  it("requires clinical-grade verification for high-consequence visual questions", () => {
    const generalResponse = resolveKinfolkVisualEvidence({
      currentMessage: "Show me an image of a rash.",
      answerStrategy: "current_evidence",
      highConsequence: true,
      candidates: [verifiedEvidence],
    });
    expect(generalResponse).toMatchObject({
      state: "unavailable_no_verified_evidence",
      evidence: [],
      notice: expect.stringContaining("verified clinical image source"),
    });

    const clinicalResponse = resolveKinfolkVisualEvidence({
      currentMessage: "Show me an image of a rash.",
      answerStrategy: "current_evidence",
      highConsequence: true,
      candidates: [{ ...verifiedEvidence, id: "clinical-image-0001", assetPath: "/api/kinfolk/visual-evidence/assets/clinical-image-0001", category: "clinical" }],
    });
    expect(clinicalResponse.state).toBe("verified_evidence");
  });

  it("never crosses into public discovery for a consented private image turn", () => {
    expect(resolveKinfolkVisualEvidence({
      currentMessage: "What does this photo show?",
      answerStrategy: "stable_knowledge",
      highConsequence: false,
      isPrivateImageTurn: true,
      candidates: [verifiedEvidence],
    })).toEqual({ state: "not_requested", evidence: [], notice: null });
  });
});
