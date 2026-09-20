import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  new URL("../../routes/kinfolk.ts", import.meta.url),
  "utf8",
);

describe("Kinfolk English query recovery policy", () => {
  it("treats ordinary typos as an accessibility concern without guessing material facts", () => {
    expect(routeSource).toContain("ENGLISH QUERY RECOVERY — NON-NEGOTIABLE:");
    expect(routeSource).toContain("ordinary spelling errors");
    expect(routeSource).toContain("Never silently substitute a named person, school, business, medicine, law, financial product, diagnosis, place, date, amount, or other material fact.");
    expect(routeSource).toContain("ask one focused question instead of guessing.");
  });

  it("does not shame a member for spelling or language ability", () => {
    expect(routeSource).toContain("do not comment on education, grammar, intelligence, or language ability");
  });
});
