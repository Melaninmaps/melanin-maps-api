import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const routeSource = readFileSync(fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)), "utf8");
const migrationSource = readFileSync(fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)), "utf8");
const mobileSource = readFileSync(`${root}artifacts/mobile/components/AIChatWidget.tsx`, "utf8");
const webSource = readFileSync(`${root}artifacts/web/src/pages/travel.tsx`, "utf8");

describe("Kinfolk response feedback contract", () => {
  it("persists a revocable member response signal without injecting it into answer prompts", () => {
    expect(routeSource).toContain('router.put("/kinfolk/response-feedback"');
    expect(routeSource).toContain('router.delete("/kinfolk/response-feedback/:messageId"');
    expect(routeSource).toContain("automaticallyChangesKinfolk: false");
    expect(routeSource).not.toContain("buildKinfolkResponseFeedbackPrompt");
    expect(migrationSource).toContain('name: "kinfolk_feedback_flywheel_v1"');
    expect(migrationSource).toContain("UNIQUE (user_id, message_id)");
  });

  it("renders helpful, not-helpful, needs-more-help, and revoke controls on web and native", () => {
    for (const source of [webSource, mobileSource]) {
      expect(source).toContain("I need more help");
      expect(source).toContain("Remove feedback");
      expect(source).toContain("needs_more_help");
      expect(source).toContain("api/kinfolk/response-feedback");
    }
  });
});
