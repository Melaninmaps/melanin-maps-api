import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hook = readFileSync(new URL("../hooks/useItineraries.ts", import.meta.url), "utf8");
const screen = readFileSync(new URL("../app/my-trips.tsx", import.meta.url), "utf8");
const organizer = readFileSync(new URL("../components/TripItineraryOrganizer.tsx", import.meta.url), "utf8");

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
    for (const boundary of ["chat/memory", "profile, discovery/Map/Directory/Community/Safety", "calendar, hotels, events, documents, tasks/reminders, analytics, or", "exact address, location, or coordinates"]) {
      expect(screen).toContain(boundary);
    }
  });

  it("adds a confirmed account-backed private manual itinerary with server ordering, never local persistence", () => {
    expect(screen).toContain("TripItineraryOrganizer tripId={selected.id}");
    for (const contract of ["useTripItinerary", "cache: \"no-store\"", "createEntry", "updateEntry", "deleteEntry", "reorderEntries", "entryIds, memberConfirmed: true"]) {
      expect(hook).toContain(contract);
    }
    expect(hook).not.toContain("@react-native-async-storage/async-storage");
    expect(organizer).toContain('accessibilityLabel="Confirm private itinerary save"');
    expect(organizer).toContain("reorderEntries(ordered.map((current) => current.id), true)");
    expect(organizer).toContain("deleteEntry(entry.id, true)");
  });

  it("adds a selected-Trip Temporary Stay link control that uses the nested private API, safe metadata, and confirmation", () => {
    for (const contract of ["useTripTemporaryStays", "temporary-stays", "temporaryStayId: stayId, memberConfirmed: true", "method: \"POST\"", "method: \"DELETE\"", "cache: \"no-store\""]) {
      expect(hook).toContain(contract);
    }
    for (const contract of ["TripTemporaryStayManager tripId={selected.id}", "Temporary Stay (optional)", 'accessibilityLabel="Confirm Temporary Stay link"', "Alert.alert(\"Unlink Temporary Stay?\"", "Arrival {formatDate(stay.arrivalDate)}", "Departure {formatDate(stay.departureDate)}", "Expires {formatDate(stay.expiresAt)}"]) {
      expect(screen).toContain(contract);
    }
    for (const boundary of ["neither sends it to Kinfolk chat or memory", "nearby search, calendar, booking, provider, reminders, sharing", "Map, Directory, Community, Safety, or analytics", "Creation and its Google disclosure remain in Settings"]) {
      expect(screen).toContain(boundary);
    }
    expect(screen).not.toContain("exactAddress");
  });

  it("keeps the itinerary visibly private/manual with no booking, notification, sharing, or automatic use", () => {
    for (const boundary of ["do not schedule, book, notify, share, or automatically use any service", "Kinfolk chat or memory, profile, discovery, Map, Directory, Community, Safety", "providers, calendars, flights, hotels, events, documents, tasks, reminders, or analytics", "public share link"]) {
      expect(organizer).toContain(boundary);
    }
    expect(organizer).not.toContain("api/kinfolk/chat");
    expect(organizer).not.toContain("AsyncStorage");
  });
});
