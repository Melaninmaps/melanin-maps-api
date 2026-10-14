import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("private Trip flight Web contracts", () => {
  it("places owner-confirmed Trip flight controls inside the selected private Trip only", () => {
    const component = read("../components/trip-flight-context.tsx");
    const page = read("../pages/trips.tsx");

    expect(component).toContain("Optional private flight context");
    expect(component).toContain("does not activate status tracking, booking, provider use, Kinfolk chat or memory");
    expect(component).toContain("Do not enter PNRs, booking references, exact addresses, coordinates, or live location.");
    expect(component).toContain("Confirm private flight save");
    expect(component).toContain('fetch(`${endpoint}/available`');
    expect(component).toContain('credentials: "include", cache: "no-store"');
    expect(component).toContain('body: JSON.stringify({ memberConfirmed: true })');
    expect(component).toContain("ciphertext, encryption key IDs, fingerprints");
    expect(component).not.toContain("api/kinfolk/chat");
    expect(component).not.toContain("providerStatus");
    expect(page).toContain('<TripFlightContext tripId={selected.id} />');
    expect(page).toContain("An optional flight may be deliberately attached to a selected private Trip");
  });
});
