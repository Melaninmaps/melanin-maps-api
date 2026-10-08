import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(new URL("../../routes/kinfolk.ts", import.meta.url), "utf8");
const start = route.indexOf('router.post("/kinfolk/memory-consent"');
const end = route.indexOf('router.post("/kinfolk/memories"', start);
const block = route.slice(start, end);

describe("Kinfolk memory-consent route", () => {
  it("requires the second explicit consent for selected sensitive items", () => {
    expect(block).toContain('selected.some((item) => item.kind === "sensitive")');
    expect(block).toContain("body.sensitiveConsent !== true");
    expect(block).toContain('code: "SENSITIVE_MEMORY_CONSENT_REQUIRED"');
    expect(block.indexOf("body.sensitiveConsent !== true")).toBeLessThan(
      block.indexOf("withSerializedPrivateMemoryWrite"),
    );
  });
});
