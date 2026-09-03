import type { SessionMessage } from "@workspace/db";
import type {
  GovernedKinfolkBusiness,
  GovernedKinfolkBusinessRepository,
  ValidatedKinfolkCityScope,
} from "./governedBusinessRepository";

export type NamedBusinessResolution =
  | { state: "not_named" }
  | { state: "needs_location"; reply: string }
  | { state: "not_found"; name: string }
  | { state: "resolved"; business: GovernedKinfolkBusiness; source: "explicit" | "immediate_reference" };

const EXPLICIT_BUSINESS_GRAMMAR = /^\s*(?:tell me about|what (?:can you tell me|do you know) about)\s+(.+?)\s*[?.!]*\s*$/i;
const IMMEDIATE_REFERENCE_GRAMMAR = /^\s*the\s+(?:restaurant|business|place|spot|venue|shop|store|cafe|bar|salon|barbershop)\s+(?:in|at)\s+(.+?)\s*[?.!]*\s*$/i;
const GENERIC_REFERENTS = /^(?:it|that|this|the (?:restaurant|business|place|spot|venue|shop|store|cafe|bar|salon|barbershop))$/i;
const GENERIC_DISCOVERY_SUBJECT = /^(?:book[ -]?stores?|bookshops?|books|restaurants?|caf[eé]s?|coffee shops?|barbers?|barber[ -]?shops?|salons?|grocer(?:y|ies)|grocery stores?|laundromats?|laundr(?:y|ies)|hotels?|night[ -]?life|bars?|clubs?|lounges?)(?:\s+(?:in|near|around|at)\b|$)/i;

function explicitBusinessName(message: string): string | null {
  const candidate = message.match(EXPLICIT_BUSINESS_GRAMMAR)?.[1]?.trim() ?? null;
  if (!candidate || candidate.length > 120 || GENERIC_REFERENTS.test(candidate) || GENERIC_DISCOVERY_SUBJECT.test(candidate)) return null;
  return candidate;
}

function previousCanonicalBusiness(messages: SessionMessage[]): { id: string | null; name: string; city: string | null } | null {
  const last = messages.at(-1);
  if (!last || last.role !== "assistant" || !last.recommendations || typeof last.recommendations !== "object") return null;
  const businesses = (last.recommendations as { businesses?: unknown }).businesses;
  if (!Array.isArray(businesses) || businesses.length !== 1) return null;
  const candidate = businesses[0];
  if (!candidate || typeof candidate !== "object") return null;
  const row = candidate as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const idValue = typeof row.id === "string" ? row.id : typeof row.businessId === "string" ? row.businessId : null;
  const city = typeof row.city === "string" ? row.city.trim() : null;
  return name ? { id: idValue, name, city } : null;
}

/**
 * Resolve explicit business grammar before a city catalog. The immediate-reference
 * grammar revalidates the prior canonical recommendation by exact name and geography;
 * it never trusts or geocodes a business name.
 */
export async function resolveNamedBusinessTurn(input: {
  message: string;
  scope: ValidatedKinfolkCityScope | null;
  existingMessages: SessionMessage[];
  repository: GovernedKinfolkBusinessRepository;
}): Promise<NamedBusinessResolution> {
  const explicitName = explicitBusinessName(input.message);
  if (explicitName) {
    if (!input.scope) {
      return {
        state: "needs_location",
        reply: `Which “${explicitName}” do you mean, and what city is the business in?`,
      };
    }
    const business = await input.repository.findExactByNormalizedName({
      name: explicitName,
      ...input.scope,
    });
    return business
      ? { state: "resolved", business, source: "explicit" }
      : { state: "not_found", name: explicitName };
  }

  if (!IMMEDIATE_REFERENCE_GRAMMAR.test(input.message) || !input.scope) return { state: "not_named" };
  const previous = previousCanonicalBusiness(input.existingMessages);
  if (!previous || (previous.city && previous.city.toLowerCase() !== input.scope.city.toLowerCase())) {
    return { state: "not_named" };
  }
  const business = await input.repository.findExactByNormalizedName({
    name: previous.name,
    ...input.scope,
  });
  return business
    ? { state: "resolved", business, source: "immediate_reference" }
    : { state: "not_named" };
}

export function namedBusinessPromptBlock(business: GovernedKinfolkBusiness): string {
  return [
    "NAMED BUSINESS — SERVER-AUTHORITATIVE EXACT RECORD:",
    `${business.name} [${business.id}] | ${business.category} | ${business.city}, ${business.stateCode ?? ""}`,
    business.description || business.story || "No public description is available.",
    "Answer only about this canonical visible record. Do not broaden to a city catalog, rename it, merge another business, or invent details.",
    `Any recommendation must use businessId "${business.id}" and exact name "${business.name}".`,
  ].join("\n");
}
