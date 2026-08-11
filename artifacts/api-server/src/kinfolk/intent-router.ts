/**
 * Kinfolk Intent Router — Phase 1
 *
 * Classifies every user message into a domain intent BEFORE buildSystemPrompt
 * is called. The intent drives the evidence policy: what sources are allowed,
 * whether citations are required, and how the model must label its answer.
 *
 * Design decisions:
 * - Phase 1 uses fast keyword + pattern classification (no extra LLM call, no latency).
 * - Phase 2 (future) will use a structured-output OpenAI call for nuanced intent.
 * - The router NEVER sees user ID, location, or saved places — it sees only the message.
 * - Evidence policy is deterministic: the same message always gets the same policy.
 *
 * Non-negotiable rules (from MWM_Universal_Search_Router_Contract.md):
 * - Medical, legal, financial, emergency → citations required, community evidence blocked.
 * - Math, stable facts → answer directly, no forced search.
 * - Business discovery, travel → MWM catalog first, then labeled general context.
 * - Culture, entertainment, hobbies → conversational, subjective label required.
 */

// ─── Intent types ─────────────────────────────────────────────────────────────

export type KinfolkIntent =
  | "general_knowledge"      // math, trivia, stable facts — answer from training
  | "culture_entertainment"  // music, sports, film, food culture — conversational
  | "business_discovery"     // finding places, services, businesses, travel
  | "hobby_lifestyle"        // vintage cars, cooking, gardening, gaming
  | "medical_health"         // symptoms, conditions, medications, procedures
  | "legal_regulated"        // legal rights, contracts, court, immigration
  | "financial_regulated"    // investments, loans, taxes, financial planning
  | "safety_emergency"       // emergencies, violence, immediate danger
  | "current_information";   // time-sensitive: visa rules, events, hours, news

export type CitationMode = "none" | "recommended" | "required";
export type Consequence = "low" | "medium" | "high";

export interface EvidencePolicy {
  intent: KinfolkIntent;
  consequence: Consequence;
  citationMode: CitationMode;
  /** Restrict: community experience may NOT be used as evidence for this intent class */
  blockCommunityAsProof: boolean;
  /** Restrict: Library interests (topic names from user follows) may still be injected */
  allowLibraryInterests: boolean;
  /** When true: explicitly tell model current info may be outdated */
  flagCurrencyRisk: boolean;
  /** Tone instruction override for high-stakes intents */
  toneOverride: string | null;
  /** Label that must appear in the model's answer to distinguish source type */
  provenanceLabel: string;
}

// ─── Evidence policies ────────────────────────────────────────────────────────

