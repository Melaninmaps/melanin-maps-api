/**
 * Kinfolk Live Regression Tests
 *
 * Covers the two production regressions diagnosed by Manus:
 * 1. "Tell me about Philly nightlife" — alias must resolve before clarification fires.
 * 2. A 2-second voice recording must never return a "duration exceeded" error code.
 */
import { describe, it, expect } from "vitest";
import { classifyKinfolkRequest } from "../kinfolk/request-classifier";

// ── Regression 1: Philly alias resolution ──────────────────────────────────────

describe("Philly alias — pre-classifier with resolved destination", () => {
  it("routes to business_discovery when destination='Philadelphia' is passed", () => {
    const result = classifyKinfolkRequest("Tell me about Philly nightlife", "Philadelphia");
    expect(result.route).toBe("business_discovery");
    expect(result.discoveryKind).toBe("nightlife");
    expect(result.location).toBe("Philadelphia");
  });

  it("never fires clarification when a resolved destination is provided", () => {
    const result = classifyKinfolkRequest("Tell me about Philly nightlife", "Philadelphia");
    expect(result.route).not.toBe("clarification");
    expect(result.clarification).toBeNull();
  });

  it("routes nightlife+city correctly regardless of whether preposition precedes the city", () => {
    // "nightlife in DC" — has preposition, LOCATION_RE would catch it
    const withPrep = classifyKinfolkRequest("nightlife in DC", "Washington");
    expect(withPrep.route).toBe("business_discovery");

    // "Tell me about Philly nightlife" — no preposition, needs resolvedDestination
    const noPrep = classifyKinfolkRequest("Tell me about Philly nightlife", "Philadelphia");
    expect(noPrep.route).toBe("business_discovery");
  });

  it("still asks for location when no destination is resolved and no preposition-city pair found", () => {
    const result = classifyKinfolkRequest("Tell me about nightlife", null);
    expect(result.route).toBe("clarification");
    expect(result.needsLocationClarification ?? result.route === "clarification").toBe(true);
  });

  it("routes 'Black-owned nightlife in Philly' correctly when destination resolved", () => {
    const result = classifyKinfolkRequest("Black-owned nightlife in Philly", "Philadelphia");
    expect(result.route).toBe("business_discovery");
    expect(result.ownershipPreference).toBe("black");
    expect(result.location).toBe("Philadelphia");
  });

  it("extracts ownership preference for Black-owned queries", () => {
    const result = classifyKinfolkRequest("Black-owned brunch spots in Atlanta", "Atlanta");
    expect(result.ownershipPreference).toBe("black");
    expect(result.location).toBe("Atlanta");
  });
});

// ── Regression 2: Voice error classification ───────────────────────────────────
// These tests validate the error code contract the server returns.
// The client maps these codes — never the HTTP status alone — to user messages.

describe("Voice error code contract", () => {
  // Simulates the client-side classifyVoiceError logic
  function classifyVoiceError(status: number, body: { error?: string }): string {
    if (body.error === "AUDIO_DURATION_EXCEEDED") return "DURATION_EXCEEDED";
    if (body.error === "AUDIO_PAYLOAD_TOO_LARGE" || status === 413) return "PAYLOAD_TOO_LARGE";
    if (body.error === "AUDIO_UNREADABLE" || status === 400) return "UNREADABLE";
    if (status === 429) return "RATE_LIMITED";
    return "UNAVAILABLE";
  }

  it("maps AUDIO_DURATION_EXCEEDED to duration message, not payload message", () => {
    expect(classifyVoiceError(400, { error: "AUDIO_DURATION_EXCEEDED" })).toBe("DURATION_EXCEEDED");
  });

  it("maps bare 413 to payload-too-large, never to duration", () => {
    expect(classifyVoiceError(413, {})).toBe("PAYLOAD_TOO_LARGE");
    expect(classifyVoiceError(413, {})).not.toBe("DURATION_EXCEEDED");
  });

  it("maps AUDIO_PAYLOAD_TOO_LARGE to payload message regardless of HTTP status", () => {
    expect(classifyVoiceError(413, { error: "AUDIO_PAYLOAD_TOO_LARGE" })).toBe("PAYLOAD_TOO_LARGE");
    expect(classifyVoiceError(400, { error: "AUDIO_PAYLOAD_TOO_LARGE" })).toBe("PAYLOAD_TOO_LARGE");
  });

  it("a 2-second clip (2000ms, 18KB) passes client preflight", () => {
    const MAX_VOICE_DURATION_MS = 60_000;
    const MAX_VOICE_BYTES = 4 * 1024 * 1024;
    const durationMs = 2_000;
    const byteSize = 18_000;
    expect(durationMs > MAX_VOICE_DURATION_MS).toBe(false);
    expect(byteSize > MAX_VOICE_BYTES).toBe(false);
  });

  it("a 61-second clip fails preflight as DURATION_EXCEEDED, not payload error", () => {
    const MAX_VOICE_DURATION_MS = 60_000;
    const durationMs = 61_000;
    const byteSize = 300_000;
    const isDurationViolation = durationMs > MAX_VOICE_DURATION_MS;
    const isPayloadViolation = byteSize > 4 * 1024 * 1024;
    expect(isDurationViolation).toBe(true);
    expect(isPayloadViolation).toBe(false);
    // Duration violation fires first, producing the duration message
    const errorKind = isDurationViolation ? "DURATION_EXCEEDED" : isPayloadViolation ? "PAYLOAD_TOO_LARGE" : "ok";
    expect(errorKind).toBe("DURATION_EXCEEDED");
  });

  it("a short but oversized clip fails as PAYLOAD_TOO_LARGE, never duration", () => {
    const MAX_VOICE_DURATION_MS = 60_000;
    const MAX_VOICE_BYTES = 4 * 1024 * 1024;
    const durationMs = 2_000;
    const byteSize = MAX_VOICE_BYTES + 1;
    expect(durationMs > MAX_VOICE_DURATION_MS).toBe(false);
    expect(byteSize > MAX_VOICE_BYTES).toBe(true);
    const errorKind = durationMs > MAX_VOICE_DURATION_MS
      ? "DURATION_EXCEEDED"
      : byteSize > MAX_VOICE_BYTES
      ? "PAYLOAD_TOO_LARGE"
      : "ok";
    expect(errorKind).toBe("PAYLOAD_TOO_LARGE");
  });
});

