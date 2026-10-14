/** Explicit settings input only. Never derive a chapter from activity or chat. */
export const CURRENT_CHAPTER_KINDS = {
  career_change: "Career change",
  relocation: "Relocation",
  caregiving: "Caregiving",
  family_change: "Family change",
  health_support: "Health support",
  fertility: "Fertility",
  pregnancy: "Pregnancy",
  pregnancy_loss: "Pregnancy loss",
  later_pregnancy: "Later pregnancy",
  grief: "Grief",
  other: "Other",
} as const;
export type CurrentChapterKind = keyof typeof CURRENT_CHAPTER_KINDS;
export function parseCurrentChapterKind(value: unknown): CurrentChapterKind | null {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CURRENT_CHAPTER_KINDS, value)
    ? value as CurrentChapterKind : null;
}
export function isSensitiveChapterKind(kind: CurrentChapterKind): boolean {
  return ["health_support", "fertility", "pregnancy", "pregnancy_loss", "later_pregnancy", "grief"].includes(kind);
}
export interface CurrentChapterView {
  id: string;
  kind: CurrentChapterKind | null;
  note: string | null;
  isSensitive: boolean;
  vaultLocked: boolean;
  allowRelevantUse: boolean;
  memberConfirmedAt: string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