const POLICIES: Record<KinfolkIntent, EvidencePolicy> = {
  general_knowledge: {
    intent: "general_knowledge",
    consequence: "low",
    citationMode: "none",
    blockCommunityAsProof: false,
    allowLibraryInterests: true,
    flagCurrencyRisk: false,
    toneOverride: null,
    provenanceLabel: "From general knowledge",
  },
  culture_entertainment: {
    intent: "culture_entertainment",
    consequence: "low",
    citationMode: "recommended",
    blockCommunityAsProof: false,
    allowLibraryInterests: true,
    flagCurrencyRisk: false,
    toneOverride: null,
    provenanceLabel: "From cultural knowledge — this reflects perspective, not a single fact",
  },
  business_discovery: {
    intent: "business_discovery",
    consequence: "low",
    citationMode: "recommended",
    blockCommunityAsProof: false,
    allowLibraryInterests: true,
    flagCurrencyRisk: true,
    toneOverride: null,
    provenanceLabel: "MWM listings are verified platform records; other suggestions are general guidance",
  },
  hobby_lifestyle: {
    intent: "hobby_lifestyle",
    consequence: "low",
    citationMode: "recommended",
    blockCommunityAsProof: false,
    allowLibraryInterests: true,
    flagCurrencyRisk: false,
    toneOverride: null,
    provenanceLabel: "From general knowledge and community experience",
  },
  medical_health: {
    intent: "medical_health",
    consequence: "high",
    citationMode: "required",
    blockCommunityAsProof: true,
    allowLibraryInterests: false, // suppress — Library interests are private
    flagCurrencyRisk: true,
    toneOverride:
      "Use calm, precise, plain language. Cite authoritative medical sources (CDC, NIH, WHO, Mayo Clinic, NHS). " +
      "State clearly that this is general health information, not medical advice. " +
      "Encourage consulting a licensed healthcare provider. " +
      "NEVER use community reviews, vibe tags, or anecdotal experience as evidence for health claims.",
    provenanceLabel: "General health information — not a substitute for professional medical advice",
  },
  legal_regulated: {
    intent: "legal_regulated",
    consequence: "high",
    citationMode: "required",
    blockCommunityAsProof: true,
    allowLibraryInterests: false,
    flagCurrencyRisk: true,
    toneOverride:
      "Use calm, precise, plain language. Reference official legal sources when possible. " +
      "State clearly that this is general legal information, not legal advice. " +
      "Encourage consulting a licensed attorney. " +
      "NEVER present community opinion or anecdote as legal fact.",
    provenanceLabel: "General legal information — not a substitute for professional legal advice",
  },
  financial_regulated: {
    intent: "financial_regulated",
    consequence: "high",
    citationMode: "required",
    blockCommunityAsProof: true,
    allowLibraryInterests: false,
    flagCurrencyRisk: true,
    toneOverride:
      "Use calm, precise, plain language. Reference authoritative financial sources. " +
      "State clearly that this is general financial information, not financial advice. " +
      "Encourage consulting a licensed financial advisor. " +
      "NEVER present community tips as investment or financial guidance.",
    provenanceLabel: "General financial information — not a substitute for professional financial advice",
  },
  safety_emergency: {
    intent: "safety_emergency",
    consequence: "high",
    citationMode: "required",
    blockCommunityAsProof: true,
    allowLibraryInterests: false,
    flagCurrencyRisk: true,
    toneOverride:
      "Respond immediately and directly. Lead with safety actions (call 911, leave the area, contact a trusted person). " +
      "Use official emergency guidance only. " +
      "NEVER speculate or soften urgent safety information. " +
      "Include emergency contact numbers where relevant.",
    provenanceLabel: "Emergency guidance — always contact emergency services for immediate danger",
  },
  current_information: {
    intent: "current_information",
    consequence: "medium",
    citationMode: "required",
    blockCommunityAsProof: false,
    allowLibraryInterests: true,
    flagCurrencyRisk: true,
    toneOverride:
      "Acknowledge that this type of information changes frequently. " +
      "Provide your best answer from available knowledge but clearly state the training cutoff caveat. " +
      "Direct the user to official or authoritative sources for current verification.",
    provenanceLabel: "This information may have changed — verify with official sources before acting",
  },
};

// ─── Classification signals ───────────────────────────────────────────────────

const MEDICAL_SIGNALS = [
  /\b(symptom|symptoms|diagnosis|diagnos|treatment|treat|medication|medicine|drug|prescription|dose|dosage|side effect|clinical|therapy|therapist|psychiatrist|psychologist|disorder|syndrome|disease|illness|cancer|tumor|diabetes|hypertension|blood pressure|cholesterol|immuniz|vaccin|allerg|asthma|arthritis|menopause|pregnancy|prenatal|postnatal|postpartum|fertility|infertil|ivf|ivf treatment|miscarriage|stillbirth|hiv|aids|sti|std|herpes|chlamydia|gonorrhea|syphilis|depression|anxiety|bipolar|schizophrenia|ptsd|adhd|autism|eating disorder|anorexia|bulimia|obesity|bmi|stroke|heart attack|cardiac|kidney|liver|pancreas|thyroid|hormone|surgery|surgical|anesthesia|hospital|emergency room|er|urgent care|nurse|doctor|physician|specialist|oncologist|cardiologist|neurologist|dermatologist|gynecologist|ob.gyn|obstetrician|pediatrician|hospice|palliative|clinical trial|health insurance|medicaid|medicare)\b/i,
];

