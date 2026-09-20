export type HeritageContentCategory =
  | "academics_research"
  | "student_life"
  | "traditions_events"
  | "alumni_mentorship"
  | "community_connection"
  | "history_legacy"
  | "visit_experience"
  | "preservation_learning";

export type HeritageContentCategoryDefinition = Readonly<{
  value: HeritageContentCategory;
  label: string;
  helper: string;
}>;

const HBCU_CATEGORIES: readonly HeritageContentCategoryDefinition[] = [
  {
    value: "academics_research",
    label: "Academics & Research",
    helper: "Classes, labs, programs, study strategies, and academic resources.",
  },
  {
    value: "student_life",
    label: "Student Life",
    helper: "Housing, campus routines, organizations, accessibility, and practical student tips.",
  },
  {
    value: "traditions_events",
    label: "Traditions & Events",
    helper: "Homecoming, band, campus traditions, reunions, and celebratory moments.",
  },
  {
    value: "alumni_mentorship",
    label: "Alumni & Mentorship",
    helper: "Career paths, mentoring, networking, and professional lessons from alumni.",
  },
  {
    value: "community_connection",
    label: "Community Connection",
    helper: "A respectful personal connection to this institution or its legacy.",
  },
] as const;

const HERITAGE_CATEGORIES: readonly HeritageContentCategoryDefinition[] = [
  {
    value: "history_legacy",
    label: "History & Legacy",
    helper: "Context, memory, and source-grounded historical perspective.",
  },
  {
    value: "visit_experience",
    label: "Visit Experience",
    helper: "Practical, respectful visit context and public-safe experience media.",
  },
  {
    value: "preservation_learning",
    label: "Preservation & Learning",
    helper: "Learning resources, stewardship, and ways to understand the site responsibly.",
  },
  {
    value: "community_connection",
    label: "Community Connection",
    helper: "A respectful personal connection to this place and its continuing meaning.",
  },
] as const;

export function contentCategoriesForHeritage(heritageCategory: string | null | undefined): readonly HeritageContentCategoryDefinition[] {
  return heritageCategory?.trim().toUpperCase() === "HBCU" ? HBCU_CATEGORIES : HERITAGE_CATEGORIES;
}

export function isPermittedHeritageContentCategory(
  value: unknown,
  heritageCategory: string | null | undefined,
): value is HeritageContentCategory {
  return typeof value === "string" && contentCategoriesForHeritage(heritageCategory).some((category) => category.value === value);
}

export function defaultHeritageContentCategory(heritageCategory: string | null | undefined): HeritageContentCategory {
  return contentCategoriesForHeritage(heritageCategory)[0].value;
}

/**
 * Academic intent may read only academics/research and mentorship entries.
 * Culture/event media remains discoverable by choosing that category, but it is
 * never a fallback for an academic query.
 */
export function heritageCategoriesForIntent(intent: "academic" | "career" | "culture" | "visit" | "general"): readonly HeritageContentCategory[] {
  switch (intent) {
    case "academic":
      return ["academics_research"];
    case "career":
      return ["alumni_mentorship"];
    case "culture":
      return ["traditions_events", "history_legacy", "community_connection"];
    case "visit":
      return ["visit_experience", "preservation_learning", "community_connection"];
    default:
      return ["community_connection", "history_legacy", "visit_experience"];
  }
}
