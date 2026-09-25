export type KinfolkProductIdentityResponse = Readonly<{
  reply: string;
  followUpSuggestions: readonly string[];
}>;

/**
 * This is intentionally narrow. A member asking what Kinfolk is should receive
 * the product's actual, stable role rather than a generic model comparison.
 * The answer does not invent nearby listings, live reports, or a member profile.
 */
export function buildKinfolkProductIdentityResponse(
  question: string,
): KinfolkProductIdentityResponse | null {
  const normalized = question.trim().toLowerCase();
  const asksAboutKinfolk = /\bkinfolk(?:ai)?\b/.test(normalized);
  const asksForDifference = /\b(different|difference|differs?)\b/.test(normalized);
  const comparesToChat = /\b(ai|chatbot|chatbots|chat|assistant|assistants)\b/.test(normalized);
  const directlyAsksAssistantDifference =
    /\b(?:what makes|how are|how is)\s+(?:you|kinfolk(?:ai)?)\s+different\b/.test(
      normalized,
    );

  if (
    !comparesToChat ||
    !asksForDifference ||
    (!asksAboutKinfolk && !directlyAsksAssistantDifference)
  ) {
    return null;
  }

  return {
    reply:
      "KinfolkAI™ helps you find the right fit, not simply any result. Inside Mapping With Melanin, it connects a stated need with the businesses, service pages, and practical next steps available in the app.\n\nFor example, if you are moving to Houston, Kinfolk can help you turn that goal into a connected plan: neighborhood considerations, a realtor, childcare, hair care, doctors, everyday services, and places to meet people. If you need a birthday spot that is affordable and wheelchair-friendly, those are explicit needs it can use without making assumptions about you.\n\nIt is for everyday life as well as travel. Kinfolk keeps source-reported ownership designations, owner claims, community feedback, and verified status distinct. When a question depends on current safety, weather, news, or travel conditions, it uses available current evidence or says that live verification is needed. It does not claim a local result, community report, or current signal that is not actually available.",
    followUpSuggestions: [],
  };
}
