import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk Living Library route provider wiring", () => {
  it("uses the standard configuration resolver instead of a legacy-only credential", () => {
    expect(source).toContain('from "../kinfolk/living-library-provider-config"');
    expect(source).toContain("resolveKinfolkLivingLibraryWriterConfiguration()");
    expect(source).not.toContain("process.env.AI_INTEGRATIONS_OPENAI_API_KEY");
  });

  it("fails the optional Library branch cleanly when either provider dependency is unavailable", () => {
    expect(source).toContain("if (!deps.researchProvider || !deps.writer)");
  });
});
