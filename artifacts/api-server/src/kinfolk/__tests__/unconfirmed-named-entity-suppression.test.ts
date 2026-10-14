import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveEntityMock = vi.hoisted(() => vi.fn());

vi.mock("../entity-resolver", async (importOriginal) => {
  const original = await importOriginal<typeof import("../entity-resolver")>();
  return { ...original, resolveEntity: resolveEntityMock };
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

beforeEach(() => {
  resolveEntityMock.mockReset();
});

describe("unconfirmed named-entity recommendation boundary", () => {
  it("does not attach business recommendations to an unresolved person or work query", async () => {
    resolveEntityMock.mockResolvedValue({
      state: "unconfirmed",
      unconfirmedReason: "No active source-backed candidate found for this query.",
      qualifier: "Use reliable current sources when a factual answer needs verification.",
      preferencesUsed: [],
      sources: [],
    });

    const result = await resolveKinfolkContext({
      message: "Tell me about an unlisted film director",
      userId: "member-test",
      permittedLocation: { city: "Philadelphia" },
      preferences: null,
      intent: "general_knowledge",
    });

    expect(result.responseMode).toBe("no_entity");
    expect(result.queryClass).toBe("named_entity");
    expect(result.suppressBusinessRecommendations).toBe(true);
    expect(result.shortCircuitReply).toBeNull();
  });

  it("preserves ordinary local business discovery", async () => {
    const result = await resolveKinfolkContext({
      message: "Find a Black-owned restaurant in Philadelphia",
      userId: "member-test",
      permittedLocation: { city: "Philadelphia" },
      preferences: null,
      intent: "business_discovery",
      authoritativeDestination: "Philadelphia",
    });

    expect(result.queryClass).toBe("local_business");
    expect(result.suppressBusinessRecommendations).toBe(false);
    expect(resolveEntityMock).not.toHaveBeenCalled();
  });
});
