import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk contextual visual route wiring", () => {
  it("selects visuals only from the server-controlled registry after reviewed-resource selection", () => {
    expect(routeSource).toContain('from "../kinfolk/contextual-visuals"');
    expect(routeSource).toContain("selectKinfolkContextualVisuals({");
    expect(routeSource).toContain("reviewedResources: webResourceCards");
    expect(routeSource).toContain("contextualVisuals: webContextualVisuals");
    expect(routeSource).not.toContain("imageUrl: parsed.");
  });
});
