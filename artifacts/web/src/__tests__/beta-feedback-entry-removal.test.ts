import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync(new URL("../components/layout.tsx", import.meta.url), "utf8");
const legacyFeedback = readFileSync(new URL("../components/FeedbackButton.tsx", import.meta.url), "utf8");
const admin = readFileSync(new URL("../pages/admin.tsx", import.meta.url), "utf8");

describe("public Beta Feedback retirement", () => {
  it("removes the member-facing floating Beta Feedback entry point without deleting the historical feedback implementation", () => {
    expect(layout).not.toContain('import { FeedbackButton } from "./FeedbackButton"');
    expect(layout).not.toContain("<FeedbackButton />");
    expect(legacyFeedback).toContain('export function FeedbackButton()');
    expect(admin).toContain("<AdminFeedbackTab />");
  });
});
