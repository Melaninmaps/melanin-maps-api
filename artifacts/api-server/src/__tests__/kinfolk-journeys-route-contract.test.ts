import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routesIndex = readFileSync(
  new URL("../routes/index.ts", import.meta.url),
  "utf8",
);
const journeyRoute = readFileSync(
  new URL("../routes/kinfolk-journeys.ts", import.meta.url),
  "utf8",
);
const retentionPolicy = readFileSync(
  new URL("../kinfolk/journeys/retention.ts", import.meta.url),
  "utf8",
);
const mediaRoutes = readFileSync(
  new URL("../media/registerMediaRoutes.ts", import.meta.url),
  "utf8",
);

describe("Kinfolk Journeys API contract", () => {
  it("mounts behind the member wall and separate from Life Journeys", () => {
    expect(routesIndex).toContain(
      'import kinfolkJourneysRouter from "./kinfolk-journeys";',
    );
    expect(routesIndex.indexOf("router.use(requireAuth)")).toBeLessThan(
      routesIndex.indexOf("router.use(kinfolkJourneysRouter)"),
    );
    expect(journeyRoute).toContain(
      'router.get("/kinfolk-journeys/capabilities"',
    );
    expect(journeyRoute).toContain('router.get("/kinfolk-journeys"');
  });

  it("never returns provider token envelopes or raw import content", () => {
    expect(journeyRoute).toContain("token_envelope");
    expect(journeyRoute).toContain("safeImport");
    expect(journeyRoute).not.toContain("rawEmailContent");
    expect(journeyRoute).toContain("reviewRequired: true");
  });

  it("keeps destructive operations owner-scoped and audited", () => {
    expect(journeyRoute).toContain("WHERE id=$1 AND user_id=$2");
    expect(journeyRoute).toContain('getJourneyDeletionPlan("member_delete")');
    expect(retentionPolicy).toContain('auditEvent: "journey_delete_requested"');
    expect(journeyRoute).not.toContain(
      "UPDATE kinfolk_journey_connections SET status='disconnect_pending'",
    );
    expect(journeyRoute).toContain("until you choose Disconnect");
  });

  it("fails closed across members and when duplicate or stale reviews conflict", () => {
    expect(journeyRoute).toContain("async function requireOwnedJourney");
    expect(journeyRoute).toContain(
      "WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
    );
    expect(journeyRoute).toContain(
      "WHERE id=$1 AND journey_id=$2 AND user_id=$3 AND deleted_at IS NULL",
    );
    expect(journeyRoute).toContain(
      "ON CONFLICT (journey_id,content_digest) DO NOTHING",
    );
    expect(journeyRoute).toContain("duplicate: true");
    expect(journeyRoute).toContain(
      "This private attachment changed while it was being reviewed.",
    );
  });

  it("requires owned private assets and a verified PKCE callback", () => {
    expect(journeyRoute).toContain(
      'router.post("/kinfolk-journeys/:journeyId/imports/assets"',
    );
    expect(journeyRoute).toContain("purpose='kinfolk_journey_private'");
    expect(journeyRoute).toContain("public_url IS NULL");
    expect(journeyRoute).toMatch(
      /router\.get\(\s*"\/kinfolk-journeys\/connections\/:provider\/callback"/,
    );
    expect(journeyRoute).toContain("assertJourneyAuthorizationCallback");
    expect(journeyRoute).toContain("exchangeJourneyAuthorizationCode");
    expect(mediaRoutes).toContain('purpose === "kinfolk_journey_private"');
    expect(mediaRoutes).toContain("media-uploads/kinfolk-journeys-private");
    expect(mediaRoutes).toContain("isPrivateJourney");
  });

  it("reviews an owned private document only after explicit consent and never persists raw text", () => {
    expect(journeyRoute).toContain(
      'router.post(\n  "/kinfolk-journeys/:journeyId/imports/:importId/extract-private-document"',
    );
    expect(journeyRoute).toContain("extractJourneyPrivateDocument");
    expect(journeyRoute).toContain("req.body?.consent !== true");
    expect(journeyRoute).toContain("journey_private_document_reviewed");
    expect(journeyRoute).not.toContain("rawPdfText");
    expect(journeyRoute).not.toContain("attachmentText:");
    expect(mediaRoutes).toContain("message/rfc822");
    expect(mediaRoutes).toContain("text/calendar");
    expect(mediaRoutes).toContain("application/vnd.apple.pkpass");
  });

  it("keeps import provenance and reminder delivery member-confirmed", () => {
    expect(journeyRoute).toContain("kinfolk_journey_sources");
    expect(journeyRoute).toContain("Member-approved");
    expect(journeyRoute).toContain(
      'router.post("/kinfolk-journeys/:journeyId/reminders"',
    );
    expect(journeyRoute).toContain("req.body?.consent !== true");
    expect(journeyRoute).toContain('delivery: "not_scheduled"');
  });

  it("keeps flight watching advisory, consented, and revocable", () => {
    expect(journeyRoute).toContain(
      'router.post("/kinfolk-journeys/:journeyId/flight-watches"',
    );
    expect(journeyRoute).toContain("parseFlightWatchInput");
    expect(journeyRoute).toContain("getFlightMonitorReadiness");
    expect(journeyRoute).toContain("journey_flight_watch_consent_recorded");
    expect(journeyRoute).toContain("journey_flight_watch_${action}");
    expect(journeyRoute).toContain("kinfolk_journey_flight_watches");
    expect(journeyRoute).toContain("advisory-only pending watch");
    expect(journeyRoute).not.toContain("reservation access");
  });
});
