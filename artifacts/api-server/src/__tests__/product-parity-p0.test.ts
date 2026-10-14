import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("private social-space authorization", () => {
  it("requires authentication and hides nonmember private Groups", () => {
    const groups = source("../routes/groups.ts");
    expect(groups).toMatch(/router\.get\("\/groups",[\s\S]*?if \(!requireAuth\(req, res\)\) return/);
    expect(groups).toContain("if (g.isPrivate && !memberGroupIds.has(g.id)) return false");
    expect(groups).toContain("if (group.isPrivate && !membership)");
    expect(groups).toMatch(/router\.get\("\/groups\/:id\/suggestions",[\s\S]*?Group membership required/);
    expect(groups).toMatch(/router\.post\("\/groups\/:id\/suggestions",[\s\S]*?Group membership required/);
  });

  it("caps Circles at eight and protects members, invitations, and planning content", () => {
    const circles = source("../routes/circles.ts");
    expect(circles).toContain("maxPrivateMembers: 8");
    expect(circles).toContain("maximum 8 members");
    expect(circles).toContain("Only the Circle Host can invite members");
    expect(circles).toContain("The new host must already be a Circle member");
    expect(circles).toContain("SELECT max_members FROM kinfolk_circles WHERE id = $1 FOR UPDATE");
    expect(circles).toContain("const effectiveMax = Math.min");
    expect(circles.match(/await addCircleMemberWithinCap\(circleId,/g)?.length).toBe(2);
    expect(circles).toMatch(/router\.get\("\/circles\/:id\/suggestions",[\s\S]*?Not a member/);
    expect(circles).toMatch(/router\.get\("\/circles\/:id\/plans",[\s\S]*?Not a member/);
  });

  it("keeps trusted live location separate from private Safety Check-Ins", () => {
    const shares = source("../routes/location-shares.ts");
    const checkins = source("../routes/safety-checkins.ts");
    expect(shares).toContain('router.patch("/safety/location-shares/:token/update"');
    expect(shares).toContain('router.get("/safety/location-shares/:token/view"');
    expect(shares).toContain("liveLocationConsent !== true");
    expect(shares).toContain("minimizeLocationCoordinate");
    expect(shares).toContain("tss.contact_accepted = true");
    expect(shares).toContain("owner_blocks.id IS NULL");
    expect(shares).not.toContain("retireLocationSharesForMember");
    const alerts = source("../routes/community-alerts.ts");
    expect(alerts).toContain("Legacy community safety alerts have been retired");
    expect(alerts).not.toContain("pool.query");
    expect(checkins).toContain("Safety Check-Ins do not collect, store, or share location");
    expect(checkins).not.toContain("minimizeLocationCoordinate");
  });

  it("keeps Safety-tip submitter identifiers out of client responses", () => {
    const safetyTips = source("../routes/safety-tips.ts");
    expect(safetyTips).toContain("function publicSafetyTip");
    expect(safetyTips).toContain("tip: publicSafetyTip(tip)");
    expect(safetyTips).toContain("Individual Safety Tip listings are unavailable");
    expect(safetyTips).toContain("Nearby Safety Tips have been retired");
  });

  it("makes anonymous reports unlinkable and keeps reporter fields out of public responses", () => {
    const reports = source("../routes/reports.ts");
    expect(reports).toContain("reporterId: isAnon ? null");
    expect(reports).toContain("function publicSafetyReport");
    expect(reports).toContain("report: publicSafetyReport(report)");
    expect(reports).toContain("Individual Safety report listings are unavailable");
    const publicProjection = reports.slice(reports.indexOf("function publicSafetyReport"), reports.indexOf('router.post("/reports"'));
    expect(publicProjection).not.toContain("reporterId");
    expect(publicProjection).not.toContain("moderatorNotes");
    expect(publicProjection).not.toContain("evidenceLinks");
  });
});

describe("production content and voice integrity", () => {
  it("publishes only member-created active events and leaves fixture rows stored", () => {
    const events = source("../routes/events.ts");
    expect(events.match(/isNotNull\(eventsTable\.createdById\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(events).toContain("remain in storage for audit/history");
  });

  it("suppresses direct demo-tagged business details without deleting data", () => {
    const businesses = source("../routes/businesses.ts");
    const discovery = source("../discovery/postgresLocationFirstRepository.ts");
    const localMap = source("../map/localBusinessSearch.ts");
    const universal = source("../routes/universal-search.ts");
    expect(businesses).toContain("containsDemoMarker");
    expect(businesses).toContain('value.toLowerCase().includes("[demo]")');
    // `containsDemoMarker` is the central predicate; individual SQL clauses are
    // intentionally not duplicated once per response field.
    expect(businesses.match(/NOT ILIKE '%\[demo\]%'/g)?.length).toBeGreaterThanOrEqual(2);
    expect(discovery.match(/NOT ILIKE '%\[demo\]%'/g)?.length).toBe(2);
    expect(localMap).toContain("PROVEN_DEMO_BUSINESS_SQL_PREDICATE");
    expect(universal.match(/NOT ILIKE '%\[demo\]%'/g)?.length).toBeGreaterThanOrEqual(8);
    expect(businesses).not.toContain("delete(businessesTable)");
  });

  it("registers the existing multipart Kinfolk transcription endpoint only once", () => {
    const app = source("../app.ts");
    const kinfolk = source("../routes/kinfolk.ts");
    expect(app).not.toContain("registerVoiceTranscriptionRoute");
    expect(kinfolk).toContain('router.post("/kinfolk/transcribe"');
    expect(kinfolk).toContain('}).single("audio")');
    expect(kinfolk).toContain('req.is("multipart/form-data")');
  });
});
