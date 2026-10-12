import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isCurrentCommunityAlertForDisplay,
  isCurrentSafetyReportForDisplay,
} from "../safetyHubLifecycle";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Safety Hub current-display lifecycle", () => {
  const now = new Date("2026-10-10T15:00:00.000Z");
  const future = new Date("2026-10-10T16:00:00.000Z");

  it("fails closed for expired, withdrawn, or corrected source records without deleting them", () => {
    expect(isCurrentSafetyReportForDisplay({
      status: "approved",
      displayExpiresAt: future,
    }, now)).toBe(true);
    expect(isCurrentSafetyReportForDisplay({
      status: "approved",
      displayExpiresAt: future,
      withdrawnAt: now,
    }, now)).toBe(false);
    expect(isCurrentSafetyReportForDisplay({
      status: "approved",
      displayExpiresAt: future,
      correctedAt: now,
    }, now)).toBe(false);
    expect(isCurrentSafetyReportForDisplay({
      status: "approved",
      displayExpiresAt: now,
    }, now)).toBe(false);

    expect(isCurrentCommunityAlertForDisplay({
      isActive: true,
      expiresAt: future,
    }, now)).toBe(true);
    expect(isCurrentCommunityAlertForDisplay({
      isActive: true,
      expiresAt: future,
      withdrawnAt: now,
    }, now)).toBe(false);
    expect(isCurrentCommunityAlertForDisplay({
      isActive: true,
      expiresAt: future,
      correctedAt: now,
    }, now)).toBe(false);
    expect(isCurrentCommunityAlertForDisplay({
      isActive: true,
      expiresAt: now,
    }, now)).toBe(false);
  });

  it("writes lifecycle metadata and current-display state without a retention or purge operation", () => {
    const reports = source("../../routes/reports.ts");
    const communityAlerts = source("../../routes/community-alerts.ts");
    const directions = source("../../routes/directions.ts");
    const lifecycleRunner = source("../safetyHubLifecycleRunner.ts");
    const currentDisplaySources = [reports, communityAlerts, directions, lifecycleRunner];

    expect(reports).toContain("isNull(safetyReportsTable.correctedAt)");
    expect(reports).toContain("displayExpiresAt: now");
    expect(reports).toContain("isNull(safetyReportsTable.withdrawnAt)");
    expect(reports).toContain("Individual Safety report listings are unavailable");

    expect(communityAlerts).toContain("Legacy community safety alerts have been retired");
    expect(communityAlerts).not.toContain("pool.query");
    expect(directions).toContain("Route-based Safety context has been retired");
    expect(directions).not.toContain("pool.query");

    for (const currentDisplaySource of currentDisplaySources) {
      expect(currentDisplaySource).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b/i);
    }
  });
});
