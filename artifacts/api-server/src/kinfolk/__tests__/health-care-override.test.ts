import { describe, expect, it } from "vitest";
import { buildHealthCareOverride } from "../health-care-override";

describe("qualified care override", () => {
  it("does not let a breast-change care request be blocked by an ownership-scoped directory", () => {
    const override = buildHealthCareOverride({
      message:
        "I'm a Black woman and found a lump in my breast. Where can I find a doctor in Philadelphia?",
      intentClass: "medical_health",
    });

    expect(override).toMatchObject({
      applies: true,
      suppressesGeneralBusinessCatalog: true,
    });
    expect(override.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "NCI" }),
        expect.objectContaining({ source: "CDC" }),
        expect.objectContaining({ source: "HRSA" }),
        expect.objectContaining({ source: "CMS Medicare" }),
      ]),
    );
    expect(override.promptBlock).toContain("Never withhold or delay");
    expect(override.promptBlock).toContain("Do not output an ordinary MWM business card");
    expect(override.promptBlock).toContain("Do not diagnose it");
    expect(override.promptBlock).toContain("group-level context");
    expect(override.promptBlock).not.toMatch(/appointment.*earliest/i);
  });

  it("keeps generic health care navigation neutral unless population context is explicit", () => {
    const override = buildHealthCareOverride({
      message: "Where can I find a breast specialist in Philadelphia?",
      intentClass: "medical_health",
    });

    expect(override.applies).toBe(true);
    expect(override.suppressesGeneralBusinessCatalog).toBe(true);
    expect(override.sources.some((source) => source.source === "CDC")).toBe(false);
    expect(override.promptBlock).toContain("Do not infer a race");
  });

  it("offers medication questions without turning every medication question into a directory search", () => {
    const override = buildHealthCareOverride({
      message: "What should I ask my pharmacist about a new prescription and side effects?",
      intentClass: "medical_health",
    });

    expect(override).toMatchObject({
      applies: true,
      suppressesGeneralBusinessCatalog: false,
    });
    expect(override.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "NIH MedlinePlus" }),
      ]),
    );
    expect(override.promptBlock).toContain("Do not prescribe");
    expect(override.promptBlock).toContain("missed-dose instructions");
  });

  it("does not alter ordinary non-health discovery or general conversation", () => {
    expect(
      buildHealthCareOverride({
        message: "Find a Black-owned vegan restaurant in Philadelphia",
        intentClass: "business_discovery",
      }),
    ).toMatchObject({
      applies: false,
      suppressesGeneralBusinessCatalog: false,
      promptBlock: "",
      sources: [],
    });

    expect(
      buildHealthCareOverride({
        message: "Why is the sun so hot?",
        intentClass: "general_knowledge",
      }),
    ).toMatchObject({
      applies: false,
      suppressesGeneralBusinessCatalog: false,
      promptBlock: "",
      sources: [],
    });
  });
});
