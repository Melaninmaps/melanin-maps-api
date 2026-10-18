import { describe, expect, it } from "vitest";
import {
  kinfolkContinuityStatus,
  resolveKinfolkContinuityUpdate,
} from "../continuity-consent-policy";

describe("Kinfolk universal continuity consent policy", () => {
  it.each([
    ["no settings row", undefined],
    [
      "legacy settings row without a decision",
      { enabled: true, decision: null },
    ],
    ["settings row with a missing decision field", { enabled: false }],
  ])("treats %s as undecided", (_scenario, settings) => {
    expect(kinfolkContinuityStatus(settings)).toMatchObject({
      enabled: false,
      disclosureRequired: true,
      decision: null,
    });
  });

  it("honors accepted and declined decisions independently from historical rows", () => {
    expect(
      kinfolkContinuityStatus({ enabled: true, decision: "accepted" }),
    ).toMatchObject({
      enabled: true,
      disclosureRequired: false,
      decision: "accepted",
    });
    expect(
      kinfolkContinuityStatus({ enabled: true, decision: "declined" }),
    ).toMatchObject({
      enabled: false,
      disclosureRequired: false,
      decision: "declined",
    });
  });

  it("never derives a first decision from a toggle value", () => {
    expect(
      resolveKinfolkContinuityUpdate({
        currentDecision: null,
        requestedDecision: null,
        enabled: true,
      }),
    ).toMatchObject({
      ok: false,
      code: "KINFOLK_CONTINUITY_DECISION_REQUIRED",
    });
    expect(
      resolveKinfolkContinuityUpdate({
        currentDecision: null,
        requestedDecision: null,
        enabled: false,
      }),
    ).toMatchObject({
      ok: false,
      code: "KINFOLK_CONTINUITY_DECISION_REQUIRED",
    });
  });

  it("requires a new explicit acceptance before a declined member can enable continuity", () => {
    expect(
      resolveKinfolkContinuityUpdate({
        currentDecision: "declined",
        requestedDecision: null,
        enabled: true,
      }),
    ).toMatchObject({
      ok: false,
      code: "KINFOLK_CONTINUITY_ACCEPTANCE_REQUIRED",
    });
    expect(
      resolveKinfolkContinuityUpdate({
        currentDecision: "declined",
        requestedDecision: "accepted",
        enabled: true,
      }),
    ).toEqual({ ok: true, decision: "accepted" });
  });

  it("allows a previously accepted member to pause and resume without rewriting the decision", () => {
    expect(
      resolveKinfolkContinuityUpdate({
        currentDecision: "accepted",
        requestedDecision: null,
        enabled: false,
      }),
    ).toEqual({ ok: true, decision: "accepted" });
    expect(
      resolveKinfolkContinuityUpdate({
        currentDecision: "accepted",
        requestedDecision: null,
        enabled: true,
      }),
    ).toEqual({ ok: true, decision: "accepted" });
  });
});
