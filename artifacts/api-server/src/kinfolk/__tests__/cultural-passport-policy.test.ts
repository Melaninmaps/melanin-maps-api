import { describe, expect, it } from "vitest";
import {
  CULTURAL_PASSPORT_DISCLOSURE,
  CULTURAL_PASSPORT_PROMISE,
  culturalPassportView,
  validateCulturalPassportMoment,
} from "../cultural-passport-policy";

describe("Cultural Passport policy", () => {
  it("requires explicit member confirmation rather than deriving a moment from engagement", () => {
    expect(validateCulturalPassportMoment({
      kind: "place",
      title: "A neighborhood story I want to remember",
    })).toEqual({
      ok: false,
      error: "Explicit confirmation is required before Kinfolk saves a Passport moment.",
    });
  });

  it("accepts a member-confirmed meaningful moment without points, levels, or completion data", () => {
    const untrustedDraft: Record<string, unknown> = {
      memberConfirmed: true,
      kind: "story",
      title: "A family story I explored",
      note: "A reflection I chose to keep.",
      sourceLabel: "Library",
      sourceUrl: "https://example.org/story",
      points: 500,
      level: "Explorer",
      completed: true,
    };
    const result = validateCulturalPassportMoment(untrustedDraft);

    expect(result).toEqual({
      ok: true,
      value: {
        kind: "story",
        title: "A family story I explored",
        note: "A reflection I chose to keep.",
        sourceLabel: "Library",
        sourceUrl: "https://example.org/story",
      },
    });
  });

  it("rejects invalid kinds and unsafe source URLs", () => {
    expect(validateCulturalPassportMoment({
      memberConfirmed: true,
      kind: "achievement",
      title: "Not a moment kind",
    })).toEqual({ ok: false, error: "Choose a valid kind of moment." });

    expect(validateCulturalPassportMoment({
      memberConfirmed: true,
      kind: "music",
      title: "A song I learned about",
      sourceUrl: "file:///private/member-note",
    })).toEqual({ ok: false, error: "Source link must use http or https." });
  });

  it("presents My Passport as a private collection of moments with the locked no-gamification promise", () => {
    const passport = culturalPassportView({
      displayName: "Community Member",
      memberSince: 2026,
      moments: [{
        id: "moment-1",
        kind: "food",
        title: "A food tradition I explored",
        note: null,
        sourceLabel: null,
        sourceUrl: null,
        createdAt: "2026-10-14T00:00:00.000Z",
      }],
    });

    expect(passport.promise).toBe(CULTURAL_PASSPORT_PROMISE);
    expect(passport.disclosure).toBe(CULTURAL_PASSPORT_DISCLOSURE);
    expect(passport.moments).toEqual([expect.objectContaining({ title: "A food tradition I explored" })]);
    expect(passport).not.toHaveProperty("level");
    expect(passport).not.toHaveProperty("points");
    expect(passport).not.toHaveProperty("streak");
    expect(passport).not.toHaveProperty("achievement");
    expect(passport).not.toHaveProperty("progress");
  });
});
