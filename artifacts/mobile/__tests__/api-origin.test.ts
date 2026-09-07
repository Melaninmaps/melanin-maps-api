import { afterEach, describe, expect, it } from "vitest";
import { getApiBase, STAGING_ORIGIN } from "../lib/api";

const originalOrigin = process.env.EXPO_PUBLIC_API_ORIGIN;
const originalEnvironment = process.env.EXPO_PUBLIC_APP_ENV;

afterEach(() => {
  if (originalOrigin === undefined) delete process.env.EXPO_PUBLIC_API_ORIGIN;
  else process.env.EXPO_PUBLIC_API_ORIGIN = originalOrigin;
  if (originalEnvironment === undefined) delete process.env.EXPO_PUBLIC_APP_ENV;
  else process.env.EXPO_PUBLIC_APP_ENV = originalEnvironment;
});

describe("mobile API origin", () => {
  it("accepts the reviewed HTTPS staging origin", () => {
    process.env.EXPO_PUBLIC_APP_ENV = "staging";
    process.env.EXPO_PUBLIC_API_ORIGIN = STAGING_ORIGIN;
    expect(getApiBase()).toBe(STAGING_ORIGIN);
  });

  it("fails closed when the origin is missing", () => {
    delete process.env.EXPO_PUBLIC_API_ORIGIN;
    expect(() => getApiBase()).toThrow(/required/);
  });

  it.each([
    "http://mwm-staging.35.196.78.19.nip.io",
    "https://user:secret@mwm-staging.35.196.78.19.nip.io",
    "https://mwm-staging.35.196.78.19.nip.io/api",
    "https://mwm-staging.35.196.78.19.nip.io?target=other",
    "not-an-origin",
  ])("rejects malformed or unsafe origin %s", (origin) => {
    process.env.EXPO_PUBLIC_APP_ENV = "staging";
    process.env.EXPO_PUBLIC_API_ORIGIN = origin;
    expect(() => getApiBase()).toThrow(/blocked/);
  });

  it("rejects the production backend for a staging candidate", () => {
    process.env.EXPO_PUBLIC_APP_ENV = "staging";
    process.env.EXPO_PUBLIC_API_ORIGIN = "https://www.mappingwithmelanin.com";
    expect(() => getApiBase()).toThrow(/reviewed staging backend/);
  });
});
