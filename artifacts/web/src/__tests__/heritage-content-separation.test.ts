import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../pages/cultural-site-detail.tsx", import.meta.url), "utf8");
const mobile = readFileSync(new URL("../../../mobile/app/cultural-heritage.tsx", import.meta.url), "utf8");
const mobileLibrary = readFileSync(new URL("../../../mobile/app/library-research.tsx", import.meta.url), "utf8");

describe("heritage profile content separation", () => {
  it("gives HBCUs distinct academic, student-life, tradition, and mentorship scopes", () => {
    for (const expected of ["Academics & Research", "Student Life", "Traditions & Events", "Alumni & Mentorship"]) {
      expect(page).toContain(expected);
      expect(mobile).toContain(expected);
    }
    expect(page).toContain("HBCU learning & community");
    expect(mobile).toContain("HBCU Learning & Community");
  });

  it("keeps public social links review-gated and category-addressable", () => {
    expect(page).toContain("Public-safe links are reviewed before appearing");
    expect(page).toContain("contentCategory");
    expect(mobile).toContain("contentCategory");
    expect(mobile).toContain("Links are reviewed before appearing");
  });

  it("opens each HBCU through a contextual Library research prompt", () => {
    expect(page).toContain("/library?q=");
    expect(mobile).toContain('pathname: "/library-research"');
    expect(mobile).toContain("academics, student life, alumni mentorship");
    expect(mobileLibrary).toContain("useLocalSearchParams");
    expect(mobileLibrary).toContain("suggestedQuestion");
  });
});
