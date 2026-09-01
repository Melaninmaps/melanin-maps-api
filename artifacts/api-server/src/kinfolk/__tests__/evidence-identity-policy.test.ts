import { afterEach, describe, expect, it, vi } from "vitest";
import { routeEvidence } from "../evidence-route";
import {
  extractExplicitPopulationWording,
  permittedIdentityContext,
} from "../permitted-identity-context";
import {
  buildDiasporaFirstQuery,
  buildDiasporaFirstResearchQuery,
  contextStorageDecision,
  enforceDiasporaFirstProviderQuery,
} from "../diasporaFirstResearchPolicy";
import { prepareKinfolkResearchPlan } from "../prepareResearchPlan";
import { buildHealthRetrievalContext, extractHealthTopic } from "../health-retrieval";
import { buildMemberProfile, buildSearchPlan } from "../lens-planner";
import {
  buildIntentPolicyPrompt,
  classifyCulturalClaimMode,
  getEvidencePolicy,
  getQueryClass,
} from "../intent-router";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("deterministic evidence route", () => {
  it("routes generic blood pressure as high-risk authoritative medical evidence", () => {
    const route = routeEvidence("What should I know about blood pressure?");

    expect(route).toMatchObject({
      domain: "medical_health",
      risk: "high",
      claimMode: "factual",
      retrievalRequirement: "authoritative",
      failClosed: true,
      visibleBoilerplate: null,
    });
    expect(route.allowedSources).toContain("official_public_source");
    expect(route.sourceGuidance).toMatch(/condition-first/i);
  });

  it("routes best rapper-turned-actor as evaluative culture with evidence and no boilerplate", () => {
    const route = routeEvidence("Who is the best rapper-turned-actor?");

    expect(route).toMatchObject({
      domain: "culture_entertainment",
      risk: "low",
      claimMode: "evaluative",
      retrievalRequirement: "authoritative",
      failClosed: true,
      visibleBoilerplate: null,
      accuratePublicFigureFactsAllowed: true,
    });
    expect(route.sourceGuidance).toMatch(/criteria|multiple defensible views/i);
    expect(getQueryClass("Who is the best rapper-turned-actor?")).toBe("culture_opinion");
  });

  it("routes factual rapper and actor credits as factual culture", () => {
    const route = routeEvidence("Which rapper became an actor in this film?");

    expect(route.domain).toBe("culture_entertainment");
    expect(route.claimMode).toBe("factual");
    expect(route.retrievalRequirement).toBe("authoritative");
    expect(route.accuratePublicFigureFactsAllowed).toBe(true);
    expect(getQueryClass("Which rapper became an actor in this film?")).toBe("named_entity");
  });

  it("requires live web for a current Sinners request while preserving the culture domain", () => {
    const route = routeEvidence("What is the latest news about Sinners?");

    expect(route.domain).toBe("culture_entertainment");
    expect(route.claimMode).toBe("factual");
    expect(route.risk).toBe("medium");
    expect(route.retrievalRequirement).toBe("web_required");
    expect(route.failClosed).toBe(true);
    expect(route.allowedSources).toContain("reputable_current_reporting");
  });

  it.each(["current", "recent", "latest", "today"])(
    "requires live web for the freshness term %s",
    (term) => {
      expect(routeEvidence(`${term} Sinners cast updates`).retrievalRequirement).toBe("web_required");
    },
  );
});

describe("cultural claim mode and inline provenance", () => {
  it.each([
    "best rapper-turned-actor",
    "greatest rapper turned actor",
    "my favorite actor",
    "most influential rapper in film",
    "compare Ice Cube and Queen Latifah as actors",
  ])("classifies evaluative wording: %s", (message) => {
    expect(classifyCulturalClaimMode(message)).toBe("evaluative");
  });

  it("keeps a factual rapper/actor question factual", () => {
    expect(classifyCulturalClaimMode("Which films did Ice Cube act in?")).toBe("factual");
  });

  it("has no mandatory inline cultural provenance sentence", () => {
    const policy = getEvidencePolicy("culture_entertainment");
    const prompt = buildIntentPolicyPrompt(policy);

    expect(policy.provenanceLabel).toBeNull();
    expect(prompt).toMatch(/state the criteria|multiple defensible views/i);
    expect(prompt).not.toContain("From cultural knowledge");
    expect(prompt).not.toContain("this reflects perspective, not a single fact");
    expect(prompt).not.toContain("PROVENANCE LABEL");
  });
});

