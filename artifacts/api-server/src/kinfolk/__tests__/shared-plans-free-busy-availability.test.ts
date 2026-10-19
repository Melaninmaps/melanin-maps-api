import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateSharedPlanFreeBusy,
  SHARED_PLAN_FREE_BUSY_PURPOSE,
} from "../shared-plans/free-busy-availability";

const NOW = new Date("2026-10-19T15:00:00.000Z");
const PLAN = {
  id: "shared-plan-a",
  purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
  startAt: "2026-10-20T12:00:00Z",
  endAt: "2026-10-20T16:00:00Z",
  timeZone: "Etc/UTC",
};

function grant(participantRef: string, patch: Record<string, unknown> = {}) {
  return {
    planId: PLAN.id,
    purpose: SHARED_PLAN_FREE_BUSY_PURPOSE,
    participantRef,
    state: "granted",
    grantedAt: "2026-10-19T14:00:00Z",
    expiresAt: "2026-10-21T00:00:00Z",
    windowStartAt: PLAN.startAt,
    windowEndAt: PLAN.endAt,
    timeZone: "Etc/UTC",
    ...patch,
  };
}

function participant(participantRef: string, busyIntervals: unknown[] = [], grantPatch: Record<string, unknown> = {}) {
  return { participantRef, grant: grant(participantRef, grantPatch), busyIntervals };
}

function request(participants = [
  participant("opaque-member-one", [{ startAt: "2026-10-20T13:00:00Z", endAt: "2026-10-20T14:00:00Z", timeZone: "Etc/UTC" }]),
  participant("opaque-member-two", [{ startAt: "2026-10-20T14:00:00Z", endAt: "2026-10-20T15:00:00Z", timeZone: "Etc/UTC" }]),
  participant("opaque-manual-invite", []),
]) {
  return { plan: { ...PLAN }, participants, minimumAvailable: 2 };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  }
  return value;
}

