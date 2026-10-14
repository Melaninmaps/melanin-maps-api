import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hook = readFileSync(new URL("../hooks/useItineraries.ts", import.meta.url), "utf8");
const screen = readFileSync(new URL("../app/my-trips.tsx", import.meta.url), "utf8");

describe("native account-backed private Trips", () => {
  it("uses the authenticated API rather than AsyncStorage for the canonical lifecycle", () => {
    expect(hook).toContain('import { getApiBase, getMemberApiHeaders } from "@/lib/api";');
    expect(hook).toContain('fetch(`${getApiBase()}/api/kinfolk/trips${path}`');
    expect(hook).toContain("getMemberApiHeaders()");
    expect(hook).toContain('credentials: Platform.OS === "web" ? "include" : undefined');
    expect(hook).not.toContain("@react-native-async-storage/async-storage");
    expect(hook).not.toContain("AsyncStorage.");
    expect(hook).not.toContain("setItemAsync");
    expect(hook).not.toContain("removeItemAsync");
  });

  it("requires explicit controls for create, edit, and delete requests", () => {
    expect(hook).toContain("if (!memberConfirmed) throw new Error");
    expect(hook.match(/memberConfirmed: true/g)?.length).toBeGreaterThanOrEqual(3);
    expect(screen).toContain('accessibilityLabel="Confirm private Trip save"');
    expect(screen).toContain("await createItinerary(title, notes, destination, true)");
    expect(screen).toContain("await updateItinerary(selected.id, { name: title, destination, notes }, true)");
    expect(screen).toContain("await deleteItinerary(item.id, true)");
  });

  it("labels legacy local data truthfully and declares no automatic cross-feature integration", () => {
    expect(screen).toContain("Older device-only Saved Trips, if any, remain in this device");
    expect(screen).toContain("They were not moved to your account or deleted.");
    for (const boundary of ["chat/memory", "profile, discovery/Map/Directory/Community/Safety", "flights, hotels, events, documents, tasks/reminders, analytics, or", "exact address, location, or coordinates"]) {
      expect(screen).toContain(boundary);
    }
  });
});
