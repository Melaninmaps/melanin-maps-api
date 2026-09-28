import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const source = readFileSync(`${root}/artifacts/web/src/pages/travel.tsx`, "utf8");

describe("Kinfolk web answer copy contract", () => {
  it("offers a copy action for every rendered assistant answer without copying private metadata", () => {
    expect(source).toContain("const copyAnswer = (content: string)");
    expect(source).toContain("navigator.clipboard.writeText(content)");
    expect(source).toContain('aria-label="Copy this Kinfolk answer"');
    expect(source).toContain("never session metadata, private-memory context");
  });

  it("retains and confirms server-proposed Kinfolk reminders", () => {
    expect(source).toContain("taskAction?: KinfolkTaskAction | null");
    expect(source).toContain("taskAction: data.taskAction ?? null");
    expect(source).toContain("const saveTaskAction = async");
    expect(source).toContain("Save reminder");
    expect(source).toContain("api/kinfolk/tasks");
  });
});
