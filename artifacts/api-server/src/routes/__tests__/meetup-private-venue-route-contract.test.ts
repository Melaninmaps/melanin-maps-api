import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../meetup-verifications.ts", import.meta.url)),
  "utf8",
);
const relationshipAccess = readFileSync(
  fileURLToPath(new URL("../../social/profileRelationshipAccess.ts", import.meta.url)),
  "utf8",
);

describe("private meetup venue route contract", () => {
  it("requires an accepted unblocked connection and seals the venue before storage", () => {
    expect(route).toContain("requireAcceptedUnblockedConnection");
    expect(route).toContain("usersAreBlocked");
    expect(route).toContain("connectionId,");
    expect(route).toContain("location: sealMeetupVenue(request.venue)");
    expect(route).toContain("location: sealMeetupVenue(corrected.venue)");
    expect(route).not.toContain("location: request.venue");
  });

  it("redacts venue data after cancellation or expiry and keeps legacy automatic check-ins retired", () => {
    expect(route).toContain("function redactedMeetupDetails()");
    expect(route).toContain("clearedAt: now");
    expect(route).toContain('router.patch("/meetups/:id/arrival-checkin"');
    expect(route).toContain('code: "MEETUP_CHECKIN_RETIRED"');
    expect(route).not.toContain("sendArrivalCheckEmail");
    expect(route).not.toContain("sendHomeCheckEmail");
  });

  it("makes blocking revoke participant-only meetup details with the connection", () => {
    expect(route).toContain('router.post("/meetups/:id/block"');
    expect(route).toContain("blockMemberAndCleanupRelationships(userId, counterpartId)");
    expect(relationshipAccess).toContain("meetupVerificationsTable");
    expect(relationshipAccess).toContain('cancellationReason: "Relationship unavailable"');
    expect(relationshipAccess).toContain("location: null");
  });
});
