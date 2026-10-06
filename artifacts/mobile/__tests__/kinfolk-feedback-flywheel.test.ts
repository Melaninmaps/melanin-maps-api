import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const widget = readFileSync(`${root}artifacts/mobile/components/AIChatWidget.tsx`, "utf8");
const ownerDashboard = readFileSync(`${root}artifacts/mobile/app/business-owner/index.tsx`, "utf8");

describe("native Kinfolk feedback flywheel", () => {
  it("offers explicit helpful, not-helpful, need, and revoke actions", () => {
    expect(widget).toContain('"helpful" | "not_helpful" | "needs_more_help"');
    expect(widget).toContain("I need more help");
    expect(widget).toContain("Choose a broad topic");
    expect(widget).toContain("Remove feedback");
    expect(widget).toContain('method: "DELETE"');
  });

  it("explains the aggregate-only and no-automatic-learning boundary", () => {
    expect(widget).toContain("does not automatically change Kinfolk");
    expect(widget).toContain("never your name, message, note, or chat transcript");
    expect(widget).toContain("responseFeedbackTopics");
    expect(widget).toContain("responseFeedbackNeedDrafts");
  });

  it("shows owner insights only through the private owner dashboard endpoint", () => {
    expect(ownerDashboard).toContain("kinfolk-community-needs");
    expect(ownerDashboard).toContain("Private Kinfolk community needs");
    expect(ownerDashboard).toContain("no member identity, message, note, transcript");
  });
});
