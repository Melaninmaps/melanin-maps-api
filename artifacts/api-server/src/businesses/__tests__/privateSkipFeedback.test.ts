import { describe, expect, it } from "vitest";
import {
  aggregatePrivateSkipFeedbackSignals,
  normalizePrivateSkipFeedbackReason,
  PRIVATE_SKIP_FEEDBACK_MINIMUM_DISTINCT_MEMBERS,
} from "../privateSkipFeedback";

describe("private skip feedback policy", () => {
  it("accepts only the reviewed category vocabulary", () => {
    expect(normalizePrivateSkipFeedbackReason("accessibility")).toBe("accessibility");
    expect(normalizePrivateSkipFeedbackReason("  PRICE_VALUE ")).toBe("price_value");
    expect(normalizePrivateSkipFeedbackReason("the owner was rude")).toBeNull();
    expect(normalizePrivateSkipFeedbackReason(undefined)).toBeNull();
  });

  it("returns only thresholded distinct-member aggregates", () => {
    const aggregate = aggregatePrivateSkipFeedbackSignals([
      { message: "accessibility", submittedById: "member-1" },
      { message: "accessibility", submittedById: "member-2" },
      { message: "accessibility", submittedById: "member-3" },
      { message: "accessibility", submittedById: "member-3" },
      { message: "price_value", submittedById: "member-1" },
      { message: "price_value", submittedById: "member-2" },
      { message: "a legacy free-text note", submittedById: "member-4" },
    ]);

    expect(PRIVATE_SKIP_FEEDBACK_MINIMUM_DISTINCT_MEMBERS).toBe(3);
    expect(aggregate).toEqual({
      totalDistinctMembers: 3,
      reasonCounts: [{
        reasonCode: "accessibility",
        label: "Accessibility",
        distinctMemberCount: 3,
      }],
    });
  });

  it("withholds a category when fewer than three distinct members selected it", () => {
    expect(aggregatePrivateSkipFeedbackSignals([
      { message: "hours_availability", submittedById: "member-1" },
      { message: "hours_availability", submittedById: "member-2" },
    ])).toEqual({ totalDistinctMembers: 0, reasonCounts: [] });
  });
});
