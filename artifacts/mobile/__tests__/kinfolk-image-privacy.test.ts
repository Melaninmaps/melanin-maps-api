import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);
const hookSource = readFileSync(
  fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)),
  "utf8",
);

describe("native Kinfolk image privacy controls", () => {
  it("shows an explicit member confirmation before uploading an image", () => {
    expect(travelSource).toContain("Use this image for this answer?");
    expect(travelSource).toContain("is not used to train Kinfolk");
    expect(travelSource).toContain("is not saved as memory");
    expect(travelSource).toContain("expires within 15 minutes");
    expect(travelSource).toContain('form.append("kinfolkVisionConsent", "true")');
  });

  it("uses a private server asset ID for inference and a local URI for the member preview", () => {
    const requestPayload = hookSource.slice(
      hookSource.indexOf("body: JSON.stringify({"),
      hookSource.indexOf("signal: controller.signal"),
    );
    expect(travelSource).toContain("imageAssetIds: attachedImageAssetIds");
    expect(travelSource).toContain("imageVisionConsent: attachedImageAssetIds.length > 0");
    expect(travelSource).toContain("imageUrls: attachedImagePreviews");
    expect(requestPayload).toContain("imageAssetIds: opts?.imageAssetIds ?? []");
    expect(requestPayload).toContain("imageVisionConsent: opts?.imageVisionConsent === true");
    expect(requestPayload).not.toContain("imageUrls: opts?.imageUrls ?? []");
  });

  it("offers immediate private-image removal before the expiry backstop", () => {
    expect(travelSource).toContain("/api/media/kinfolk-question/${encodeURIComponent(attachment.assetId)}");
    expect(travelSource).toContain("will expire shortly from private processing");
  });
});
