export type SavedMemberResearchPreferences = Readonly<{
  useMemberContextByDefault?: boolean | null;
  communities?: unknown;
  cultures?: unknown;
}>;

export type LibraryPurposeConsent = Readonly<{
  granted: boolean;
  purpose: "library_saved_context";
}>;

const MEMBER_CONTEXT_OPT_OUT = /\b(?:general\s+only|without\s+(?:my\s+)?(?:saved\s+)?context|this\s+is\s+for\s+(?:my\s+)?(?:friend|family|patient|client)|not\s+about\s+me|donat(?:e|ing|ion)|fundrais(?:e|ing)|charit(?:y|able)|nonprofit|non-profit|scholarship\s+fund|grant\s+fund(?:ing)?)\b/i;

/**
 * The single revocable consent gate for every Library use of saved context.
 * Turning the existing preference off immediately disables both query
 * augmentation and ranking personalization; no secondary inferred consent is
 * accepted at this boundary.
 */
export function libraryPurposeConsent(
  preferences: Pick<SavedMemberResearchPreferences, "useMemberContextByDefault"> | null,
): LibraryPurposeConsent {
  return {
    granted: preferences?.useMemberContextByDefault === true,
    purpose: "library_saved_context",
  };
}

function normalizedValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.normalize("NFKC").trim())
    .filter((item) => item.length >= 2 && item.length <= 100))].slice(0, 25);
}

function tagsFor(values: readonly string[]): string[] {
  const normalized = values.map((value) => value.toLocaleLowerCase("en-US"));
  const tags = new Set<string>();
  if (normalized.some((value) => /\bblack\s*(?:woman|women)\b/.test(value))) tags.add("#BlackWomen");
  if (normalized.some((value) => /\bblack\s*(?:man|men|boys?)\b/.test(value))) tags.add("#BlackMen");
  if (normalized.some((value) => /\bblack\s+students?\b/.test(value))) tags.add("#BlackStudents");
  if (normalized.some((value) => /\bhbcu\b/.test(value))) tags.add("#HBCUStudents");
  if (normalized.some((value) => /(?:african diaspora|black\s*\/\s*african american|black\s*\/\s*african-american)/.test(value))) tags.add("#Diaspora");
  return [...tags];
}

/**
 * Applies only a member's affirmative, private default setting. The current
 * request wins: a stated population, a "general only" request, or a request
 * made for someone else never inherits the saved context.
 */
export function applySavedMemberResearchContext(input: {
  question: string;
  preferences: SavedMemberResearchPreferences | null;
}): { question: string; appliedTags: string[] } {
  const preferences = input.preferences;
  if (!preferences || !libraryPurposeConsent(preferences).granted || MEMBER_CONTEXT_OPT_OUT.test(input.question)) {
    return { question: input.question, appliedTags: [] };
  }
  if (/#(?:diaspora|blackwomen|blackwoman|blackmen|blackman|blackstudents|blackstudent|hbcustudents|hbcustudent)\b|\b(?:black women?|black men?|black students?|hbcu students?)\b/i.test(input.question)) {
    return { question: input.question, appliedTags: [] };
  }
  const tags = tagsFor(normalizedValues([
    ...(normalizedValues(preferences.communities)),
    ...(normalizedValues(preferences.cultures)),
  ]));
  return tags.length
    ? { question: `${tags.join(" ")} ${input.question}`.trim(), appliedTags: tags }
    : { question: input.question, appliedTags: [] };
}

export const memberResearchContextOverridePattern = MEMBER_CONTEXT_OPT_OUT;
