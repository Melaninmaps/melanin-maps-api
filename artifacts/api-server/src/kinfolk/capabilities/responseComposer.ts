import type {
  IntentResolution,
  KinfolkCapabilityResponse,
  OptionalAction,
  ToneStyle,
} from "./types";

function displayProfessionalType(type: NonNullable<IntentResolution["professionalOffer"]>): string {
  return type === "medical_professional" ? "medical professionals" : `${type}s`;
}

function actionIdFor(type: NonNullable<IntentResolution["professionalOffer"]>): OptionalAction["id"] {
  if (type === "attorney") return "show_local_attorneys";
  if (type === "medical_professional") return "show_local_medical";
  if (type === "plumber") return "show_local_plumbers";
  return "show_local_businesses";
}

export function buildOptionalAction(intent: IntentResolution): OptionalAction | null {
  if (!intent.professionalOffer || intent.urgentSafetyFlag) return null;

  const professionalType = intent.professionalOffer;
  const hasLocation = Boolean(intent.localContext.city || intent.localContext.neighborhood);
  const locationLabel = intent.localContext.placeMeaning || intent.localContext.neighborhood || intent.localContext.city;

  return {
    id: actionIdFor(professionalType),
    label: hasLocation
      ? `Would you like to see verified local ${displayProfessionalType(professionalType)}${locationLabel ? ` near ${locationLabel}` : ""}?`
      : `Would you like to see verified local ${displayProfessionalType(professionalType)}?`,
    supportingText: hasLocation
      ? "This is optional. Kinfolk will only open local results if you choose to see them."
      : "This is optional. Share a city or neighborhood only if you want local results.",
    professionalType,
    requiresLocation: !hasLocation,
  };
}

function openingForTone(tone: ToneStyle, detectedCommunityLanguage: boolean): string {
  // Conversational language is preference-gated. It is never used simply
  // because Kinfolk guesses a member's identity or background.
  if (tone === "community_conversational" && detectedCommunityLanguage) return "Y'all, ";
  if (tone === "concise_professional") return "";
  return "I can help you think this through. ";
}

function categoryGuidance(intent: IntentResolution): string {
  switch (intent.primaryNeed) {
    case "legal_information":
      return "I can explain the general information, help you organize useful questions and documents, and point you toward reliable resources. Because laws depend on the jurisdiction and facts, this is not legal advice.";
    case "medical_information":
      return "I can share educational information and reputable sources, help you prepare questions for a clinician, and point toward care options. This is not a diagnosis or a substitute for medical care.";
    case "home_service":
      return "I can walk you through safe, practical troubleshooting steps and help you decide when the issue is better handled by a professional.";
    case "nightlife":
      return "I can help you find an experience that fits the location, time, and energy you have in mind.";
    case "education":
      return "I can help you explore programs, pathways, opportunities, and the questions worth asking next.";
    case "financial_education":
      return "I can explain the topic clearly and point to reputable educational resources; this is not individualized financial, tax, or investment advice.";
    default:
      return "I can help with clear information, community context, and optional next steps when a relevant connection is available.";
  }
}

export function composeKinfolkCapabilityResponse(intent: IntentResolution): KinfolkCapabilityResponse {
  if (intent.urgentSafetyFlag) {
    return {
      message:
        "Some symptoms can need urgent attention. If there may be an immediate emergency, contact local emergency services now. If it is not an emergency, I can still help you find reputable information and prepare questions for a clinician.",
      intent,
      optionalAction: null,
      professionalResults: null,
      locationPrompt: null,
    };
  }

  const action = buildOptionalAction(intent);
  return {
    message: `${openingForTone(intent.toneStyle, intent.toneDetectedFromMessage)}${categoryGuidance(intent)}`.trim(),
    intent,
    optionalAction: action,
    professionalResults: null,
    locationPrompt:
      action?.requiresLocation
        ? "If you want local options, you can share a city or neighborhood. You can also keep exploring the information without sharing it."
        : null,
  };
}
