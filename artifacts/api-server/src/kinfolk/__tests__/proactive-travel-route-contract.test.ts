import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const chatRoute = routeSource.slice(
  routeSource.indexOf('router.post("/kinfolk/chat"'),
  routeSource.indexOf('router.get("/kinfolk/business-action-plan'),
);

describe("proactive travel offer route boundary", () => {
  it("offers categories before any catalog, model, or itinerary work", () => {
    const offer = chatRoute.indexOf("inspectProactiveTravelSuggestion({");
    const classifier = chatRoute.indexOf("buildGenericAnswerRouteClassifierPrompt()");
    const catalogRead = chatRoute.indexOf("governedBusinessRepository.findDestinationCatalog");
    const providerCall = chatRoute.indexOf('chatStage = "provider_call"');
    const itinerary = chatRoute.indexOf("const deterministicTravelEligible =");

    expect(offer).toBeGreaterThan(-1);
    expect(offer).toBeLessThan(classifier);
    expect(offer).toBeLessThan(catalogRead);
    expect(offer).toBeLessThan(providerCall);
    expect(offer).toBeLessThan(itinerary);
  });

  it("keeps the offer response card-free, source-free, and outside private-memory writes", () => {
    const offer = chatRoute.indexOf("inspectProactiveTravelSuggestion({");
    const branch = chatRoute.slice(offer, offer + 2200);

    expect(branch).toContain("recommendations: null");
    expect(branch).toContain("itinerary: null");
    expect(branch).toContain("sources: []");
    expect(branch).toContain("allowBusinessCards: false");
    expect(branch).not.toContain("persistExplicitMemberMemory");
    expect(branch).not.toContain("persistDeterministicDiscoveryTurn");
  });
});
