import { describe, expect, it } from "vitest";
import {
  applySavedMemberResearchContext,
  libraryPurposeConsent,
} from "../saved-member-research-context";

describe("saved member research context", () => {
  const blackWomanDefault = {
    useMemberContextByDefault: true,
    communities: ["Black women"],
    cultures: [],
  };

  it("uses one explicit revocable consent decision for every Library purpose", () => {
    expect(libraryPurposeConsent(blackWomanDefault)).toEqual({
      granted: true,
      purpose: "library_saved_context",
    });
    expect(libraryPurposeConsent({ useMemberContextByDefault: false })).toEqual({
      granted: false,
      purpose: "library_saved_context",
    });
    expect(libraryPurposeConsent(null).granted).toBe(false);
  });

  it("adds an explicitly consented default as a separate research lens", () => {
    expect(applySavedMemberResearchContext({
      question: "breast cancer screening",
      preferences: blackWomanDefault,
    })).toEqual({
      question: "#BlackWomen breast cancer screening",
      appliedTags: ["#BlackWomen"],
    });
  });

  it("does not add private context without affirmative default consent", () => {
    expect(applySavedMemberResearchContext({
      question: "buying a home",
      preferences: { ...blackWomanDefault, useMemberContextByDefault: false },
    })).toEqual({ question: "buying a home", appliedTags: [] });
  });

  it("lets a current purpose or explicit group override the saved default", () => {
    expect(applySavedMemberResearchContext({
      question: "general only: breast cancer screening",
      preferences: blackWomanDefault,
    }).appliedTags).toEqual([]);
    expect(applySavedMemberResearchContext({
      question: "this is for my friend: breast cancer screening",
      preferences: blackWomanDefault,
    }).appliedTags).toEqual([]);
    expect(applySavedMemberResearchContext({
      question: "#BlackMen breast cancer screening",
      preferences: blackWomanDefault,
    }).appliedTags).toEqual([]);
    expect(applySavedMemberResearchContext({
      question: "I want to donate to a breast cancer charity",
      preferences: blackWomanDefault,
    }).appliedTags).toEqual([]);
  });

  it("does not use saved context as public identity or business-recommendation data", () => {
    const result = applySavedMemberResearchContext({
      question: "breast cancer screening",
      preferences: blackWomanDefault,
    });
    expect(result).toEqual({
      question: "#BlackWomen breast cancer screening",
      appliedTags: ["#BlackWomen"],
    });
    expect(Object.keys(result)).toEqual(["question", "appliedTags"]);
  });
});
