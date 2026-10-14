import { describe, expect, it } from "vitest";
import { selectKinfolkContextualVisuals } from "../contextual-visuals";
import { REVIEWED_LIBRARY } from "../resource-library";

const eczemaGallery = REVIEWED_LIBRARY.filter((resource) => resource.id === "eczema-skin-of-color-gallery");

describe("Kinfolk contextual visual registry", () => {
  it("returns only attributed, rights-labeled illustrative photos for a box-braids request", () => {
    const visuals = selectKinfolkContextualVisuals({
      message: "Show me box braids.",
      reviewedResources: [],
    });

    expect(visuals).toHaveLength(2);
    for (const visual of visuals) {
      expect(visual.kind).toBe("image");
      if (visual.kind !== "image") continue;
      expect(visual.imageUrl).toMatch(/^https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/thumb\//);
      expect(visual.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(visual.attribution).toBeTruthy();
      expect(visual.licenseLabel).toMatch(/^CC BY/);
      expect(visual.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\//);
      expect(visual.classification).toBe("illustrative_photo");
    }
  });

  it("fails closed for medical photographs while retaining the reviewed eczema image-library destination", () => {
    const visuals = selectKinfolkContextualVisuals({
      message: "What does eczema look like on brown skin?",
      reviewedResources: eczemaGallery,
    });

    expect(visuals).toEqual([
      expect.objectContaining({
        kind: "external_gallery",
        sourceUrl: "https://eczemainskinofcolor.org/image-library/",
        safetyNote: expect.stringContaining("cannot diagnose"),
      }),
    ]);
    expect(visuals.some((visual) => visual.kind === "image")).toBe(false);
  });

  it("does not attach a visual result to an unrelated nonvisual question", () => {
    expect(selectKinfolkContextualVisuals({
      message: "What is 14 plus 6?",
      reviewedResources: eczemaGallery,
    })).toEqual([]);
  });
});
