import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, connect } = vi.hoisted(() => ({
  query: vi.fn(),
  connect: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  pool: { query, connect },
}));

import {
  communityIntelligenceCollectionEnabled,
  getCommunityIntelligenceGaps,
  getCommunityIntelligencePreference,
  recordCommunityIntelligenceFeedback,
} from "../services/community-intelligence/service";

const input = {
  userId: "synthetic-member",
  journeyType: "wedding" as const,
  stage: "inspiration" as const,
  intent: "planning" as const,
  categoryKey: "wedding_alterations",
  action: "helpful" as const,
};

describe("Community Intelligence consent gate", () => {
  beforeEach(() => {
    query.mockReset();
    connect.mockReset();
    query.mockResolvedValue({ rows: [] });
    delete process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED;
  });

  it("defaults collection off and never writes a learning event", async () => {
    expect(communityIntelligenceCollectionEnabled()).toBe(false);
    await expect(recordCommunityIntelligenceFeedback(input)).resolves.toEqual({
      recorded: false,
      reason: "collection_disabled",
    });
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO kinfolk_community_intelligence_events"))).toBe(false);
  });

  it("requires an explicit participation record before any collection write", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    await expect(recordCommunityIntelligenceFeedback(input)).resolves.toEqual({
      recorded: false,
      reason: "participation_required",
    });
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO kinfolk_community_intelligence_events"))).toBe(false);
  });

  it("records only an opted-in structured category and returns only a suppressed aggregate gap", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    query
      .mockResolvedValueOnce({ rows: [{ participation_enabled: true }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{
        journey_type: "wedding",
        journey_stage: "inspiration",
        category_key: "wedding_alterations",
      }] });

    await expect(recordCommunityIntelligenceFeedback(input)).resolves.toEqual({ recorded: true });
    const eventWrite = query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO kinfolk_community_intelligence_events"));
    expect(eventWrite?.[1]).toEqual([
      "synthetic-member",
      "wedding",
      "inspiration",
      "planning",
      "wedding_alterations",
      "helpful",
    ]);
    await expect(getCommunityIntelligenceGaps()).resolves.toEqual([{
      journeyType: "wedding",
      stage: "inspiration",
      categoryKey: "wedding_alterations",
      coverage: "enough_community_input",
      timeWindow: "last_90_days",
      explanation: expect.stringContaining("enough opted-in"),
    }]);
  });

  it("reports collection state separately from individual participation", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    await expect(getCommunityIntelligencePreference("synthetic-member")).resolves.toEqual({
      participationEnabled: false,
      collectionEnabled: true,
    });
  });
});
