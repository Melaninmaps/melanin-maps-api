export type SensitiveMemoryTopic =
  | "health"
  | "exact_location"
  | "race_ethnicity"
  | "religion"
  | "sexuality"
  | "finances"
  | "children";

const SENSITIVE_MEMORY_TOPICS: ReadonlyArray<{
  key: SensitiveMemoryTopic;
  pattern: RegExp;
}> = [
  {
    key: "health",
    pattern: /\b(?:fertility|infertility|ivf|iui|egg freezing|pregnan(?:t|cy)|miscarriage|reproductive|ob[- ]?gyn|rash|eczema|psoriasis|acne|skin condition|dermatolog(?:y|ist)|depression|anxiety|therapy|therapist|trauma|panic attack|mental health|suicid(?:e|al)|sexual health|sti|std|hiv|aids|contraception|birth control|diagnos(?:is|ed)|medical condition|disab(?:led|ility))\b/i,
  },
  {
    key: "exact_location",
    pattern: /\b(?:my (?:home|house|apartment|address|work address)|live at|located at|street address|\d{1,6}\s+[A-Za-z0-9.'-]+\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|place|pl\.?|parkway|pkwy\.?|way)|(?:apt|apartment|unit|suite)\s*#?\s*[A-Za-z0-9-]+|\b\d{5}(?:-\d{4})?\b)\b/i,
  },
  {
    key: "race_ethnicity",
    pattern: /\b(?:black|african(?:[- ]american)?|hispanic|latina|latino|latinx|asian(?:[- ]american)?|indigenous|native(?: american)?|arab|middle eastern|ethnic(?:ity)?|race)\b/i,
  },
  {
    key: "religion",
    pattern: /\b(?:religion|religious|christian|catholic|muslim|islam|jew(?:ish|ishness)?|judaism|hindu|buddhist|sikh|atheist|agnostic|church|mosque|synagogue|temple)\b/i,
  },
  {
    key: "sexuality",
    pattern: /\b(?:sexuality|sexual orientation|lgbtq(?:ia\+?)?|gay|lesbian|bisexual|queer|trans(?:gender)?|nonbinary)\b/i,
  },
  {
    key: "finances",
    pattern: /\b(?:income|salary|debt|bankruptcy|credit score|foreclosure|eviction|financial hardship|bank account|paycheck|monthly budget|funds? (?:are|is) tight|money is tight|tight budget)\b/i,
  },
  {
    key: "children",
    pattern: /\b(?:children|kids?|son|daughter|child(?:'s)? school|daycare|aftercare|school pickup|custody|minor child|newborn|toddler|teenager)\b/i,
  },
];

/**
 * Sensitive details always require a separate per-item confirmation. This is
 * intentionally deterministic: raw text is classified in-process and never
 * sent to a model merely to decide whether it can be retained.
 */
export function sensitiveMemoryTopic(value: unknown): SensitiveMemoryTopic | null {
  if (typeof value !== "string") return null;
  return SENSITIVE_MEMORY_TOPICS.find((topic) => topic.pattern.test(value))?.key ?? null;
}

export function isSensitiveMemory(value: unknown): boolean {
  return sensitiveMemoryTopic(value) !== null;
}
