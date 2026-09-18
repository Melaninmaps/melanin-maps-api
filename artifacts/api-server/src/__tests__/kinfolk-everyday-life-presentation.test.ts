import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk everyday-life presentation", () => {
  it("does not label general and current answers as travel guidance", () => {
    expect(routeSource).not.toContain("This is general travel guidance");
    expect(routeSource).not.toContain("You may offer helpful general travel context");
    expect(routeSource).toContain("Answer the member's actual question directly with factual, source-supported context when available.");
    expect(routeSource).toContain("Do not turn an everyday-life question into a travel answer.");
  });

  it("keeps travel as an additive everyday-life use case rather than the product identity", () => {
    expect(routeSource).toContain("INTERNATIONAL USE IS ONE PART OF EVERYDAY LIFE");
    expect(routeSource).toContain("like a well-connected Big Cousin for everyday life");
  });
});
