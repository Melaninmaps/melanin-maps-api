import { describe, expect, it } from "vitest";
import {
  BUSINESS_DELETION_HOLD_DAYS,
  BUSINESS_DELETION_HOLD_REASON,
  ensureBusinessDeletionHoldSchema,
  sevenDaysFrom,
} from "../businessDeletionHold";

describe("business deletion hold", () => {
  it("sets a precise seven-day recovery deadline", () => {
    const requestedAt = new Date("2026-10-14T20:00:00.000Z");
    expect(BUSINESS_DELETION_HOLD_DAYS).toBe(7);
    expect(sevenDaysFrom(requestedAt).toISOString()).toBe(
      "2026-10-21T20:00:00.000Z",
    );
    expect(BUSINESS_DELETION_HOLD_REASON).toContain("seven days");
  });

  it("provisions pending, blocked, and immutable deletion-hold records", async () => {
    const statements: string[] = [];
    const client = {
      query: async (statement: string) => {
        statements.push(statement);
        return { rows: [] };
      },
    };
    await ensureBusinessDeletionHoldSchema(client);
    expect(statements.join("\n")).toContain("business_deletion_holds");
    expect(statements.join("\n")).toContain("state IN ('pending', 'blocked')");
    expect(statements.join("\n")).toContain("business_deletion_hold_events");
    expect(statements.join("\n")).toContain(
      "business_deletion_hold_events are immutable",
    );
    expect(statements.join("\n")).toContain(
      "business_permanent_deletion_audit_events",
    );
  });
});
