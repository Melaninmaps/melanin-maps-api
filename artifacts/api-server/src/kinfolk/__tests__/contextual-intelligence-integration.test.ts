import { describe, expect, it, vi } from "vitest";
import type { LibraryRepository } from "../../library/types";
import {
  bindContextualLinksToEvidence,
  parseKinfolkMediaLinks,
  parseKinfolkRelatedConnections,
  parseKinfolkStructuredContent,
} from "../contextual-answer-contract";
import { mayUseContextualIntelligence } from "../contextual-intelligence-mode";
import { retrieveApprovedInternalLibrary } from "../contextual-internal-retrieval";
import {
  orchestrateContextualResearch,
  type ContextualEvidenceItem,
} from "../contextual-research-orchestrator";
import { routeEvidence } from "../evidence-route";
import { planSemanticTurn, type SemanticTurnPlan } from "../semantic-turn-planner";

const NOW = "2025-06-01T12:00:00.000Z";

function evidence(
  title: string,
  url: string,
  kind: ContextualEvidenceItem["kind"],
  excerpt: string,
  publishedAt: string | null = "2025-05-30T00:00:00.000Z",
): ContextualEvidenceItem {
  return {
    title,
    url,
    publisher: new URL(url).hostname,
    kind,
    excerpt,
    publishedAt,
    retrievedAt: NOW,
    supports: [excerpt],
    creatorVerified: kind === "creator" ? true : undefined,
  };
}

type FixturePayload = {
  reply: string;
  structuredContent?: unknown;
  mediaLinks?: unknown;
  relatedConnections?: unknown;
  followUpSuggestions?: string[];
  libraryAction?: { type: string; topicId: string; topicName: string } | null;
};

async function contextualTurn(input: {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  classify?: Parameters<typeof planSemanticTurn>[0]["classify"];
  internal?: ContextualEvidenceItem[];
  external?: ContextualEvidenceItem[];
  synthesize: (plan: SemanticTurnPlan, allEvidence: ContextualEvidenceItem[]) => FixturePayload;
}) {
  if (!mayUseContextualIntelligence({
    mode: "staff",
    authenticated: true,
    administrator: false,
    activeTester: true,
  })) throw new Error("fixture staff member unexpectedly ineligible");

  const plan = await planSemanticTurn({
    message: input.message,
    history: input.history,
    evidenceRoute: routeEvidence(input.message),
    classify: input.classify,
  });
  if (plan.needsClarification) {
    return {
      reply: plan.clarificationQuestion ?? "Which one do you mean?",
      sources: [] as Array<{ title: string; url: string }>,
      followUpSuggestions: [] as string[],
      libraryAction: null,
      recommendations: null,
      answerMode: "clarification",
      structuredContent: null,
      mediaLinks: [],
      relatedConnections: [],
      researchStatus: { usedInternal: false, usedLiveWeb: false, degraded: false, asOf: NOW },
      plan,
    };
  }

  const bundle = await orchestrateContextualResearch(plan, {
    searchInternal: async () => input.internal ?? [],
    searchLive: async () => input.external ?? [],
    now: () => NOW,
  });
  const allEvidence = [...bundle.internal, ...bundle.external, ...bundle.media];
  const payload = input.synthesize(plan, allEvidence);
  const bound = bindContextualLinksToEvidence({
    structuredContent: parseKinfolkStructuredContent(payload.structuredContent),
    mediaLinks: parseKinfolkMediaLinks(payload.mediaLinks),
    relatedConnections: parseKinfolkRelatedConnections(payload.relatedConnections),
    evidenceUrls: allEvidence.map((item) => item.url),
    mediaEvidence: bundle.media,
    libraryPaths: bundle.internal.flatMap((item) => item.libraryPath ? [item.libraryPath] : []),
  });
  return {
    reply: payload.reply,
    sources: allEvidence.map(({ title, url }) => ({ title, url })),
    followUpSuggestions: payload.followUpSuggestions ?? [],
    libraryAction: payload.libraryAction ?? null,
    recommendations: null,
    answerMode: plan.taskMode,
    ...bound,
    researchStatus: {
      usedInternal: bundle.internal.length > 0,
      usedLiveWeb: bundle.external.length + bundle.media.length > 0,
      degraded: bundle.degraded,
      asOf: NOW,
    },
    plan,
  };
}

