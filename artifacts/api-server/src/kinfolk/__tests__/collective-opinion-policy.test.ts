import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  new URL("../../routes/kinfolk.ts", import.meta.url),
  "utf8",
);

describe("Kinfolk collective opinion response policy", () => {
  it("distinguishes opinion, verifiable facts, criticism, and public conversation", () => {
    expect(routeSource).toContain("COLLECTIVE OPINION AND CULTURAL CONSENSUS:");
    expect(routeSource).toContain("Who was the best Spider-Man?");
    expect(routeSource).toContain("Who was the best rapper in Wu-Tang Clan?");
    expect(routeSource).toContain("(1) verifiable facts");
    expect(routeSource).toContain("(2) published criticism or cultural analysis");
    expect(routeSource).toContain("(3) clearly labeled audience or public conversation");
  });

  it("requires sources for factual or consensus claims but permits a labeled low-stakes opinion", () => {
    expect(routeSource).toContain("A published article is required for factual claims that need verification");
    expect(routeSource).toContain("not required to offer a clearly framed, low-stakes comparative opinion");
    expect(routeSource).toContain("Never invent a platform poll, social-media metric, unanimous consensus, or source.");
  });
});
