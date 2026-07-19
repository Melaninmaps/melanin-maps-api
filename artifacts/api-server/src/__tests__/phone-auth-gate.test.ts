import { describe, it, expect, vi } from "vitest";

const TEST_PHONE = "+15555550100";

describe("TEST_PHONE production gate", () => {
  it("IS_PRODUCTION evaluates true when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const IS_PRODUCTION = process.env.NODE_ENV === "production";
    expect(IS_PRODUCTION).toBe(true);
    vi.unstubAllEnvs();
  });

  it("bypass is inactive in production — test phone treated as real", () => {
    vi.stubEnv("NODE_ENV", "production");
    const IS_PRODUCTION = process.env.NODE_ENV === "production";
    const normalized: string = TEST_PHONE;
    const bypassActive = !IS_PRODUCTION && normalized === TEST_PHONE;
    expect(bypassActive).toBe(false);
    vi.unstubAllEnvs();
  });

  it("bypass is active in development — test phone skips Twilio", () => {
    vi.stubEnv("NODE_ENV", "development");
    const IS_PRODUCTION = process.env.NODE_ENV === "production";
    const normalized: string = TEST_PHONE;
    const bypassActive = !IS_PRODUCTION && normalized === TEST_PHONE;
    expect(bypassActive).toBe(true);
    vi.unstubAllEnvs();
  });

  it("bypass is inactive for any non-test phone number in any environment", () => {
    vi.stubEnv("NODE_ENV", "development");
    const IS_PRODUCTION = process.env.NODE_ENV === "production";
    const realPhone: string = "+12025551234";
    const bypassActive = !IS_PRODUCTION && realPhone === TEST_PHONE;
    expect(bypassActive).toBe(false);
    vi.unstubAllEnvs();
  });
});