describe("contextual intelligence behavior integration", () => {
  it("returns practical ingredient options and only evidence-bound creator media", async () => {
    const creator = evidence(
      "Three braising methods",
      "https://youtube.com/shorts/fixture",
      "creator",
      "Verified creator demonstrates braising.",
    );
    const result = await contextualTurn({
      message: "How do I cook beef?",
      external: [creator],
      synthesize: (plan, items) => {
        expect(plan.taskMode).toBe("recipe_options");
        expect(items).toContainEqual(expect.objectContaining({ url: creator.url }));
        return {
          reply: "Here are several practical directions. Which cut and how much time do you have?",
          structuredContent: {
            kind: "recipe_options",
            options: [
              { title: "Quick sear", description: "Sear a tender cut.", keyIngredients: ["beef", "salt", "oil"], timeLabel: "20 minutes" },
              { title: "Slow braise", description: "Cook a tougher cut gently.", keyIngredients: ["beef", "stock", "onion"], timeLabel: "3 hours" },
              { title: "Stir-fry", description: "Slice thinly and cook fast.", keyIngredients: ["beef", "vegetables", "sauce"], timeLabel: "30 minutes" },
            ],
          },
          mediaLinks: [
            { title: creator.title, creator: creator.publisher, platform: "YouTube", url: creator.url, reason: "Shows a supported method" },
            { title: "Made up video", creator: "Nobody", platform: "YouTube", url: "https://youtube.com/watch?v=made-up", reason: "Unsupported" },
          ],
          followUpSuggestions: ["Tell me the cut", "Choose a cooking time"],
        };
      },
    });
    expect(result.structuredContent).toMatchObject({ kind: "recipe_options" });
    expect(result.mediaLinks).toHaveLength(1);
    expect(result.reply).toMatch(/cut.*time/i);
    expect(result.sources).toEqual([{ title: creator.title, url: creator.url }]);
  });

  it("returns complete pot-roast structure, safety context, and no businesses", async () => {
    const safety = evidence(
      "Safe minimum internal temperatures",
      "https://foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures",
      "official",
      "Authoritative temperature and rest-time guidance.",
    );
    const result = await contextualTurn({
      message: "How do I make pot roast?",
      external: [safety],
      synthesize: (plan) => {
        expect(plan.taskMode).toBe("recipe_instructions");
        return {
          reply: "Brown, braise, and rest the roast; use a thermometer for safety.",
          structuredContent: {
            kind: "recipe_instructions",
            title: "Fixture pot roast",
            ingredients: ["chuck roast", "onion", "carrots", "stock"],
            steps: ["Brown the roast.", "Braise covered at 325°F for about 3–4 hours.", "Check tenderness and temperature.", "Rest before serving."],
            foodSafety: ["Follow the cited official temperature and rest guidance."],
          },
        };
      },
    });
    expect(result.structuredContent).toMatchObject({
      kind: "recipe_instructions",
      ingredients: expect.arrayContaining(["chuck roast"]),
      steps: expect.arrayContaining([expect.stringMatching(/325°F.*3–4 hours/)]),
      foodSafety: [expect.stringMatching(/temperature/i)],
    });
    expect(result.recommendations).toBeNull();
    expect(result.sources[0].url).toBe(safety.url);
  });

  it("clarifies an underspecified conflict, then switches cleanly to cooking", async () => {
    const classify = vi.fn().mockResolvedValue({
      confidence: 0.42,
      candidateMeanings: [
        { label: "an earlier music conflict", domain: "culture", confidence: 0.42 },
        { label: "a recent music conflict", domain: "culture", confidence: 0.4 },
        { label: "a historical dispute", domain: "history", confidence: 0.25 },
      ],
      clarificationQuestion: "Which conflict or era do you mean?",
    });
    const first = await contextualTurn({
      message: "Who won the beef?",
      classify,
      synthesize: () => { throw new Error("must clarify before synthesis"); },
    });
    expect(first.plan.candidateMeanings).toHaveLength(3);
    expect(first).toMatchObject({ answerMode: "clarification", reply: "Which conflict or era do you mean?" });
    expect(classify).toHaveBeenCalledTimes(1);

    const second = await contextualTurn({
      message: "Give me a pot roast recipe",
      history: [
        { role: "user", content: "Who won the beef?" },
        { role: "assistant", content: first.reply },
      ],
      synthesize: (plan) => {
        expect(plan.taskMode).toBe("recipe_instructions");
        return {
          reply: "Here is the cooking method.",
          structuredContent: { kind: "recipe_instructions", title: "Pot roast", ingredients: ["roast"], steps: ["Braise."], foodSafety: [] },
        };
      },
    });
    expect(second.answerMode).toBe("recipe_instructions");
  });

  it("separates dated measurable reception from a named-conflict consensus judgment", async () => {
    const chart = evidence("Official chart history", "https://charts.example/official-history", "official", "Dated chart positions.");
    const criticism = evidence("Critical retrospective", "https://criticism.example/retrospective", "criticism", "Critics explain their judgments.");
    const result = await contextualTurn({
      message: "Who won the Kendrick and Drake beef?",
      external: [chart, criticism],
      synthesize: (_plan, items) => {
        expect(new Set(items.map((item) => item.kind))).toEqual(new Set(["official", "criticism"]));
        return {
          reply: "On the declared reception and critical-response criteria, the evidence leans one way, but that is a judgment rather than objective fact.",
          structuredContent: {
            kind: "cultural_consensus",
            subject: "Kendrick Lamar and Drake conflict",
            conclusion: "The fixture evidence supports a critical consensus, not an objective winner.",
            criteria: ["dated measurable reception", "established criticism"],
            evidenceFor: ["Official chart history is reported separately from criticism."],
            otherDefensibleViews: ["Listeners can weigh lyrical technique or catalog impact differently."],
            asOf: NOW,
          },
        };
      },
    });
    expect(result.structuredContent).toMatchObject({
      kind: "cultural_consensus",
      criteria: expect.arrayContaining(["dated measurable reception"]),
      otherDefensibleViews: expect.any(Array),
      asOf: NOW,
    });
    expect(result.sources).toHaveLength(2);
  });

  it("uses declared rubrics for evaluative music and diaspora-editorial acting scopes without identity inference", async () => {
    const musicSources = [
      evidence("Recorded work archive", "https://archive.example/recorded-work", "primary", "Primary recording context."),
      evidence("Regional critical histories", "https://criticism.example/regional-histories", "criticism", "East Coast and West Coast critical perspectives."),
    ];
    const music = await contextualTurn({
      message: "What is the best diss song of all time?",
      external: musicSources,
      synthesize: (plan) => {
        expect(plan.answerPerspective).toBe("evaluative");
        return {
          reply: "Using writing, performance, impact, and response as the rubric, here are defensible perspectives.",
          structuredContent: {
            kind: "ranked_perspectives",
            criteria: ["writing", "performance", "documented impact"],
            entries: [
              { name: "Fixture selection", reason: "Strong across the rubric.", evidenceSummary: "Supported by the primary work and criticism." },
              { name: "East Coast alternative", reason: "A regional canon differs.", evidenceSummary: "Supported by regional criticism." },
              { name: "West Coast alternative", reason: "A regional canon differs.", evidenceSummary: "Supported by regional criticism." },
            ],
          },
        };
      },
    });
    expect(music.structuredContent).toMatchObject({ kind: "ranked_perspectives", criteria: expect.any(Array) });
    expect(music.reply).not.toMatch(/\b(streams?|awards?|chart position)\b/i);

    const acting = await contextualTurn({
      message: "Who are the best actresses?",
      external: [
        evidence("Angela Bassett official biography", "https://academy.example/angela-bassett", "official", "Career and awards record."),
        evidence("Viola Davis official biography", "https://academy.example/viola-davis", "official", "Career and awards record."),
      ],
      synthesize: (plan) => {
        expect(plan.identityContextUsed).toEqual([]);
        return {
          reply: "Kinfolk’s diaspora-centered editorial scope highlights supported figures first; it does not imply anything about your identity, and I can also give a broader all-industry list.",
          structuredContent: {
            kind: "ranked_perspectives",
            criteria: ["craft", "range", "sustained body of work"],
            entries: [
              { name: "Angela Bassett", reason: "Sustained acclaimed work.", evidenceSummary: "Supported by the official biography." },
              { name: "Viola Davis", reason: "Range across stage and screen.", evidenceSummary: "Supported by the official biography." },
            ],
          },
        };
      },
    });
    expect(acting.reply).toMatch(/diaspora-centered editorial scope/i);
    expect(acting.reply).toMatch(/broader all-industry/i);
    expect(acting.plan.identityContextUsed).toEqual([]);
  });

  it("explores a named public entity through source-backed Library pathways", async () => {
    const biography = evidence("Jay-Z primary biography", "https://artist.example/jay-z", "primary", "Works and career history.");
    const library = {
      ...evidence("Published hip-hop topic", "https://library.example/topics/hip-hop", "library_published", "Published Library context."),
      libraryPath: "/library/topics/hip-hop",
    };
    const result = await contextualTurn({
      message: "Jay-Z",
      internal: [library],
      external: [biography],
      synthesize: (plan) => {
        expect(plan).toMatchObject({ taskMode: "entity_explorer", resolvedMeaning: "Jay-Z", needsClarification: false });
        return {
          reply: "A concise, source-backed overview of the public artist and business figure.",
          structuredContent: {
            kind: "entity_explorer",
            canonicalName: "Jay-Z",
            overview: "A public artist, songwriter, and business figure.",
            pathways: [
              { label: "Works", description: "Explore recordings.", libraryHref: "/library/topics/hip-hop" },
              { label: "Storytelling and lyrics", description: "Explore writing.", libraryHref: "/library/topics/hip-hop" },
              { label: "Influence", description: "Review supported cultural history.", libraryHref: "/library/topics/hip-hop" },
              { label: "Business history", description: "Review sourced ventures.", libraryHref: "/library/topics/hip-hop" },
              { label: "Related content", description: "Open the published topic.", libraryHref: "/library/topics/hip-hop" },
            ],
          },
          relatedConnections: [
            { title: "Published hip-hop topic", relationship: "Library topic", reason: "Published related context", href: "/library/topics/hip-hop", evidenceUrl: library.url },
            { title: "Unsupported local artist", relationship: "Influence", reason: "Genre alone", href: null, evidenceUrl: "https://invented.example/claim" },
          ],
          libraryAction: { type: "open_topic", topicId: "hip-hop", topicName: "Hip-hop" },
        };
      },
    });
    expect(result.relatedConnections).toHaveLength(1);
    expect(result.libraryAction).toEqual({ type: "open_topic", topicId: "hip-hop", topicName: "Hip-hop" });
    expect(result.researchStatus.usedInternal).toBe(true);
  });

  it("keeps medical evidence authoritative and the disclaimer at the bottom", async () => {
    const cdc = evidence("CDC blood pressure guidance", "https://cdc.gov/high-blood-pressure/about/index.html", "official", "Adult blood-pressure categories.");
    const anecdote = evidence("Community discussion", "https://forum.example/blood-pressure", "community_discourse", "Anecdotal claims.");
    const result = await contextualTurn({
      message: "What should normal blood pressure be for my age?",
      external: [cdc, anecdote],
      synthesize: (plan, items) => {
        expect(plan).toMatchObject({ taskMode: "high_consequence", primaryDomain: "medical_health", identityContextUsed: [] });
        const authoritative = items.filter((item) => ["official", "research"].includes(item.kind));
        expect(authoritative).toEqual([cdc]);
        return {
          reply: "Guidance varies by age range and clinical context. What age range do you mean?\n\nThis is general health information, not medical advice.",
        };
      },
    });
    expect(result.reply).toMatch(/age range/i);
    expect(result.reply.endsWith("This is general health information, not medical advice.")).toBe(true);
    expect(result.plan.identityContextUsed).toEqual([]);
  });

  it("degrades on provider failure without inventing a current metric", async () => {
    const stable = evidence("Artist catalog", "https://artist.example/catalog", "primary", "Stable catalog context.", null);
    const plan = await planSemanticTurn({
      message: "What is the latest streaming milestone for this artist?",
      evidenceRoute: routeEvidence("What is the latest streaming milestone for this artist?"),
    });
    const bundle = await orchestrateContextualResearch(plan, {
      searchInternal: async () => [stable],
      searchLive: async () => { throw new Error("provider unavailable"); },
      now: () => NOW,
    });
    const payload = {
      reply: `The catalog context is supported. ${bundle.gaps.length || bundle.degraded ? "The current metric could not be verified." : ""}`,
      sources: bundle.internal.map(({ title, url }) => ({ title, url })),
    };
    expect(bundle).toMatchObject({ degraded: true, degradedReason: "A retrieval provider was unavailable." });
    expect(payload.reply).toMatch(/could not be verified/i);
    expect(payload.reply).not.toMatch(/\b\d[\d,.]*\s*(streams?|views?|million|billion)\b/i);
    expect(payload.sources).toEqual([{ title: stable.title, url: stable.url }]);
  });

  it("searches only published Brazil records and never writes memory, even when consent is merely offered", async () => {
    const writes = {
      saveEntry: vi.fn(),
      recordCoverageSignal: vi.fn(),
      setTopicFollow: vi.fn(),
      memory: vi.fn(),
    };
    const searchPublishedContent = vi.fn().mockResolvedValue({
      total: 1,
      results: [{
        kind: "entry",
        id: "brazil-entry",
        title: "Brazilian cultural history",
        summary: "A reviewed summary.",
        body: "Reviewed body.",
        topicSlug: "culture-heritage",
        topicTitle: "Culture and heritage",
        sourceCount: 1,
        sources: [{ title: "Museum collection", url: "https://museum.example/brazil", publisher: "Museum" }],
        refreshedAt: new Date(NOW),
      }],
    });
    const repository = {
      searchPublishedContent,
      ...writes,
    } as unknown as LibraryRepository;

    const first = await retrieveApprovedInternalLibrary({ repository, queries: ["Brazil"], now: () => NOW });
    expect(first).toEqual([expect.objectContaining({
      kind: "library_published",
      url: "https://museum.example/brazil",
      libraryPath: "/library/topics/culture-heritage",
      supports: ["Brazilian cultural history"],
    })]);
    expect(writes.memory).not.toHaveBeenCalled();
    expect(writes.saveEntry).not.toHaveBeenCalled();
    expect(writes.recordCoverageSignal).not.toHaveBeenCalled();

    await retrieveApprovedInternalLibrary({ repository, queries: ["Brazil music"], now: () => NOW });
    await retrieveApprovedInternalLibrary({ repository, queries: ["Brazil food"], now: () => NOW });
    const compatibilityReply = {
      reply: "Here are the published results.",
      sources: first.map(({ title, url }) => ({ title, url })),
      followUpSuggestions: ["Would you like Kinfolk to remember this interest for recommendations?"],
      libraryAction: null,
    };
    expect(compatibilityReply.followUpSuggestions[0]).toMatch(/would you like.*remember/i);
    expect(writes.memory).not.toHaveBeenCalled();
    expect(writes.saveEntry).not.toHaveBeenCalled();
    expect(searchPublishedContent).toHaveBeenCalledTimes(3);
  });

  it("keeps the complete Build 105 reply and legacy source shapes alongside additive fields", async () => {
    const source = evidence("Published source", "https://source.example/article", "reference", "Supported context.");
    const result = await contextualTurn({
      message: "Jay-Z",
      external: [source],
      synthesize: () => ({
        reply: "This reply is complete without rendering additive JSON.",
        structuredContent: { kind: "entity_explorer", canonicalName: "Jay-Z", overview: "Overview.", pathways: [] },
        followUpSuggestions: ["Explore works"],
        libraryAction: { type: "open_topic", topicId: "music", topicName: "Music" },
      }),
    });
    expect(result).toMatchObject({
      reply: expect.any(String),
      sources: [{ title: source.title, url: source.url }],
      followUpSuggestions: ["Explore works"],
      libraryAction: { type: "open_topic", topicId: "music", topicName: "Music" },
      structuredContent: { kind: "entity_explorer" },
    });
    expect(result.reply).not.toContain("{");
  });
});
