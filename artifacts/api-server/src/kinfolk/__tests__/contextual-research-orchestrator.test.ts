import { describe, expect, it, vi } from "vitest";
import type { ExternalResearchProvider, ResearchDocument } from "../../library/types";
import {
  orchestrateContextualResearch,
  type ContextualEvidenceItem,
} from "../contextual-research-orchestrator";
import type { SemanticTurnPlan } from "../semantic-turn-planner";

const NOW = "2025-06-01T12:00:00.000Z";

function plan(overrides: Partial<SemanticTurnPlan> = {}): SemanticTurnPlan {
  return {
    taskMode: "direct_answer",
    primaryDomain: "general_knowledge",
    namedEntities: [],
    candidateMeanings: [],
    resolvedMeaning: null,
    confidence: 0.9,
    needsClarification: false,
    clarificationQuestion: null,
    freshness: "stable",
    evidenceNeeds: ["approved_internal"],
    retrievalQueries: ["one", "two", "three", "four"],
    answerPerspective: "factual",
    identityContextUsed: [],
    ...overrides,
  };
}

function item(title: string, url: string, kind: ContextualEvidenceItem["kind"] = "reference"): ContextualEvidenceItem {
  return {
    title,
    url,
    publisher: "Fixture publisher",
    kind,
    excerpt: "Supported fixture excerpt.",
    publishedAt: "2025-05-31T00:00:00.000Z",
    retrievedAt: NOW,
    supports: ["fixture claim"],
  };
}

function document(index: number, overrides: Partial<ResearchDocument> = {}): ResearchDocument {
  return {
    title: `Document ${index}`,
    url: `https://source${index}.example/article?tracking=removed#section`,
    content: "Reference account.",
    publisher: "Fixture publisher",
    publishedAt: new Date("2025-05-31T00:00:00.000Z"),
    ...overrides,
  };
}

describe("contextual research orchestrator", () => {
  it("runs internal and live retrieval independently, deduplicates canonical safe URLs, and exposes degradation", async () => {
    const result = await orchestrateContextualResearch(plan(), {
      searchInternal: async () => [
        item("Library", "https://example.com/a?internal=1"),
        item("Unsafe", "javascript:alert(1)"),
      ],
      searchLive: async () => {
        throw new Error("offline");
      },
      now: () => NOW,
    });
    expect(result.internal).toEqual([expect.objectContaining({
      title: "Library",
      url: "https://example.com/a?internal=1",
      retrievedAt: NOW,
    })]);
    expect(result.external).toEqual([]);
    expect(result).toMatchObject({ degraded: true, degradedReason: "A retrieval provider was unavailable." });
  });

  it("limits provider work to three queries and eight accepted documents with provenance", async () => {
    const search = vi.fn().mockImplementation(async ({ query, maxResults }) => ({
      documents: Array.from({ length: maxResults }, (_, index) => document(index, {
        title: `${query} document ${index}`,
        url: `https://${query}.example/${index}`,
      })),
      provider: "openai",
      status: "available",
    }));
    const primaryProvider: ExternalResearchProvider = { name: "openai", search };
    const result = await orchestrateContextualResearch(plan(), {
      primaryProvider,
      now: () => NOW,
    });
    expect(search.mock.calls.length).toBeLessThanOrEqual(3);
    expect(search.mock.calls.map(([input]) => input.query)).toEqual(["one"]);
    expect(result.external).toHaveLength(8);
    expect(result.external[0]).toMatchObject({
      title: "one document 0",
      publisher: "Fixture publisher",
      retrievedAt: NOW,
      supports: ["one", "two", "three"],
    });
    expect(result.external.every((entry) => entry.url.startsWith("https://"))).toBe(true);
  });

  it("uses the existing fallback provider and rejects unverified creator metadata", async () => {
    const primaryProvider: ExternalResearchProvider = {
      name: "openai",
      search: vi.fn().mockRejectedValue(new Error("primary unavailable")),
    };
    const fallbackProvider: ExternalResearchProvider = {
      name: "tavily",
      search: vi.fn().mockResolvedValue({
        documents: [
          document(1, {
            title: "Verified creator interview",
            url: "https://youtube.com/watch?v=verified",
            publisher: "Verified channel",
          }),
          document(2, {
            title: "Metadata-free video",
            url: "https://youtube.com/watch?v=unknown",
            publisher: null,
          }),
        ],
        provider: "tavily",
        status: "available",
      }),
    };
    const result = await orchestrateContextualResearch(plan({ retrievalQueries: ["creator interview"] }), {
      primaryProvider,
      fallbackProvider,
      now: () => NOW,
    });
    expect(primaryProvider.search).toHaveBeenCalledTimes(1);
    expect(fallbackProvider.search).toHaveBeenCalledTimes(1);
    expect(result.media).toEqual([expect.objectContaining({
      title: "Verified creator interview",
      url: "https://youtube.com/watch?v=verified",
      publisher: "Verified channel",
      kind: "creator",
    })]);
  });

  it("fails closed for insufficient current corroboration instead of promoting a metric", async () => {
    const result = await orchestrateContextualResearch(plan({
      freshness: "current",
      evidenceNeeds: ["official_current", "reputable_reporting"],
      retrievalQueries: ["current audience metric"],
    }), {
      searchLive: async () => [
        item("Undated reference repeating a metric", "https://reference.example/metric", "reference"),
      ],
      now: () => NOW,
    });
    expect(result).toMatchObject({
      external: [expect.objectContaining({ kind: "reference" })],
      degraded: true,
      degradedReason: "Current evidence was not sufficiently corroborated.",
      gaps: ["The current claim could not be corroborated."],
    });
  });

  it("keeps only official or research evidence for high-consequence provider documents", async () => {
    const provider: ExternalResearchProvider = {
      name: "openai",
      search: vi.fn().mockResolvedValue({
        documents: [
          document(1, { title: "Official health department guidance", url: "https://health.gov/guidance" }),
          document(2, { title: "Community discussion", url: "https://forum.example/thread", content: "Audience forum discussion." }),
        ],
        provider: "openai",
        status: "available",
      }),
    };
    const result = await orchestrateContextualResearch(plan({
      taskMode: "high_consequence",
      primaryDomain: "medical_health",
      evidenceNeeds: ["official_current"],
      retrievalQueries: ["blood pressure guidance"],
    }), {
      primaryProvider: provider,
      now: () => NOW,
    });
    expect(result.external).toEqual([expect.objectContaining({
      kind: "official",
      url: "https://health.gov/guidance",
    })]);
    expect(result.external).not.toContainEqual(expect.objectContaining({ kind: "community_discourse" }));
  });
});