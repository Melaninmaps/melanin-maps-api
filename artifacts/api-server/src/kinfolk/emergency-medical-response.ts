/**
 * Deterministic emergency-medical escalation.
 *
 * This boundary is intentionally evaluated before memory, quota, retrieval, and
 * model work. A possible immediate medical emergency must never depend on an
 * external provider, a source-ranking result, or a generative response.
 */
const CHEST_PAIN_SIGNAL =
  /\b(?:chest pain|chest pressure|chest tightness|chest (?:feels?|is) tight)\b/i;
const BREATHING_DISTRESS_SIGNAL =
  /\b(?:shortness of breath|short of breath|difficulty breathing|trouble breathing|can't breathe|cannot breathe)\b/i;

export function isImmediateMedicalEmergency(message: string): boolean {
  return (
    CHEST_PAIN_SIGNAL.test(message) && BREATHING_DISTRESS_SIGNAL.test(message)
  );
}

export function immediateMedicalEmergencyReply(message: string): string | null {
  if (!isImmediateMedicalEmergency(message)) return null;

  return "Chest pain with shortness of breath can be an emergency. Call your local emergency number now (911 in the U.S. and Canada). If you cannot call, ask someone nearby to call for you. Do not drive yourself. I can’t safely assess or treat this in chat.";
}
