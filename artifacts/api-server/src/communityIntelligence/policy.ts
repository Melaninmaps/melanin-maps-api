/**
 * Community Intelligence Policy
 *
 * Product rule: The product term is "Community Intelligence" — never "Community Safety".
 * Community Intelligence = community-sourced context for informed choices.
 *
 * Prohibited: Any inference that a location is unsafe because it has minority residents,
 * is predominantly minority, has a particular race/ethnicity, is diverse, or lacks diversity.
 * Demographic composition is NOT a safety signal.
 */

export const COMMUNITY_INTELLIGENCE_LANGUAGE = {
  productName: "Community Intelligence",
  description: "Community-sourced context for informed choices about arrival, access, atmosphere, and practical local conditions.",
  eyebrow: "Community Intelligence",
  title: "Know What to Expect",
  subtitle: "Community-sourced context for informed choices.",
  body: "Real observations from members who've actually been there — arrival experiences, practical conditions, and what the community has shared. Not a safety score. Not a neighborhood judgment.",
  disclaimer: "Community Intelligence is not a judgment about a neighborhood or its residents. These are shared member observations — context, not ratings.",
  nav: "Community Intelligence",
  empty: "No community context yet for this area. Be the first to share what you've experienced.",
  emergencyDisclaimer: "In a life-threatening emergency, always call 911. Emergency resources are separate from Community Intelligence and are not rebranded as community context.",
} as const;

export type CommunityIntelligenceSignal = {
  placeId: string;
  category: "practical_context" | "arrival_experience" | "access" | "atmosphere" | "community_connection" | "emergency_resource";
  sourceType: "member_review" | "verified_checkin" | "official_alert";
  sourceId: string;
  observedAt: string; // ISO date string
  moderationStatus: "approved" | "pending" | "rejected";
  observation: string;
};

const PROHIBITED_PATTERNS = [
  /unsafe.*(?:minority|black|diverse|latino|hispanic|asian)/i,
  /(?:minority|black|diverse|latino|hispanic|asian).*unsafe/i,
  /lack(?:s|ing)? diversity.*(?:unsafe|dangerous|avoid)/i,
  /(?:unsafe|dangerous|avoid).*lack(?:s|ing)? diversity/i,
  /predominantly.*(?:minority|black).*(?:unsafe|dangerous)/i,
  /safety score.*(?:demographic|race|ethnicity|diversity)/i,
  /demographic.*safety/i,
];

/**
 * Returns true if a community intelligence signal is permitted.
 * Rejects any signal that implies demographic composition as a safety variable.
 */
export function isPermittedSignal(signal: CommunityIntelligenceSignal): boolean {
  if (signal.category === "emergency_resource") return true;
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(signal.observation)) return false;
  }
  return true;
}

/**
 * Returns the Kinfolk prompt instruction for Community Intelligence summaries.
 * Include this when Kinfolk summarizes community signals.
 */
export function communityIntelligencePromptRules(): string {
  return [
    "When summarizing community context, use the term 'Community Intelligence' — never 'Community Safety'.",
    "Describe specific, dated, source-attributed observations about arrival, access, atmosphere, or practical conditions.",
    "Never imply or calculate that a location is unsafe based on its racial, ethnic, or demographic makeup.",
    "Never infer a member's identity from the cultural context they requested.",
    "If a member explicitly requests emergency help, provide official emergency resources separately and accurately — do not rebrand them as Community Intelligence.",
    "Conclude summaries with: 'These are shared member experiences — context for your own judgment, not a rating of the neighborhood or its residents.'",
  ].join(" ");
}
