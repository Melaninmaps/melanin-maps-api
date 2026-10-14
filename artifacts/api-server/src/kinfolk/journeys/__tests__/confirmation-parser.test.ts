import { describe, expect, it } from "vitest";
import { parseJourneyConfirmationText } from "../confirmation-parser";

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
});
