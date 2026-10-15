import { describe, expect, it } from "vitest";
import {
  deriveNonSensitiveInterestSignals,
  normalizeInterestLabel,
  SAFE_INTEREST_CATEGORIES,
} from "../interest-intelligence-service";

describe("Kinfolk interest intelligence safeguards", () => {
  it("uses a bounded allow-list for broad non-sensitive interests", () => {
    expect(SAFE_INTEREST_CATEGORIES).toContain("music_and_audio");
    expect(SAFE_INTEREST_CATEGORIES).not.toContain("health");
    expect(deriveNonSensitiveInterestSignals("I want to find a jazz concert and a good bookstore.")).toEqual([
      { category: "books_and_learning", label: "books and reading", temporary: false },
      { category: "music_and_audio", label: "live music", temporary: false },
    ]);
  });

  it("fails closed for family, third-party, health, and temporary-sensitive contexts", () => {
    expect(deriveNonSensitiveInterestSignals("I am researching baby products for my friend")).toEqual([]);
    expect(deriveNonSensitiveInterestSignals("My child needs a music class")).toEqual([]);
    expect(deriveNonSensitiveInterestSignals("I need a therapist who likes jazz")).toEqual([]);
    expect(deriveNonSensitiveInterestSignals("Find a wellness spa for someone else")).toEqual([]);
    expect(normalizeInterestLabel("medical care")).toBeNull();
    expect(normalizeInterestLabel("street photography")).toBe("street photography");
  });

  it("marks a narrow time-bound non-sensitive signal as temporary", () => {
    expect(deriveNonSensitiveInterestSignals("Any live music tonight?")).toEqual([
      { category: "music_and_audio", label: "live music", temporary: true },
    ]);
  });
});
