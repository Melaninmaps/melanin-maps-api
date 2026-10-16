import { describe, expect, it } from "vitest";
import {
  DELETE_QUEUE_HOLD_DAYS,
  deleteQueueConfirmation,
  getDeleteQueueEligibleAt,
  isDeleteQueueEligible,
  removeFromDeleteQueueConfirmation,
} from "../deleteQueue";

describe("Delete Queue hold policy", () => {
  it("sets eligibility exactly seven days after a record enters the reversible queue", () => {
    const queuedAt = new Date("2026-10-16T16:00:00.000Z");
    const eligibleAt = getDeleteQueueEligibleAt(queuedAt);

    expect(DELETE_QUEUE_HOLD_DAYS).toBe(7);
    expect(eligibleAt.toISOString()).toBe("2026-10-23T16:00:00.000Z");
    expect(isDeleteQueueEligible(eligibleAt, new Date("2026-10-23T15:59:59.999Z"))).toBe(false);
    expect(isDeleteQueueEligible(eligibleAt, new Date("2026-10-23T16:00:00.000Z"))).toBe(true);
  });

  it("requires explicit, count-specific queue and hold-removal confirmations", () => {
    expect(deleteQueueConfirmation(1)).toBe("MOVE 1 BUSINESS TO DELETE QUEUE");
    expect(deleteQueueConfirmation(2)).toBe("MOVE 2 BUSINESSES TO DELETE QUEUE");
    expect(removeFromDeleteQueueConfirmation(1)).toBe("REMOVE 1 BUSINESS FROM DELETE QUEUE");
    expect(removeFromDeleteQueueConfirmation(2)).toBe("REMOVE 2 BUSINESSES FROM DELETE QUEUE");
  });
});
