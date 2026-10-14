import type { ResourceCard } from "./resource-library";

/**
 * Server-controlled visual results are intentionally separate from model output.
 * A model never selects an image URL, author, license, or medical reference.
 */
export type KinfolkContextualVisual =
  | Readonly<{
      kind: "image";
      id: string;
      title: string;
      imageUrl: string;
      alt: string;
      sourceUrl: string;
      sourceLabel: string;
      attribution: string;
      licenseLabel: string;
      licenseUrl: string;
      classification: "illustrative_photo";
    }>
  | Readonly<{
      kind: "external_gallery";
      id: string;
      title: string;
      description: string;
      sourceUrl: string;
      sourceLabel: string;
      safetyNote: string;
    }>;

const BOX_BRAID_VISUALS: ReadonlyArray<Extract<KinfolkContextualVisual, { kind: "image" }>> = [
  {
    kind: "image",
    id: "box-braids-randen-pederson",
    title: "Box Braids",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Box_Braids.jpg/960px-Box_Braids.jpg",
    alt: "Photograph of box braids.",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Box_Braids.jpg",
    sourceLabel: "Wikimedia Commons file page",
    attribution: "Photo by Randen Pederson",
    licenseLabel: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.en",
    classification: "illustrative_photo",
  },
  {
    kind: "image",
    id: "box-braids-crystals-braiding",
    title: "Box Braids",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Crystal%27s_Braiding_%26_Beyond.jpg/500px-Crystal%27s_Braiding_%26_Beyond.jpg",
    alt: "Photograph labeled as box braids by the original creator.",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Crystal%27s_Braiding_%26_Beyond.jpg",
    sourceLabel: "Wikimedia Commons file page",
    attribution: "Photo by Crystal's Braiding & Beyond",
    licenseLabel: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en",
    classification: "illustrative_photo",
  },
];

function normalized(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isBraidsQuestion(query: string): boolean {
  return /\b(?:box\s+braids?|knotless\s+braids?|braids?|braiding|protective\s+style)\b/i.test(query);
}

function isEczemaQuestion(query: string): boolean {
  return /\b(?:eczema|atopic\s+dermatitis)\b/i.test(query);
}

/**
 * Select only entries already reviewed in this source file. The registry never
 * performs a live image search, proxies a third-party asset, or trusts a model
 * proposed URL. Medical photographs fail closed unless their reusable license
 * and clinical-review status are explicitly recorded here.
 */
export function selectKinfolkContextualVisuals(input: {
  message: string;
  reviewedResources: ReadonlyArray<ResourceCard>;
}): KinfolkContextualVisual[] {
  const query = normalized(input.message);
  if (!query) return [];

  const selected: KinfolkContextualVisual[] = [];
  if (isBraidsQuestion(query)) selected.push(...BOX_BRAID_VISUALS);

  if (isEczemaQuestion(query)) {
    const reviewedGallery = input.reviewedResources.find(
      (resource) => resource.id === "eczema-skin-of-color-gallery" && resource.reviewed,
    );
    if (reviewedGallery) {
      selected.push({
        kind: "external_gallery",
        id: "eczema-skin-of-color-rights-pending",
        title: reviewedGallery.title,
        description: "A reviewed educational image library is available. Kinfolk is not embedding medical photographs until reusable image rights and clinical-review status are documented.",
        sourceUrl: reviewedGallery.url,
        sourceLabel: "Reviewed educational image library",
        safetyNote: reviewedGallery.safetyNote ?? "Educational images cannot diagnose a rash.",
      });
    }
  }

  return selected.slice(0, 3);
}
