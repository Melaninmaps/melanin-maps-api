import { describe, expect, it } from "vitest";
import {
  normalizeReferralCodeForLookup,
  validateReferralCode,
} from "../waitlistReferralLedger";

describe("waitlist referral code policy", () => {
  it("normalizes case without treating punctuation variants as separate codes", () => {
    expect(validateReferralCode("mea-parks")).toEqual({
      ok: true,
      displayCode: "MEA-PARKS",
      normalizedCode: "MEA-PARKS",
    });
    expect(validateReferralCode("Mea-Parks")).toEqual({
      ok: true,
      displayCode: "MEA-PARKS",
      normalizedCode: "MEA-PARKS",
    });
  });

  it("permits only new codes of 3–10 letters, numbers, or internal hyphens", () => {
    expect(validateReferralCode("M-12345678").ok).toBe(true);
    expect(validateReferralCode("M-123456789")).toEqual({ ok: false, reason: "format" });
    expect(validateReferralCode("-MEA")).toEqual({ ok: false, reason: "format" });
    expect(validateReferralCode("MEA-")).toEqual({ ok: false, reason: "format" });
  });

  it("blocks reserved and moderation-prohibited code claims before availability checks", () => {
    expect(validateReferralCode("admin")).toEqual({ ok: false, reason: "reserved" });
    expect(validateReferralCode("shit")).toEqual({ ok: false, reason: "moderation" });
  });

  it("continues to resolve older shared links without making them claimable again", () => {
    expect(normalizeReferralCodeForLookup("MWM-MEAPARKS-1234")).toEqual({
      ok: true,
      displayCode: "MWM-MEAPARKS-1234",
      normalizedCode: "MWM-MEAPARKS-1234",
    });
    expect(validateReferralCode("MWM-MEAPARKS-1234")).toEqual({ ok: false, reason: "format" });
  });
});
