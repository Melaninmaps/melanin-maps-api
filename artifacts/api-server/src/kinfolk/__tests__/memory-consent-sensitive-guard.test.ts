import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const routeStart = routeSource.indexOf('router.post("/kinfolk/memory-consent"');
const routeEnd = routeSource.indexOf(
  'router.post("/kinfolk/memories"',
  routeStart,
);
const memoryConsentRoute = routeSource.slice(
  routeStart,
  routeEnd === -1 ? routeSource.length : routeEnd,
);

describe("Kinfolk inline sensitive-memory consent guard", () => {
  it("fails closed before persistence when a selected plan item is sensitive", () => {
    const sensitiveGate = memoryConsentRoute.indexOf(
      'const selectedSensitive = selected.some((item) => item.kind === "sensitive");',
    );
    const persistence = memoryConsentRoute.indexOf(
      "withSerializedPrivateMemoryWrite({",
    );

    expect(routeStart).toBeGreaterThan(-1);
    expect(sensitiveGate).toBeGreaterThan(-1);
    expect(persistence).toBeGreaterThan(sensitiveGate);
    expect(memoryConsentRoute).toContain(
      "selectedSensitive && body.sensitiveConsent !== true",
    );
    expect(memoryConsentRoute).toContain(
      'code: "SENSITIVE_MEMORY_CONFIRMATION_REQUIRED"',
    );
    expect(memoryConsentRoute).toContain("...sensitiveMemoryConfirmation(null)");
  });

  it("keeps ordinary selected plan items compatible with the existing consent flow", () => {
    expect(memoryConsentRoute).toContain(
      "const selected = items.filter((item) => selectedIds.includes(item.id));",
    );
    expect(memoryConsentRoute).toContain(
      "if (selectedSensitive && body.sensitiveConsent !== true)",
    );
    expect(memoryConsentRoute).toContain(
      "isSensitive: item.kind === \"sensitive\"",
    );
  });
});