const LEGAL_SIGNALS = [
  /\b(lawsuit|sue|suing|court|judge|attorney|lawyer|legal|rights|contract|agreement|lease|tenant|landlord|eviction|discrimination|discriminated|discriminating|discriminatory|harassment|civil rights|employment law|labor law|copyright|trademark|patent|intellectual property|immigration|visa|asylum|deportation|citizenship|naturalization|divorce|custody|child support|alimony|will|trust|estate|probate|bankruptcy|debt|garnishment|arrest|warrant|bail|criminal|felony|misdemeanor|prison|parole|probation|restraining order|protective order|wrongful termination|workplace violation|wage theft|hostile work|retaliation)\b/i,
  // Travel policy phrases — must route to legal regardless of destination signal
  /\b(visa requirement|entry requirement|travel document|documentation requirement|border requirement|border crossing|entry policy|travel policy|work permit|residence permit|tourist visa|business visa|travel authorization|travel ban|country requirement|passport requirement)\b/i,
];

const FINANCIAL_SIGNALS = [
  /\b(invest|investing|investment|stock|bonds|mutual fund|401k|ira|roth|pension|retirement|portfolio|dividend|crypto|bitcoin|ethereum|nft|tax|taxes|tax return|irs|deduction|audit|credit score|credit report|loan|mortgage|refinance|interest rate|apr|heloc|debt|bankruptcy|budget|financial plan|wealth|net worth|income|expense|savings|compound interest|index fund|etf|brokerage)\b/i,
];

