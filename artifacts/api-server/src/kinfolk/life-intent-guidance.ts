/**
 * Life-intent guidance turns a plainly stated goal into a small, source-aware
 * next-step plan. It is deliberately derived from the current message only:
 * no member profile, saved memory, identity, location history, or private
 * Community material is consulted.
 *
 * The values are presentation and retrieval instructions, not medical,
 * admissions, financial-aid, or legal conclusions. Material facts still have
 * to come from the server-supplied source evidence for the turn.
 */

export type LifeIntentGuidance = Readonly<{
  kind: "pregnancy_planning" | "college_planning";
  /** A precise, source-appropriate retrieval phrase. */
  sourceQuery: string;
  /** A short explanation displayed above the source links. */
  sourceContext: string;
  /** Server-controlled next questions shown as Kinfolk quick replies. */
  followUpSuggestions: readonly [string, string, string];
  /** Enforced prompt instruction for the conversational response. */
  responseInstruction: string;
}>;

const PREGNANCY_PLANNING_RE = /\b(?:trying|try|want(?:s|ing)?|plan(?:ning)?|prepar(?:e|ing)|hop(?:e|ing))\b[^.!?]{0,48}\b(?:to\s+)?(?:get\s+)?pregnant\b|\b(?:trying|try|want(?:s|ing)?|plan(?:ning)?|prepar(?:e|ing)|hop(?:e|ing))\b[^.!?]{0,48}\b(?:to\s+)?(?:conceive|start(?:ing)?\s+(?:a\s+)?family|have\s+(?:a\s+)?baby)\b|\bpreconception\b/i;

const COLLEGE_PLANNING_RE = /\b(?:looking at|consider(?:ing)?|interested in|thinking about|want(?:s|ing)? to attend|apply(?:ing)? to|admissions?|admit|enroll(?:ing)?|start(?:ing)? college|college plans?|college planning|financial aid|fafsa|scholarship|grant(?:s)?|tuition)\b[^.!?]{0,72}\b(?:college|university|campus|school|ucla|usc|hbcu)\b|\b(?:college|university|campus|school|ucla|usc|hbcu)\b[^.!?]{0,72}\b(?:admissions?|apply|application|financial aid|fafsa|scholarship|grant(?:s)?|tuition|visit|tour|deadline)\b/i;

const PREGNANCY_PLANNING: LifeIntentGuidance = {
  kind: "pregnancy_planning",
  sourceQuery: "preconception care official guidance",
  sourceContext:
    "These sources were selected because pregnancy planning starts with preconception care: questions to review with a qualified clinician before pregnancy.",
  followUpSuggestions: [
    "What should I discuss at a preconception visit?",
    "Which medications or vaccines should I review?",
    "What questions should I ask about my timeline?",
  ],
  responseInstruction:
    "LIFE-INTENT RESPONSE — PREGNANCY PLANNING: The member is looking for supportive, practical pregnancy-planning information. Lead with the immediate answer in calm, non-alarmist language. Then give up to three manageable next steps appropriate for a preconception conversation with a qualified clinician. Connect the leading supplied source to the question in one plain sentence beginning “Why this source fits:”. Do not diagnose, predict fertility, recommend an individual treatment, or imply that age, identity, or any group statistic determines this member’s outcome. Close by making the next question easy rather than requiring the member to know clinical vocabulary.",
};

const COLLEGE_PLANNING: LifeIntentGuidance = {
  kind: "college_planning",
  sourceQuery: "official university admissions financial aid application guidance",
  sourceContext:
    "These sources were selected to help turn interest in a school into practical next steps: official admissions, financial-aid, and application information.",
  followUpSuggestions: [
    "How do we compare programs and fit?",
    "What financial-aid steps come first?",
    "What should be on the application timeline?",
  ],
  responseInstruction:
    "LIFE-INTENT RESPONSE — COLLEGE PLANNING: The member is looking for a clear path from interest in a school to a practical plan. Lead with the immediate answer, then give up to three manageable next steps using only the supplied official or authoritative source material. Connect the leading supplied source to the question in one plain sentence beginning “Why this source fits:”. Do not invent admissions criteria, tuition, deadline, grant, scholarship, program, or eligibility details. Make it easy to ask the next useful question about program fit, application preparation, or financial aid.",
};

/**
 * Identifies currently supported life-planning requests. This is intentionally
 * narrow; unmatched messages continue through Kinfolk's existing general,
 * medical, education, current-research, and directory routes unchanged.
 */
export function getLifeIntentGuidance(message: string): LifeIntentGuidance | null {
  const clean = message.normalize("NFKC").trim();
  if (!clean) return null;
  if (PREGNANCY_PLANNING_RE.test(clean)) return PREGNANCY_PLANNING;
  if (COLLEGE_PLANNING_RE.test(clean)) return COLLEGE_PLANNING;
  return null;
}

/**
 * Keeps a named school in the external research query so a member interested in
 * UCLA, for example, receives UCLA's own official admissions and aid pages—not
 * a generic college-planning search. Pregnancy planning deliberately stays on
 * the precise preconception-care topic instead of searching personal wording.
 */
export function buildLifeIntentSourceQuery(
  message: string,
  guidance: LifeIntentGuidance,
): string {
  if (guidance.kind === "pregnancy_planning") return guidance.sourceQuery;
  return `${message.normalize("NFKC").trim().slice(0, 180)} official admissions financial aid guidance`;
}
