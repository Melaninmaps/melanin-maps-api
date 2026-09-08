/**
 * KinfolkAI Request Classifier + Voice Validation Tests
 *
 * Adapted from Manus's MWM_KINFOLK_SCREENSHOT_FIX_TESTS package.
 * Covers brunch intent routing, clarification, diaspora context,
 * and voice duration acceptance/rejection.
 *
 * Run: pnpm --filter @workspace/api-server test
 */

import { describe, expect, it } from "vitest";
import { classifyKinfolkRequest } from "../kinfolk/request-classifier";
import {
  validateVoiceRecording,
  voiceErrorForStatus,
  VOICE_MAX_DURATION_SECONDS,
} from "../kinfolk/voice-validation";

// ── Brunch intent routing ─────────────────────────────────────────────────────

describe("classifyKinfolkRequest — brunch routing", () => {
  const BRUNCH_WITH_LOCATION = [
    { input: "Brunch in DC", location: "DC" },
    {
      input: "Heading to DC for the weekend, any brunch spots?",
      location: "DC",
    },
    {
      input: "After early church service, where can we brunch in Atlanta?",
      location: "Atlanta",
    },
    {
      input: "Any Black-owned brunch spots in Washington DC?",
      location: "Washington DC",
    },
  ] as const;

  for (const { input, location } of BRUNCH_WITH_LOCATION) {
    it(`routes "${input}" to business_discovery`, () => {
      const result = classifyKinfolkRequest(input);
      expect(result.route).toBe("business_discovery");
      expect(result.discoveryKind).toBe("brunch");
      expect(result.location).toBe(location);
      expect(result.culturalContext).toContain("diaspora_brunch");
    });
  }

  it('sends "Brunch spots?" to clarification (no location)', () => {
    const result = classifyKinfolkRequest("Brunch spots?");
    expect(result.route).toBe("clarification");
    expect(result.discoveryKind).toBe("brunch");
    expect(result.location).toBeNull();
    expect(result.clarification).toMatch(/city|neighborhood/i);
  });

  it('routes "Tell me about brunch as a cultural tradition" to general_knowledge', () => {
    const result = classifyKinfolkRequest(
      "Tell me about brunch as a cultural tradition",
    );
    expect(result.route).toBe("general_knowledge");
  });

  it("includes diaspora brunch context for post-church phrasing", () => {
    const result = classifyKinfolkRequest(
      "After church brunch in Atlanta",
    );
    expect(result.route).toBe("business_discovery");
    expect(result.culturalContext).toContain("diaspora_brunch");
    expect(result.culturalContext).toContain("post_church_social_meal");
  });
});

describe("classifyKinfolkRequest — stylist proof-of-concept", () => {
  it("routes the founder screenshot request to deterministic Philadelphia discovery", () => {
    expect(classifyKinfolkRequest(
      "Can you find me a stylist in Philadelphia",
      "Philadelphia",
    )).toMatchObject({
      route: "business_discovery",
      location: "Philadelphia",
    });
  });

  it("asks a hair-specific location question without restaurant language", () => {
    const result = classifyKinfolkRequest("a stylist is a hairdresser or a salon");
    expect(result.route).toBe("clarification");
    expect(result.clarification).toMatch(/stylist|salon/i);
    expect(result.clarification).toMatch(/city|neighborhood/i);
    expect(result.clarification).toMatch(/locs|braids|natural hair/i);
    expect(result.clarification).not.toMatch(/cuisine/i);
  });

  it.each([
    "What does a stylist do?",
    "How do I become a stylist?",
    "My stylist recommends this product",
  ])("does not demand a location for informational stylist wording: %s", (message) => {
    expect(classifyKinfolkRequest(message).route).toBe("general_knowledge");
  });

  it("routes a fashion stylist request as fashion rather than salon discovery", () => {
    const result = classifyKinfolkRequest("I need a fashion stylist in Philadelphia", "Philadelphia");
    expect(result.route).toBe("business_discovery");
    expect(result.location).toBe("Philadelphia");
  });

  it.each([
    "Find a stylist for a photo in Philadelphia",
    "Find a stylist for a photo shoot in Philadelphia",
    "Find a stylist for a product in Philadelphia",
  ])("never treats creative-production styling as a hair salon request: %s", (message) => {
    const result = classifyKinfolkRequest(message, "Philadelphia");
    expect(result.clarification ?? "").not.toMatch(/hair|salon|locs|braids/i);
  });

  it.each([
    "Find personal styling in Philadelphia",
    "I need personal styling in Philadelphia",
  ])("routes explicit personal styling as fashion business discovery: %s", (message) => {
    expect(classifyKinfolkRequest(message, "Philadelphia").route).toBe("business_discovery");
  });
});

// ── Voice duration validation ─────────────────────────────────────────────────

describe("validateVoiceRecording", () => {
  const VALID_AUDIO = "A".repeat(1000);

  it("accepts an 11-second recording", () => {
    const result = validateVoiceRecording({
      durationSeconds: 11,
      base64Audio: VALID_AUDIO,
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a 59.9-second recording (just under limit)", () => {
    const result = validateVoiceRecording({
      durationSeconds: 59.9,
      base64Audio: VALID_AUDIO,
    });
    expect(result.ok).toBe(true);
  });

  it(`rejects recordings over ${VOICE_MAX_DURATION_SECONDS} seconds`, () => {
    const result = validateVoiceRecording({
      durationSeconds: 60.1,
      base64Audio: VALID_AUDIO,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VOICE_CLIP_TOO_LONG");
  });

  it("accepts null durationSeconds (duration not provided by client)", () => {
    const result = validateVoiceRecording({
      durationSeconds: null,
      base64Audio: VALID_AUDIO,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects oversized base64 audio", () => {
    // ~14 MB base64 string
    const oversized = "A".repeat(14 * 1024 * 1024);
    const result = validateVoiceRecording({ base64Audio: oversized });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("AUDIO_TOO_LARGE");
  });
});

// ── Voice error messages ──────────────────────────────────────────────────────

describe("voiceErrorForStatus", () => {
  it("503 says to type the question — never blames clip length", () => {
    expect(voiceErrorForStatus(503)).toMatch(/type your question/i);
    expect(voiceErrorForStatus(503)).not.toMatch(/shorter clip/i);
  });

  it("413 mentions file size", () => {
    expect(voiceErrorForStatus(413)).toMatch(/too large/i);
  });

  it("429 mentions rate limit", () => {
    expect(voiceErrorForStatus(429)).toMatch(/rate-limited|wait/i);
  });
});
