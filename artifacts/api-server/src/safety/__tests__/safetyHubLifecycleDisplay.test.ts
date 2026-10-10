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
    expect(reports).toContain("AND sr.corrected_at IS NULL");

    expect(communityAlerts).toContain('action !== "withdraw" && action !== "correct" && action !== "set_expiration"');
    expect(communityAlerts).toContain("withdrawal_reason = $3");
    expect(communityAlerts).toContain("SET is_active = false,\n               corrected_at = NOW()");
    expect(communityAlerts).toContain("AND corrected_at IS NULL");
    expect(communityAlerts).toContain("AND withdrawn_at IS NULL");
    expect(communityAlerts).toContain("AND ca.expires_at > NOW()");
    expect(directions).toContain("AND ca.corrected_at IS NULL");
    expect(directions).toContain("AND ca.withdrawn_at IS NULL");
    expect(directions).toContain("AND ca.expires_at > NOW()");

    for (const currentDisplaySource of currentDisplaySources) {
      expect(currentDisplaySource).not.toMatch(/\bDELETE\s+FROM\b|\bTRUNCATE\b/i);
    }
  });
});
