import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(new URL("../routes/kinfolk.ts", import.meta.url), "utf8");

describe("Kinfolk universal assistant and culturally relevant lens contract", () => {
  it("answers ordinary questions directly without forcing an identity lens", () => {
    expect(routeSource).toContain("UNIVERSAL ASSISTANT + CULTURAL RELEVANCE STANDARD");
    expect(routeSource).toContain("Never force every question through an identity or minority lens");
    expect(routeSource).toContain("DIRECT FACT FIRST");
    expect(routeSource).toContain("For a straightforward fact such as a state capital, answer the fact plainly and immediately");
    expect(routeSource).toContain("Do not append cultural commentary to unrelated questions merely to sound on-brand");
  });

  it("adds supported overlooked context only when relevant and keeps identity private", () => {
    expect(routeSource).toContain("Cultural context is additive when it helps tell a well-supported side of history");
    expect(routeSource).toContain("Never assume a disputed premise is true");
    expect(routeSource).toContain("A culturally aware answer does not prove or imply the member's race");
    expect(routeSource).toContain("Use only current-turn or server-permitted context");
  });

  it("adapts learning depth for children or adults and answers before a Library handoff", () => {
    expect(routeSource).toContain("AGE-APPROPRIATE LEARNING");
    expect(routeSource).toContain("help them understand and complete the learning task without doing dishonest schoolwork for them");
    expect(routeSource).toContain("Adults may receive deeper historiography, media criticism, or debate context");
    expect(routeSource).toContain("Kinfolk answers in the conversation first");
    expect(routeSource).toContain("The Library handoff is never a gate");
  });

  it("requires current evidence for changing financial and public-information questions", () => {
    expect(routeSource).toMatch(/current\(\?:ly\)\?/);
    expect(routeSource).toContain("Current interest rates, news, laws, prices, elections, schedules");
    expect(routeSource).toContain("require current authoritative evidence");
  });
});
