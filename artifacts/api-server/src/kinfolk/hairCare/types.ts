export type RecommendationPath = "medical_education" | "dermatology" | "community_hair_care";

export type CommunitySignalLabel =
  | "growing_hands"
  | "hair_loss_support"
  | "scalp_care"
  | "protective_style_care"
  | "gentle_detangling"
  | "stylist_listens"
  | "culturally_knowledgeable";

export type CommunitySignal = {
  label: CommunitySignalLabel;
  confirmedMemberCount: number;
  recentConfirmedMemberCount: number;
  moderationStatus: "approved" | "pending" | "rejected";
};

export type CareProvider = {
  id: string;
  name: string;
  providerType: "dermatologist" | "hair_care_professional";
  category: string;
  city: string | null;
  stateCode: string | null;
  addressLine1: string | null;
  detailUrl: string;
  isVerified: boolean;
  professionalVerification: "board_certified" | "licensed" | "directory_verified" | "unverified";
  communitySignals: CommunitySignal[];
  distanceMiles: number | null;
};

export type ExplainedRecommendation = CareProvider & {
  communityTrustScore: number;
  reasons: string[];
  boundary: string | null;
};

export type HairLossCarePlan = {
  educationalMessage: string;
  medicalDisclaimer: string;
  sourceLinks: Array<{ title: string; url: string }>;
  optionalPaths: Array<{
    id: "show_dermatologists" | "show_hair_loss_stylists";
    title: string;
    question: string;
    supportingText: string;
  }>;
};

export interface HairCareRepository {
  findVerifiedCareProviders(input: {
    providerType: CareProvider["providerType"];
    city: string | null;
    stateCode: string | null;
    limit: number;
  }): Promise<CareProvider[]>;
}
