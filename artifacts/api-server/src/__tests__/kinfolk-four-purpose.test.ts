import { describe, it, expect } from "vitest";
import {
  validatePromotionCandidates,
  enforceEducationalSources,
  safetyEnvelope,
  buildFlywheelEvent,
  enforceKinfolkResponse,
} from "../kinfolk/four-purpose-enforcement";

const catalog = [
  {
    id: "canonical-1",
    name: "Verified Community Cafe",
    category: "Restaurant",
    city: "Washington DC",
    verified: true,
    evidence: [
      {
        sourceProvider: "google-places",
        sourceRecordId: "place-1",
        sourceUrl: "https://maps.google.com/?place_id=place-1",
      },
    ],
  },
];

describe("validatePromotionCandidates", () => {
  it("accepts a server-catalog business by ID", () => {
    const result = validatePromotionCandidates(
      [{ id: "canonical-1", name: "Verified Community Cafe", city: "Washington DC" }],
      catalog,
    );
    expect(result.businesses.length).toBe(1);
    expect(result.rejected).toBe(0);
  });

  it("accepts a server-catalog business by name+city when no ID supplied", () => {
    const result = validatePromotionCandidates(
      [{ name: "Verified Community Cafe", city: "Washington DC" }],
      catalog,
    );
    expect(result.businesses.length).toBe(1);
    expect(result.rejected).toBe(0);
  });

  it("rejects a fabricated model-only business (not in catalog)", () => {
    const result = validatePromotionCandidates(
      [{ name: "Fictional Cafe", city: "Washington DC", website: "https://fiction.invalid" }],
      catalog,
    );
    expect(result.businesses.length).toBe(0);
    expect(result.rejected).toBe(1);
    expect(result.reason).toBeTruthy();
  });

  it("caps results at 12", () => {
    const bigCatalog = Array.from({ length: 20 }, (_, i) => ({
      id: `biz-${i}`,
      name: `Biz ${i}`,
      category: "Cafe",
      city: "Atlanta",
    }));
    const proposals = bigCatalog.map((b) => ({ id: b.id, name: b.name, city: b.city }));
    const result = validatePromotionCandidates(proposals, bigCatalog);
    expect(result.businesses.length).toBeLessThanOrEqual(12);
  });
});

describe("enforceEducationalSources", () => {
  it("returns grounded when sources present", () => {
    const result = enforceEducationalSources(
      "A source-backed Library answer.",
      [{ id: "lib-1", title: "Library topic", url: "https://example.org/library-topic", label: "library" }],
      { type: "open_library", topicId: "topic-1" },
    );
    expect(result.educationalStatus).toBe("grounded");
    expect(result.sources.length).toBe(1);
    expect(result.reply).not.toMatch(/verified source/i);
  });

  it("returns limited with library action present but no sources", () => {
    const result = enforceEducationalSources(
      "An answer without a source.",
      [],
      { type: "open_library", topicId: "topic-1" },
    );
    expect(result.educationalStatus).toBe("limited");
    expect(result.sources.length).toBe(0);
    expect(result.reply).toMatch(/verified source/i);
  });

  it("returns needs_review with no sources and no library action", () => {
    const result = enforceEducationalSources("A general answer.", [], null);
    expect(result.educationalStatus).toBe("needs_review");
    expect(result.reply).toMatch(/could not verify a source/i);
  });
});

describe("safetyEnvelope", () => {
  it("returns a disclaimer for safety intents without an official source", () => {
    const notice = safetyEnvelope("safety_emergency", []);
    expect(notice).toMatch(/official local authorities/i);
    expect(notice).toMatch(/emergency services/i);
  });

  it("returns a softer disclaimer when an official source is attached", () => {
    const notice = safetyEnvelope("safety_emergency", [
      {
        id: "s1",
        title: "Official alert",
        url: "https://example.gov/alert",
        label: "official_safety",
      },
    ]);
    expect(notice).toMatch(/official local authorities/i);
  });

  it("returns null for non-safety intents", () => {
    expect(safetyEnvelope("business_discovery", [])).toBeNull();
    expect(safetyEnvelope("general_knowledge", [])).toBeNull();
    expect(safetyEnvelope("travel_general", [])).toBeNull();
  });
});

describe("buildFlywheelEvent", () => {
  it("normalizes subject to lowercase, trimmed, max 160 chars", () => {
    const e = buildFlywheelEvent({
      userId: "tester-1",
      eventType: "kinfolk_query",
      canonicalSubject: "  Brunch in DC ",
      sourceSurface: "kinfolk_chat",
      sensitive: false,
    });
    expect(e.canonicalSubject).toBe("brunch in dc");
    expect(e.learningEligible).toBe(true);
    expect(e.eventDay.length).toBe(10);
    expect(e.isLoadTest).toBe(false);
  });

  it("marks sensitive events as not learning-eligible", () => {
    const e = buildFlywheelEvent({
      userId: "tester-1",
      eventType: "kinfolk_query",
      canonicalSubject: "pregnancy complications",
      sourceSurface: "kinfolk_chat",
      sensitive: true,
    });
    expect(e.learningEligible).toBe(false);
  });

  it("marks load test events", () => {
    const e = buildFlywheelEvent({
      userId: "tester-1",
      eventType: "kinfolk_query",
      canonicalSubject: "test subject",
      sourceSurface: "kinfolk_chat",
      sensitive: false,
      isLoadTest: true,
    });
    expect(e.isLoadTest).toBe(true);
  });
});

describe("enforceKinfolkResponse — integration", () => {
  it("removes a model fabrication and keeps a catalog business", () => {
    const result = enforceKinfolkResponse({
      reply: "Here are some places.",
      modelRecommendations: [
        { id: "canonical-1", name: "Verified Community Cafe", city: "Washington DC" },
        { name: "Made Up Bistro", city: "Washington DC" },
      ],
      catalog,
      sources: [{ id: "src-1", title: "Google", url: "https://maps.google.com/?place_id=place-1", label: "maps" }],
      libraryAction: null,
      intentClass: "business_discovery",
    });
    expect(result.recommendations?.businesses.length).toBe(1);
    expect(result.rejectedRecommendations).toBe(1);
    expect(result.educationalStatus).toBe("grounded");
    expect(result.safetyNotice).toBeNull();
  });

  it("attaches a safety notice for safety intents", () => {
    const result = enforceKinfolkResponse({
      reply: "Stay safe out there.",
      modelRecommendations: [],
      catalog: [],
      sources: [],
      libraryAction: null,
      intentClass: "safety_emergency",
    });
    expect(result.safetyNotice).toMatch(/emergency services/i);
    expect(result.reply).toMatch(/emergency services/i);
  });
});
