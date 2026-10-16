import { describe, expect, it } from "vitest";
import {
  containsLikelyStreetAddress,
  MEETUP_RETENTION_MS,
  nonSensitiveMeetupFields,
  parseOptionalFutureDate,
  resolveMeetupEligibility,
  validateMeetingPlace,
} from "../meetupSafetyPolicy";

describe("consent-first Meetup Verification policy", () => {
  it("allows adults and guardian-approved 16–17 year olds only", () => {
    expect(resolveMeetupEligibility("18_plus", false)).toMatchObject({
      allowed: true,
      code: "eligible_adult",
    });
    expect(resolveMeetupEligibility("16_17", true)).toMatchObject({
      allowed: true,
      code: "eligible_guardian_approved",
    });
    expect(resolveMeetupEligibility("16_17", false)).toMatchObject({
      allowed: false,
      code: "guardian_approval_required",
    });
    expect(resolveMeetupEligibility("13_15", true)).toMatchObject({
      allowed: false,
      code: "under_16_not_available",
    });
    expect(resolveMeetupEligibility("unknown", false)).toMatchObject({
      allowed: false,
      code: "age_assurance_required",
    });
  });

  it("uses a fixed 90-day retention period", () => {
    expect(MEETUP_RETENTION_MS).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it("rejects likely street addresses while allowing city and venue names", () => {
    expect(containsLikelyStreetAddress("123 Main Street")).toBe(true);
    expect(containsLikelyStreetAddress("200 Grand Ave")).toBe(true);
    expect(containsLikelyStreetAddress("Downtown Atlanta")).toBe(false);
    expect(() => validateMeetingPlace("Downtown Atlanta", "Busy Bean Coffee")).not.toThrow();
    expect(() => validateMeetingPlace(null, "123 Main Street")).toThrow(/street address/i);
  });

  it("accepts only future meeting times within one year", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(parseOptionalFutureDate(tomorrow, "Meeting time")).toBeInstanceOf(Date);
    expect(() => parseOptionalFutureDate(new Date(Date.now() - 1000).toISOString(), "Meeting time")).toThrow(/future/i);
    expect(() => parseOptionalFutureDate("not-a-date", "Meeting time")).toThrow(/valid date-time/i);
  });

  it("limits persisted meetup data to non-sensitive fields", () => {
    expect(nonSensitiveMeetupFields()).not.toContain("address");
    expect(nonSensitiveMeetupFields()).not.toContain("coordinates");
    expect(nonSensitiveMeetupFields()).not.toContain("dateOfBirth");
  });
});
