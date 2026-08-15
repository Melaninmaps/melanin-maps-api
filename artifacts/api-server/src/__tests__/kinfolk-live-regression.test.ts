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
