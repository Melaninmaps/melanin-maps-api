import { describe, expect, it } from "vitest";
import {
  CULTURAL_JOURNEY_DISCLOSURE,
  culturalJourneyEntryView,
  validateCulturalJourneyReflection,
} from "../cultural-journey-policy";

describe("cultural Journey privacy policy", () => {
  it("requires an explicit confirmation before saving a reflection", () => {
    expect(validateCulturalJourneyReflection({ reflection: "A note I chose to keep." })).toMatchObject({ ok: false });
    expect(validateCulturalJourneyReflection({ memberConfirmed: true, reflection: "   " })).toMatchObject({ ok: false });
    expect(validateCulturalJourneyReflection({ memberConfirmed: true, reflection: "A note I chose to keep." })).toEqual({
      ok: true,
      value: "A note I chose to keep.",
    });
  });

  it("bounds private reflection text", () => {
    expect(validateCulturalJourneyReflection({ memberConfirmed: true, reflection: "x".repeat(1_201) })).toMatchObject({ ok: false });
  });

  it("returns only a client-safe owner-scoped entry view", () => {
    expect(culturalJourneyEntryView({
      id: "entry-1",
      culturalSiteId: "site-1",
      siteName: "Example Cultural Site",
      sourceLabel: "Cultural site",
      libraryQuestion: "Example Cultural Site: history, context, and reputable sources",
      reflection: null,
      createdAt: "2026-10-14T00:00:00.000Z",
      updatedAt: "2026-10-14T00:00:00.000Z",
    })).toEqual({
      id: "entry-1",
      culturalSiteId: "site-1",
      siteName: "Example Cultural Site",
      sourceLabel: "Cultural site",
      libraryQuestion: "Example Cultural Site: history, context, and reputable sources",
      reflection: null,
      createdAt: "2026-10-14T00:00:00.000Z",
      updatedAt: "2026-10-14T00:00:00.000Z",
    });
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/private to you/i);
    expect(CULTURAL_JOURNEY_DISCLOSURE).toMatch(/not.*score|score.*not/i);
  });
});