describe("permitted current-turn identity context", () => {
  it("permits explicit Black woman wording only for this turn and never diagnosis or storage", () => {
    const context = permittedIdentityContext(
      "I'm a Black woman. What should I know about blood pressure?",
      {
        name: "Aisha Johnson",
        city: "Atlanta",
        countryOriginPreference: "Ghana",
        businessPreference: "Black-owned businesses",
        storedCulturalProfile: { diasporaCountries: ["Jamaica"] },
      },
    );

    expect(context).toMatchObject({
      demographic: "Black woman",
      demographicQualifier: "Black woman",
      requestedPopulation: "Black woman",
      communityLabel: "Black women",
      source: "explicit_current_turn",
      persist: false,
      persistence: "none",
      diagnosisAllowed: false,
      purposeConsentLedgerPresent: false,
    });
  });

  it("returns no demographic and neutral member language when the current turn is generic", () => {
    const context = permittedIdentityContext("What should I know about blood pressure?", {
      name: "Aisha Johnson",
      city: "Atlanta",
      countryOriginPreference: "Nigeria",
      businessPreference: "Black-owned restaurants",
      storedCulturalProfile: { culturalBackground: "African American" },
    });

    expect(context.demographic).toBeNull();
    expect(context.demographicQualifier).toBeNull();
    expect(context.requestedPopulation).toBeNull();
    expect(context.communityLabel).toBe("your community");
    expect(context.source).toBe("none");
  });

  it.each([
    ["My name is Aisha Johnson.", { name: "Aisha Johnson" }],
    ["I live in Atlanta.", { city: "Atlanta" }],
    ["Show me places from Ghana.", { countryOriginPreference: "Ghana" }],
    ["I prefer Black-owned businesses.", { businessPreference: "Black-owned" }],
    ["What should I know about blood pressure?", { storedCulturalProfile: { ethnicity: "Black" } }],
  ])("does not infer a demographic from %s", (turn, unsafeInputs) => {
    const context = permittedIdentityContext(turn, unsafeInputs);
    expect(context.demographicQualifier).toBeNull();
    expect(context.communityLabel).toBe("your community");
  });

  it("treats a population research request as group wording, not member identity", () => {
    const context = permittedIdentityContext("What does the evidence say about Black women and hypertension?");
    expect(context.demographic).toBeNull();
    expect(context.requestedPopulation).toBe("Black women");
    expect(context.demographicQualifier).toBe("Black women");
    expect(context.persist).toBe(false);
  });

  it("does not treat Black-owned preference wording as demographic context", () => {
    expect(extractExplicitPopulationWording("Find Black-owned restaurants near me")).toBeNull();
  });
});

describe("neutral research and health planning", () => {
  it("does not inject a universal demographic into generic provider queries", () => {
    expect(buildDiasporaFirstQuery({ question: "blood pressure" })).toBe("blood pressure");
    expect(enforceDiasporaFirstProviderQuery("  blood   pressure  ")).toBe("blood pressure");
    expect(buildDiasporaFirstResearchQuery("heart disease", "health", {
      subject: "me",
      memberContext: { rememberedAttributes: { ethnicity: "Black woman" } },
      temporaryAttributes: { population: "Black women" },
    })).toBe("heart disease");
  });

  it("keeps explicit current-turn population wording without double-prefixing", () => {
    expect(buildDiasporaFirstQuery({
      question: "Black women blood pressure evidence",
      requestedPopulation: "Black women",
      topic: "health",
    })).toBe("Black women blood pressure evidence");
  });

  it("never permits stored member memory without a purpose-consent ledger", () => {
    expect(contextStorageDecision({ subject: "me" })).toMatchObject({
      mayUseMemberMemory: false,
      persistSearchSubject: false,
      persistTemporaryAttributes: false,
      purposeConsentLedgerRequired: true,
    });
  });

  it("prepares a generic BP plan with no demographic leakage and neutral community language", () => {
    const plan = prepareKinfolkResearchPlan("blood pressure", {
      subject: "me",
      memberContext: { rememberedAttributes: { ethnicity: "Black woman" } },
    });

    expect(plan.researchQuery).toBe("blood pressure");
    expect(plan.demographicQualifier).toBeNull();
    expect(plan.communityLabel).toBe("your community");
    expect(plan.persistIdentityContext).toBe(false);
  });

  it("builds generic health search authority-first and ignores stored lens values", () => {
    const profile = buildMemberProfile({
      userId: "member-1",
      diasporaCountries: ["Black woman"],
      culturalBackground: "African American",
      preferredOwnershipTypes: ["Black-owned"],
    });
    const plan = buildSearchPlan("blood pressure", profile, {});

    expect(profile.active).toBe(false);
    expect(profile.lenses).toEqual([]);
    expect(plan.activeLenses).toEqual([]);
    expect(plan.queries[0]).toMatchObject({ role: "evidence" });
    expect(plan.queries[0].text).toMatch(/^blood pressure official clinical guidance$/i);
    expect(plan.queries.map((query) => query.text).join(" ")).not.toMatch(/Black|African American/i);
  });

  it("adds explicit Black woman population evidence only after the authoritative health track", () => {
    const profile = buildMemberProfile({ userId: "member-2" });
    const plan = buildSearchPlan(
      "I'm a Black woman asking about blood pressure",
      profile,
      {},
    );

    expect(plan.queries[0].role).toBe("evidence");
    expect(plan.queries[1]).toMatchObject({
      role: "community_primary",
      lensId: "explicit-current-turn",
    });
    expect(plan.queries[1].text).toContain("Black woman");
    expect(plan.queries[1].reason).toMatch(/group-level and non-diagnostic/i);
  });

  it("extracts generic BP condition-first without a demographic default", () => {
    expect(extractHealthTopic("What should I know about blood pressure?")).toBe(
      "hypertension high blood pressure",
    );
    expect(extractHealthTopic("I'm a Black woman. What about blood pressure?")).toBe(
      "hypertension high blood pressure Black woman",
    );
  });

  it("keeps generic health templates neutral and explicit population templates non-diagnostic", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("<nlmSearchResult></nlmSearchResult>", { status: 200 }),
    );

    const generic = await buildHealthRetrievalContext("blood pressure", "medical_health");
    const explicit = await buildHealthRetrievalContext(
      "I'm a Black woman asking about blood pressure",
      "medical_health",
    );

    expect(generic?.contextBlock).toContain("AUTHORITATIVE RETRIEVAL INCOMPLETE");
    expect(generic?.contextBlock).not.toMatch(/Black women|Black community/i);
    expect(generic?.contextBlock).toMatch(/Never diagnose the member/i);
    expect(explicit?.contextBlock).toContain('current turn names "Black woman"');
    expect(explicit?.contextBlock).toMatch(/group-level, non-diagnostic evidence/i);
  });
});
