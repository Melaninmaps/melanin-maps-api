import { describe, expect, it } from "vitest";
import {
  BUSINESS_CULTURAL_TEACHING_MAX_TEXT_CHARS,
  BUSINESS_CULTURAL_TEACHING_MAX_WORDS,
  sanitizeBusinessCulturalTeaching,
} from "../business-cultural-teaching-policy";

const valid = {
  title: "A small welcome",
  teaching: "We invite visitors to slow down, ask questions, and enjoy this space with care.",
  ownerConfirmed: true,
};

describe("Business Cultural Teaching policy", () => {
  it("requires an explicit owner confirmation and normalizes bounded plain text", () => {
    expect(sanitizeBusinessCulturalTeaching({ ...valid, ownerConfirmed: false })).toEqual({
      ok: false,
      error: "Confirm this teaching before saving.",
    });
    expect(sanitizeBusinessCulturalTeaching({ ...valid, teaching: "  Take\n your time.  " })).toEqual({
      ok: true,
      teaching: { title: valid.title, teaching: "Take your time." },
    });
  });

  it("enforces the roughly thirty-second character and word boundaries", () => {
    expect(sanitizeBusinessCulturalTeaching({ ...valid, teaching: "word ".repeat(BUSINESS_CULTURAL_TEACHING_MAX_WORDS + 1) })).toMatchObject({ ok: false });
    expect(sanitizeBusinessCulturalTeaching({ ...valid, teaching: "a".repeat(BUSINESS_CULTURAL_TEACHING_MAX_TEXT_CHARS + 1) })).toMatchObject({ ok: false });
  });

  it("rejects controls and markup instead of silently rewriting them", () => {
    expect(sanitizeBusinessCulturalTeaching({ ...valid, title: "<strong>Welcome</strong>" })).toMatchObject({ ok: false });
    expect(sanitizeBusinessCulturalTeaching({ ...valid, teaching: "Welcome\u0000 everyone" })).toMatchObject({ ok: false });
    expect(sanitizeBusinessCulturalTeaching({ ...valid, teaching: "[Read more](https://example.com)" })).toMatchObject({ ok: false });
    expect(sanitizeBusinessCulturalTeaching({ ...valid, teaching: "Read more at https://example.com" })).toMatchObject({ ok: false });
  });

  it("does not accept culture labels, demographics, targeting, or arbitrary metadata fields", () => {
    for (const extra of [
      { cultureLabel: "Example" },
      { demographics: ["Example"] },
      { targeting: { audience: "Example" } },
      { metadata: { source: "Example" } },
    ]) {
      expect(sanitizeBusinessCulturalTeaching({ ...valid, ...extra })).toEqual({
        ok: false,
        error: "Use only the supported teaching fields.",
      });
    }
  });
});
