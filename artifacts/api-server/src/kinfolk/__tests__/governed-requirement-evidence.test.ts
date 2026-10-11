import { describe, expect, it } from "vitest";
import type { GovernedKinfolkBusiness } from "../governedBusinessRepository";
import {
  governedRequirementEvidenceForMemories,
  hasDocumentedRequirementEvidence,
} from "../governed-requirement-evidence";

type RequirementMemory = {
  content: string;
  purpose: string;
  isSensitive: boolean;
};

const documentedAccessibleVeganBusiness: Pick<
  GovernedKinfolkBusiness,
  | "tags"
  | "specialties"
  | "accessibilityFeatures"
  | "audiencesServed"
  | "vibes"
  | "environmentTags"
  | "amenityTags"
> = {
  tags: ["vegan menu"],
  specialties: [],
  accessibilityFeatures: ["wheelchair accessible entrance"],
  audiencesServed: [],
  vibes: [],
  environmentTags: [],
  amenityTags: [],
};

describe("governed hard-requirement evidence boundary", () => {
  it("translates only non-sensitive hard requirements into opaque controlled constraints", () => {
    const evidence = governedRequirementEvidenceForMemories([
      {
        content: "I must have a wheelchair-accessible vegan restaurant.",
        purpose: "requirement_context",
        isSensitive: false,
      },
      {
        content: "My diagnosis is private.",
        purpose: "requirement_context",
        isSensitive: true,
      },
    ] satisfies RequirementMemory[]);

    expect(evidence).toEqual({
      hasRequirement: true,
      hasUnsupportedRequirement: false,
      constraints: expect.arrayContaining([
        "documented_accessibility",
        "documented_vegan",
      ]),
    });
    expect(JSON.stringify(evidence)).not.toContain("diagnosis");
    expect(JSON.stringify(evidence)).not.toContain("wheelchair-accessible vegan restaurant");
  });

  it("requires documented listing metadata for every saved hard requirement", () => {
    const evidence = governedRequirementEvidenceForMemories([
      {
        content: "I must have a wheelchair-accessible vegan restaurant.",
        purpose: "requirement_context",
        isSensitive: false,
      },
    ] satisfies RequirementMemory[]);

    expect(
      hasDocumentedRequirementEvidence(documentedAccessibleVeganBusiness, evidence),
    ).toBe(true);
    expect(
      hasDocumentedRequirementEvidence(
        { ...documentedAccessibleVeganBusiness, accessibilityFeatures: [] },
        evidence,
      ),
    ).toBe(false);
  });

  it("fails closed when a hard requirement has no controlled evidence predicate", () => {
    const evidence = governedRequirementEvidenceForMemories([
      {
        content: "I must have a restaurant where the chef has studied my favorite poetry.",
        purpose: "requirement_context",
        isSensitive: false,
      },
    ] satisfies RequirementMemory[]);

    expect(evidence).toEqual({
      hasRequirement: true,
      hasUnsupportedRequirement: true,
      constraints: [],
    });
    expect(
      hasDocumentedRequirementEvidence(documentedAccessibleVeganBusiness, evidence),
    ).toBe(false);
  });
});
