import { describe, expect, it } from "vitest";
import { normalizeBusinessSocialProfileUrl } from "../lib/businessProfileSocialUrl";

describe("business profile social URL normalization", () => {
  it("retains exact official full profile URLs without double-prefixing", () => {
    expect(normalizeBusinessSocialProfileUrl(
      "https://www.instagram.com/bookers.westphilly/",
      "instagram",
    )).toBe("https://www.instagram.com/bookers.westphilly/");
    expect(normalizeBusinessSocialProfileUrl(
      "https://x.com/bookers_philly",
      "twitter",
    )).toBe("https://x.com/bookers_philly");
  });

  it("constructs a platform URL only from a simple social handle", () => {
    expect(normalizeBusinessSocialProfileUrl("@bookers.westphilly", "instagram"))
      .toBe("https://www.instagram.com/bookers.westphilly");
    expect(normalizeBusinessSocialProfileUrl("bookers_philly", "twitter"))
      .toBe("https://x.com/bookers_philly");
  });

  it("holds mismatched, malformed, credentialed, and path-like inputs", () => {
    expect(normalizeBusinessSocialProfileUrl("https://example.com/bookers", "instagram")).toBeNull();
    expect(normalizeBusinessSocialProfileUrl("https://person:secret@instagram.com/bookers", "instagram")).toBeNull();
    expect(normalizeBusinessSocialProfileUrl("javascript:alert(1)", "instagram")).toBeNull();
    expect(normalizeBusinessSocialProfileUrl("bookers/westphilly", "instagram")).toBeNull();
  });
});
