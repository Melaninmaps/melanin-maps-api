export type KinfolkCulturalLearningOpportunity = Readonly<{
  promptBlock: string;
  followUpSuggestion: string;
  retrievalQueries: readonly [string, string, string];
}>;

const ANCIENT_MEDITERRANEAN_FOLLOW_UP =
  "What do historians and museum collections show about African presence and representation in the ancient Mediterranean?";

/**
 * A deliberately narrow, non-identity-based learning bridge for the current
 * Odyssey casting conversation. It does not assert a fictional character's
 * identity or use historical contact as proof of any particular casting claim.
 * The follow-up is itself a source-seeking question and therefore remains
 * governed by the ordinary evidence route when the member selects it.
 */
export function buildKinfolkCulturalLearningOpportunity(
  message: string,
): KinfolkCulturalLearningOpportunity | null {
  const normalized = message.toLowerCase();
  const isOdysseyCastingConversation =
    /\bodyssey\b/.test(normalized) &&
    /\b(lupita|nyong['’]?o|cast|casting|role|backlash|upset|outrage)\b/.test(
      normalized,
    );

  if (!isOdysseyCastingConversation) return null;

  return {
    promptBlock: [
      "CULTURAL LEARNING OFFER — SERVER CONTROLLED:",
      "Answer the member's primary question first using the supplied evidence. Separate verified reporting about a present casting conversation from historical background and from interpretation.",
      "When the supplied evidence supports it, end with one optional invitation: ‘Want to learn more about what historians and museum collections show about African presence and representation in the ancient Mediterranean?’",
      "Do not say that historical contact proves a particular fictional character's ancestry, appearance, or casting outcome. Do not portray disagreement as a single group view or invent a historical consensus.",
    ].join("\n"),
    followUpSuggestion: ANCIENT_MEDITERRANEAN_FOLLOW_UP,
    retrievalQueries: [
      "Lupita Nyong'o The Odyssey casting reaction reporting and ancient Greek African representation historical context",
      "Africans in ancient Greek art museum collection historical context",
      "ancient Greece skin colour African presence historical scholarship",
    ],
  };
}
