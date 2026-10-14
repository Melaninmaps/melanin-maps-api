import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
const primary = readFileSync(fileURLToPath(new URL("../app/travel.tsx", import.meta.url)), "utf8");
const widget = readFileSync(fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)), "utf8");
for (const [name, source] of [["primary", primary], ["widget", widget]] as const) {
  describe(`${name} private image editing`, () => {
    it("requires an existing private asset, explicit consent, and an authenticated opaque-ID request", () => {
      expect(source).toContain("api/kinfolk/images/edit");
      expect(source).toContain("imageAssetId: editSourceAssetId");
      expect(source).toContain("providerDisclosureAccepted: imageEditConsent");
      expect(source).toContain("editConsentAccepted: imageEditConsent");
      expect(source).toContain("Confirm image editing provider disclosure");
      expect(source).not.toContain("imageDataUrl: editedImage");
    });
    it("renders a removable session-only private result without memory persistence", () => {
      expect(source).toContain("AI-edited private image");
      expect(source).toContain("setEditedImage(null)");
      expect(source).toContain(name === "primary" ? "prepareEditedImageForAnotherEdit" : "prepareWidgetEditedImageForAnotherEdit");
      expect(source).toContain("not added to");
    });
  });
}
