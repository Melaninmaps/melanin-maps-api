import {
  HERITAGE_CITIES,
  getHeritageCity,
  resolveHeritageCity,
  type HeritageCity,
  type HeritageCityResolution,
} from "@workspace/constants";

export {
  HERITAGE_CITIES,
  getHeritageCity,
  resolveHeritageCity,
  type HeritageCity,
  type HeritageCityResolution,
};

export type TurnGeographyResolution = Readonly<{
  city: string;
  state: string | null;
  source: "alias" | "explicit" | "session";
  currentTurn: boolean;
  matchedText: string | null;
}>;
function extractUnregisteredDestination(message: string): string | null {
  const patterns = [
    /\b(?:in|to|at|around|visiting|headed to|going to|travelling to|traveling to|moving to|near)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/,
    /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:restaurants|food|spots|places|businesses|things to do|events|bars|brunch|coffee|barbershop|barbers|salons|vibes|nightlife|heritage sites|historic sites)\b/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern)?.[1]?.trim();
    if (match && match.length >= 3) return match;
  }
  return null;
}

/**
 * Resolve current-turn geography before falling back to an already permitted,
 * enabled-session destination. A current message always wins, so changing cities
 * cannot be masked by stale session state. Unregistered international destinations
 * retain the route's existing grammar-based fallback.
 */
export function resolveTurnGeography(
  message: string,
  sessionDestination?: string | null,
): TurnGeographyResolution | null {
  // An explicit destination is stronger than another current-turn city reference
  // (for example, "from Philadelphia to Atlanta"). Resolve it first, but only
  // if the captured value is a known canonical city or a safe alias.
  const unregistered = extractUnregisteredDestination(message);
  const explicitRegistered = unregistered
    ? getHeritageCity(unregistered)
    : null;
  if (explicitRegistered && unregistered) {
    const explicitMatch = resolveHeritageCity(unregistered);
    return {
      city: explicitRegistered.city,
      state: explicitRegistered.state,
      source: explicitMatch?.matchKind === "alias" ? "alias" : "explicit",
      currentTurn: true,
      matchedText: unregistered,
    };
  }

  const current = resolveHeritageCity(message);
  if (current) {
    return {
      city: current.city,
      state: current.state,
      source: current.matchKind === "alias" ? "alias" : "explicit",
      currentTurn: true,
      matchedText: current.matchedText,
    };
  }

  if (unregistered) {
    return {
      city: unregistered,
      state: null,
      source: "explicit",
      currentTurn: true,
      matchedText: unregistered,
    };
  }

  if (!sessionDestination) return null;
  const registeredSession = getHeritageCity(sessionDestination);
  return {
    city: registeredSession?.city ?? sessionDestination,
    state: registeredSession?.state ?? null,
    source: "session",
    currentTurn: false,
    matchedText: null,
  };
}

/** Current-turn geography is authoritative; model output may only fill a blank. */
export function destinationForEnabledSession(input: {
  turn: TurnGeographyResolution | null;
  existingDestination?: string | null;
  modelDestination?: string | null;
}): string | null {
  if (input.turn?.currentTurn) return input.turn.city;
  if (input.existingDestination) {
    return (
      getHeritageCity(input.existingDestination)?.city ??
      input.existingDestination
    );
  }
  if (input.turn) return input.turn.city;
  if (input.modelDestination) {
    return (
      getHeritageCity(input.modelDestination)?.city ?? input.modelDestination
    );
  }
  return null;
}
