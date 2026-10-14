import { describe, expect, it } from "vitest";
import {
  CONNECTED_APP_CATALOG,
  buildContextualConnectedAppsPrompt,
  connectedAppByKey,
  contextualConnectedApps,
} from "../catalog";

describe("Connected Apps catalog", () => {
  it("covers travel, health, finance, and everyday-life boundaries without claiming unsupported access", () => {
    expect(new Set(CONNECTED_APP_CATALOG.map((app) => app.category))).toEqual(
      new Set(["travel", "health", "finance", "everyday"]),
    );
    expect(connectedAppByKey("apple_wallet")?.availability).toBe("unsupported");
    expect(connectedAppByKey("google_wallet")?.authorizationMode).toBe(
      "unsupported",
    );
    expect(connectedAppByKey("mychart_epic")?.sensitive).toBe(true);
    expect(connectedAppByKey("plaid")?.boundary).toMatch(/No payments/i);
  });

  it("offers contextual prompts without creating authorization or hidden imports", () => {
    const travel = contextualConnectedApps(
      "My flight and hotel confirmation changed",
    );
    expect(travel.map((app) => app.key)).toContain("airline_confirmation");
    expect(travel.map((app) => app.key)).toContain("selected_files");

    const health = contextualConnectedApps(
      "I have a Dr appointment and questions about my BP labs",
    );
    expect(health.map((app) => app.key)).toEqual(
      expect.arrayContaining(["mychart_epic", "apple_health"]),
    );
    expect(health.every((app) => app.boundary.length > 20)).toBe(true);
  });

  it("prioritizes a selected flight confirmation before broader travel prompts", () => {
    expect(
      contextualConnectedApps("I have a flight booked next week")[0]?.key,
    ).toBe("airline_confirmation");
  });

  it("offers an optional review prompt without starting a provider connection", () => {
    const flight = buildContextualConnectedAppsPrompt(
      "My flight confirmation changed",
    );
    expect(flight?.appKeys).toContain("airline_confirmation");
    expect(flight?.description).toMatch(/Nothing connects or imports/i);

    const health = buildContextualConnectedAppsPrompt(
      "I need help preparing for a doctor appointment",
    );
    expect(health?.description).toMatch(/purpose-specific review/i);
    expect(health?.appKeys).toContain("mychart_epic");
  });

  it("covers member-selected creative, learning, and media context without account access", () => {
    const keys = CONNECTED_APP_CATALOG.map((entry) => entry.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "spotify",
        "youtube",
        "tiktok",
        "pinterest",
        "goodreads",
        "canva",
        "adobe",
        "course_calendar",
      ]),
    );

    const prompt = buildContextualConnectedAppsPrompt(
      "Help me fit my course calendar and reading plan into the week",
    );
    expect(prompt?.appKeys).toContain("course_calendar");
    expect(prompt?.description).toContain("Nothing connects or imports");
  });
});
