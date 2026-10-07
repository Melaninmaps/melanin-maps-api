import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);

describe("native Kinfolk image generation", () => {
  it("requires an explicit two-part disclosure before the authenticated generation request", () => {
    expect(travelSource).toContain('api/kinfolk/images/generate');
    expect(travelSource).toContain("providerDisclosureAccepted");
    expect(travelSource).toContain("noRealPersonOrPrivateInfoConfirmed");
    expect(travelSource).toContain("Confirm image provider disclosure");
    expect(travelSource).toContain("Confirm no real person or private information");
  });

  it("keeps the generated visual session-only and separate from upload assets or chat messages", () => {
    expect(travelSource).toContain("Created for this session only. It is not saved, posted, or added to Kinfolk memory.");
    expect(travelSource).toContain("setGeneratedImage(null)");
    expect(travelSource).toContain("AI-generated decorative visual");
    expect(travelSource).not.toContain("imageAssetIds: [generatedImage");
    expect(travelSource).not.toContain("imageUrls: [generatedImage");
  });
});
