import { buildOptionalAction } from "./responseComposer";
import type {
  IntentResolution,
  KinfolkCapabilityResponse,
  ProfessionalDirectoryRepository,
} from "./types";

/**
 * Call this only after the member actively chooses an optional action card.
 * Kinfolk never preloads attorney, clinician, plumber, or business results
 * merely because it inferred that they might be useful.
 */
export async function getConsentBasedProfessionalResults(input: {
  intent: IntentResolution;
  directoryRepository: ProfessionalDirectoryRepository;
}): Promise<Pick<KinfolkCapabilityResponse, "optionalAction" | "professionalResults" | "locationPrompt">> {
  const action = buildOptionalAction(input.intent);
  if (!action || !input.intent.professionalOffer) {
    return { optionalAction: null, professionalResults: null, locationPrompt: null };
  }

  if (action.requiresLocation) {
    return {
      optionalAction: action,
      professionalResults: null,
      locationPrompt:
        "Tell me the city or neighborhood you want to use, and I can look for verified local options. You can also skip this and continue with the information here.",
    };
  }

  const professionalResults = await input.directoryRepository.findNearestVerifiedProfessionals({
    professionalType: input.intent.professionalOffer,
    location: input.intent.localContext,
    limit: 5,
  });

  return {
    optionalAction: action,
    professionalResults,
    locationPrompt: professionalResults.length
      ? null
      : "I could not find a verified local option in the directory yet. You can try another nearby area or continue with the information above.",
  };
}
