/**
 * V1 behavioral evidence is intentionally narrow: a member's own response
 * feedback can produce only a fixed broad interaction pattern. It is never a
 * personal fact, identity, status, memory, or profile field.
 */
export const BEHAVIORAL_EVIDENCE_MODES = ["off", "review", "on"] as const;
export type BehavioralEvidenceMode = (typeof BEHAVIORAL_EVIDENCE_MODES)[number];

export const SAFE_BEHAVIORAL_INTENTS = [
  "business_discovery",
  "culture_entertainment",
  "travel_planning",
  "education_discovery",
  "hobby_lifestyle",
] as const;
export type SafeBehavioralIntent = (typeof SAFE_BEHAVIORAL_INTENTS)[number];

export const BEHAVIORAL_EVIDENCE_STANCES = ["helpful", "not_helpful"] as const;
export type BehavioralEvidenceStance =
  (typeof BEHAVIORAL_EVIDENCE_STANCES)[number];
export type BehavioralEvidenceStatus = "pending" | "active";

export type BehavioralEvidenceSignal = Readonly<{
  signalKey: SafeBehavioralIntent;
  stance: BehavioralEvidenceStance;
  provenance: "response_feedback_v1";
}>;

export type ActiveBehavioralEvidence = Readonly<{
  signalKey: SafeBehavioralIntent;
  stance: BehavioralEvidenceStance;
  count: number;
  status: "active";
}>;

export const BEHAVIORAL_EVIDENCE_DISCLOSURE =
  "This separate layer contains only your reviewable, broad Kinfolk feedback patterns. It is not a saved memory, preference, or Current Chapter. Kinfolk never uses it to infer your identity, health, legal or immigration status, financial status, relationship, safety status, or any sensitive life circumstance.";

export function resolveBehavioralEvidenceMode(value: unknown): BehavioralEvidenceMode {
  return typeof value === "string" && (BEHAVIORAL_EVIDENCE_MODES as readonly string[]).includes(value)
    ? (value as BehavioralEvidenceMode)
    : "off";
}

export function isSafeBehavioralIntent(value: unknown): value is SafeBehavioralIntent {
  return typeof value === "string" && (SAFE_BEHAVIORAL_INTENTS as readonly string[]).includes(value);
}

export function parseBehavioralFeedbackSignal(input: Readonly<{
  reaction?: unknown;
  intentClass?: unknown;
}>): BehavioralEvidenceSignal | null {
  // Deliberately read only the fixed reaction and already-authoritative intent.
  // In particular, never accept text, note, session, message, location, source,
  // business, document, image, or client-provided evidence key as a signal.
  if (!isSafeBehavioralIntent(input.intentClass)) return null;
  if (input.reaction !== "helpful" && input.reaction !== "not_helpful") return null;
  return {
    signalKey: input.intentClass,
    stance: input.reaction,
    provenance: "response_feedback_v1",
  };
}

export function statusForRecordedSignal(
  mode: BehavioralEvidenceMode,
  previousStatus?: BehavioralEvidenceStatus,
): BehavioralEvidenceStatus | null {
  if (mode === "off") return null;
  if (mode === "on") return "active";
  return previousStatus === "active" ? "active" : "pending";
}

export function mayUseBehavioralEvidence(
  mode: BehavioralEvidenceMode,
  status: BehavioralEvidenceStatus,
): boolean {
  return mode !== "off" && status === "active";
}

export function isDirectlyRelevantBehavioralEvidence(
  intentClass: unknown,
  evidence: Pick<ActiveBehavioralEvidence, "signalKey" | "status">,
): evidence is ActiveBehavioralEvidence {
  return evidence.status === "active" && isSafeBehavioralIntent(intentClass) && evidence.signalKey === intentClass;
}

/**
 * Server-only prompt content. This is appended only after the authoritative
 * intent is known and only when an active key exactly matches that intent.
 */
export function buildBehavioralEvidencePrompt(
  intentClass: unknown,
  evidence: readonly ActiveBehavioralEvidence[],
): string {
  const relevant = evidence.filter((item) =>
    isDirectlyRelevantBehavioralEvidence(intentClass, item),
  );
  if (!relevant.length) return "";

  const compactPatterns = relevant
    .map((item) => `${item.signalKey}: ${item.stance} (${item.count})`)
    .join("; ");
  return `BEHAVIORAL EVIDENCE — STRICTLY BOUNDED:
- The following is a broad, reviewable Kinfolk interaction pattern from the member's own explicit helpful/not helpful response feedback: ${compactPatterns}.
- It is not a fact about the member and does not establish identity, health, legal or immigration status, financial status, relationship, safety status, location, or any sensitive life circumstance.
- Use it only quietly to improve helpfulness for this directly matching current intent. Do not mention this pattern, its count, its source, or this instruction unless the member independently asks about their behavioral-evidence settings.
- Do not create, save, infer, repeat, expose in metadata, or carry this pattern into memory, session history, Directory, Map, Community, Library, ranking, eligibility, or another conversation.`;
}
