import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
const source = readFileSync(fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)), "utf8");
describe("Web Kinfolk private image editing", () => {
  it("uses an existing private asset and explicit provider consent", () => {
    expect(source).toContain("api/kinfolk/images/edit");
    expect(source).toContain("imageAssetId: editSourceAssetId");
    expect(source).toContain("providerDisclosureAccepted: imageEditConsent");
    expect(source).toContain("editConsentAccepted: imageEditConsent");
    expect(source).toContain("Edit a private image");
  });
  it("keeps the returned image session-only and re-ingests only through the private uploader", () => {
    expect(source).toContain("Session-only private result");
    expect(source).toContain("uploadKinfolkImage(new File([blob]");
    expect(source).toContain("Edit this result again");
    expect(source).not.toContain("imageUrls: [editedImage");
  });
});
