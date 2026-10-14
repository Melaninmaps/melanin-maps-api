import { describe, expect, it } from "vitest";
import {
  parseJourneyConfirmationText,
  parseJourneyIcs,
} from "../confirmation-parser";

describe("Journey confirmation extraction", () => {
  it("extracts explicit airline facts as review-only fields", () => {
    const parsed = parseJourneyConfirmationText(
      `\nFlight confirmation\nConfirmation: Q9R2TA\nDL 215 JFK -> ATL\n2026-11-14 9:15 AM\n`,
    );
    expect(parsed).toMatchObject({ kind: "flight", reviewRequired: true });
    expect(parsed.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "confirmation_code",
          value: "Q9R2TA",
          confidence: "high",
        }),
        expect.objectContaining({ field: "flight_number", value: "DL215" }),
        expect.objectContaining({ field: "airline", value: "Delta Air Lines" }),
        expect.objectContaining({ field: "origin", value: "JFK" }),
        expect.objectContaining({ field: "destination", value: "ATL" }),
        expect.objectContaining({ field: "start_date", value: "2026-11-14" }),
      ]),
    );
    expect(parsed.warnings.join(" ")).toMatch(/review|confirm/i);
  });

  it("does not invent a booking when content is ambiguous", () => {
    const parsed = parseJourneyConfirmationText(
      "Thinking about going somewhere warm next spring.",
    );
    expect(parsed.kind).toBe("unknown");
    expect(parsed.reviewRequired).toBe(true);
    expect(
      parsed.facts.find((fact) => fact.field === "confirmation_code"),
    ).toBeUndefined();
    expect(parsed.warnings.join(" ")).toMatch(/uncertain|No structured/i);
  });

  it("converts only the first explicit iCalendar event into review-only facts", () => {
    const parsed = parseJourneyIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Atlanta concert
DTSTART:20261103T190000
DTEND:20261103T220000
LOCATION:Downtown venue
END:VEVENT
END:VCALENDAR`);
    expect(parsed).toMatchObject({ kind: "event", reviewRequired: true });
    expect(parsed.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "title", value: "Atlanta concert" }),
        expect.objectContaining({ field: "start_date", value: "2026-11-03" }),
        expect.objectContaining({ field: "location", value: "Downtown venue" }),
      ]),
    );
    expect(parsed.warnings.join(" ")).toMatch(/not written|confirm/i);
  });
});
