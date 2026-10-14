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
  setCommunityIntelligenceParticipation,
} from "../services/community-intelligence/service";

const input = {
  userId: "synthetic-member",
  journeyType: "wedding" as const,
  stage: "inspiration" as const,
  intent: "planning" as const,
  categoryKey: "wedding_alterations",
  action: "helpful" as const,
};

const installedSchema = {
  rows: [{
    preferences_table: "kinfolk_community_intelligence_preferences",
    events_table: "kinfolk_community_intelligence_events",
  }],
};

function hasRuntimeSchemaMutation(): boolean {
  return query.mock.calls.some(([sql]) => /create\s+table|alter\s+table/i.test(String(sql)));
}

describe("Community Intelligence consent and migration gates", () => {
  beforeEach(() => {
    query.mockReset();
    connect.mockReset();
    query.mockResolvedValue({ rows: [] });
    delete process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED;
  });

  it("defaults collection off and never issues a schema or event write", async () => {
    expect(communityIntelligenceCollectionEnabled()).toBe(false);
    await expect(recordCommunityIntelligenceFeedback(input)).resolves.toEqual({
      recorded: false,
      reason: "collection_disabled",
    });
    await expect(getCommunityIntelligencePreference("synthetic-member")).resolves.toEqual({
      participationEnabled: false,
      collectionEnabled: false,
    });
    expect(query).not.toHaveBeenCalled();
    expect(hasRuntimeSchemaMutation()).toBe(false);
  });

  it("fails closed when the reviewed migration is absent", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    query.mockResolvedValue({ rows: [{ preferences_table: null, events_table: null }] });

    await expect(recordCommunityIntelligenceFeedback(input)).resolves.toEqual({
      recorded: false,
      reason: "collection_disabled",
    });
    await expect(getCommunityIntelligencePreference("synthetic-member")).resolves.toEqual({
      participationEnabled: false,
      collectionEnabled: false,
    });
    expect(hasRuntimeSchemaMutation()).toBe(false);
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO kinfolk_community_intelligence_events"))).toBe(false);
  });

  it("requires explicit participation before any learning-event write", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    query
      .mockResolvedValueOnce(installedSchema)
      .mockResolvedValueOnce({ rows: [] });

    await expect(recordCommunityIntelligenceFeedback(input)).resolves.toEqual({
      recorded: false,
      reason: "participation_required",
    });
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO kinfolk_community_intelligence_events"))).toBe(false);
  });

  it("records only an opted-in structured category and returns only a suppressed aggregate gap", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    query
      .mockResolvedValueOnce(installedSchema)
      .mockResolvedValueOnce({ rows: [{ participation_enabled: true }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(installedSchema)
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
    expect(hasRuntimeSchemaMutation()).toBe(false);
  });

  it("reports collection state separately from individual participation after the migration exists", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    query
      .mockResolvedValueOnce(installedSchema)
      .mockResolvedValueOnce({ rows: [] });

    await expect(getCommunityIntelligencePreference("synthetic-member")).resolves.toEqual({
      participationEnabled: false,
      collectionEnabled: true,
    });
  });

  it("revokes a member's active events when participation is turned off", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    };
    query.mockResolvedValueOnce(installedSchema);
    connect.mockResolvedValue(client);

    await expect(setCommunityIntelligenceParticipation("synthetic-member", false)).resolves.toEqual({
      participationEnabled: false,
      collectionEnabled: true,
    });
    expect(client.query.mock.calls.some(([sql]) => String(sql).includes("UPDATE kinfolk_community_intelligence_events"))).toBe(true);
    expect(client.query.mock.calls.some(([, values]) => Array.isArray(values) && values.includes("synthetic-member"))).toBe(true);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
