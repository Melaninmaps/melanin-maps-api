import { describe, expect, it, vi } from "vitest";
import {
  expireMemberSelectedJourneys,
  type JourneyRetentionClient,
} from "../retention-worker";

describe("Journey retention expiry worker", () => {
  it("redacts expired Journey content without touching account connections", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SELECT id, user_id")) {
        return { rows: [{ id: "journey-1", user_id: "member-1" }] };
      }
      return { rows: [], rowCount: 1 };
    });
    const release = vi.fn();

    const result = await expireMemberSelectedJourneys({
      pool: {
        connect: async () => ({
          query: query as unknown as JourneyRetentionClient["query"],
          release,
        }),
      },
      now: new Date("2026-10-14T20:00:00.000Z"),
      limit: 500,
    });

    expect(result).toEqual({ scanned: 1, deletedJourneyIds: ["journey-1"] });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("FOR UPDATE SKIP LOCKED"),
      [new Date("2026-10-14T20:00:00.000Z"), 100],
    );
    const sql = query.mock.calls
      .map(([statement]) => String(statement))
      .join("\n");
    expect(sql).toContain("kinfolk_journey_imports");
    expect(sql).toContain("kinfolk_journey_items");
    expect(sql).toContain("kinfolk_journey_reminders");
    expect(sql).toContain("journey_retention_expired");
    expect(sql).not.toContain("kinfolk_journey_connections");
    expect(release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the connection if a deletion step fails", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql === "BEGIN") return { rows: [] };
      if (sql.includes("SELECT id, user_id")) {
        return { rows: [{ id: "journey-1", user_id: "member-1" }] };
      }
      if (sql.includes("kinfolk_journey_items"))
        throw new Error("db unavailable");
      return { rows: [] };
    });
    const release = vi.fn();

    await expect(
      expireMemberSelectedJourneys({
        pool: {
          connect: async () => ({
            query: query as unknown as JourneyRetentionClient["query"],
            release,
          }),
        },
      }),
    ).rejects.toThrow("db unavailable");

    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });
});
