import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("private Trip flight native contracts", () => {
  it("keeps selected-Trip flight actions deliberate, authenticated, and non-automatic", () => {
    const component = read("../components/TripFlightContext.tsx");
    const hook = read("../hooks/useItineraries.ts");
    const screen = read("../app/my-trips.tsx");

    expect(component).toContain("OPTIONAL PRIVATE FLIGHT CONTEXT");
    expect(component).toContain("does not activate status tracking, booking, provider use, Kinfolk chat or memory");
    expect(component).toContain("Do not enter PNRs, booking references, exact addresses, coordinates, or live location.");
    expect(component).toContain("Confirm private flight save");
    expect(component).toContain("attach and correct");
    expect(component).toContain("unlinkFlight(flight.id, true)");
    expect(component).toContain("deleteFlight(flight.id, true)");
    expect(component).not.toContain("/api/kinfolk/chat");

    expect(hook).toContain('tripRequest(`${path}/available`');
    expect(hook).toContain('body: JSON.stringify({ ...input, memberConfirmed: true })');
    expect(hook).toContain('body: JSON.stringify({ memberConfirmed: true })');
    expect(hook).toContain('cache: "no-store"');
    expect(hook).toContain("getMemberApiHeaders");
    expect(screen).toContain('<TripFlightContext tripId={selected.id} />');
  });

  it("keeps the legacy Flight Tracker on the encrypted confirmation contract without calling status providers", () => {
    const screen = read("../app/travel.tsx");
    expect(screen).toContain('memberConfirmed: true');
    expect(screen).toContain("Confirm private Flight Tracker save");
    expect(screen).toContain("This screen does not activate status tracking, booking, or provider use.");
    expect(screen).toContain('fetch(`${base}/api/travel/flights`');
    expect(screen).not.toContain('fetch(`${base}/api/travel/flights/status`');
  });
});
