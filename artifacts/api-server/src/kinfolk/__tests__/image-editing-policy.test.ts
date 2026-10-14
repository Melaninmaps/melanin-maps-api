import { describe, expect, it } from "vitest";
import { decideKinfolkImageEdit } from "../image-editing-policy";
const id = "123e4567-e89b-42d3-a456-426614174000";
describe("Kinfolk private image editing", () => {
  it("requires an opaque source and explicit provider/edit consent", () => {
    expect(decideKinfolkImageEdit({ imageAssetId: id, instruction: "brighten the storefront", providerDisclosureAccepted: false, editConsentAccepted: true }).ok).toBe(false);
  });
  it("permits a bounded ordinary edit without exposing a URL", () => {
    const result = decideKinfolkImageEdit({ imageAssetId: id, instruction: "brighten the storefront and crop the sky", providerDisclosureAccepted: true, editConsentAccepted: true });
    expect(result.ok).toBe(true); if (result.ok) expect(result.prompt).toContain("Preserve the original person's identity");
  });
  it("rejects identity, sexual, and forgery requests", () => {
    for (const instruction of ["face swap this person", "remove their clothes", "make a passport"]) expect(decideKinfolkImageEdit({ imageAssetId: id, instruction, providerDisclosureAccepted: true, editConsentAccepted: true }).ok).toBe(false);
  });
});
