import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(new URL("../../routes/kinfolk.ts", import.meta.url), "utf8");
const command = readFileSync(new URL("../../scripts/kinfolkProviderReadiness.ts", import.meta.url), "utf8");

describe("provider readiness entry points", () => {
  it("keeps the network command authenticated, development-only, and probe-backed", () => {
    const start = route.indexOf('router.get("/kinfolk/provider-readiness"');
    const end = route.indexOf('router.post("/kinfolk/speak"', start);
    const block = route.slice(start, end);
    expect(block).toContain("AUTHENTICATION_REQUIRED");
    expect(block).toContain('process.env.NODE_ENV === "production"');
    expect(block).toContain("probeKinfolkProviderReadiness()");
    expect(block).toContain('status === "PASS"');
    expect(block).not.toContain("AI_INTEGRATIONS_OPENAI_API_KEY");
    expect(block).not.toContain("AI_INTEGRATIONS_OPENAI_BASE_URL");
  });

  it("keeps the local command production-refusing and row-only", () => {
    expect(command).toContain('process.env.NODE_ENV === "production"');
    expect(command).toContain("probeKinfolkProviderReadiness()");
    expect(command).toContain("process.exitCode = 1");
    expect(command).not.toContain("AI_INTEGRATIONS_OPENAI_API_KEY");
    expect(command).not.toContain("AI_INTEGRATIONS_OPENAI_BASE_URL");
  });
});