import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../kinfolk.ts"),
  "utf8",
);

describe("saved documented support lens", () => {
  it("requires a documented-source result and preserves an honest no-match", () => {
    expect(source).toContain(
      "const strictSourceBackedDiscovery =",
    );
    expect(source).toContain(
      "discoveryDesignationIds.length > 0 || broadenDocumentedOwnershipScope;",
    );
    expect(source).toContain("strictEvidenceRequired: strictSourceBackedDiscovery");
    expect(source).toContain("I won't guess at ownership or quietly swap in a listing outside your focus.");
  });
});
