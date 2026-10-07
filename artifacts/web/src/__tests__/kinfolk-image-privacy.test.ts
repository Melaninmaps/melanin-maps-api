import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("web Kinfolk image privacy controls", () => {
  it("requires member confirmation before uploading a visual question", () => {
    expect(travelSource).toContain("pendingImageConsent");
    expect(travelSource).toContain("Use this image for this answer?");
    expect(travelSource).toContain("is not used to train Kinfolk");
    expect(travelSource).toContain("is not saved as memory");
    expect(travelSource).toContain("expires within 15 minutes");
  });

  it("keeps previews local while sending only asset IDs and affirmative consent", () => {
    expect(travelSource).toContain("imageAssetIds: attachedImageAssetIds");
    expect(travelSource).toContain("imageVisionConsent: attachedImageAssetIds.length > 0");
    expect(travelSource).toContain("imageUrls: attachedImagePreviews");
    expect(travelSource).not.toContain("imageUrls: attachedImages");
  });

  it("gives the member a direct removal action with a server-side expiry backstop", () => {
    expect(travelSource).toContain("api/media/kinfolk-question/${encodeURIComponent(attachment.assetId)}");
    expect(travelSource).toContain("will expire shortly from private processing");
  });
});
