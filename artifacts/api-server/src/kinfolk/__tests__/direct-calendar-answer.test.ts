import { describe, expect, it } from "vitest";
import {
  answerDirectKinfolkCalendarDate,
  isDirectKinfolkCalendarDateQuestion,
} from "../direct-calendar-answer";

describe("direct Kinfolk calendar answers", () => {
  it.each([
    "What is the date today?",
    "Today's date",
    "What day is it?",
    "What weekday and calendar date will tomorrow be in Minneapolis?",
    "What's tomorrow's date?",
  ])("recognizes a direct calendar question: %s", (message) => {
    expect(isDirectKinfolkCalendarDateQuestion(message)).toBe(true);
  });

  it.each([
    "Is this information current as of today?",
    "I want to plan dinner tomorrow in Minneapolis.",
  ])("does not intercept a planning or freshness question: %s", (message) => {
    expect(isDirectKinfolkCalendarDateQuestion(message)).toBe(false);
  });

  it("uses the client-local calendar day instead of the server clock", () => {
    const now = new Date("2026-09-29T00:30:00.000Z");
    expect(answerDirectKinfolkCalendarDate({
      message: "What is the date today?",
      clientTimeZone: "America/New_York",
      now,
    })).toBe("Today is Monday, September 28, 2026.");
  });

  it("calculates tomorrow from the local calendar without leaking into web research", () => {
    const now = new Date("2026-09-29T00:30:00.000Z");
    expect(answerDirectKinfolkCalendarDate({
      message: "What weekday and calendar date will tomorrow be in Minneapolis?",
      clientTimeZone: "America/Chicago",
      now,
    })).toBe("Tomorrow will be Tuesday, September 29, 2026.");
  });

  it("safely falls back when a client sends an invalid timezone", () => {
    const now = new Date("2026-09-29T00:30:00.000Z");
    expect(answerDirectKinfolkCalendarDate({
      message: "Today's date",
      clientTimeZone: "not-a-timezone",
      now,
    })).toBe("Today is Tuesday, September 29, 2026.");
  });
});
