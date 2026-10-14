import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const checkins = source("../routes/checkins.ts");
const directions = source("../routes/directions.ts");
const reports = source("../routes/reports.ts");
const safetyTips = source("../routes/safety-tips.ts");
const approvedAlerts = source("../safety/approvedIncidentAlerts.ts");

describe("Safety location and notification privacy boundaries", () => {
  it("keeps new business Check-Ins private and rejects coordinate payloads", () => {
    expect(checkins).toContain('"Private Check-Ins do not accept or retain location coordinates."');
    expect(checkins).toContain("hasCoordinatePayload(body)");
    expect(checkins).toContain("checkIns.map(privateCheckInResponse)");
    expect(checkins).not.toContain("haversineKm");
    expect(checkins).not.toContain("businessesTable");
    expect(checkins).not.toContain("distanceMeters");
    expect(checkins).not.toContain("userLat:");
    expect(checkins).not.toContain("userLng:");
  });

  it("retires Safety route overlays instead of processing member waypoints", () => {
    expect(directions).toContain('router.post("/directions/safety-context"');
    expect(directions).toContain("res.status(410)");
    expect(directions).toContain("Safety does not use route or device location.");
    expect(directions).not.toContain("pool.query");
    expect(directions).not.toContain("waypoints");
    expect(directions).not.toContain("startLat");
  });

  it("removes individual incident timestamps and precise active-alert projections", () => {
    expect(reports).toContain('router.get("/reports/proximity-warnings"');
    expect(reports).toContain("res.status(410)");
    expect(reports).toContain("Coordinate-based Safety warnings have been retired");
    expect(reports).not.toContain('createdAt: report.createdAt');
    expect(reports).not.toContain("setCachedProximityWarnings");
    expect(reports).not.toContain("proximityCacheKey");
  });

  it("limits member notification to coarse separately opted-in Police/ICE alerts", () => {
    expect(approvedAlerts).toContain("sendCorroboratedPoliceIceAlert");
    expect(approvedAlerts).toContain("non-Police/ICE incident retained for private review");
    expect(approvedAlerts).not.toContain("sendPushToBusinessOwnersByCity");
    expect(approvedAlerts).not.toContain("publish");
  });

  it("keeps Safety Tip confirmation coordinate-free", () => {
    expect(safetyTips).toContain("Safety Tip confirmations do not accept or retain member coordinates.");
    expect(safetyTips).not.toContain("userLat: null");
    expect(safetyTips).not.toContain("userLng: null");
  });
});