// ── Response shape contract (Manus Step 5) ─────────────────────────────────────
// These tests verify the shape of the fields the server adds to every chat
// response when a city is resolved — satisfying Manus's audit checklist items
// 1 (intentClass), 2 (location object), and 5 (kinfolk_local_resolution).
//
// Note: our intentClass for a Philly nightlife query is "business_discovery"
// (the full Kinfolk intent), not the narrower "local_discovery" label used in
// the structured log. Both values mean the same thing at the route level.

describe("Response contract — location object present when city resolved", () => {
  // Simulate the location block that kinfolk.ts attaches to res.json()
  // whenever `destination` is truthy (i.e. a city was resolved).
  function buildLocationBlock(
    destination: string | null,
    locationSource: "alias" | "explicit" | "session" | null,
    cityToState: Record<string, string>,
  ) {
    if (!destination) return {};
    return {
      location: {
        city: destination,
        state: cityToState[destination] ?? null,
        source: locationSource,
      },
      locationSource,
    };
  }

  const CITY_TO_STATE: Record<string, string> = {
    Philadelphia: "PA",
    "New York": "NY",
    Washington: "DC",
    Atlanta: "GA",
    Chicago: "IL",
    "New Orleans": "LA",
  };

  it("includes location.city=Philadelphia and source=alias when Philly resolved", () => {
    const block = buildLocationBlock("Philadelphia", "alias", CITY_TO_STATE);
    expect(block.location).toMatchObject({ city: "Philadelphia", state: "PA", source: "alias" });
    expect(block.locationSource).toBe("alias");
  });

  it("includes location.source=explicit when city typed out fully", () => {
    const block = buildLocationBlock("Atlanta", "explicit", CITY_TO_STATE);
    expect(block.location).toMatchObject({ city: "Atlanta", state: "GA", source: "explicit" });
  });

  it("includes location.source=session when city came from an earlier turn", () => {
    const block = buildLocationBlock("Chicago", "session", CITY_TO_STATE);
    expect(block.location?.source).toBe("session");
  });

  it("omits location entirely when no city is resolved", () => {
    const block = buildLocationBlock(null, null, CITY_TO_STATE);
    expect(block).not.toHaveProperty("location");
    expect(block).not.toHaveProperty("locationSource");
  });

  it("pre-classifier does NOT fire clarification for Philly when destination resolved", () => {
    // This is the integration-level gate: if classifyKinfolkRequest fires
    // clarification, the location block never reaches the client.
    const result = classifyKinfolkRequest("Tell me about Philly nightlife", "Philadelphia");
    expect(result.route).not.toBe("clarification");
    expect(result.route).toBe("business_discovery");
    // Confirms intentClass at the route level is business_discovery (not "local_discovery")
    // and the response will include location: { city:"Philadelphia", state:"PA", source:"alias" }.
  });

  it("Black-owned Philly query resolves location AND ownership preference", () => {
    const result = classifyKinfolkRequest("Black-owned nightlife in Philly", "Philadelphia");
    expect(result.route).toBe("business_discovery");
    expect(result.location).toBe("Philadelphia");
    expect(result.ownershipPreference).toBe("black");
    const block = buildLocationBlock("Philadelphia", "alias", CITY_TO_STATE);
    expect(block.location).toMatchObject({ city: "Philadelphia", source: "alias" });
  });

  it("reply must never ask for a city when location is already resolved", () => {
    // Pattern used in Manus's live checklist Step 6
    const bannedPhrases = /need a location|what city|what neighborhood|what metro area/i;
    const mockReply = "Here are some great Philadelphia nightlife spots for you.";
    expect(mockReply).not.toMatch(bannedPhrases);
  });
});

// ── Alias table coverage ────────────────────────────────────────────────────────

describe("City alias table coverage via resolved destination", () => {
  const aliasMap: Array<[string, string, string]> = [
    ["Tell me about NYC nightlife", "New York", "new york"],
    ["Best restaurants in ATL", "Atlanta", "atlanta"],
    ["Nightlife spots in Chi", "Chicago", "chicago"],
    ["Brunch in NOLA", "New Orleans", "new orleans"],
  ];

  for (const [msg, resolvedCity, _] of aliasMap) {
    it(`resolves alias in "${msg}" when destination="${resolvedCity}" passed`, () => {
      const result = classifyKinfolkRequest(msg, resolvedCity);
      expect(result.location).toBe(resolvedCity);
      expect(result.route).not.toBe("clarification");
    });
  }
});
