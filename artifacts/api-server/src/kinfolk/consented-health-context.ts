import { permittedIdentityContext } from "./permitted-identity-context";

/**
 * A deliberately narrow adapter between a separately confirmed private identity
 * note and group-level health research. It accepts no profile fields, session
 * history, location, or inferred attributes.
 */
export type ConsentedPrivateMemoryForHealth = Readonly<{
  content: string;
  purpose: string;
  isSensitive: boolean;
  sensitiveConsentGrantedAt: Date | string | null;
}>;

export type ConsentedHealthPopulationContext = Readonly<{
  label: string;
  source: "consented_private_memory";
}>;

/**
 * Returns a saved identity only when all of these conditions are true:
 * - the member explicitly saved it as profile context;
 * - the item received its separate sensitive-detail confirmation;
 * - it is a self-description (not a saved research topic or business preference);
 * - the current turn did not already name its own population.
 *
 * Callers must use this only for a relevant group-level health question. The
 * result is not a diagnosis, a risk score, or a substitute for current evidence.
 */
export function resolveConsentedHealthPopulationContext(
  memories: readonly ConsentedPrivateMemoryForHealth[],
  currentMessage: string,
): ConsentedHealthPopulationContext | null {
  // The current turn is authoritative, including a request for another group or
  // a general answer with no population lens.
  if (permittedIdentityContext(currentMessage).demographicQualifier) return null;

  for (const memory of memories) {
    if (
      memory.purpose !== "profile_context" ||
      !memory.isSensitive ||
      !memory.sensitiveConsentGrantedAt
    ) {
      continue;
    }

    const identity = permittedIdentityContext(memory.content);
    if (!identity.demographic) continue;

    return {
      label: identity.demographic,
      source: "consented_private_memory",
    };
  }

  return null;
}
