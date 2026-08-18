export type NeedCategory =
  | "legal_information"
  | "medical_information"
  | "home_service"
  | "business_discovery"
  | "nightlife"
  | "education"
  | "financial_education"
  | "general_guidance";

export type ProfessionalType = "attorney" | "medical_professional" | "plumber" | "business" | null;

export type ToneStyle = "warm_standard" | "community_conversational" | "concise_professional";

export type LocalContext = {
  city: string | null;
  stateCode: string | null;
  neighborhood: string | null;
  placeMeaning: string | null;
  confidence: number;
};

export type IntentResolution = {
  primaryNeed: NeedCategory;
  professionalOffer: ProfessionalType;
  professionalOfferReason: string | null;
  localContext: LocalContext;
  toneStyle: ToneStyle;
  toneDetectedFromMessage: boolean;
  asksForImmediateAction: boolean;
  urgentSafetyFlag: boolean;
  requiresEducationalDisclaimer: boolean;
};

export type OptionalAction = {
  id: "show_local_attorneys" | "show_local_medical" | "show_local_plumbers" | "show_local_businesses";
  label: string;
  supportingText: string;
  professionalType: Exclude<ProfessionalType, null>;
  requiresLocation: boolean;
};

export type ProfessionalResult = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  stateCode: string | null;
  addressLine1: string | null;
  distanceMiles: number | null;
  detailUrl: string;
  isVerified: boolean;
};

export type KinfolkCapabilityResponse = {
  message: string;
  intent: IntentResolution;
  optionalAction: OptionalAction | null;
  professionalResults: ProfessionalResult[] | null;
  locationPrompt: string | null;
};

export interface LocalContextRepository {
  resolvePlacePhrase(input: {
    phrase: string;
    memberCity: string | null;
    memberStateCode: string | null;
  }): Promise<LocalContext | null>;
}

export interface ProfessionalDirectoryRepository {
  findNearestVerifiedProfessionals(input: {
    professionalType: Exclude<ProfessionalType, null>;
    location: LocalContext;
    limit: number;
  }): Promise<ProfessionalResult[]>;
}
