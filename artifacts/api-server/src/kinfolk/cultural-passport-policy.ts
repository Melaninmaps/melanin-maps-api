import {
  CULTURAL_PASSPORT_MOMENT_KINDS,
  type CulturalPassportMomentKind,
} from "@workspace/db";

export const CULTURAL_PASSPORT_PROMISE =
  "Kinfolk will never rush your journey. It will simply remember where you left off, celebrate what you've discovered, and be ready whenever you're curious to take the next step.";

export const CULTURAL_PASSPORT_DISCLOSURE =
  "My Passport is private to you. Kinfolk adds a moment only when you explicitly choose to keep it here. There are no levels, points, streaks, or completion goals.";

export interface CulturalPassportMomentDraft {
  memberConfirmed?: unknown;
  kind?: unknown;
  title?: unknown;
  note?: unknown;
  sourceLabel?: unknown;
  sourceUrl?: unknown;
}

export interface CulturalPassportMomentInput {
  kind: CulturalPassportMomentKind;
  title: string;
  note: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
}

export type CulturalPassportMomentValidation =
  | { ok: true; value: CulturalPassportMomentInput }
  | { ok: false; error: string };

function optionalText(value: unknown, maximum: number, label: string): string | null | { error: string } {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return { error: `${label} must be text.` };
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maximum) return { error: `${label} must be ${maximum} characters or fewer.` };
  return normalized;
}

function publicSourceUrl(value: unknown): string | null | { error: string } {
  const normalized = optionalText(value, 2_000, "Source link");
  if (normalized === null || typeof normalized === "object") return normalized;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { error: "Source link must use http or https." };
    }
    return url.toString();
  } catch {
    return { error: "Source link must be a valid public URL." };
  }
}

/**
 * Validates a single, member-authored Passport moment.
 *
 * No behavior in this policy derives a moment from saves, posts, reviews,
 * check-ins, points, or any other engagement activity.
 */
export function validateCulturalPassportMoment(
  draft: CulturalPassportMomentDraft,
): CulturalPassportMomentValidation {
  if (draft.memberConfirmed !== true) {
    return { ok: false, error: "Explicit confirmation is required before Kinfolk saves a Passport moment." };
  }

  if (typeof draft.kind !== "string" || !CULTURAL_PASSPORT_MOMENT_KINDS.includes(draft.kind as CulturalPassportMomentKind)) {
    return { ok: false, error: "Choose a valid kind of moment." };
  }

  const title = optionalText(draft.title, 180, "Moment title");
  if (title === null) return { ok: false, error: "A moment title is required." };
  if (typeof title === "object") return { ok: false, error: title.error };

  const note = optionalText(draft.note, 1_200, "Moment note");
  if (note !== null && typeof note === "object") return { ok: false, error: note.error };

  const sourceLabel = optionalText(draft.sourceLabel, 180, "Source label");
  if (sourceLabel !== null && typeof sourceLabel === "object") return { ok: false, error: sourceLabel.error };

  const sourceUrl = publicSourceUrl(draft.sourceUrl);
  if (sourceUrl !== null && typeof sourceUrl === "object") return { ok: false, error: sourceUrl.error };

  return {
    ok: true,
    value: {
      kind: draft.kind as CulturalPassportMomentKind,
      title,
      note,
      sourceLabel,
      sourceUrl,
    },
  };
}

export interface CulturalPassportMomentView {
  id: string;
  kind: CulturalPassportMomentKind;
  title: string;
  note: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  createdAt: Date | string;
}

export function culturalPassportView(input: {
  displayName: string;
  memberSince: number;
  moments: readonly CulturalPassportMomentView[];
}) {
  return {
    title: "My Passport",
    displayName: input.displayName,
    memberSince: input.memberSince,
    promise: CULTURAL_PASSPORT_PROMISE,
    disclosure: CULTURAL_PASSPORT_DISCLOSURE,
    moments: input.moments.map((moment) => ({
      id: moment.id,
      kind: moment.kind,
      title: moment.title,
      note: moment.note,
      sourceLabel: moment.sourceLabel,
      sourceUrl: moment.sourceUrl,
      createdAt: moment.createdAt,
    })),
  };
}
