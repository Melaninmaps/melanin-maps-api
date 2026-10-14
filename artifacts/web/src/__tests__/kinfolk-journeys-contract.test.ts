import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
const pageSource = fs.readFileSync(
  path.join(root, "pages", "journeys.tsx"),
  "utf8",
);
const apiSource = fs.readFileSync(
  path.join(root, "features", "journeys", "api.ts"),
  "utf8",
);
const layoutSource = fs.readFileSync(
  path.join(root, "components", "layout.tsx"),
  "utf8",
);

describe("Kinfolk Journeys private workspace contract", () => {
  it("registers protected list and detail routes", () => {
    expect(appSource).toContain('path="/journeys/:journeyId"');
    expect(appSource).toContain('path="/journeys"');
    expect(appSource).toContain("<JourneysPage />");
    expect(layoutSource).toContain('href="/journeys"');
  });

  it("does not present imports as confirmed bookings", () => {
    expect(pageSource).toContain(
      "Nothing below changes your plan until you confirm it.",
    );
    expect(pageSource).toMatch(
      /Kinfolk and imports cannot silently mark\s+it\s+confirmed\./,
    );
    expect(pageSource).toMatch(
      /It cannot book, change, or confirm\s+flights, hotels, reservations, or events\./,
    );
  });

  it("uses the shared authenticated transport and a non-public upload purpose", () => {
    expect(apiSource).toContain("authenticatedFetch");
    expect(apiSource).toContain('cache: "no-store"');
    expect(apiSource).toContain("purpose=kinfolk_journey_private");
    expect(apiSource).toContain("registerAttachment");
  });

  it("uses the API's available readiness state before opening a configured provider", () => {
    expect(apiSource).toContain('availability: "available"');
    expect(pageSource).toContain('connection.availability !== "available"');
    expect(pageSource).not.toContain('connection.availability !== "ready"');
  });

  it("offers an explicit private-document review action without sending attachments to ordinary chat", () => {
    expect(apiSource).toContain("extractPrivateDocument");
    expect(pageSource).toContain("Review private document");
    expect(pageSource).toContain("journeysApi.extractPrivateDocument");
    expect(pageSource).toContain("message/rfc822");
    expect(pageSource).toContain("text/calendar");
    expect(pageSource).toContain("not shared or used by Kinfolk chat");
  });

  it("makes reminder records private and does not imply delivery is active", () => {
    expect(apiSource).toContain("addReminder");
    expect(pageSource).toContain("Private reminders");
    expect(pageSource).toMatch(
      /Delivery is not active until a future\s+release\s+has your separate\s+notification permission\./,
    );
    expect(pageSource).toContain("Save private reminder");
  });

  it("offers an advisory-only flight watch with pause, revoke, and removal controls", () => {
    expect(apiSource).toContain("addFlightWatch");
    expect(apiSource).toContain("updateFlightWatch");
    expect(apiSource).toContain("deleteFlightWatch");
    expect(pageSource).toContain("Flight watch");
    expect(pageSource).toContain("Save private flight watch");
    expect(pageSource).toContain("Revoke consent");
    expect(pageSource).toMatch(
      /Kinfolk never accesses an airline\s+account, booking, PNR, ticket, loyalty account, or payment method\./,
    );
    expect(pageSource).toContain(
      "Confirm with the airline or booking channel.",
    );
  });
});
