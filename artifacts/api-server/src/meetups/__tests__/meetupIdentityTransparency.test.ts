import { describe, expect, it } from "vitest";
import {
  buildMeetupIdentityTransparency,
  identityAcknowledgmentMatches,
  resolveMeetupIdentityStatus,
} from "../meetupIdentityTransparency";

describe("meetup identity transparency", () => {
  it("exposes a positive verified signal and reliable dates only when verification is complete", () => {
    const verifiedAt = new Date("2026-10-01T12:00:00.000Z");
    const memberSince = new Date("2024-01-01T12:00:00.000Z");
    expect(buildMeetupIdentityTransparency({
      identityVerified: true,
      identityVerifiedAt: verifiedAt,
      memberSince,
    })).toMatchObject({
      status: "verified",
      verifiedAt,
      memberSince,
    });
  });

  it("does not infer verification or a verification date from a member record", () => {
    expect(buildMeetupIdentityTransparency({
      identityVerified: false,
      identityVerifiedAt: new Date("2026-10-01T12:00:00.000Z"),
      memberSince: new Date("2024-01-01T12:00:00.000Z"),
    })).toMatchObject({
      status: "not_verified",
      verifiedAt: null,
    });
  });

  it("uses unavailable only when the identity signal cannot be loaded", () => {
    expect(resolveMeetupIdentityStatus(undefined)).toBe("unavailable");
    expect(resolveMeetupIdentityStatus(null)).toBe("unavailable");
  });

  it("requires acknowledgment of the current status, including a changed status", () => {
    expect(identityAcknowledgmentMatches("not_verified", "not_verified")).toBe(true);
    expect(identityAcknowledgmentMatches("not_verified", "verified")).toBe(false);
    expect(identityAcknowledgmentMatches("verified", "unavailable")).toBe(false);
  });
});
