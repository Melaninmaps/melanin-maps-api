import { expect, test } from "vitest";
import { validateSubmission } from "../server/businessIntake/types";
import { businessSubmissionLink } from "../client/src/features/businesses/socialIntakeLinks";

test("accepts basic community business details and keeps review tags bounded", () => {
  const submission = validateSubmission({ businessName: "Neighborhood Books", businessDescription: "An independent community bookstore with readings, youth programs, and local authors.", primaryCategory: "Retail & Shopping", communityTags: ["Black-owned", "Community staple"], city: "Charlotte", stateRegion: "NC" });
  expect(submission.businessName).toBe("Neighborhood Books");
  expect(submission.communityTags).toEqual(["Black-owned", "Community staple"]);
});

test("creates source-attributed social intake links", () => {
  const url = businessSubmissionLink("instagram", "bio");
  expect(url).toContain("/submit-business?source=instagram&campaign=bio");
});

test("requires enough information to make founder review meaningful", () => {
  expect(() => validateSubmission({ businessName: "X", businessDescription: "short", primaryCategory: "" })).toThrow("BUSINESS_NAME_REQUIRED");
});