describe("Shared Plan free/busy availability policy", () => {
  it("returns only aggregate candidate windows and minimum-availability outcome", () => {
    expect(evaluateSharedPlanFreeBusy(request(), NOW)).toEqual({
      participantCount: 3,
      minimumAvailable: 2,
      minimumAvailabilityMet: true,
      candidateWindows: [
        { startAt: "2026-10-20T12:00:00.000Z", endAt: "2026-10-20T13:00:00.000Z", timeZone: "Etc/UTC", availableCount: 3 },
        { startAt: "2026-10-20T13:00:00.000Z", endAt: "2026-10-20T15:00:00.000Z", timeZone: "Etc/UTC", availableCount: 2 },
        { startAt: "2026-10-20T15:00:00.000Z", endAt: "2026-10-20T16:00:00.000Z", timeZone: "Etc/UTC", availableCount: 3 },
      ],
    });
  });

  it("reports an aggregate threshold without revealing any participant availability", () => {
    const input = { ...request(), minimumAvailable: 3 };
    const result = evaluateSharedPlanFreeBusy(input, NOW);
    expect(result).toMatchObject({ participantCount: 3, minimumAvailable: 3, minimumAvailabilityMet: true });
    expect(JSON.stringify(result)).not.toContain("opaque-member-one");
    expect(JSON.stringify(result)).not.toContain("opaque-member-two");
    expect(JSON.stringify(result)).not.toContain("opaque-manual-invite");
    expect(Object.keys(result!)).toEqual(["participantCount", "minimumAvailable", "minimumAvailabilityMet", "candidateWindows"]);
    expect(Object.keys(result!.candidateWindows[0]!)).toEqual(["startAt", "endAt", "timeZone", "availableCount"]);
  });

  it("returns false when no candidate reaches the requested threshold", () => {
    const members = [
      participant("opaque-member-one", [{ startAt: PLAN.startAt, endAt: PLAN.endAt, timeZone: "Etc/UTC" }]),
      participant("opaque-member-two", []),
      participant("opaque-manual-invite", []),
    ];
    expect(evaluateSharedPlanFreeBusy({ plan: { ...PLAN }, participants: members, minimumAvailable: 3 }, NOW)).toEqual({
      participantCount: 3,
      minimumAvailable: 3,
      minimumAvailabilityMet: false,
      candidateWindows: [
        { startAt: "2026-10-20T12:00:00.000Z", endAt: "2026-10-20T16:00:00.000Z", timeZone: "Etc/UTC", availableCount: 2 },
      ],
    });
  });

  it("accepts an exact active grant and remains deterministic for injected time", () => {
    const input = request();
    expect(evaluateSharedPlanFreeBusy(input, NOW)).toEqual(evaluateSharedPlanFreeBusy(input, new Date(NOW)));
    expect(JSON.stringify(input)).toBe(JSON.stringify(request()));
    expect(evaluateSharedPlanFreeBusy(input, new Date("2026-10-21T00:00:00.000Z"))).toBeNull();
    expect(evaluateSharedPlanFreeBusy(input, new Date("invalid"))).toBeNull();
  });

  it("does not normalize plan or participant scope identifiers into an authorization match", () => {
    expect(evaluateSharedPlanFreeBusy({
      ...request(),
      plan: { ...PLAN, id: " shared-plan-a " },
      participants: [participant("opaque-member-one", [], { planId: "shared-plan-a" })],
      minimumAvailable: 1,
    }, NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy(request([
      {
        participantRef: " opaque-member-one ",
        grant: grant("opaque-member-one"),
        busyIntervals: [],
      },
    ]), NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy(request([
      participant("opaque-member-one", [], { participantRef: "ｏpaque-member-one" }),
    ]), NOW)).toBeNull();
  });

  it("supports a manually supplied free/busy participant without a relationship or calendar field", () => {
    const manual = participant("external-invite-opaque", [
      { startAt: "2026-10-20T12:30:00Z", endAt: "2026-10-20T13:00:00Z", timeZone: "Etc/UTC" },
    ]);
    const result = evaluateSharedPlanFreeBusy({
      plan: { ...PLAN },
      participants: [manual, participant("other-opaque", [])],
      minimumAvailable: 2,
    }, NOW);
    expect(result).toEqual({
      participantCount: 2,
      minimumAvailable: 2,
      minimumAvailabilityMet: true,
      candidateWindows: [
        { startAt: "2026-10-20T12:00:00.000Z", endAt: "2026-10-20T12:30:00.000Z", timeZone: "Etc/UTC", availableCount: 2 },
        { startAt: "2026-10-20T12:30:00.000Z", endAt: "2026-10-20T13:00:00.000Z", timeZone: "Etc/UTC", availableCount: 1 },
        { startAt: "2026-10-20T13:00:00.000Z", endAt: "2026-10-20T16:00:00.000Z", timeZone: "Etc/UTC", availableCount: 2 },
      ],
    });
  });

  it("requires every grant and normalized busy interval to use the exact named plan zone", () => {
    expect(evaluateSharedPlanFreeBusy(request([
      participant("opaque-member-one", [], { timeZone: "America/New_York" }),
    ]), NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy(request([
      participant("opaque-member-one", [{ startAt: "2026-10-20T13:00:00Z", endAt: "2026-10-20T14:00:00Z", timeZone: "America/New_York" }]),
    ]), NOW)).toBeNull();
  });

  it("fails closed for pending, declined, revoked, future, expired, cross-plan, cross-purpose, and cross-participant grants", () => {
    for (const patch of [
      { state: "pending" },
      { state: "declined" },
      { state: "revoked" },
      { grantedAt: "2026-10-20T00:00:00Z" },
      { expiresAt: "2026-10-19T15:00:00Z" },
      { planId: "different-plan" },
      { purpose: "event_details" },
      { participantRef: "other-participant" },
    ]) {
      expect(evaluateSharedPlanFreeBusy(request([participant("opaque-member-one", [], patch)]), NOW)).toBeNull();
    }
  });

  it("fails closed for malformed, unknown-zone, inverted, out-of-window, overlapping, and unbounded intervals", () => {
    const invalidParticipants = [
      participant("opaque-member-one", [{ startAt: "not-a-time", endAt: PLAN.endAt, timeZone: "Etc/UTC" }]),
      participant("opaque-member-one", [{ startAt: PLAN.startAt, endAt: PLAN.endAt, timeZone: "Unknown/Zone" }]),
      participant("opaque-member-one", [{ startAt: "2026-10-20T15:00:00Z", endAt: "2026-10-20T14:00:00Z", timeZone: "Etc/UTC" }]),
      participant("opaque-member-one", [{ startAt: "2026-10-20T11:00:00Z", endAt: "2026-10-20T13:00:00Z", timeZone: "Etc/UTC" }]),
      participant("opaque-member-one", [
        { startAt: "2026-10-20T13:00:00Z", endAt: "2026-10-20T14:30:00Z", timeZone: "Etc/UTC" },
        { startAt: "2026-10-20T14:00:00Z", endAt: "2026-10-20T15:00:00Z", timeZone: "Etc/UTC" },
      ]),
      participant("opaque-member-one", [{ startAt: PLAN.startAt, timeZone: "Etc/UTC" }]),
    ];
    for (const invalid of invalidParticipants) {
      expect(evaluateSharedPlanFreeBusy(request([invalid]), NOW)).toBeNull();
    }
  });

  it("rejects malformed plan scope, nonmatching grant windows, duplicate participants, and invalid thresholds", () => {
    expect(evaluateSharedPlanFreeBusy({ ...request(), plan: { ...PLAN, endAt: "2026-10-20T12:00:00Z" } }, NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy({ ...request(), plan: { ...PLAN, timeZone: "Unknown/Zone" } }, NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy(request([participant("opaque-member-one", [], { windowEndAt: "2026-10-20T15:00:00Z" })]), NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy(request([participant("same"), participant("same")]), NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy(request([participant("same"), participant(" same ")]), NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy({ ...request(), minimumAvailable: 0 }, NOW)).toBeNull();
    expect(evaluateSharedPlanFreeBusy({ ...request(), minimumAvailable: 4 }, NOW)).toBeNull();
  });

  it("does not mutate frozen nested input while calculating aggregate windows", () => {
    const input = deepFreeze(request());
    expect(evaluateSharedPlanFreeBusy(input, NOW)).toMatchObject({ participantCount: 3, minimumAvailabilityMet: true });
  });

  it("rejects recurrence, unbounded, bearer-link, and forbidden event/detail/location/flight/itinerary/calendar fields", () => {
    const cases = [
      { plan: { ...PLAN, title: "Private dinner" }, participants: request().participants, minimumAvailable: 2 },
      { plan: { ...PLAN }, participants: [participant("opaque-member-one", [{ startAt: PLAN.startAt, endAt: PLAN.endAt, timeZone: "Etc/UTC", recurrence: "weekly" }])], minimumAvailable: 1 },
      { plan: { ...PLAN }, participants: [participant("opaque-member-one", [], { bearerLink: "secret" })], minimumAvailable: 1 },
      { plan: { ...PLAN }, participants: [{ ...participant("opaque-member-one"), eventTitle: "Appointment" }], minimumAvailable: 1 },
      { plan: { ...PLAN }, participants: [{ ...participant("opaque-member-one"), details: "personal" }], minimumAvailable: 1 },
      { plan: { ...PLAN }, participants: [{ ...participant("opaque-member-one"), location: "Home" }], minimumAvailable: 1 },
      { plan: { ...PLAN }, participants: [{ ...participant("opaque-member-one"), flightNumber: "AA100" }], minimumAvailable: 1 },
      { plan: { ...PLAN }, participants: [{ ...participant("opaque-member-one"), itinerary: "Private trip" }], minimumAvailable: 1 },
      { plan: { ...PLAN }, participants: [{ ...participant("opaque-member-one"), calendarId: "calendar-secret" }], minimumAvailable: 1 },
    ];
    for (const input of cases) expect(evaluateSharedPlanFreeBusy(input, NOW)).toBeNull();
  });

  it("rejects non-enumerable and symbol forbidden fields instead of treating them as an exact input", () => {
    const nonEnumerablePlan = request();
    Object.defineProperty(nonEnumerablePlan.plan, "title", { value: "Hidden detail", enumerable: false });
    expect(evaluateSharedPlanFreeBusy(nonEnumerablePlan, NOW)).toBeNull();
    const symbolicParticipant = request();
    Object.defineProperty(symbolicParticipant.participants[0]!, Symbol("calendar"), { value: "hidden", enumerable: true });
    expect(evaluateSharedPlanFreeBusy(symbolicParticipant, NOW)).toBeNull();
    const accessorGrant = request();
    Object.defineProperty(accessorGrant.participants[0]!.grant, "details", { get: () => "Hidden", enumerable: true });
    expect(evaluateSharedPlanFreeBusy(accessorGrant, NOW)).toBeNull();
  });

  it("fails closed instead of throwing for revoked reflective input", () => {
    const reflectivePlan = Proxy.revocable({ ...PLAN }, {});
    const input = request();
    reflectivePlan.revoke();
    Object.defineProperty(input, "plan", { value: reflectivePlan.proxy, enumerable: true });
    const evaluate = () => evaluateSharedPlanFreeBusy(input, NOW);
    expect(evaluate).not.toThrow();
    expect(evaluate()).toBeNull();
  });

  it("fails closed for sparse participant/busy arrays and decorated array containers", () => {
    const sparseParticipants = { plan: { ...PLAN }, participants: new Array(1), minimumAvailable: 1 };
    expect(evaluateSharedPlanFreeBusy(sparseParticipants, NOW)).toBeNull();
    const sparseBusy = request([participant("opaque-member-one", new Array(1))]);
    expect(evaluateSharedPlanFreeBusy(sparseBusy, NOW)).toBeNull();
    const decoratedParticipants = request();
    Object.defineProperty(decoratedParticipants.participants, "title", { value: "Hidden detail", enumerable: false });
    expect(evaluateSharedPlanFreeBusy(decoratedParticipants, NOW)).toBeNull();
    const symbolicBusy = request();
    Object.defineProperty(symbolicBusy.participants[0]!.busyIntervals, Symbol("calendar"), { value: "hidden", enumerable: true });
    expect(evaluateSharedPlanFreeBusy(symbolicBusy, NOW)).toBeNull();
    const accessorParticipants = request();
    Object.defineProperty(accessorParticipants.participants, "calendarId", { get: () => "hidden", enumerable: true });
    expect(evaluateSharedPlanFreeBusy(accessorParticipants, NOW)).toBeNull();
  });

  it("has an import-free, mutation-free policy boundary with no wall-clock access", () => {
    const source = readFileSync(new URL("../shared-plans/free-busy-availability.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toContain("Date.now(");
    expect(source).not.toMatch(/new Date\(\s*\)/);
    expect(source).toContain("function evaluateSharedPlanFreeBusy(input: unknown, now: Date)");
  });
});
