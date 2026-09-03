import { describe, expect, it, vi } from "vitest";
import { createPostgresDiscoverySignalRepository } from "../postgresFlywheelRepository";

describe("Postgres discovery aggregate signals", () => {
  it("writes only normalized coarse dimensions to the existing aggregate tables", async () => {
    const db = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const repository = createPostgresDiscoverySignalRepository(db);

    await repository.recordCoverageGap({
      city: "Atlanta",
      stateCode: "ga",
      recordType: "business",
      category: "Bookstore",
      specialty: "bookstore",
      observedAt: new Date().toISOString(),
    });
    await repository.recordFlywheelSignal({
      surface: "kinfolk",
      action: "search",
      city: "atlanta",
      stateCode: "GA",
      recordType: "business",
      category: "bookstore",
      specialty: "bookstore",
    });

    const [gapSql, gapParams] = db.query.mock.calls[0] as [string, unknown[]];
    const [signalSql, signalParams] = db.query.mock.calls[1] as [string, unknown[]];
    expect(gapSql).toContain("INSERT INTO discovery_coverage_gaps");
    expect(signalSql).toContain("INSERT INTO discovery_flywheel_daily_signals");
    expect(gapParams).toEqual(["atlanta", "GA", "business", "bookstore", "bookstore"]);
    expect(signalParams).toEqual(["kinfolk", "search", "atlanta", "GA", "business", "bookstore", "bookstore"]);
    expect(`${gapSql} ${signalSql}`).not.toMatch(/raw_text|member_text|latitude|longitude|coordinates/i);
  });
});
