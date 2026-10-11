import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  fileURLToPath(new URL("../app/member-connections.tsx", import.meta.url)),
  "utf8",
);
const tabSafetyHub = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/safety-hub.tsx", import.meta.url)),
  "utf8",
);
const standaloneSafetyHub = readFileSync(
  fileURLToPath(new URL("../app/safety-hub.tsx", import.meta.url)),
  "utf8",
);

describe("native private meetup verification client", () => {
  it("uses the canonical API origin and current two-party lifecycle routes", () => {
    expect(screen).toContain('import { getApiBase } from "@/lib/api";');
    expect(screen).toContain('body: JSON.stringify({ partnerId: selectedConn.otherId, organizerApproval: true, venue: venue.trim(), scheduledAt })');
    expect(screen).toContain('body: JSON.stringify({ partnerApproval: true })');
    expect(screen).toContain("/api/meetups/${cancelTarget.id}/cancel");
    expect(screen).toContain("/api/meetups/${id}/block");
    expect(screen).toContain('method: "POST"');
  });

  it("requires explicit two-party venue consent and presents the reduced API response", () => {
    expect(screen).toContain("const [organizerApproval, setOrganizerApproval] = useState(false)");
    expect(screen).toContain("partnerVenueAcknowledgements");
    expect(screen).toContain('role: "organizer" | "partner"');
    expect(screen).toContain('venue: string | null');
    expect(screen).toContain("Private public venue");
    expect(screen).toContain("I reviewed this planned venue and scheduled time");
    expect(screen).toContain("does not collect live location, coordinates, home details");
  });

  it("provides cancellation, blocking, private reporting, and a separately consented Safety Check-In", () => {
    expect(screen).toContain("Cancel meetup request");
    expect(screen).toContain("Block member");
    expect(screen).toContain('router.push("/report-safety")');
    expect(screen).toContain('router.push("/checkin")');
    expect(screen).toContain("The private venue and any legacy safety details are immediately cleared.");
  });

  it("does not call retired automatic tracking, sharing, or destructive-clear routes", () => {
    for (const retiredRoute of ["/arrival-checkin", "/home-checkin", "/share"]) {
      expect(screen).not.toContain(retiredRoute);
    }
    expect(screen).not.toContain('method: "DELETE"');
    expect(screen).not.toContain("safetyWatcherEmail");
    expect(screen).not.toContain('body: JSON.stringify({ clearCode');
  });

  it("keeps both Safety Hub entries on the private venue wire contract", () => {
    for (const source of [tabSafetyHub, standaloneSafetyHub]) {
      expect(source).toContain('role: "organizer" | "partner"');
      expect(source).toContain('venue: string | null');
      expect(source).toContain('meetup.role === "partner" && meetup.status === "awaiting_partner"');
      expect(source).toContain("counterpartName");
      expect(source).toContain("planned private venue");
      expect(source).not.toContain("/arrival-checkin");
      expect(source).not.toContain("/home-checkin");
    }
  });
});
