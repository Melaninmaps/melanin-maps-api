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

describe("native privacy-minimized meetup verification client", () => {
  it("uses the canonical API origin and current two-party lifecycle routes", () => {
    expect(screen).toContain('import { getApiBase } from "@/lib/api";');
    expect(screen).toContain('body: JSON.stringify({ partnerId: selectedConn.otherId, organizerApproval: true, scheduledAt })');
    expect(screen).toContain('body: JSON.stringify({ partnerApproval: true })');
    expect(screen).toContain("/api/meetups/${cancelTarget.id}/cancel");
    expect(screen).toContain('method: "POST"');
  });

  it("requires explicit organizer approval and presents the reduced API response", () => {
    expect(screen).toContain("const [organizerApproval, setOrganizerApproval] = useState(false)");
    expect(screen).toContain('role: "organizer" | "partner"');
    expect(screen).toContain('status: "awaiting_partner" | "approved" | "cancelled" | "expired"');
    expect(screen).toContain("counterpartName");
    expect(screen).toContain("does not request, store, or disclose a meetup venue");
    expect(screen).toContain("does not verify a person, guarantee safety, or share a location");
  });

  it("does not call retired check-in, sharing, or destructive-clear routes", () => {
    for (const retiredRoute of ["/arrival-checkin", "/home-checkin", "/share"]) {
      expect(screen).not.toContain(retiredRoute);
    }
    expect(screen).not.toContain('method: "DELETE"');
    expect(screen).not.toContain("safetyWatcherEmail");
    expect(screen).not.toContain('body: JSON.stringify({ clearCode');
  });

  it("keeps both Safety Hub entries on the minimized meetup wire contract", () => {
    for (const source of [tabSafetyHub, standaloneSafetyHub]) {
      expect(source).toContain('role: "organizer" | "partner"');
      expect(source).toContain('meetup.role === "partner" && meetup.status === "awaiting_partner"');
      expect(source).toContain("counterpartName");
      expect(source).toContain("No venue or member location is shared.");
      expect(source).not.toContain("/arrival-checkin");
      expect(source).not.toContain("/home-checkin");
    }
  });
});
