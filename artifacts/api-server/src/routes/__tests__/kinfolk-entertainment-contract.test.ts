import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../kinfolk-entertainment.ts", import.meta.url)),
  "utf8",
);
const migration = readFileSync(
  fileURLToPath(new URL("../../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);
const kinfolk = readFileSync(
  fileURLToPath(new URL("../kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk entertainment source contracts", () => {
  it("keeps availability authenticated, provider-gated, and schema-ready", () => {
    expect(route).toContain(
      'router.post("/kinfolk/entertainment/availability"',
    );
    expect(route).toContain("memberId(req, res)");
    expect(route).toContain("ensureKinfolkEntertainmentSchemaOnly");
    expect(route).toContain("resolveEntertainmentAvailabilityWithWebSources");
  });
  it("adds only explicit preference structure and does not configure a provider", () => {
    expect(migration).toContain("kinfolk_entertainment_preferences_v1");
    expect(migration).toContain("streaming_services");
    expect(migration).toContain("entertainment_country");
    expect(migration).toContain("ensureKinfolkEntertainmentSchemaOnly");
    expect(migration).not.toContain("JUSTWATCH_API_KEY");
  });
  it("guards current availability questions before model chat", () => {
    expect(kinfolk).toContain("parseEntertainmentAvailabilityRequest");
    expect(kinfolk).toContain("entertainment_availability_unavailable");
    expect(kinfolk).toContain("entertainment_availability_web_sources");
    expect(kinfolk).toContain("entertainmentAvailability.sources.map");
    expect(kinfolk).toContain("Model memory must never fabricate");
  });
});
