import { describe, expect, it } from "vitest";
import { shouldRecordBusinessProfileView } from "../profile-view-policy";

describe("business profile view policy", () => {
  it("records anonymous and ordinary-member profile visits", () => {
    expect(shouldRecordBusinessProfileView(undefined)).toBe(true);
    expect(shouldRecordBusinessProfileView({ isLoadTest: false })).toBe(true);
  });

  it("does not record a capacity-test account's view against a real business", () => {
    expect(shouldRecordBusinessProfileView({ isLoadTest: true })).toBe(false);
  });
});
