import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../pages/trips.tsx", import.meta.url), "utf8");
const organizer = readFileSync(new URL("../components/trip-itinerary-organizer.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const travel = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");

describe("Web private Trip management", () => {
  it("is a reachable authenticated owner page from Kinfolk travel", () => {
    expect(app).toContain('import Trips from "@/pages/trips";');
    expect(app).toContain('<Route path="/trips">');
    expect(app).toContain("<Layout><ProtectedRoute><Trips /></ProtectedRoute></Layout>");
    expect(travel).toContain('Link href="/trips"');
    expect(travel).toContain("Open My private Trips");
  });

  it("uses cookie-authenticated no-store API controls and sends confirmation on every mutation", () => {
    expect(page).toContain('fetch(`${BASE}api/kinfolk/trips`');
    expect(page).toContain('credentials: "include"');
    expect(page).toContain('cache: "no-store"');
    expect(page).toContain('method: selected ? "PUT" : "POST"');
    expect(page).toContain('method: "DELETE"');
    expect(page.match(/memberConfirmed: true/g)?.length).toBeGreaterThanOrEqual(2);
    expect(page).toContain('aria-label="Confirm private Trip save"');
    expect(page).toContain('disabled={!confirmed');
  });

  it("states default non-use, no exact location collection, and keeps ciphertext/key fields out of the UI", () => {
    for (const boundary of ["not automatically used in Kinfolk chat or memory", "profile, discovery, Map, Directory, Community, Safety", "No exact address, location, or coordinates", "providers, analytics, reminders, or sharing"]) {
      expect(page).toContain(boundary);
    }
    for (const secret of ["ciphertext", "encryption key IDs", "fingerprints"]) expect(page).toContain(secret);
    expect(page).not.toContain("api/kinfolk/chat");
    expect(page).not.toContain("shareId");
  });

  it("adds an owner-inspected private manual day-by-day organizer with confirmed lifecycle and durable ordering", () => {
    expect(page).toContain("TripItineraryOrganizer tripId={selected.id}");
    for (const contract of ["/itinerary`", "fetch(endpoint, { credentials: \"include\", cache: \"no-store\"", "method: editing ? \"PUT\" : \"POST\"", "method: \"DELETE\"", "${endpoint}/order", "entryIds: reordered.map"]) {
      expect(organizer).toContain(contract);
    }
    expect(organizer.match(/memberConfirmed: true/g)?.length).toBeGreaterThanOrEqual(3);
    expect(organizer).toContain('aria-label="Confirm private itinerary save"');
    expect(organizer).toContain('window.confirm("Reposition this private itinerary item?');
  });

  it("adds a contained selected-Trip Temporary Stay link control with safe metadata and deliberate link/unlink confirmation", () => {
    expect(page).toContain("Temporary Stay (optional)");
    expect(page).toContain("api/kinfolk/trips/${encodeURIComponent(tripId)}/temporary-stays");
    expect(page).toContain('method: "POST"');
    expect(page).toContain('method: "DELETE"');
    expect(page).toContain("temporaryStayId: stay.id, memberConfirmed: true");
    expect(page).toContain('aria-label="Confirm Temporary Stay link"');
    expect(page).toContain("window.confirm(`Unlink");
    expect(page).toContain("Arrival {new Date(stay.arrivalDate)");
    expect(page).toContain("Departure {new Date(stay.departureDate)");
    expect(page).toContain("Expires {new Date(stay.expiresAt)");
    for (const boundary of ["neither sends it to Kinfolk chat or memory", "nearby search, calendar, booking, provider, reminders, sharing", "Map, Directory, Community, Safety, or analytics", "creation and its Google disclosure remain only in Settings"]) {
      expect(page).toContain(boundary);
    }
    expect(page).not.toContain("exactAddress");
    expect(page).not.toContain("api/kinfolk/temporary-stays");
  });

  it("makes the organizer boundary explicit and does not add public sharing, chat, or automatic service use", () => {
    for (const boundary of ["Private, manual itinerary items do not schedule, book, notify, share, or automatically use any service", "Kinfolk chat or memory, profile, discovery, Map, Directory, Community, Safety", "providers, calendars, flights, hotels, events, documents, tasks, reminders, or analytics", "encryption key IDs, fingerprints, another member&apos;s items, or a public share link"]) {
      expect(organizer).toContain(boundary);
    }
    expect(organizer).not.toContain("api/kinfolk/chat");
    expect(organizer).not.toContain("shareId");
  });
});