const SAFETY_EMERGENCY_SIGNALS = [
  /\b(emergency|911|help me|i'm in danger|in danger|being followed|someone is following|domestic violence|abuse|assault|attacked|attack|shooting|shot|stabbed|fire|flood|evacuation|evacuate|missing person|kidnap|trafficking|human trafficking|suicid|self.harm|overdos|unconscious|not breathing|call 911|call the police)\b/i,
];

const CURRENT_INFO_SIGNALS = [
  /\b(current|right now|today|this week|this month|tonight|tomorrow|this weekend|latest|recent|hours|open|closed|operating hours|visa|visa requirement|entry requirement|travel advisory|travel warning|border|customs|vaccination requirement|covid|pandemic|breaking|news|election|poll|event|concert|festival|game|match|score|weather|forecast|storm|hurricane|earthquake|price|cost|rate|today's|current rate|exchange rate)\b/i,
];

const CULTURE_ENTERTAINMENT_SIGNALS = [
  /\b(rapper|rapper|hip.hop|r&b|soul|gospel|jazz|blues|reggae|afrobeats|dancehall|music|artist|album|song|concert|tour|movie|film|show|series|actor|actress|director|book|author|poet|poet|writer|athlete|player|team|league|sport|basketball|football|baseball|soccer|tennis|boxing|mma|fashion|designer|model|style|art|artist|gallery|museum|exhibit|culture|cultural|tradition|heritage|history|historical|ancestry|genealogy|diaspora|community|neighborhood|cuisine|food culture|restaurant culture|chef|cookbook|cocktail culture|nightlife|club|dj|radio)\b/i,
];

const HOBBY_SIGNALS = [
  /\b(vintage|antique|classic car|collector|collecting|hobby|gardening|plant|cooking|recipe|bake|baking|craft|diy|sew|knit|crochet|paint|draw|sculpt|woodwork|photography|hike|hiking|camping|fishing|hunting|golf|tennis|yoga|pilates|meditation|reading|book club|gaming|video game|anime|sneaker|watch collection|coin collect|stamp collect|train collect|model building)\b/i,
];

const BUSINESS_DISCOVERY_SIGNALS = [
  /\b(restaurant|cafe|barber|salon|spa|beauty|hair|nails|nail|braids|braiding|locs|natural hair|massage|chiropractor|gym|fitness|studio|grocery|market|pharmacy|bakery|food|dinner|lunch|breakfast|brunch|bar|lounge|club|nightlife|hotel|motel|airbnb|shop|store|boutique|boutiques|retail|clothes|clothing|shoes|jewelry|book store|flower|florist|auto|car wash|mechanic|dentist|doctor|clinic|school|daycare|church|mosque|temple|service|lawyer|accountant|contractor|realtor|photographer|caterer|event|venue|spot|place|spots|places|near me|nearby|in \w+|around \w+)\b/i,
];

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classify the user message into a KinfolkIntent.
 * Uses a priority ladder: high-consequence intents are checked first.
 * Falls back to business_discovery if a city/destination is detectable, else general_knowledge.
 */
export function classifyIntent(message: string, hasDestination: boolean): KinfolkIntent {
  const msg = message.toLowerCase();

  // Safety emergency — absolute top priority
  if (SAFETY_EMERGENCY_SIGNALS.some((re) => re.test(msg))) return "safety_emergency";

  // High-consequence regulated domains
  if (MEDICAL_SIGNALS.some((re) => re.test(msg))) return "medical_health";
  if (LEGAL_SIGNALS.some((re) => re.test(msg))) return "legal_regulated";
  if (FINANCIAL_SIGNALS.some((re) => re.test(msg))) return "financial_regulated";

  // Current information (time-sensitive)
  if (CURRENT_INFO_SIGNALS.some((re) => re.test(msg))) return "current_information";

  // Business discovery (strong MWM catalog signal)
  if (BUSINESS_DISCOVERY_SIGNALS.some((re) => re.test(msg)) || hasDestination) return "business_discovery";

  // Culture & entertainment
  if (CULTURE_ENTERTAINMENT_SIGNALS.some((re) => re.test(msg))) return "culture_entertainment";

  // Hobbies & lifestyle
  if (HOBBY_SIGNALS.some((re) => re.test(msg))) return "hobby_lifestyle";

  // Default: general knowledge
  return "general_knowledge";
}

/**
 * Returns the evidence policy for a given intent.
 * The same message always produces the same policy — no randomness, no user context.
 */
export function getEvidencePolicy(intent: KinfolkIntent): EvidencePolicy {
  return POLICIES[intent];
}

/**
 * Build the intent-specific system prompt block that gets prepended to the
 * Kinfolk system prompt. Returns empty string for low-consequence intents
 * that need no special handling.
 */
export function buildIntentPolicyPrompt(policy: EvidencePolicy): string {
  const lines: string[] = [];

  if (policy.consequence === "high") {
    lines.push("═══════════════════════════════════════════════════════");
    lines.push("RESPONSE STANDARDS FOR THIS QUERY TYPE");
    lines.push("═══════════════════════════════════════════════════════");
  }

  if (policy.toneOverride) {
    lines.push(policy.toneOverride);
  }

  if (policy.blockCommunityAsProof) {
    lines.push(
      "COMMUNITY DATA RESTRICTION: Community reviews, vibe tags, check-in counts, " +
      "and user-submitted ratings MUST NOT be cited as evidence for this answer. " +
      "They may appear elsewhere on this business's profile but are not authoritative " +
      "for medical, legal, financial, or emergency claims."
    );
  }

  if (policy.flagCurrencyRisk) {
    lines.push(
      "CURRENCY CAVEAT: This topic may involve information that changes over time. " +
      "If relevant, tell the user clearly: 'Verify current information with official sources before acting.'"
    );
  }

  if (policy.citationMode === "required") {
    lines.push(
      "CITATIONS REQUIRED: Your response must identify the type of source supporting each claim " +
      "(e.g., 'According to the CDC...', 'Per U.S. immigration law...', 'Based on IRS guidance...'). " +
      "Do not cite sources you cannot name. If you cannot cite, say so and direct the user to official resources."
    );
  } else if (policy.citationMode === "recommended") {
    lines.push(
      "SOURCE TRANSPARENCY: When making factual claims, indicate the source type " +
      "(MWM listing, general knowledge, community experience, etc.). " +
      "Distinguish clearly: 'Mapping With Melanin lists...' vs. 'From general knowledge...'"
    );
  }

  lines.push(`PROVENANCE LABEL (include naturally in your response): "${policy.provenanceLabel}"`);

  if (policy.consequence === "high") {
    lines.push("═══════════════════════════════════════════════════════");
  }

  return lines.length > 0 ? lines.join("\n") : "";
}
