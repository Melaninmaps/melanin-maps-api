import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveEntityMock = vi.hoisted(() => vi.fn());

vi.mock("../entity-resolver", async (importOriginal) => {
  const original = await importOriginal<typeof import("../entity-resolver")>();
  return {
    ...original,
    resolveEntity: resolveEntityMock,
  };
});

vi.mock("../cultural-retrieval", () => ({
  parseMessageSignals: vi.fn(() => ({})),
  fullTextCandidates: vi.fn(async () => []),
  vectorCandidates: vi.fn(async () => []),
}));

vi.mock("../cultural-reranker", () => ({
  rerankCulturalCandidates: vi.fn(() => []),
  buildVectorContextBlock: vi.fn(() => ""),
}));

import { resolveKinfolkContext } from "../context-resolver";
import { classifyKinfolkRequest } from "../request-classifier";
import { resolveTurnGeography } from "../heritage-city-registry";

beforeEach(() => {
  resolveEntityMock.mockReset();
});

describe("authoritative city routing precedes entity classification", () => {
  const cityQueries = [
    {
      message: "tell me about Philadelphia",
      city: "Philadelphia",
      state: "PA",
    },
    {
      message: "Philadelphia heritage sites",
      city: "Philadelphia",
      state: "PA",
    },
    {
      message: "what Black history should I know about Philadelphia",
      city: "Philadelphia",
      state: "PA",
    },
    {
      message: "Tell me about Philly nightlife",
      city: "Philadelphia",
      state: "PA",
    },
    { message: "tell me about Chicago", city: "Chicago", state: "IL" },
    { message: "what should I know about NYC", city: "New York", state: "NY" },
  ];

  for (const { message, city, state } of cityQueries) {
    it(`never asks for a person/work clarification for: ${message}`, async () => {
      const turn = resolveTurnGeography(message, null);
      const requestDecision = classifyKinfolkRequest(
        message,
        turn?.city ?? null,
      );
      const result = await resolveKinfolkContext({
        message,
        userId: "test-user",
        permittedLocation: turn ? { city: turn.city } : null,
        preferences: null,
        intent:
          requestDecision.route === "business_discovery"
            ? "business_discovery"
            : "general_knowledge",
        authoritativeDestination: requestDecision.location,
      });

      expect(turn).toMatchObject({ city, state });
      expect(requestDecision.location).toBe(city);
      expect(result).toMatchObject({
        responseMode: "no_entity",
        queryClass: "local_business",
        suppressBusinessRecommendations: false,
        shortCircuitReply: null,
      });
      expect(resolveEntityMock).not.toHaveBeenCalled();
    });
  }

  it("preserves person disambiguation when no geography is resolved", async () => {
    resolveEntityMock.mockResolvedValue({
      state: "needs_clarification",
      clarificationQuestion:
        "Which Michelle Williams do you mean — the singer or the actor?",
      candidates: [
        { canonicalName: "Michelle Williams", entityType: "person" },
        { canonicalName: "Michelle Williams", entityType: "person" },
      ],
      preferencesUsed: [],
      sources: [],
    });

    const message = "tell me about Michelle Williams";
    const turn = resolveTurnGeography(message, null);
    const requestDecision = classifyKinfolkRequest(message, turn?.city ?? null);
    const result = await resolveKinfolkContext({
      message,
      userId: "test-user",
      permittedLocation: null,
      preferences: null,
      intent: "general_knowledge",
      authoritativeDestination: requestDecision.location,
    });

    expect(turn).toBeNull();
    expect(requestDecision.location).toBeNull();
    expect(result.responseMode).toBe("needs_clarification");
    expect(result.queryClass).toBe("named_entity");
    expect(result.shortCircuitReply).toMatch(/Which Michelle Williams/);
    expect(resolveEntityMock).toHaveBeenCalledOnce();
  });
});
