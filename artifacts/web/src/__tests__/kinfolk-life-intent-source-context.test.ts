import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const thisDir = dirname(fileURLToPath(import.meta.url));
const travelSource = readFileSync(resolve(thisDir, "../pages/travel.tsx"), "utf8");

describe("Kinfolk life-intent source context on the website", () => {
  it("retains the optional API field and displays its explanation immediately before source links", () => {
    expect(travelSource).toContain("sourceContext?: string | null");
    expect(travelSource).toContain("sourceContext: data.sourceContext ?? null");
    expect(travelSource).toContain('data-testid="kinfolk-source-context"');
    expect(travelSource).toContain("Why these sources fit:");
    expect(travelSource.indexOf('data-testid="kinfolk-source-context"')).toBeLessThan(
      travelSource.indexOf("<KinfolkSourceLinks"),
    );
  });
});
