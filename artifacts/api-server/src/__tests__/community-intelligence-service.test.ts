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
  rankSuggestionsWithCommunitySignals,
  recordCommunityIntelligenceFeedback,
  setCommunityIntelligenceParticipation,
} from "../services/community-intelligence/service";
import { communityIntelligenceSuggestionsForMessage } from "../services/community-intelligence/policy";

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

function useInstalledSchema(options: Readonly<{
  participationEnabled?: boolean;
  aggregateRows?: readonly { category_key: string; effect: "support" | "reconsider" }[];
  gapRows?: readonly { journey_type: "wedding" | "birthday"; journey_stage: "inspiration"; category_key: string }[];
}> = {}): void {
  query.mockImplementation((sql: string) => {
    if (sql.includes("to_regclass")) return Promise.resolve(installedSchema);
    if (sql.includes("SELECT participation_enabled")) {
      return Promise.resolve({
        rows: options.participationEnabled ? [{ participation_enabled: true }] : [],
      });
    }
    if (sql.includes("CASE") && sql.includes("reconsider")) {
      return Promise.resolve({ rows: options.aggregateRows ?? [] });
    }
    if (sql.includes("SELECT e.journey_type")) {
      return Promise.resolve({ rows: options.gapRows ?? [] });
    }
    return Promise.resolve({ rows: [] });
  });
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
    useInstalledSchema();

    await expect(recordCommunityIntelligenceFeedback(input)).resolves.toEqual({
      recorded: false,
      reason: "participation_required",
    });
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO kinfolk_community_intelligence_events"))).toBe(false);
  });

  it("records only an opted-in structured category and returns only a suppressed aggregate gap", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    useInstalledSchema({
      participationEnabled: true,
      gapRows: [{
        journey_type: "wedding",
        journey_stage: "inspiration",
        category_key: "wedding_alterations",
      }],
    });

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
    const aggregateQuery = query.mock.calls.find(([sql]) => String(sql).includes("SELECT e.journey_type"));
    expect(String(aggregateQuery?.[0])).toContain("participation_enabled = TRUE");
    expect(hasRuntimeSchemaMutation()).toBe(false);
  });

  it("reports collection state separately from individual participation after the migration exists", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    useInstalledSchema();

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
    useInstalledSchema();
    connect.mockResolvedValue(client);

    await expect(setCommunityIntelligenceParticipation("synthetic-member", false)).resolves.toEqual({
      participationEnabled: false,
      collectionEnabled: true,
    });
    expect(client.query.mock.calls.some(([sql]) => String(sql).includes("UPDATE kinfolk_community_intelligence_events"))).toBe(true);
    expect(client.query.mock.calls.some(([, values]) => Array.isArray(values) && values.includes("synthetic-member"))).toBe(true);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("does not apply aggregate learning to a non-participating recipient", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    useInstalledSchema({
      aggregateRows: [{ category_key: "wedding_venue_planning", effect: "reconsider" }],
    });
    const suggestions = communityIntelligenceSuggestionsForMessage("I am planning my wedding.");

    await expect(rankSuggestionsWithCommunitySignals("recipient-without-consent", suggestions)).resolves.toEqual(suggestions);
    expect(query.mock.calls.some(([sql]) => String(sql).includes("CASE") && String(sql).includes("reconsider"))).toBe(false);
  });

  it("uses only a suppressed aggregate reconsider signal to change a later opted-in member's suggestions", async () => {
    process.env.COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED = "true";
    useInstalledSchema({
      participationEnabled: true,
      aggregateRows: [{ category_key: "wedding_venue_planning", effect: "reconsider" }],
    });
    const suggestions = communityIntelligenceSuggestionsForMessage("I am planning my wedding.");

    const adjusted = await rankSuggestionsWithCommunitySignals("different-opted-in-member", suggestions);
    expect(adjusted.map((suggestion) => suggestion.categoryKey)).not.toContain("wedding_venue_planning");
    expect(adjusted).toHaveLength(2);

    const learningQuery = query.mock.calls.find(([sql]) => String(sql).includes("CASE") && String(sql).includes("reconsider"));
    expect(String(learningQuery?.[0])).toContain("INNER JOIN kinfolk_community_intelligence_preferences p");
    expect(String(learningQuery?.[0])).toContain("participation_enabled = TRUE");
    expect(String(learningQuery?.[0])).not.toContain("SELECT e.user_id");
  });
});
