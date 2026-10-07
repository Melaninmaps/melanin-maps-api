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
const IMMEDIATE_SAFETY_SIGNAL =
  /\b(?:911|call 911|call the police|i(?:'m| am) in danger|being followed|someone is following(?: me)?|someone (?:is )?trying to break into|domestic violence|being abused|sexual assault|being attacked|shooting|been shot|stabbed|fire|flood|evacuat(?:e|ion)|missing person|kidnap(?:ped|ping)?|human trafficking|suicid(?:e|al)?|self[ -]?harm|overdos(?:e|ing)|unconscious|not breathing)\b/i;

export function isImmediateMedicalEmergency(message: string): boolean {
  return (
    CHEST_PAIN_SIGNAL.test(message) && BREATHING_DISTRESS_SIGNAL.test(message)
  );
}

export function immediateMedicalEmergencyReply(message: string): string | null {
  if (!isImmediateMedicalEmergency(message)) return null;

  return "Chest pain with shortness of breath can be an emergency. Call your local emergency number now (911 in the U.S. and Canada). If you cannot call, ask someone nearby to call for you. Do not drive yourself. I can’t safely assess or treat this in chat.";
}

/**
 * A concrete immediate-danger signal must receive direct action even when live
 * research is unavailable. This excludes the medical case above so its specific
 * clinical escalation remains the first response.
 */
export function isImmediateSafetyEmergency(message: string): boolean {
  return !isImmediateMedicalEmergency(message) && IMMEDIATE_SAFETY_SIGNAL.test(message);
}

export function immediateSafetyEmergencyReply(message: string): string | null {
  if (!isImmediateSafetyEmergency(message)) return null;

  return "If you are in immediate danger, call your local emergency number now (911 in the U.S. and Canada). Do not confront anyone. If you can do so without increasing your risk, move to a safer location and follow the dispatcher’s instructions. If you cannot call, ask a nearby trusted person to contact emergency services. I can’t determine whether a location or situation is safe in chat.";
}
