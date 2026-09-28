import { describe, expect, it } from "vitest";
import { normalizeKinfolkTaskAction } from "../task-action-contract";

describe("Kinfolk task action contract", () => {
  it("accepts a bounded reviewable reminder action without persisting it", () => {
    expect(normalizeKinfolkTaskAction({
      type: "create_task",
      tasks: [{
        title: "Send birthday dinner invitation",
        dueAt: "2026-09-29T14:00:00.000Z",
        dueTimeLabel: "Tomorrow at 9 AM",
        category: "reminder",
      }],
    })).toEqual({
      type: "create_task",
      tasks: [{
        title: "Send birthday dinner invitation",
        notes: null,
        dueAt: "2026-09-29T14:00:00.000Z",
        dueTimeLabel: "Tomorrow at 9 AM",
        category: "reminder",
      }],
    });
  });

  it("rejects malformed, unsaveable, or unsupported task proposals", () => {
    expect(normalizeKinfolkTaskAction({
      type: "create_task",
      tasks: [{ title: "", category: "reminder" }],
    })).toBeNull();
    expect(normalizeKinfolkTaskAction({
      type: "create_task",
      tasks: [{ title: "Call coworker", dueAt: "tomorrow morning", category: "reminder" }],
    })).toBeNull();
    expect(normalizeKinfolkTaskAction({
      type: "schedule_push_notification",
      tasks: [{ title: "Call coworker" }],
    })).toBeNull();
  });
});
