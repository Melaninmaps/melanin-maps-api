import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE,
  type CalendarAvailabilityWindow,
} from "../contracts";
import {
  normalizeGoogleFreeBusy,
  normalizeMicrosoftGraphCalendarView,
  passKnownAvailabilityToAggregate,
  readAndNormalizeAvailability,
} from "../normalizers";

const window: CalendarAvailabilityWindow = {
  startAt: "2026-10-20T09:00:00.000Z",
  endAt: "2026-10-20T12:00:00.000Z",
};
const forbiddenSentinels = [
  "google-calendar-id-SENTINEL",
  "graph-event-id-SENTINEL",
  "Kinfolk-chat-SENTINEL",
  "Map-SENTINEL",
  "Directory-SENTINEL",
  "Community-SENTINEL",
  "Safety-SENTINEL",
  "member-account-SENTINEL",
  "secret-provider-error-SENTINEL",
];

function googleFixture() {
  return {
    timeMin: window.startAt,
    timeMax: window.endAt,
    calendars: {
      "google-calendar-id-SENTINEL": {
        busy: [
          {
            start: "2026-10-20T10:30:00.000Z",
            end: "2026-10-20T11:30:00.000Z",
          },
          {
            start: "2026-10-20T09:30:00.000Z",
            end: "2026-10-20T10:30:00.000Z",
          },
          {
            start: "2026-10-20T11:30:00.000Z",
            end: "2026-10-20T12:30:00.000Z",
          },
        ],
      },
    },
  };
}

