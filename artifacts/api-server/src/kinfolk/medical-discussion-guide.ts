import { permittedIdentityContext } from "./permitted-identity-context";

const MEDICATION_NAME_RE = /\b(?:prescribed|prescription for|taking|started on|given)\s+(?:me\s+)?(?:a\s+new\s+)?([A-Za-z][A-Za-z0-9-]{2,40})\b/i;
const MEDICATION_WORD_RE = /\b(?:medication|medicine|prescription|drug|dose|dosage|side effect|pharmacist|pill|tablet|capsule)\b/i;
const URGENT_RE = /\b(?:trouble breathing|chest pain|faint(?:ed|ing)?|swelling (?:of|in) (?:my )?(?:face|lips|tongue)|severe allergic reaction|seizure|unconscious|heavy bleeding)\b/i;
const ANEMIA_RE = /\b(?:anemia|anaemia|iron(?:[-\s]+deficien(?:t|cy))?)\b/i;
const REPRODUCTIVE_HEALTH_RE = /\b(?:menopause|fertility|pregnan(?:t|cy)|periods?|menstrual|fibroid|endometriosis|pcos|breast cancer|mammogram)\b/i;

/**
 * A retrieval outage must not turn a health question into a dead end. This is a
 * deliberately non-diagnostic conversation guide: it makes no medical claims,
 * never tells a member to change a drug, and is useful until source retrieval
 * or a clinician/pharmacist is available.
 */
export function buildMedicalDiscussionGuide(message: string): string {
  const clean = message.trim();
  const medicationName = clean.match(MEDICATION_NAME_RE)?.[1] ?? null;
  const mentionsMedication = Boolean(medicationName) || MEDICATION_WORD_RE.test(clean);
  const identity = permittedIdentityContext(clean);
  const lines: string[] = [
    "I could not pull a dependable, condition-specific medical source right now, so I will not guess about a diagnosis, dose, interaction, or whether a medicine is right for you.",
    "Here are focused questions you can take to your doctor or pharmacist:",
  ];

  if (mentionsMedication) {
    lines.push(
      medicationName
        ? `• For ${medicationName}, what is it intended to treat for me, and how should I take it?`
        : "• What is this medicine intended to treat for me, and how should I take it?",
      "• What effects or side effects should I watch for, and which symptoms mean I should call the office or seek urgent care?",
      "• Could it interact with my other prescriptions, over-the-counter medicines, vitamins, supplements, alcohol, or foods?",
      "• What should I do if I miss a dose, and what follow-up or monitoring do you want?",
      "• Is there anything about my diet, supplements, medical history, or current symptoms that changes this plan?",
      "Do not start, stop, skip, or change a prescribed medicine based on this chat; confirm any change with the clinician or pharmacist who knows your care."
    );
  } else if (ANEMIA_RE.test(clean)) {
    lines.push(
      "• What type of anemia are we considering, and what tests would help clarify it?",
      "• Are there possible causes in my situation, including diet, bleeding, absorption, medicines, or another health condition?",
      "• Should I ask about food choices, supplements, or follow-up testing—and exactly what should I take or avoid before changing anything?"
    );
  } else if (REPRODUCTIVE_HEALTH_RE.test(clean)) {
    lines.push(
      "• What symptoms, history, and tests are most relevant for my situation?",
      "• What screening, follow-up, or specialist questions should I bring to the visit?",
      "• Are there diet, supplement, medication, or family-history details I should mention before making any changes?"
    );
  } else {
    lines.push(
      "• What are the most likely questions or tests we should discuss for my symptoms or concern?",
      "• What changes should make me call the office sooner or seek urgent care?",
      "• Are diet, supplements, other medicines, family history, or a follow-up test relevant to this conversation?"
    );
  }

  if (identity.demographicQualifier) {
    lines.push(
      `Because you explicitly mentioned ${identity.demographicQualifier}, you can also ask whether your own medical history, family history, symptoms, and test results change the screening or monitoring plan. Group-level research cannot diagnose you or determine your treatment.`
    );
  }

  if (URGENT_RE.test(clean)) {
    lines.push("Because you described a potentially urgent symptom, seek urgent in-person medical care or emergency services now rather than waiting for an online answer.");
  }

  return lines.join("\n");
}
