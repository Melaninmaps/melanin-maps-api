import type {
  CareProvider,
  ExplainedRecommendation,
  HairCareRepository,
  HairLossCarePlan,
} from "./types";

const COMMUNITY_SIGNAL_WEIGHTS = {
  growing_hands: 0.28,
  hair_loss_support: 0.28,
  scalp_care: 0.18,
  protective_style_care: 0.12,
  gentle_detangling: 0.08,
  stylist_listens: 0.06,
  culturally_knowledgeable: 0.1,
} as const;

const MIN_CONFIRMED_MEMBERS = 3;
const MIN_COMMUNITY_HAIR_SCORE = 0.55;

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Community language such as “growing hands” is treated as a moderated,
 * explainable community signal—not a medical promise or a self-awarded badge.
 */
export function scoreCommunityHairCareProvider(provider: CareProvider): ExplainedRecommendation | null {
  if (!provider.isVerified || provider.providerType !== "hair_care_professional") return null;

  let score = provider.professionalVerification === "licensed" ? 0.2 : 0.1;
  const reasons: string[] = [];

  for (const signal of provider.communitySignals) {
    if (signal.moderationStatus !== "approved" || signal.confirmedMemberCount < MIN_CONFIRMED_MEMBERS) {
      continue;
    }
    const weight = COMMUNITY_SIGNAL_WEIGHTS[signal.label];
    const recencyMultiplier = signal.recentConfirmedMemberCount >= 2 ? 1 : 0.65;
    score += weight * recencyMultiplier;

    if (signal.label === "growing_hands") reasons.push("Community members repeatedly describe this professional as having “growing hands.”");
    if (signal.label === "hair_loss_support") reasons.push("Community members report supportive experience with hair-loss concerns.");
    if (signal.label === "scalp_care") reasons.push("Community members mention scalp-care awareness.");
    if (signal.label === "protective_style_care") reasons.push("Community members mention careful protective-style support.");
  }

  const communityTrustScore = Number(clamp(score).toFixed(2));
  if (communityTrustScore < MIN_COMMUNITY_HAIR_SCORE) return null;

  return {
    ...provider,
    communityTrustScore,
    reasons: reasons.length ? reasons : ["This provider has enough approved, relevant community feedback to be considered for this optional care path."],
    boundary:
      "Community experience is not medical evidence. This recommendation does not diagnose, treat, or guarantee hair-growth outcomes.",
  };
}

export function buildHairLossCarePlan(): HairLossCarePlan {
  return {
    educationalMessage:
      "Hair loss can have different causes, and an accurate diagnosis matters. Kinfolk can share source-cited educational information relevant to Black women and other women of color, while also helping you identify supportive local care options if you want them.",
    medicalDisclaimer:
      "Educational information only. Hair loss can have many causes; this is not a diagnosis or a substitute for care from a qualified clinician.",
    sourceLinks: [
      {
        title: "American Academy of Dermatology: Hair loss in Black women",
        url: "https://www.aad.org/public/diseases/hair-loss/insider/hair-loss-black-women",
      },
    ],
    optionalPaths: [
      {
        id: "show_dermatologists",
        title: "Medical path",
        question: "Would you like to see verified local dermatologists who may be able to evaluate hair loss?",
        supportingText: "This is optional. A dermatologist is the appropriate professional for diagnosis and treatment planning.",
      },
      {
        id: "show_hair_loss_stylists",
        title: "Community hair-care path",
        question: "Would you like to see community-recognized hair-care professionals with relevant hair-loss or scalp-care signals?",
        supportingText: "These are not generic salons. Kinfolk shows only verified professionals with sufficient approved community evidence, such as “growing hands,” scalp-care awareness, or hair-loss support.",
      },
    ],
  };
}

export async function getOptionalHairLossRecommendations(input: {
  action: "show_dermatologists" | "show_hair_loss_stylists";
  location: { city: string | null; stateCode: string | null };
  repository: HairCareRepository;
}): Promise<ExplainedRecommendation[]> {
  if (!input.location.city || !input.location.stateCode) return [];

  if (input.action === "show_dermatologists") {
    const providers = await input.repository.findVerifiedCareProviders({
      providerType: "dermatologist",
      city: input.location.city,
      stateCode: input.location.stateCode,
      limit: 5,
    });
    return providers
      .filter((provider) => provider.isVerified && provider.professionalVerification === "board_certified")
      .map((provider) => ({
        ...provider,
        communityTrustScore: 1,
        reasons: ["Verified board-certified dermatology listing."],
        boundary: "A listing is not a medical endorsement. Confirm availability, insurance, and fit directly with the practice.",
      }));
  }

  const providers = await input.repository.findVerifiedCareProviders({
    providerType: "hair_care_professional",
    city: input.location.city,
    stateCode: input.location.stateCode,
    limit: 20,
  });
  return providers
    .map(scoreCommunityHairCareProvider)
    .filter((provider): provider is ExplainedRecommendation => provider !== null)
    .sort((left, right) => right.communityTrustScore - left.communityTrustScore)
    .slice(0, 5);
}
