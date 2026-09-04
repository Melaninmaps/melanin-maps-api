import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readBusinessDirectoryResponse } from "@/features/businesses/businessDirectoryResponse";
import { canDisplayBusinessCover, getBusinessHeroIcon } from "@/features/businesses/businessHero";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Businesses reliability and trusted hero media", () => {
  it("rejects API error envelopes instead of treating them as discovery results", async () => {
    const response = new Response(JSON.stringify({ error: "Temporary upstream problem" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
    await expect(readBusinessDirectoryResponse(response)).rejects.toThrow("Temporary upstream problem");
  });

  it("rejects malformed successful discovery payloads", async () => {
    const response = new Response(JSON.stringify({ records: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    await expect(readBusinessDirectoryResponse(response)).rejects.toThrow("incomplete response");
  });

  it("shows cover images only for claimed businesses", () => {
    expect(canDisplayBusinessCover({ imageUrl: "https://example.com/demo.jpg", profileStatus: "community_listed" })).toBe(false);
    expect(canDisplayBusinessCover({ imageUrl: "https://example.com/owner.jpg", profileStatus: "claimed" })).toBe(true);
    expect(canDisplayBusinessCover({ imageUrl: "https://example.com/owner.jpg", listingStatus: "live_claimed" })).toBe(true);
    expect(canDisplayBusinessCover({ imageUrl: null, profileStatus: "claimed" })).toBe(false);
  });

  it("selects useful category icon plates", () => {
    expect(getBusinessHeroIcon({ category: "Barber & Beauty" })).toBe("beauty");
    expect(getBusinessHeroIcon({ category: "Restaurant" })).toBe("food");
    expect(getBusinessHeroIcon({ category: "HVAC contractor" })).toBe("home");
  });
});

describe("bounded cross-platform website repairs", () => {
  it("publishes only real member-created events with dates, search, categories, and submission", () => {
    const events = source("../features/events/LocationFirstEvents.tsx");
    const app = source("../App.tsx");
    expect(events).toContain("api/events?");
    expect(events).toContain("event.dateShort");
    expect(events).toContain("Find an event");
    expect(events).toContain("EVENT_CATEGORIES");
    expect(events).toContain("dayOfWeek === 0 ? -1");
    expect(events).toContain('href="/events/submit"');
    expect(app).toContain('path="/events/submit"');
    expect(app).toContain("<SubmitEvent />");
    const submitEvent = source("../pages/submit-event.tsx");
    expect(submitEvent).toContain("function localDateInputValue");
    expect(submitEvent).not.toContain("toISOString().slice(0, 10)");
  });

  it("keeps Safety categories canonical and sends the anonymity choice", () => {
    const safety = source("../pages/safety.tsx");
    expect(safety).toContain("SAFETY_CATEGORY_VALUES[type] ?? \"safety\"");
    expect(safety).toMatch(/severity: severity \|\| "medium", isAnonymous/);
    expect(safety).toContain('category: "police"');
    expect(safety).not.toMatch(/\bfetch\(/);
    expect(safety).not.toContain("No account needed to report");
    expect(safety).toContain("You control report privacy");
    expect(safety).toContain("Moderators can still review signed-in submissions");
  });

  it("simplifies Community posting and removes the duplicate What’s Happening tab", () => {
    const community = source("../pages/community.tsx");
    expect(community).toContain('const TABS = ["Feed", "Events", "Groups"]');
    expect(community).not.toContain("<HappeningPanel");
    expect(community).not.toContain("setPostType");
    expect(community).toContain('placeholder="Tag a place"');
    expect(community).toContain('placeholder="Tag a topic"');
    expect(community).toContain('aria-label="Tag a place"');
    expect(community).toContain('aria-label="Tag a topic"');
    expect(community).toContain("Community guidance");
  });

  it("opens members on Discover and repairs legacy website routes", () => {
    const home = source("../pages/home.tsx");
    const app = source("../App.tsx");
    const layout = source("../components/layout.tsx");
    expect(home).toContain('navigate("/discover", { replace: true })');
    expect(app).toContain('<Route path="/businesses/submit"><Redirect to="/submit-business" /></Route>');
    expect(app).toContain('<Route path="/health-hub"><Redirect to="/wellness" /></Route>');
    expect(layout).not.toContain('{ href: "/connections", label: "Connections" }');
  });

  it("moves the map to selected cultural layers and always exposes recenter", () => {
    const map = source("../pages/map.tsx");
    expect(map).toContain("function selectLegendLayer");
    expect(map).toContain("map.fitBounds(bounds");
    expect(map).toContain("Recenter");
    expect(map).toContain("userCoords ?? { lat: 39.9526, lng: -75.1652 }");
  });
});
