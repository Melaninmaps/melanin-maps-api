import { describe, expect, it } from "vitest";
import {
  contentCategoriesForHeritage,
  heritageCategoriesForIntent,
  isPermittedHeritageContentCategory,
} from "../heritageContentCategories";

describe("heritage content categories", () => {
  it("keeps academic HBCU contributions separate from traditions and events", () => {
    expect(contentCategoriesForHeritage("HBCU").map((item) => item.value)).toEqual(expect.arrayContaining([
      "academics_research",
      "student_life",
      "traditions_events",
      "alumni_mentorship",
    ]));
    expect(heritageCategoriesForIntent("academic")).toEqual(["academics_research"]);
    expect(heritageCategoriesForIntent("academic")).not.toContain("traditions_events");
  });

  it("allows only categories that fit the selected place type", () => {
    expect(isPermittedHeritageContentCategory("academics_research", "HBCU")).toBe(true);
    expect(isPermittedHeritageContentCategory("traditions_events", "HBCU")).toBe(true);
    expect(isPermittedHeritageContentCategory("academics_research", "Civil Rights")).toBe(false);
    expect(isPermittedHeritageContentCategory("history_legacy", "Civil Rights")).toBe(true);
  });
});
