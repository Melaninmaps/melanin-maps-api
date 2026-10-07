import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk image generation on Web", () => {
  it("keeps generation explicit, provider-disclosed, and separate from chat attachments", () => {
    expect(travelSource).toContain("kinfolk-image-create");
    expect(travelSource).toContain("providerDisclosureAccepted");
    expect(travelSource).toContain("noRealPersonOrPrivateInfoConfirmed");
    expect(travelSource).toContain('api/kinfolk/images/generate');
    expect(travelSource).toContain("AI-generated visual");
    expect(travelSource).toContain("not saved to Kinfolk memory");
    expect(travelSource).not.toContain("imageUrls: [generatedImage");
  });
});
