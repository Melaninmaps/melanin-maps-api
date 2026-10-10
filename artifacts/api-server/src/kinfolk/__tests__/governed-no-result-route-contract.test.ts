import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("governed no-result route contract", () => {
  it("accepts only a preceding server-issued expansion action and keeps the original request scoped", () => {
    expect(route).toContain("resolveGovernedNoResultFollowUp");
    expect(route).toContain("decodeGovernedNoResultAction");
    expect(route).toContain("offeredActions: priorAssistant?.followUpSuggestions");
    expect(route).toContain("const discoveryMessage =\n    noResultFollowUp?.priorQuestion ??\n    locationClarificationFollowUp?.priorQuestion ??\n    input.message");
    expect(route).toContain("readEphemeralKinfolkSession(input.req.user!.id, input.sessionId)");
  });

  it("keeps saved preferences unchanged until the member explicitly changes them in settings", () => {
    expect(route).toContain("buildGovernedNoResultOffer");
    expect(route).toContain("buildGovernedNoResultActionReply");
    expect(route).toContain("ownershipDocumentationScope");
    expect(route).toContain("allowAllPublicPlaces: explicitAllPlacesExpansion");
    expect(route).not.toContain("updatePreferences({ preferredOwnershipTypes: []");
  });
});