function graphFixture() {
  return {
    value: [
      {
        showAs: "free",
        start: { dateTime: "2026-10-20T09:00:00.0000000", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T09:30:00.0000000", timeZone: "UTC" },
      },
      {
        showAs: "workingElsewhere",
        start: { dateTime: "2026-10-20T09:30:00.0000000", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T10:00:00.0000000", timeZone: "UTC" },
      },
      {
        showAs: "tentative",
        start: { dateTime: "2026-10-20T10:00:00.0000000", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T10:30:00.0000000", timeZone: "UTC" },
      },
      {
        showAs: "busy",
        start: { dateTime: "2026-10-20T10:30:00.0000000", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T11:00:00.0000000", timeZone: "UTC" },
      },
      {
        showAs: "oof",
        start: { dateTime: "2026-10-20T11:00:00.0000000", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T11:30:00.0000000", timeZone: "UTC" },
      },
      {
        showAs: "unknown",
        start: { dateTime: "2026-10-20T11:30:00.0000000", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T12:00:00.0000000", timeZone: "UTC" },
      },
    ],
  };
}

function assertNoSentinel(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const sentinel of forbiddenSentinels)
    expect(serialized).not.toContain(sentinel);
}

describe("OAUTH-002 source-only availability normalizers", () => {
  it("keeps the fixture reader disabled by default before it reads or normalizes anything", async () => {
    const read = vi.fn(async () => googleFixture());
    const result = await readAndNormalizeAvailability(
      { read },
      window,
      normalizeGoogleFreeBusy,
    );
    expect(DEFAULT_CALENDAR_AVAILABILITY_FEATURE_GATE.isEnabled()).toBe(false);
    expect(result).toEqual({ kind: "unknown", code: "not-enabled" });
    expect(read).not.toHaveBeenCalled();
  });

  it("normalizes one fake Google FreeBusy calendar into clipped, sorted, coalesced busy-only ranges", () => {
    const result = normalizeGoogleFreeBusy(googleFixture(), window);
    expect(result).toEqual({
      kind: "known",
      window,
      busy: [
        {
          startAt: "2026-10-20T09:30:00.000Z",
          endAt: "2026-10-20T12:00:00.000Z",
          timeZone: "Etc/UTC",
        },
      ],
    });
    assertNoSentinel(result);
  });

  it("fails closed for Google payloads that carry a second calendar or any hostile provider field", () => {
    const multiCalendar = googleFixture() as {
      calendars: Record<
        string,
        { busy: Array<{ start: string; end: string }> }
      >;
    };
    multiCalendar.calendars["second-calendar-SENTINEL"] = { busy: [] };
    const hostile = {
      ...googleFixture(),
      kind: "calendar#freeBusy",
      errors: [{ message: "secret-provider-error-SENTINEL" }],
    };
    expect(normalizeGoogleFreeBusy(multiCalendar, window)).toEqual({
      kind: "unknown",
      code: "invalid-payload",
    });
    expect(normalizeGoogleFreeBusy(hostile, window)).toEqual({
      kind: "unknown",
      code: "invalid-payload",
    });
    assertNoSentinel(normalizeGoogleFreeBusy(hostile, window));
  });

  it("maps synthetic default-calendar Graph free and workingElsewhere records to available and every other permitted status to busy", () => {
    const result = normalizeMicrosoftGraphCalendarView(graphFixture(), window);
    expect(result).toEqual({
      kind: "known",
      window,
      busy: [
        {
          startAt: "2026-10-20T10:00:00.000Z",
          endAt: "2026-10-20T12:00:00.000Z",
          timeZone: "Etc/UTC",
        },
      ],
    });
    assertNoSentinel(result);
  });

  it("fails closed for Graph pagination, sensitive event properties, malformed time zones, and unrecognized availability", () => {
    const paginated = {
      ...graphFixture(),
      "@odata.nextLink": "https://graph.example/secret-provider-error-SENTINEL",
    };
    const sensitive = {
      value: [
        {
          ...graphFixture().value[0],
          id: "graph-event-id-SENTINEL",
          subject: "Kinfolk-chat-SENTINEL",
          body: { content: "Community-SENTINEL" },
          attendees: [{ emailAddress: { address: "member-account-SENTINEL" } }],
          organizer: { emailAddress: { address: "Directory-SENTINEL" } },
          location: { displayName: "Map-SENTINEL" },
          webLink: "https://Safety-SENTINEL.example",
          recurrence: { pattern: {} },
        },
      ],
    };
    const badZone = graphFixture();
    badZone.value[0]!.start.timeZone = "America/New_York";
    const unrecognized = graphFixture();
    unrecognized.value[0]!.showAs = "maybe";
    expect(normalizeMicrosoftGraphCalendarView(paginated, window)).toEqual({
      kind: "unknown",
      code: "incomplete-source-page",
    });
    expect(normalizeMicrosoftGraphCalendarView(sensitive, window)).toEqual({
      kind: "unknown",
      code: "invalid-payload",
    });
    expect(normalizeMicrosoftGraphCalendarView(badZone, window)).toEqual({
      kind: "unknown",
      code: "invalid-payload",
    });
    expect(normalizeMicrosoftGraphCalendarView(unrecognized, window)).toEqual({
      kind: "unknown",
      code: "invalid-payload",
    });
    assertNoSentinel(normalizeMicrosoftGraphCalendarView(paginated, window));
    assertNoSentinel(normalizeMicrosoftGraphCalendarView(sensitive, window));
  });

  it("uses an injected fake reader only under an injected test gate, handles reader failure generically, and never calls global fetch", async () => {
    const fetchSpy = vi.fn(() => {
      throw new Error("network path must remain unreachable");
    });
    vi.stubGlobal("fetch", fetchSpy);
    try {
      const read = vi.fn(async () => googleFixture());
      const result = await readAndNormalizeAvailability(
        { read },
        window,
        normalizeGoogleFreeBusy,
        { isEnabled: () => true },
      );
      expect(result.kind).toBe("known");
      expect(read).toHaveBeenCalledWith(window);
      expect(fetchSpy).not.toHaveBeenCalled();
      const rejected = await readAndNormalizeAvailability(
        {
          read: async () => {
            throw new Error("secret-provider-error-SENTINEL");
          },
        },
        window,
        normalizeGoogleFreeBusy,
        { isEnabled: () => true },
      );
      expect(rejected).toEqual({ kind: "unknown", code: "source-unavailable" });
      assertNoSentinel(rejected);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("passes only purpose, requested window, and normalized busy intervals to an injected aggregate port", () => {
    const result = normalizeGoogleFreeBusy(googleFixture(), window);
    const evaluate = vi.fn(() => ({ aggregate: "safe" }));
    expect(passKnownAvailabilityToAggregate({ evaluate }, result)).toEqual({
      aggregate: "safe",
    });
    expect(evaluate).toHaveBeenCalledWith({
      purpose: "shared_plan_free_busy",
      window,
      busy: [
        {
          startAt: "2026-10-20T09:30:00.000Z",
          endAt: "2026-10-20T12:00:00.000Z",
          timeZone: "Etc/UTC",
        },
      ],
    });
    assertNoSentinel(evaluate.mock.calls[0]);
    expect(
      passKnownAvailabilityToAggregate(
        { evaluate },
        { kind: "unknown", code: "invalid-payload" },
      ),
    ).toBeNull();
  });

  it("contains no network, OAuth, route, storage, client, or cross-feature integration path", () => {
    const root = new URL("..", import.meta.url);
    const source = ["contracts.ts", "normalizers.ts"]
      .map((name) => readFileSync(new URL(name, root), "utf8"))
      .join("\n");
    const executableSource = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    for (const forbidden of [
      /\bfetch\s*\(/,
      /https?:\/\//,
      /\bprocess\.env\b/,
      /\bRouter\b/,
      /@workspace\/db/,
      /\bpool\b/,
      /\bCalendarClient\b/,
      /\b(?:logger|analytics|cache|queue|scheduler)\b/,
      /\b(?:reminder|notification)\b/,
      /journeys\/providers/,
      /private-availability-blocks/,
    ]) {
      expect(executableSource).not.toMatch(forbidden);
    }
  });
});
