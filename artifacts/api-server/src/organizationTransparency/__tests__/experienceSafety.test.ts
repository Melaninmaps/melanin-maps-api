import { describe, expect, it } from "vitest";
import {
  assessOrganizationExperienceNarrative,
  OrganizationExperienceSafetyError,
} from "../experienceSafety";

describe("organization experience privacy screening", () => {
  it("blocks direct identifiers and medical-record references before moderation storage", () => {
    expect(() =>
      assessOrganizationExperienceNarrative(
        "Please call 215-555-0123 about my treatment.",
        "care",
      ),
    ).toThrow(OrganizationExperienceSafetyError);
    expect(() =>
      assessOrganizationExperienceNarrative(
        "My MRN: A-88291 was mishandled.",
        "care",
      ),
    ).toThrow(OrganizationExperienceSafetyError);
    expect(() =>
      assessOrganizationExperienceNarrative(
        "Dr. Ada Lovelace ignored my request.",
        "care",
      ),
    ).toThrow(OrganizationExperienceSafetyError);
  });

  it("routes serious contextual claims to heightened human review instead of publishing automatically", () => {
    expect(
      assessOrganizationExperienceNarrative(
        "I experienced discrimination after raising a staffing concern.",
        "workplace",
      ),
    ).toEqual({
      normalizedNarrative:
        "I experienced discrimination after raising a staffing concern.",
      moderationFlags: ["unverified_serious_allegation"],
    });
  });
});
