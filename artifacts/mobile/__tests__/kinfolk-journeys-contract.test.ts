import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  new URL("../app/kinfolk-journeys.tsx", import.meta.url),
  "utf8",
);
const client = readFileSync(
  new URL("../lib/kinfolkJourneys.ts", import.meta.url),
  "utf8",
);
const layout = readFileSync(
  new URL("../app/_layout.tsx", import.meta.url),
  "utf8",
);
const profile = readFileSync(
  new URL("../app/(tabs)/profile.tsx", import.meta.url),
  "utf8",
);

describe("native Kinfolk Journeys contract", () => {
  it("registers a protected native Journey workspace", () => {
    expect(layout).toContain('name="kinfolk-journeys"');
    expect(screen).toContain('router.push("/login" as never)');
    expect(profile).toContain('router.push("/kinfolk-journeys" as never)');
    expect(profile).toContain("Kinfolk Journeys");
  });

  it("uses member-authenticated API calls and private attachments", () => {
    expect(client).toContain("getMemberApiHeaders");
    expect(client).toContain("purpose=kinfolk_journey_private");
    expect(client).toContain("registerAttachment");
  });

  it("requires explicit member selection for calendar events and never presents booking", () => {
    expect(screen).toContain("requestCalendarPermissionsAsync");
    expect(screen).toContain("Add selected events");
    expect(screen).toContain(
      "They remain tentative until you confirm them in your Journey.",
    );
    expect(screen).toMatch(
      /It cannot book, change, or confirm flights,\s+hotels, reservations, or events\./,
    );
  });

  it("keeps imported facts in review until the member saves a selected detail", () => {
    expect(client).toContain("confirmImport");
    expect(screen).toContain("Review imported details");
    expect(screen).toContain("Save reviewed detail");
    expect(screen).toContain("Nothing was booked or confirmed.");
  });

  it("requires an explicit private-document review action before presenting extracted facts", () => {
    expect(client).toContain("extractPrivateDocument");
    expect(screen).toContain("Review private document");
    expect(screen).toContain("kinfolkJourneysApi.extractPrivateDocument");
    expect(screen).toContain('"message/rfc822"');
    expect(screen).toContain('"text/calendar"');
    expect(screen).toContain("suggestions only");
  });

  it("persists private reminders without implying notification delivery", () => {
    expect(client).toContain("addReminder");
    expect(client).toContain("updateReminder");
    expect(screen).toContain("Private reminders");
    expect(screen).toMatch(
      /Delivery is off until a future\s+release\s+has your separate\s+notification permission\./,
    );
  });

  it("keeps flight watches advisory, member-consented, and removable", () => {
    expect(client).toContain("addFlightWatch");
    expect(client).toContain("updateFlightWatch");
    expect(client).toContain("deleteFlightWatch");
    expect(screen).toContain("Save private flight watch");
    expect(screen).toContain("Revoke");
    expect(screen).toContain("Kinfolk never accesses airline accounts");
    expect(screen).toContain(
      "Confirm any change with the airline or booking channel.",
    );
  });
});
