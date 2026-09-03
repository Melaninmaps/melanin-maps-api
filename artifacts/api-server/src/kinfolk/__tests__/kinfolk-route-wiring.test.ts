import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { enforceKinfolkResponse } from "../four-purpose-enforcement";
import { getHeritageCity } from "../heritage-city-registry";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const chatRoute = routeSource.slice(
  routeSource.indexOf('router.post("/kinfolk/chat"'),
  routeSource.indexOf('router.get("/kinfolk/business-action-plan'),
);

describe("Kinfolk chat static wiring", () => {
  it("uses the governed public repository for every chat catalog and fallback read", () => {
    expect(chatRoute).toContain("resolveNamedBusinessTurn({");
    expect(chatRoute).toContain("repository: governedBusinessRepository");
    expect(chatRoute).toContain("governedBusinessRepository.findDestinationCatalog");
    expect(chatRoute).toContain("governedBusinessRepository.findWithinRadius");
    expect(chatRoute).toContain("governedBusinessRepository.findHomeFallback");
    expect(chatRoute).not.toMatch(/(?:FROM|JOIN)\s+(?:public\.)?businesses\s+b\b/i);
  });

  it("wires current-turn identity, evidence routing, strict parsing, and itinerary normalization", () => {
    expect(chatRoute).toContain("resolvePermittedIdentityContext(message)");
    expect(chatRoute).toContain("classifyEvidenceRoute(message)");
    expect(chatRoute).toContain("evidenceFailureReply({");
    expect(chatRoute).toContain("parseKinfolkModelPayload(rawContent)");
    expect(chatRoute).toContain("normalizeKinfolkItinerary({");
    expect(chatRoute).toContain("recommendations = enforced.recommendations");
    expect(chatRoute).toContain("if (travelPlanning) recommendations = null");
    expect(chatRoute).not.toContain("culturalLine = (prefs?.culturalInterests");
  });



  it("short-circuits category discovery before quota/model calls while preserving session context", () => {
    const deterministicStart = chatRoute.indexOf("await tryAnswerDeterministicBusinessDiscovery({");
    const quotaCheck = chatRoute.indexOf('chatStage = "quota_check"');
    const providerCall = chatRoute.indexOf('chatStage = "provider_call"');
    const helperStart = routeSource.indexOf("async function tryAnswerDeterministicBusinessDiscovery");
    const helperEnd = routeSource.indexOf('router.post("/kinfolk/chat"', helperStart);
    const helper = routeSource.slice(helperStart, helperEnd);

    expect(deterministicStart).toBeGreaterThan(-1);
    expect(deterministicStart).toBeLessThan(quotaCheck);
    expect(deterministicStart).toBeLessThan(providerCall);
    expect(helper).toContain("resolveTurnGeography(input.message, currentSession?.destination ?? null)");
    expect(helper).toContain('decision.route !== "business_discovery"');
    expect(helper).toContain('namedBusiness.state !== "not_named"');
    expect(helper).toContain("await discoverLocalBusinesses({");
    expect(helper).toContain("await persistDeterministicDiscoveryTurn({");
    expect(helper).toContain("input.res.status(200).json({");
    expect(helper).not.toContain("openai.chat.completions.create");
  });

  it("does not turn the platform mission or saved services into a member identity assumption", () => {
    expect(routeSource).toContain('use "your community" when relational community language is helpful');
    expect(routeSource).not.toContain("built for the Black community");
    expect(routeSource).not.toContain("I already lined up a Black barber");
    expect(routeSource).not.toContain("voluntary community profile (Black woman");
    expect(routeSource).not.toContain("From cultural knowledge — this reflects perspective, not a single fact");
  });

  it("ignores an invalid model destination before session persistence", () => {
    const proposedModelDestination = "Amina Restaurant";
    const validatedModelDestination = getHeritageCity(proposedModelDestination)?.city ?? null;

    expect(validatedModelDestination).toBeNull();
    expect(chatRoute).toContain("getHeritageCity(proposedModelDestination)?.city ?? null");
    expect(chatRoute).toContain("modelDestination: validatedModelDestination");
    expect(chatRoute).not.toContain("modelDestination: proposedModelDestination");
  });
});

describe("Kinfolk recommendation enforcement", () => {
  const canonicalCatalog = [{
    id: "amina-id",
    name: "AMINA",
    category: "Food",
    city: "Philadelphia",
    state: "PA",
    verified: true,
  }];

  it("always replaces null or missing model recommendations with null", () => {
    const enforced = enforceKinfolkResponse({
      reply: "A conversational answer.",
      modelRecommendations: null,
      catalog: canonicalCatalog,
      sources: [],
      libraryAction: null,
      intentClass: "general_knowledge",
    });

    expect(enforced.recommendations).toBeNull();
  });

  it("rejects a non-catalog venue and preserves only canonical businesses", () => {
    const enforced = enforceKinfolkResponse({
      reply: "Two proposed venues.",
      modelRecommendations: [
        { businessId: "invented", name: "Invented Cafe", city: "Philadelphia" },
        { businessId: "amina-id", name: "Renamed Amina", city: "Elsewhere" },
      ],
      catalog: canonicalCatalog,
      sources: [],
      libraryAction: null,
      intentClass: "business_discovery",
    });

    expect(enforced.rejectedRecommendations).toBe(1);
    expect(enforced.recommendations).toEqual({
      businesses: [{ ...canonicalCatalog[0], paidPlacement: false }],
    });
  });
});
