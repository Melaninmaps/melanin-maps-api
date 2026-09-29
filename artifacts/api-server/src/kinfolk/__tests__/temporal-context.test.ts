import { describe, expect, it } from "vitest";
import { buildKinfolkTemporalContext } from "../temporal-context";

const now = new Date("2026-09-29T00:30:00.000Z");

describe("Kinfolk temporal context", () => {
  it("uses the valid active client time zone for every ordinary answer", () => {
    const context = buildKinfolkTemporalContext({
      clientTimeZone: "America/Chicago",
      now,
    });

    expect(context).toContain("Monday, September 28, 2026");
    expect(context).toContain("CDT");
    expect(context).toContain("today, tonight, tomorrow, this weekend, next week");
    expect(context).toContain("Do not assume every travel question is before arrival");
    expect(context).toContain("No destination-local clock is active");
  });

  it("falls back safely without trusting an invalid client time zone", () => {
    const context = buildKinfolkTemporalContext({
      clientTimeZone: "not-a-timezone",
      now,
    });

    expect(context).toContain("UTC");
    expect(context).not.toContain("not-a-timezone");
  });

  it("keeps the destination clock only for an already location-aware current turn", () => {
    const context = buildKinfolkTemporalContext({
      clientTimeZone: "America/New_York",
      destinationLocalTimeContext: [
        "SERVER-RESOLVED LOCAL TIME — AUTHORITATIVE FOR LOCATION FEATURES:",
        "At response generation, it is Monday, Sep 28, 7:30 PM CDT in Minneapolis (America/Chicago).",
        "Use this destination-local clock for arrival, event, reminder, open/close, and time-sensitive guidance. Never substitute the server, browser, or device clock.",
      ].join("\n"),
      now,
    });

    expect(context).toContain("member's active time zone (America/New_York)");
    expect(context).toContain("Minneapolis (America/Chicago)");
    expect(context).not.toContain("SERVER-RESOLVED LOCAL TIME — AUTHORITATIVE FOR LOCATION FEATURES:");
  });
});
