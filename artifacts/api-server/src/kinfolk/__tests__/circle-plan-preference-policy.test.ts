import { describe, expect, it } from "vitest";
import { canUseOwnCirclePlanPreferences } from "../circle-plan-preference-policy";

describe("Circle plan preference sharing", () => {
  it("allows a member to use only their own saved preferences", () => {
    expect(canUseOwnCirclePlanPreferences("member-a", "member-a")).toBe(true);
  });

  it("rejects another Circle member's account-level preferences", () => {
    expect(canUseOwnCirclePlanPreferences("member-a", "member-b")).toBe(false);
  });

  it("does not treat a missing requester as preference-sharing consent", () => {
    expect(canUseOwnCirclePlanPreferences("", "member-b")).toBe(false);
  });
});
