import { describe, expect, it, vi } from "vitest";
import {
  expireMemberSelectedJourneys,
  type JourneyRetentionClient,
} from "../retention-worker";

describe("Journey retention expiry worker", () => {
  it("purges expired Journey content without touching account connections", async () => {
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
    expect(sql).toContain("DELETE FROM kinfolk_journey_sources");
    expect(sql).toContain("kinfolk_journey_imports");
    expect(sql).toContain("kinfolk_journey_items");
    expect(sql).toContain("kinfolk_journey_collaborators");
    expect(sql).toContain("kinfolk_journey_reminders");
    expect(sql).toContain("kinfolk_journey_flight_watches");
    expect(sql).toContain("journey_retention_expired");
    expect(sql).toContain("title='Removed private Journey'");
    expect(sql).not.toContain("kinfolk_journey_connections");
    const auditCall = query.mock.calls.find(([statement]) =>
      String(statement).includes("journey_retention_expired"),
    );
    const auditParameters = (
      auditCall as unknown as [string, readonly unknown[]] | undefined
    )?.[1];
    expect(auditParameters).toContain(
      JSON.stringify({ localAccessRemoved: true, contentPurged: true }),
    );
    expect(release).toHaveBeenCalledOnce();
  });

  it("physically deletes exclusively owned private attachments and purges prior Journey provenance", async () => {
    const deleteObject = vi.fn().mockResolvedValue(undefined);
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SELECT id, user_id")) {
        return { rows: [{ id: "journey-1", user_id: "member-1" }] };
      }
      if (sql.includes("FROM media_assets AS media_asset")) {
        return {
          rows: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              object_key:
                "media-uploads/kinfolk-journeys-private/member-1/private.pdf",
            },
          ],
        };
      }
      return { rows: [], rowCount: 1 };
    });
    const release = vi.fn();
    vi.stubEnv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", "private-test-bucket");

    try {
      await expireMemberSelectedJourneys({
        pool: {
          connect: async () => ({
            query: query as unknown as JourneyRetentionClient["query"],
            release,
          }),
        },
        storageClient: {
          bucket: (bucketId) => {
            expect(bucketId).toBe("private-test-bucket");
            return { file: () => ({ delete: deleteObject }) };
          },
        },
      });
    } finally {
      vi.unstubAllEnvs();
    }

    expect(deleteObject).toHaveBeenCalledWith({ ignoreNotFound: true });
    const sql = query.mock.calls
      .map(([statement]) => String(statement))
      .join("\n");
    expect(sql).toContain("FROM media_assets AS media_asset");
    expect(sql).toContain("DELETE FROM media_assets");
    expect(sql).toContain("DELETE FROM kinfolk_journey_audit");
    expect(sql).toContain("AND NOT EXISTS");
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
