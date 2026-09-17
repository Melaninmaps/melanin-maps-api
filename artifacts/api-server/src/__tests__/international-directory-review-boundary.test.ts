import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../directoryImport/registerDirectoryImportRoutes.ts", import.meta.url)),
  "utf8",
);

describe("international and cultural directory review boundary", () => {
  it("admits cultural records to review filtering but never treats them as a business target", () => {
    expect(source).toContain('| "cultural_place"');
    expect(source).toContain('"cultural_place",');
    expect(source).toContain("Cultural places remain in the separate cultural review queue");
    expect(source).toContain('candidate.target_kind === "business" ||');
    expect(source).not.toContain('candidate.target_kind === "cultural_place" ||');
  });

  it("accepts an absent state/province in staging records without changing public business behavior", () => {
    expect(source).toContain("state: string | null;");
    expect(source).toContain("candidate.state?.trim().toUpperCase() ?? null");
    expect(source).toContain("function resourceCanonicalKey");
  });
});
