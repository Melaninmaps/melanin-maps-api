import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const routeSource = readFileSync(
  fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const migrationSource = readFileSync(
  fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);
const mobileSource = readFileSync(
  `${root}artifacts/mobile/components/AIChatWidget.tsx`,
  "utf8",
);
const webSource = readFileSync(
  `${root}artifacts/web/src/pages/travel.tsx`,
  "utf8",
);

describe("Kinfolk response feedback contract", () => {
  it("persists a member response reaction separately from business feedback", () => {
    expect(routeSource).toContain('router.put("/kinfolk/response-feedback"');
    expect(routeSource).toContain("kinfolkResponseFeedbackTable");
    expect(routeSource).toContain('feedback.reaction === "helpful" || feedback.reaction === "not_helpful"');
    expect(routeSource).toContain("buildKinfolkResponseFeedbackPrompt");
    expect(migrationSource).toContain('name: "kinfolk_response_feedback_v1"');
    expect(migrationSource).toContain("kinfolk_response_feedback");
    expect(migrationSource).toContain("UNIQUE (user_id, message_id)");
  });

  it("renders helpful and not-helpful controls on web and mobile Kinfolk replies", () => {
    expect(webSource).toContain('data-testid="kinfolk-response-feedback"');
    expect(webSource).toContain("What should Kinfolk do better? (optional)");
    expect(webSource).toContain("api/kinfolk/response-feedback");
    expect(mobileSource).toContain("Was this helpful?");
    expect(mobileSource).toContain("What should Kinfolk do better? (optional)");
    expect(mobileSource).toContain("/api/kinfolk/response-feedback");
  });
});
