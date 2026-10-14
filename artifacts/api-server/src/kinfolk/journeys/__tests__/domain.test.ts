import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertJourneyProvider,
  assertConfirmedItemMutation,
  assertJourneyFeatureEnabled,
  assertJourneyTransition,
  assertValidJourneyInput,
  JourneyActionError,
} from "../domain";
import { getJourneyDeletionPlan } from "../retention";

function errorCode(action: () => unknown): string | null {
  try {
    action();
    return null;
  } catch (error) {
    return error instanceof JourneyActionError ? error.code : null;
  }
}

describe("Kinfolk Journeys domain policy", () => {
  it("accepts only declared Journey providers", () => {
    expect(assertJourneyProvider("google_calendar")).toBe("google_calendar");
    expect(() => assertJourneyProvider("unknown_provider")).toThrow(
      "supported Journey connection",
    );
  });

  afterEach(() => vi.unstubAllEnvs());

  it("stays disabled until the exact source flag is enabled", () => {
    expect(errorCode(() => assertJourneyFeatureEnabled())).toBe(
      "JOURNEYS_DISABLED",
    );
    vi.stubEnv("KINFOLK_JOURNEYS_ENABLED", "true");
    expect(() => assertJourneyFeatureEnabled()).not.toThrow();
  });

  it("enforces date and timezone correctness before persistence", () => {
    expect(
      errorCode(() =>
        assertValidJourneyInput({
          title: "Weekend",
          startDate: "2026-07-12",
          endDate: "2026-07-11",
        }),
      ),
    ).toBe("JOURNEY_INVALID");
    expect(
      assertValidJourneyInput({
        title: "  Philadelphia weekend  ",
        startDate: "2026-07-11",
        endDate: "2026-07-12",
        timeZone: "America/New_York",
      }),
    ).toMatchObject({ title: "Philadelphia weekend" });
  });

  it("permits only lifecycle transitions that preserve a recoverable journey", () => {
    expect(errorCode(() => assertJourneyTransition("draft", "active"))).toBe(
      "JOURNEY_STATE_INVALID",
    );
    expect(() =>
      assertJourneyTransition("review_needed", "confirmed"),
    ).not.toThrow();
    expect(errorCode(() => assertJourneyTransition("deleted", "draft"))).toBe(
      "JOURNEY_STATE_INVALID",
    );
  });

  it("prevents Kinfolk or imports from changing a confirmed commitment", () => {
    expect(
      errorCode(() =>
        assertConfirmedItemMutation({
          existingStatus: "confirmed",
          actor: "import",
          explicitMemberEdit: false,
        }),
      ),
    ).toBe("JOURNEY_CONFIRMED_ITEM_REQUIRES_MEMBER_EDIT");
    expect(() =>
      assertConfirmedItemMutation({
        existingStatus: "confirmed",
        actor: "member",
        explicitMemberEdit: true,
      }),
    ).not.toThrow();
  });

  it("uses typed member-safe errors", () => {
    const error = new JourneyActionError("No access", 404, "JOURNEY_NOT_FOUND");
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(404);
  });

  it("does not disconnect a member provider when only one Journey is deleted", () => {
    expect(getJourneyDeletionPlan("member_delete")).toMatchObject({
      revokeConnections: false,
      deleteImports: true,
      deleteSensitiveItemPayloads: true,
    });
  });
});
