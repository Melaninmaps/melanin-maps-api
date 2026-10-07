import { describe, expect, it } from "vitest";
import {
  EMPTY_OWNER_ONBOARDING,
  buildOwnerOnboardingChecklist,
  completionPercent,
  ownerOnboardingInputSchema,
} from "../owner-onboarding-policy";

describe("business owner onboarding policy", () => {
  it("accepts only bounded owner-entered launch details", () => {
    const parsed = ownerOnboardingInputSchema.parse({
      ...EMPTY_OWNER_ONBOARDING,
      identityReviewed: true,
      offerings: [{ name: "  Custom   planning ", detail: "  By appointment  " }],
      pricing: { model: "starting_at", detail: "From $50" },
      availability: { useWeeklySchedule: true, note: "" },
      media: { confirmedRights: true, confirmedReview: true },
      communication: { channels: ["email", "email", "website"], responseWindow: "Within two days" },
    });

    expect(parsed.offerings).toEqual([{ name: "Custom planning", detail: "By appointment" }]);
    expect(parsed.communication.channels).toEqual(["email", "website"]);
    expect(parsed).not.toHaveProperty("publish");
    expect(parsed).not.toHaveProperty("marketing");
  });

  it("rejects unbounded offerings and undeclared automation controls", () => {
    expect(() => ownerOnboardingInputSchema.parse({
      ...EMPTY_OWNER_ONBOARDING,
      offerings: Array.from({ length: 13 }, (_, index) => ({ name: `Offering ${index}`, detail: "" })),
    })).toThrow();
    expect(() => ownerOnboardingInputSchema.parse({
      ...EMPTY_OWNER_ONBOARDING,
      autoPublish: true,
    })).toThrow();
  });

  it("does not count a weekly schedule selection until an actual schedule exists", () => {
    const input = {
      ...EMPTY_OWNER_ONBOARDING,
      availability: { useWeeklySchedule: true, note: "" },
    };
    const withoutSchedule = buildOwnerOnboardingChecklist(input, false);
    const withSchedule = buildOwnerOnboardingChecklist(input, true);

    expect(withoutSchedule.find((item) => item.key === "availability")?.complete).toBe(false);
    expect(withSchedule.find((item) => item.key === "availability")?.complete).toBe(true);
    expect(completionPercent(withSchedule)).toBeGreaterThan(completionPercent(withoutSchedule));
  });

  it("requires owners to make each launch choice rather than treating defaults as complete", () => {
    const checklist = buildOwnerOnboardingChecklist(EMPTY_OWNER_ONBOARDING, false);
    expect(checklist.every((item) => !item.complete)).toBe(true);
    expect(completionPercent(checklist)).toBe(0);
  });
});
