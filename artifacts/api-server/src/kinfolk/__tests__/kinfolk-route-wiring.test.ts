import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { enforceKinfolkResponse } from "../four-purpose-enforcement";
import { getHeritageCity } from "../heritage-city-registry";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const orchestratorSource = readFileSync(
  fileURLToPath(new URL("../contextual-research-orchestrator.ts", import.meta.url)),
  "utf8",
);
const governedDiscoveryV2Source = readFileSync(
  fileURLToPath(new URL("../governed-discovery-v2.ts", import.meta.url)),
  "utf8",
);
const citySafetyV1Source = readFileSync(
  fileURLToPath(new URL("../city-safety-briefing-v1.ts", import.meta.url)),
  "utf8",
);
const chatRoute = routeSource.slice(
  routeSource.indexOf('router.post("/kinfolk/chat"'),
  routeSource.indexOf('router.get("/kinfolk/business-action-plan'),
);

describe("Kinfolk chat static wiring", () => {
  it("keeps Support Lens response aliases canonical and mode-only updates persisted", () => {
    expect(routeSource).toContain("preferredOwnershipTypes: canonicalOwnershipTypes");
    expect(routeSource).toContain("ownershipTypes: canonicalOwnershipTypes");
    expect(routeSource).toContain("existingPreferences?.preferredOwnershipTypes");
    expect(routeSource).toContain("invalidatePrefsCache(req.user.id)");
  });

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
    expect(chatRoute).toContain("buildValidatedOrRankedItinerary({");
    expect(chatRoute).toContain("recommendations = enforced.recommendations");
    expect(chatRoute).toContain("if (travelPlanning) recommendations = null");
    expect(chatRoute).not.toContain("culturalLine = (prefs?.culturalInterests");
  });

  it("returns an immediate medical emergency response before memory, quota, research, or model work", () => {
    const emergencyResponse = chatRoute.indexOf(
      "immediateMedicalEmergencyReply(message)",
    );
    const memoryPersistence = chatRoute.indexOf("persistExplicitMemberMemory({");
    const genericClassifier = chatRoute.indexOf(
      "buildGenericAnswerRouteClassifierPrompt()",
    );

    expect(emergencyResponse).toBeGreaterThan(-1);
    expect(memoryPersistence).toBeGreaterThan(emergencyResponse);
    expect(genericClassifier).toBeGreaterThan(emergencyResponse);
    expect(chatRoute).toContain('intentClass: "safety_emergency"');
    expect(chatRoute).toContain('answerMode: "immediate_medical_emergency"');
  });

  it("uses one bounded generic answer route before contextual research and fails current turns closed without support", () => {
    const genericRoute = chatRoute.indexOf("buildGenericAnswerRouteClassifierPrompt()");
    const citedResearch = chatRoute.indexOf("const citedResearchRequired =");
    const contextualPlan = chatRoute.indexOf("let contextualPlan: SemanticTurnPlan | null = cityBriefingPlan");
    const evidenceGate = chatRoute.indexOf("const genericEvidenceOutcome = resolveKinfolkEvidenceOutcome({");

    expect(genericRoute).toBeGreaterThan(-1);
    expect(citedResearch).toBeGreaterThan(genericRoute);
    expect(contextualPlan).toBeGreaterThan(citedResearch);
    expect(evidenceGate).toBeGreaterThan(contextualPlan);
    expect(chatRoute).toContain("generalAnswerRoute.requiresCurrentEvidence");
    expect(chatRoute).toContain("TRUTHFUL_EVIDENCE_UNAVAILABLE_REPLY");
    expect(chatRoute).toContain("hasApprovedRelevantMemory: isPreferredNameRecallRequest(message)");
  });

  it("forces every semantic task mode with a current answer requirement through live evidence", () => {
    expect(chatRoute).toContain("if (generalAnswerRoute.requiresCurrentEvidence) {");
    expect(chatRoute).toContain('freshness: "current"');
    expect(chatRoute).toContain('evidenceNeeds: ["official_current", "reputable_reporting"]');
    expect(chatRoute).not.toContain(
      'generalAnswerRoute.requiresCurrentEvidence &&\n        contextualPlan.taskMode === "direct_answer"',
    );
  });

  it("keeps qualified care navigation outside the ordinary ownership-scoped business catalog", () => {
    const careOverride = chatRoute.indexOf("const healthCareOverride = buildHealthCareOverride");
    const catalogFilter = chatRoute.indexOf("businessCatalog = healthCareOverride.suppressesGeneralBusinessCatalog");
    const promptAssembly = chatRoute.indexOf("healthCareOverride.promptBlock || null");

    expect(careOverride).toBeGreaterThan(-1);
    expect(catalogFilter).toBeGreaterThan(careOverride);
    expect(promptAssembly).toBeGreaterThan(catalogFilter);
    expect(chatRoute).toContain("healthRetrievalSources.push(...healthCareOverride.sources)");
    expect(chatRoute).toContain("namedBusiness && !healthCareOverride.suppressesGeneralBusinessCatalog");
  });

  it("runs medical questions through authoritative retrieval before the Living Library shortcut", () => {
    expect(chatRoute).toContain('intentClass !== "medical_health"');
    expect(chatRoute).toContain("buildHealthRetrievalContext(");
  });

  it("keeps city-bearing health requests out of the ordinary discovery fast path", () => {
    const helperStart = routeSource.indexOf("async function tryAnswerDeterministicBusinessDiscovery");
    const helperEnd = routeSource.indexOf('router.post("/kinfolk/chat"', helperStart);
    const helper = routeSource.slice(helperStart, helperEnd);

    expect(helper).toContain("const fastPathEvidenceDomain = classifyEvidenceRoute(input.message)");
    expect(helper).toContain('fastPathEvidenceDomain === "medical_health"');
    expect(helper).toContain('fastPathEvidenceDomain === "safety_emergency"');
    expect(chatRoute).toContain("const highConsequenceEvidence =");
    expect(chatRoute).toContain("!highConsequenceEvidence");
  });

  it("passes an explicit article source into exact-source retrieval", () => {
    expect(chatRoute).toContain(
      "requestedArticleUrl: requestedArticleSummaryUrl(message)",
    );
    expect(routeSource).toContain("same-publisher or related-story substitute");
  });

  it("ranks the governed travel catalog with canonical age assurance and explicit preferences before prompting", () => {
    const ageContext = chatRoute.indexOf("await loadKinfolkMemberContext(req.user.id, intentClass, message)");
    const audienceFilter = chatRoute.indexOf("businessCatalog = rankGovernedBusinessesForMember(businessCatalog");
    const ownerContext = chatRoute.indexOf("let ownerBusinessContext");
    const travelCandidateMerge = chatRoute.search(/const favoriteMatches\s*=\s*await governedBusinessRepository\.findByPreferenceTerms\(/);
    const travelRanking = chatRoute.search(/businessCatalog\s*=\s*rankTravelCatalogForMember\(\{/);
    const promptBuild = chatRoute.indexOf("const baseSystemPrompt");
    const itinerarySelection = chatRoute.indexOf("buildValidatedOrRankedItinerary({");

    expect(ageContext).toBeGreaterThan(-1);
    expect(audienceFilter).toBeGreaterThan(ageContext);
    expect(audienceFilter).toBeLessThan(ownerContext);
    expect(travelCandidateMerge).toBeGreaterThan(ageContext);
    expect(travelCandidateMerge).toBeLessThan(travelRanking);
    expect(travelRanking).toBeGreaterThan(ageContext);
    expect(travelRanking).toBeLessThan(promptBuild);
    expect(travelRanking).toBeLessThan(itinerarySelection);
    expect(chatRoute).toContain("ageBand: effectiveAudienceBand");
    expect(chatRoute).toMatch(/audienceAllowsBusinessText\(\{\s*ageBand:\s*effectiveAudienceBand,\s*text:\s*message,?\s*\}\)/);
    expect(chatRoute).toContain("const directNameCatalog = namedBusiness");
    expect(chatRoute).toContain("subjectScopedCatalog.filter((business) => business.id !== namedBusiness.id)");
    expect(chatRoute).toContain("favoriteCategories: prefs?.favoriteCategories");
    expect(chatRoute).toContain("tripStyle: prefs?.tripStyle");
    expect(chatRoute).toContain("travelCompanion: prefs?.travelCompanion");
    expect(chatRoute).toContain("dietaryNotes: prefs?.dietaryNotes");
    expect(chatRoute).toContain("buildValidatedOrRankedItinerary({");
    expect(chatRoute).toContain("reply = buildValidatedItineraryReply(destination, itinerary)");
  });

  it("applies only explicit member preferences to ordinary catalog ranking without overriding the current request", () => {
    const catalogRanking = chatRoute.indexOf("businessCatalog = rankGovernedBusinessesForMember(businessCatalog");
    const promptBuild = chatRoute.indexOf("const baseSystemPrompt");

    expect(catalogRanking).toBeGreaterThan(-1);
    expect(catalogRanking).toBeLessThan(promptBuild);
    expect(chatRoute).toContain("const explicitBusinessPreferenceTerms = [");
    expect(chatRoute).toContain("...(prefs?.favoriteCategories ?? [])");
    expect(chatRoute).toContain("...(prefs?.lifestyleServices ?? [])");
    expect(chatRoute).toContain("...(prefs?.culturalInterests ?? [])");
    expect(chatRoute).toContain("priorityPreferenceTerms: priorityBusinessPreferenceTerms");
    expect(chatRoute).toContain("avoidTerms: prefs?.avoidCategories ?? []");
    expect(chatRoute).toContain("currentRequest: message");
  });

  it("returns a basic governed-catalog itinerary before any provider call", () => {
    const deterministicTravel = chatRoute.search(/const deterministicTravelEligible\s*=\s*travelPlanning/);
    const providerCall = chatRoute.indexOf('chatStage = "provider_call"');
    expect(deterministicTravel).toBeGreaterThan(-1);
    expect(deterministicTravel).toBeLessThan(providerCall);
    expect(chatRoute).toMatch(/const itinerary\s*=\s*buildRankedCatalogItinerary\(\{\s*message,\s*catalog: businessCatalog,?\s*\}\)/);
    expect(chatRoute).toContain("&& !contextualEvidence");
    expect(chatRoute).toContain("!requiresCurrentResearch(message)");
    expect(chatRoute).toContain("&& !sensitiveTopicDetected");
    expect(chatRoute).toContain("!bodyCircleId");
    expect(chatRoute).toContain("verifiedImageUrls.length === 0");
    expect(chatRoute).toContain('intentClass: "travel_planning"');
    expect(chatRoute).toContain("usedLiveWeb: false");
    expect(chatRoute).toContain('const detailUrl = `/businesses/${encodeURIComponent(business.id)}`');
    expect(chatRoute).toContain('label: "mwm_public_business"');
    expect(chatRoute).not.toContain('id: business.website!');
  });

  it("does not offer or build an itinerary outside an exact governed destination scope", () => {
    expect(chatRoute).toContain("const hasGovernedItineraryCoverage =");
    expect(chatRoute).toContain("Boolean(destinationScope) && businessCatalog.length > 0");
    expect(chatRoute).toContain("travelPlanning && hasGovernedItineraryCoverage && destination");
    expect(chatRoute).toContain("I won't swap in listings from another city.");
    expect(chatRoute).toContain("!hasGovernedItineraryCoverage && destination");
    expect(chatRoute).toContain("itiner(?:ary|aries)|plan(?:ning)?|trip|visit(?:ing)?");
    expect(chatRoute).toContain("may offer useful, general travel");
    expect(chatRoute).not.toContain("travel(?:ing)?|trip|visit(?:ing)?");
  });

  it("does not attach a local-directory coverage note to a general place answer", () => {
    expect(chatRoute).toContain("const usedLocalDirectoryContext =");
    expect(chatRoute).toContain("travelPlanning && hasGovernedItineraryCoverage");
    expect(chatRoute).toContain("destination && usedLocalDirectoryContext");
    expect(chatRoute).not.toMatch(
      /assembledSources\.length === 0 && destination\s*\? tourSiteBlock/,
    );
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
    expect(helper).toMatch(/resolveTurnGeography\(\s*input\.message,\s*input\.cityHint \?\? currentSession\?\.destination \?\? null,?\s*\)/);
    expect(helper).toContain('decision.route !== "business_discovery"');
    expect(helper).toContain('namedBusiness.state !== "not_named"');
    expect(helper).toContain("getMemberAgeBand(input.req.user!.id)");
    expect(helper).toContain("effectiveBusinessAudienceBand(");
    expect(helper).toContain("temporaryBusinessAudienceBand(input.message)");
    expect(helper).not.toContain("loadAdaptiveDeliveryProfile");
    expect(helper).toContain("await discoverLocalBusinesses({");
    expect(helper).toContain("priorityPreferenceTerms: [");
    expect(helper).toContain("...(prefs?.favoriteCategories ?? [])");
    expect(helper).toContain("await persistDeterministicDiscoveryTurn({");
    expect(helper).toContain("input.res.status(200).json({");
    expect(helper).not.toContain("openai.chat.completions.create");
  });

  it("reuses published Library knowledge before the model only for stable general questions", () => {
    const intentStart = chatRoute.indexOf("const intentClass: KinfolkIntent");
    const approvedLookup = chatRoute.indexOf("await findApprovedLibraryAnswer({");
    const semanticPlanner = chatRoute.indexOf("let contextualPlan: SemanticTurnPlan");
    const providerCall = chatRoute.indexOf('chatStage = "provider_call"');

    expect(intentStart).toBeGreaterThan(-1);
    expect(approvedLookup).toBeGreaterThan(intentStart);
    expect(approvedLookup).toBeLessThan(semanticPlanner);
    expect(approvedLookup).toBeLessThan(providerCall);
    expect(chatRoute).toMatch(/intentClass === "general_knowledge"\s*&&\s*!shouldResearchInLibrary\s*&&\s*decisionPlan\.kind !== "platform_policy"\s*&&\s*!namedBusiness/);
    expect(routeSource).toContain("requiresCurrentResearch,");
    expect(chatRoute).toMatch(/intentClass === "general_knowledge"\s*&&\s*requiresCurrentResearch\(researchContextMessage\)/);
    expect(chatRoute).toContain('answerMode: "approved_library"');
    expect(chatRoute).toContain("usedInternal: true");
    expect(chatRoute).toContain("usedLiveWeb: false");
    expect(chatRoute).toContain("await persistDeterministicDiscoveryTurn({");
  });

  it("routes a resolved before-you-go question through current news research even when semantic planning is off", () => {
    const cityBriefingPlan = chatRoute.indexOf("let cityBriefingPlan = isCityBriefingRequest(message, destination)");
    const contextualPlan = chatRoute.indexOf("let contextualPlan: SemanticTurnPlan | null = cityBriefingPlan");
    const semanticPlanner = chatRoute.indexOf("if (contextualResearchEnabled && !contextualPlan)");
    const researchExecution = chatRoute.indexOf("if (contextualPlan) {");

    expect(cityBriefingPlan).toBeGreaterThan(-1);
    expect(contextualPlan).toBeGreaterThan(cityBriefingPlan);
    expect(semanticPlanner).toBeGreaterThan(contextualPlan);
    expect(researchExecution).toBeGreaterThan(semanticPlanner);
    expect(chatRoute).toContain("timeoutMs: contextualResearchTimeoutMs(contextualPlan)");
    expect(orchestratorSource).toContain('if (plan.taskMode === "city_briefing") return 20_000');
    expect(chatRoute).toContain("I will not substitute a generic city description");
  });

  it("returns a linked official Minneapolis arrival recovery instead of source-less filler when broad reporting is insufficient", () => {
    expect(chatRoute).toContain("city_briefing_partial_official_recovery");
    expect(chatRoute).toContain("resolveAuthoritativeWeather(destination)");
    expect(chatRoute).toContain("currentCitySafetyBriefing({");
    expect(chatRoute).toContain("citySafetySourcesForResponse(arrivalSafety)");
    expect(chatRoute).toContain("arrival briefings do not introduce immigration context without an explicit");
    expect(chatRoute).not.toContain("• Immigration and civic context:");
    expect(chatRoute).toContain("not going to fill the gaps with generic travel advice");
  });

  it("routes plain-language city arrival questions through the reviewed official check before model prose", () => {
    expect(routeSource).toContain("const requestedCityBriefing = isCityBriefingRequest(input.message, location.city)");
    expect(routeSource).toContain("!requestsCurrentCitySafetyBriefing(input.message) && !requestedCityBriefing");
    expect(routeSource).toContain("resolveAuthoritativeWeather(`${location.city}, ${location.state}`)");
    expect(routeSource).toContain("For a visit to ${location.city}, here is the current arrival check I can verify from the linked public sources.");
    expect(routeSource).toContain("!requestsCurrentCityImmigrationContext(input.message)");
    expect(routeSource).not.toContain("• Immigration and civic context:");
  });

  it("uses bounded semantic city-readiness classification for natural arrival language without weakening deterministic routes", () => {
    const cityBriefingPlan = chatRoute.indexOf("let cityBriefingPlan = isCityBriefingRequest(message, destination)");
    const contextualPlan = chatRoute.indexOf("let contextualPlan: SemanticTurnPlan | null = cityBriefingPlan");

    expect(cityBriefingPlan).toBeGreaterThan(-1);
    expect(contextualPlan).toBeGreaterThan(cityBriefingPlan);
    expect(chatRoute).toContain("mayNeedSemanticCityReadiness({");
    expect(chatRoute).toContain("highConsequence: highConsequenceEvidence");
    expect(chatRoute).toContain("buildSemanticCityReadinessClassifierPrompt");
    expect(chatRoute).toContain("isSemanticCityReadinessDecision(semanticDecision)");
    expect(chatRoute).toContain("KINFOLK_CITY_READINESS_CLASSIFIER_UNAVAILABLE");
  });

  it("keeps the corrected strict directory path disabled until its exact release flag is enabled", () => {
    const helperStart = routeSource.indexOf("async function tryAnswerDeterministicBusinessDiscovery");
    const helperEnd = routeSource.indexOf('router.post("/kinfolk/chat"', helperStart);
    const helper = routeSource.slice(helperStart, helperEnd);

    expect(routeSource).toContain("isGovernedDiscoveryV2Enabled");
    expect(governedDiscoveryV2Source).toContain("KINFOLK_GOVERNED_DISCOVERY_V2_ENABLED");
    expect(helper).toContain("strictGovernedDiscoveryV2");
    expect(helper).toContain("strictEvidenceRequired: strictSourceBackedDiscovery");
    expect(helper).toContain("GOVERNED_DISCOVERY_V2_RADIUS_REPLY");
    expect(helper).toContain("isVerifiedRadiusV1Enabled()");
    expect(helper).toContain("resolveVerifiedPublicOrigin");
    expect(helper).toContain("verifiedRadius: verifiedRadius ?? undefined");
    expect(helper).toContain("radiusVerification: \"unavailable_without_verified_public_origin\"");
    expect(helper).toContain("verified_public_origin_straight_line");
    expect(helper).toContain("I won't guess at ownership or quietly swap in a listing outside your focus.");
  });

  it("does not omit a requested current-safety concern from a strict directory reply", () => {
    const helperStart = routeSource.indexOf("async function tryAnswerDeterministicBusinessDiscovery");
    const helperEnd = routeSource.indexOf('router.post("/kinfolk/chat"', helperStart);
    const helper = routeSource.slice(helperStart, helperEnd);

    expect(helper).toContain("requestsCurrentLocalSafetyContext(input.message)");
    expect(helper).toContain("governedDirectorySafetyLimit(scope.city)");
    expect(helper).toContain("strictSafetyLimit");
  });

  it("keeps food-allergy requests in discovery without treating a listing as allergy-safety evidence", () => {
    const helperStart = routeSource.indexOf("async function tryAnswerDeterministicBusinessDiscovery");
    const helperEnd = routeSource.indexOf('router.post("/kinfolk/chat"', helperStart);
    const helper = routeSource.slice(helperStart, helperEnd);

    expect(helper).toContain("allergySafetyCaveat");
    expect(helper).toContain("cannot verify allergen handling or cross-contact");
    expect(helper).toContain("call the business directly");
    expect(helper).toContain("shellfish or allergy need");
  });

  it("keeps staff audit isolation server-authorized and independent of New Chat", () => {
    expect(routeSource).toContain("resolveKinfolkStaffAuditPolicy");
    expect(routeSource).toContain("requested: requestedStaffAudit");
    expect(routeSource).toContain("administrator: isAdmin(req)");
    expect(routeSource).toContain('res.status(403).json({ error: "Staff audit access is required." })');
    expect(routeSource).toContain("if (!staffAuditPolicy)");
    expect(routeSource).toContain("let resolvedMemoryEnabled = false;");
    expect(routeSource).toContain("conversationContext: staffAuditPolicy ? undefined : conversationContext");
    expect(routeSource).toContain("signalRepository: input.staffAudit ? undefined : discoverySignalRepository");
    expect(routeSource).toContain("!memoryEnabled && !staffAuditPolicy");
    expect(routeSource).toContain("!staffAuditPolicy");
    expect(routeSource).not.toContain("New Chat is an audit control");
  });

  it("keeps ordinary draft, revision, career, reminder, and direct-time requests out of generic research fallback", () => {
    const timeAnswer = chatRoute.indexOf("const directLocalTimeReply =");
    const currentFallback = chatRoute.indexOf("contextualEvidenceNeedsFailClosedResponse(");

    expect(chatRoute).toContain("isKinfolkOrdinaryAssistantRequest(message)");
    expect(chatRoute).toContain("!ordinaryAssistantRequest &&");
    expect(chatRoute).toContain("isKinfolkReminderRequest(message)");
    expect(chatRoute).toContain("boundedEphemeralConversation(conversationContext)");
    expect(chatRoute).toContain("reminder_audit_unavailable");
    expect(timeAnswer).toBeGreaterThan(-1);
    expect(timeAnswer).toBeLessThan(currentFallback);
    expect(routeSource).toContain("answerDirectKinfolkLocalTime");
  });

  it("uses count-only radius tracing and governed deterministic repairs", () => {
    expect(routeSource).toContain("radiusTraceRequestId: verifiedRadius ? crypto.randomUUID() : undefined");
    expect(routeSource).toContain("isKinfolkRaisePreparationRequest(message)");
    expect(routeSource).toContain("renderKinfolkRaisePreparation(");
    expect(routeSource).toContain('answerMode: "career_coaching"');
    expect(routeSource).toContain("const queueConversationKey = sessionId");
    expect(routeSource).toContain("queueConversationKey,");
    expect(routeSource).toContain("Kinfolk is temporarily busy. Please retry this question");
  });

  it("keeps current city-safety evidence separately gated from directory cards", () => {
    const helperStart = routeSource.indexOf("async function tryAnswerDeterministicBusinessDiscovery");
    const helperEnd = routeSource.indexOf('router.post("/kinfolk/chat"', helperStart);
    const helper = routeSource.slice(helperStart, helperEnd);

    expect(citySafetyV1Source).toContain("CITY_SAFETY_BRIEFING_V1");
    expect(helper).toContain("isCitySafetyBriefingV1Enabled()");
    expect(helper).toContain("currentCitySafetyBriefing");
    expect(helper).toContain("Business-directory and city-safety sources are separate.");
    expect(helper).toContain("input.staffAudit ? undefined : pool");
  });

  it("answers an explicit city safety or transit question before business discovery and never returns a directory card", () => {
    const directSafety = routeSource.indexOf("async function tryAnswerCurrentCitySafetyBriefing");
    const safetyInvocation = chatRoute.indexOf("await tryAnswerCurrentCitySafetyBriefing({");
    const discoveryInvocation = chatRoute.indexOf("await tryAnswerDeterministicBusinessDiscovery({");

    expect(directSafety).toBeGreaterThan(-1);
    expect(routeSource).toContain("requestsCurrentCitySafetyBriefing(input.message)");
    expect(routeSource).toContain("renderDirectCitySafetyBriefing(location.city, briefing)");
    expect(routeSource).toContain('answerMode: requestedCityBriefing ? "official_city_arrival" : "official_city_safety"');
    expect(routeSource).toContain("recommendations: null");
    expect(routeSource).toContain("resultView: null");
    expect(safetyInvocation).toBeGreaterThan(-1);
    expect(safetyInvocation).toBeLessThan(discoveryInvocation);
  });

  it("keeps documentary taxonomy tags separately gated from ownership evidence", () => {
    const helperStart = routeSource.indexOf("async function tryAnswerDeterministicBusinessDiscovery");
    const helperEnd = routeSource.indexOf('router.post("/kinfolk/chat"', helperStart);
    const helper = routeSource.slice(helperStart, helperEnd);

    expect(routeSource).toContain("isDirectoryTaxonomyV2Enabled");
    expect(helper).toContain("documentedSourceTaxonomy");
    expect(helper).toContain("strictSourceBackedDiscovery && isDirectoryTaxonomyV2Enabled()");
  });

  it("keeps city briefing sources out of prior-city resolver context", () => {
    expect(chatRoute).toContain("!isCurrentCityBriefing");
    expect(chatRoute).toContain("contextResolution.sources.map((source) => source.url)");
    expect(chatRoute).toContain("contextResolution.sources.map((s) => ({");
    expect(orchestratorSource).toContain("cityBriefingScopeMatches");
  });

  it("routes a current question through cited research even when optional contextual intelligence is off", () => {
    expect(chatRoute).toContain("const citedResearchRequired =");
    expect(chatRoute).toContain("requiresCurrentResearch(researchContextMessage)");
    expect(chatRoute).toContain("let contextualResearchEnabled = contextualIntelligenceEnabled");
    expect(chatRoute).toContain("contextualResearchEnabled =\n      contextualIntelligenceEnabled || citedResearchRequired");
    expect(chatRoute).toContain("if (contextualResearchEnabled && !contextualPlan)");
    expect(chatRoute).toContain("!contextualResearchEnabled");
    expect(chatRoute).toContain('intentClass === "general_knowledge" &&\n        requiresCurrentResearch(researchContextMessage)');
    expect(chatRoute).toContain("!shouldResearchInLibrary");
    expect(routeSource).toContain("buildCurrentEvidenceSourceContext");
  });

  it("answers live weather from a server-owned source before generic current-research gating", () => {
    const weatherShortCircuit = chatRoute.indexOf("await tryAnswerAuthoritativeWeather({");
    const citedResearch = chatRoute.indexOf("const citedResearchRequired =");

    expect(weatherShortCircuit).toBeGreaterThan(-1);
    expect(citedResearch).toBeGreaterThan(weatherShortCircuit);
    expect(routeSource).toContain("resolveAuthoritativeWeather");
    expect(routeSource).toContain("Live weather is supplied directly by Open-Meteo");
    expect(routeSource).toContain('answerMode: "authoritative_weather"');
  });

  it("answers a direct calendar question before weather or live-research fallback", () => {
    const calendarAnswer = chatRoute.indexOf("const directCalendarDateReply = answerDirectKinfolkCalendarDate({");
    const weatherShortCircuit = chatRoute.indexOf("await tryAnswerAuthoritativeWeather({");
    const citedResearch = chatRoute.indexOf("const citedResearchRequired =");

    expect(routeSource).toContain('import { answerDirectKinfolkCalendarDate } from "../kinfolk/direct-calendar-answer";');
    expect(chatRoute).toContain("clientTimeZone,");
    expect(calendarAnswer).toBeGreaterThan(-1);
    expect(calendarAnswer).toBeLessThan(weatherShortCircuit);
    expect(calendarAnswer).toBeLessThan(citedResearch);
    expect(chatRoute).toContain('answerMode: "direct_calendar_date"');
  });

  it("uses the reviewed city-arrival shortcut rather than generic model prose for a whole arrival briefing", () => {
    expect(routeSource).toContain("A broad \"before I go\" request may include weather");
    expect(routeSource).toContain("if (isCityBriefingRequest(input.message, currentTurnCity)) return false;");
    expect(chatRoute).toContain("await tryAnswerCurrentCitySafetyBriefing({");
    expect(routeSource).toContain("const requestedCityBriefing = isCityBriefingRequest(input.message, location.city)");
  });

  it("uses the bounded source-seeking ancient Mediterranean follow-up only for the supplied cultural case", () => {
    expect(routeSource).toContain("buildKinfolkCulturalLearningOpportunity");
    expect(chatRoute).toContain("const culturalLearningOpportunity =");
    expect(chatRoute).toContain("culturalLearningOpportunity.promptBlock");
    expect(chatRoute).toContain("culturalLearningOpportunity.followUpSuggestion");
    expect(chatRoute).toContain("!contextualEvidence.degraded");
  });

  it("does not replace a current city briefing or any generic current-evidence turn with a catalog itinerary", () => {
    expect(chatRoute).toContain('const isCurrentCityBriefing = contextualPlan?.taskMode === "city_briefing"');
    expect(chatRoute).toMatch(
      /const travelPlanning\s*=\s*!isCurrentCityBriefing\s*&&\s*!generalAnswerRoute\.requiresCurrentEvidence\s*&&\s*\(isTravelPlanningPrompt\(message\)\s*\|\|\s*earlyDecision\.route === "travel_planning"\);/,
    );
  });

  it("does not turn the platform mission or saved services into a member identity assumption", () => {
    expect(routeSource).toContain('use "your community" when relational community language is helpful');
    expect(routeSource).not.toContain("built for the Black community");
    expect(routeSource).not.toContain("I already lined up a Black barber");
    expect(routeSource).not.toContain("voluntary community profile (Black woman");
    expect(routeSource).not.toContain("From cultural knowledge — this reflects perspective, not a single fact");
  });

  it("uses a member correction only inside the active conversation prompt", () => {
    const sessionRead = chatRoute.indexOf('chatStage = "session_read"');
    const correctionInstruction = chatRoute.indexOf("buildKinfolkCurrentTurnCorrectionInstruction({");
    const systemPrompt = chatRoute.indexOf("const systemPrompt =");

    expect(correctionInstruction).toBeGreaterThan(sessionRead);
    expect(correctionInstruction).toBeLessThan(systemPrompt);
    expect(chatRoute).toContain("history: existingMessages");
    expect(chatRoute).toContain("currentTurnCorrectionInstruction");
  });

  it("keeps a remembered destination out of unrelated current-turn answers and uses destination-local time", () => {
    expect(routeSource).toContain("async function resolveDestinationLocalTimeContext");
    expect(routeSource).toContain("SERVER-RESOLVED LOCAL TIME — AUTHORITATIVE FOR LOCATION FEATURES:");
    expect(routeSource).toContain("currentRequestUsesLocation");
    expect(chatRoute).toContain("const promptDestination = currentRequestUsesLocation ? destination : null");
    expect(chatRoute).toContain("await resolveDestinationLocalTimeContext(promptDestination)");
    expect(chatRoute).toContain("destination: promptDestination");
    expect(chatRoute).toContain("destinationLocalTimeContext");
    expect(routeSource).toContain("CURRENT-TURN PRIORITY — NON-NEGOTIABLE");
    expect(routeSource).toContain("ON-SCREEN FORMAT: Return plain text");
  });

  it("injects one server-resolved temporal contract into both full and lean Kinfolk responses", () => {
    expect(routeSource).toContain('import { buildKinfolkTemporalContext } from "../kinfolk/temporal-context";');
    expect(chatRoute).toContain("const temporalContext = buildKinfolkTemporalContext({");
    expect(chatRoute).toContain("clientTimeZone,");
    expect(chatRoute).toContain("destinationLocalTimeContext,");
    expect(chatRoute).toContain("`\\n\\n${temporalContext}`");
    expect(chatRoute).toContain("${buildLeanGeneralChatPrompt(conversationVoiceMode)}\\n\\n${temporalContext}");
  });

  it("uses the shared natural-conversation contract in the full Kinfolk prompt", () => {
    expect(routeSource).toContain("buildKinfolkNaturalConversationContract,");
    expect(routeSource).toContain("const naturalConversationContract = buildKinfolkNaturalConversationContract();");
    expect(routeSource).toContain("${naturalConversationContract}");
  });

  it("keeps promotion-versus-community policy questions out of the business catalog and card prompt", () => {
    expect(chatRoute).toContain('"platform_policy_question_routes_to_general_knowledge"');
    expect(chatRoute).toContain("PLATFORM-POLICY QUESTION — NOT A DIRECTORY SEARCH:");
    expect(chatRoute).toContain("Do not return business cards, listings, or an itinerary.");
    expect(chatRoute).toContain("businessCatalog = [];");
    expect(chatRoute).toContain("catalogSource = \"none\";");
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
      allowBusinessCards: false,
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
      allowBusinessCards: true,
    });

    expect(enforced.rejectedRecommendations).toBe(1);
    expect(enforced.recommendations).toEqual({
      businesses: [{ ...canonicalCatalog[0], paidPlacement: false }],
    });
  });
});
