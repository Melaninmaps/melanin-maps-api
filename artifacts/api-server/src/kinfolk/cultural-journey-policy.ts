export const CULTURAL_JOURNEY_DISCLOSURE =
  "My Cultural Journey is private to you. Kinfolk saves a public cultural-site reference only when you choose it, and a reflection only when you confirm it. Nothing here is a score, streak, or completion goal.";

export interface CulturalJourneyReflectionDraft {
  memberConfirmed?: unknown;
  reflection?: unknown;
}

export type CulturalJourneyReflectionValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

/**
 * Reflections are member-authored and require a fresh affirmative action. They
 * are not copied into Kinfolk memory or Library research context by this route.
 */
export function validateCulturalJourneyReflection(
  draft: CulturalJourneyReflectionDraft,
): CulturalJourneyReflectionValidation {
  if (draft.memberConfirmed !== true) {
    return { ok: false, error: "Explicit confirmation is required before Kinfolk saves a Journey reflection." };
  }
  if (typeof draft.reflection !== "string") {
    return { ok: false, error: "Reflection must be text." };
  }
  const reflection = draft.reflection.trim();
  if (!reflection) return { ok: false, error: "Write a reflection before saving it." };
  if (reflection.length > 1_200) return { ok: false, error: "Reflection must be 1200 characters or fewer." };
  return { ok: true, value: reflection };
}

export interface CulturalJourneyEntryView {
  id: string;
  culturalSiteId: string;
  siteName: string;
  sourceLabel: string;
  libraryQuestion: string;
  reflection: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Owner-scoped, client-safe view. Deliberately excludes implementation state. */
export function culturalJourneyEntryView(entry: CulturalJourneyEntryView) {
  return {
    id: entry.id,
    culturalSiteId: entry.culturalSiteId,
    siteName: entry.siteName,
    sourceLabel: entry.sourceLabel,
    libraryQuestion: entry.libraryQuestion,
    reflection: entry.reflection,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
