export type EntertainmentCostPolicy = "any" | "included_only";
export type EntertainmentSubscriptionOperation =
  | "add"
  | "remove"
  | "replace"
  | "set_cost_policy";

export type EntertainmentPreferenceSnapshot = Readonly<{
  streamingServices: readonly string[];
  entertainmentCountry: string | null;
  entertainmentCostPolicy: EntertainmentCostPolicy;
}>;

export type EntertainmentConsentPlan = Readonly<{
  operation: EntertainmentSubscriptionOperation;
  add: readonly string[];
  remove: readonly string[];
  costPolicy: EntertainmentCostPolicy | null;
  summary: string;
}>;

const SERVICE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  Netflix: ["netflix"],
  Hulu: ["hulu"],
  "Prime Video": ["prime video", "amazon prime", "prime"],
  Max: ["max", "hbo max", "hbo"],
  "Disney+": ["disney+", "disney plus"],
  "Apple TV+": ["apple tv+", "apple tv plus"],
  Peacock: ["peacock"],
  "Paramount+": ["paramount+", "paramount plus"],
};

function phraseInText(text: string, phrase: string): boolean {
  const escaped = phrase
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\+/g, "\\+");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
}

export function normalizeStreamingService(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ").toLowerCase();
  for (const [canonical, aliases] of Object.entries(SERVICE_ALIASES)) {
    if (aliases.some((alias) => cleaned === alias)) return canonical;
  }
  return null;
}

export function extractStreamingServices(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const found = Object.entries(SERVICE_ALIASES)
    .filter(([, aliases]) =>
      aliases.some((alias) => phraseInText(value, alias)),
    )
    .map(([canonical]) => canonical);
  return [...new Set(found)];
}

function isIncludedOnlyInstruction(message: string): boolean {
  return /\b(?:only\s+recommend|recommend)\b[\s\S]{0,90}\b(?:without\s+(?:paying|pay|extra)|included\s+(?:with|in)\s+my\s+(?:subscriptions?|services?)|no\s+extra\s+cost)\b/i.test(
    message,
  );
}

function isAnyCostInstruction(message: string): boolean {
  return /\b(?:include|allow)\b[\s\S]{0,50}\b(?:rent(?:als?)?|purchases?|paid\s+(?:options?|titles?))\b/i.test(
    message,
  );
}

/**
 * Produces a reviewable plan from ordinary chat. It never writes a preference;
 * the authenticated member must send the exact plan back with consent: true.
 */
export function buildEntertainmentConsentPlan(
  value: unknown,
): EntertainmentConsentPlan | null {
  if (typeof value !== "string") return null;
  const message = value.trim();
  if (!message) return null;
  if (isIncludedOnlyInstruction(message)) {
    return {
      operation: "set_cost_policy",
      add: [],
      remove: [],
      costPolicy: "included_only",
      summary:
        "Remember: recommend only options included with my saved services or available free/ad-supported.",
    };
  }
  if (isAnyCostInstruction(message)) {
    return {
      operation: "set_cost_policy",
      add: [],
      remove: [],
      costPolicy: "any",
      summary:
        "Remember: rentals and purchases may be included in entertainment options.",
    };
  }
  const services = extractStreamingServices(message);
  if (!services.length) return null;
  if (
    /\b(?:cancel(?:led|ed)?|canceling|no\s+longer\s+(?:have|subscribe)|dropped|stopped)\b/i.test(
      message,
    )
  ) {
    return {
      operation: "remove",
      add: [],
      remove: services,
      costPolicy: null,
      summary: `Remove ${services.join(" and ")} from my saved streaming services.`,
    };
  }
  if (
    /\b(?:switch(?:ed|ing)?|moved)\b/i.test(message) &&
    /\bfrom\b[\s\S]{0,80}\bto\b/i.test(message) &&
    services.length >= 2
  ) {
    return {
      operation: "replace",
      add: [services.at(-1)!],
      remove: [services[0]],
      costPolicy: null,
      summary: `Replace ${services[0]} with ${services.at(-1)} in my saved streaming services.`,
    };
  }
  if (
    /\b(?:i\s+(?:have|subscribe\s+to|use)|my\s+(?:streaming\s+)?services?\s+(?:are|include)|add)\b/i.test(
      message,
    )
  ) {
    return {
      operation: "add",
      add: services,
      remove: [],
      costPolicy: null,
      summary: `Save ${services.join(" and ")} as my streaming service${services.length === 1 ? "" : "s"}.`,
    };
  }
  return null;
}

export function normalizeEntertainmentCostPolicy(
  value: unknown,
): EntertainmentCostPolicy {
  return value === "included_only" ? "included_only" : "any";
}

export function applyEntertainmentConsentPlan(
  current: EntertainmentPreferenceSnapshot,
  plan: EntertainmentConsentPlan,
): EntertainmentPreferenceSnapshot {
  const normalizedExisting = current.streamingServices
    .map(normalizeStreamingService)
    .filter((service): service is string => Boolean(service));
  const remove = new Set(plan.remove);
  const remaining = normalizedExisting.filter(
    (service) => !remove.has(service),
  );
  const streamingServices = [...new Set([...remaining, ...plan.add])].slice(
    0,
    20,
  );
  return {
    streamingServices,
    entertainmentCountry: current.entertainmentCountry,
    entertainmentCostPolicy:
      plan.costPolicy ??
      normalizeEntertainmentCostPolicy(current.entertainmentCostPolicy),
  };
}

export function isIncludedWithoutExtraCost(monetizationType: string): boolean {
  return (
    monetizationType === "flatrate" ||
    monetizationType === "free" ||
    monetizationType === "ads"
  );
}
