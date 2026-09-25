import { describe, expect, it } from "vitest";
import { hasEffectiveRolloutAccess } from "../authMiddleware";

const NOW = new Date("2026-09-25T17:40:00.000Z");

describe("effective rollout access", () => {
  it("admits an active tester without relying on a duplicate raw approved flag", () => {
    expect(
      hasEffectiveRolloutAccess(
        {
          role: "tester",
          accountStatus: "active",
          testerStatus: "active",
          testingEntitlementEndsAt: null,
          waitlistApproved: false,
        },
        NOW,
      ),
    ).toBe(true);
  });

  it("admits a member whose unified waitlist record is approved", () => {
    expect(
      hasEffectiveRolloutAccess(
        {
          role: "user",
          accountStatus: "active",
          testerStatus: null,
          testingEntitlementEndsAt: null,
          waitlistApproved: true,
        },
        NOW,
      ),
    ).toBe(true);
  });

  it("continues to block a suspended account, expired tester grant, or no approval proof", () => {
    expect(
      hasEffectiveRolloutAccess(
        {
          role: "tester",
          accountStatus: "suspended",
          testerStatus: "active",
          testingEntitlementEndsAt: null,
          waitlistApproved: true,
        },
        NOW,
      ),
    ).toBe(false);
    expect(
      hasEffectiveRolloutAccess(
        {
          role: "tester",
          accountStatus: "active",
          testerStatus: "active",
          testingEntitlementEndsAt: new Date("2026-09-25T17:39:59.000Z"),
          waitlistApproved: false,
        },
        NOW,
      ),
    ).toBe(false);
    expect(
      hasEffectiveRolloutAccess(
        {
          role: "user",
          accountStatus: "active",
          testerStatus: null,
          testingEntitlementEndsAt: null,
          waitlistApproved: false,
        },
        NOW,
      ),
    ).toBe(false);
  });
});
