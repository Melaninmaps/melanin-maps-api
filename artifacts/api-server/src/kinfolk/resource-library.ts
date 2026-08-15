/**
 * Kinfolk reviewed resource library.
 *
 * Adapted from the Manus profile-first web search starter.
 *
 * PRODUCTION NOTE: Move this into a DB table (kinfolk_reviewed_resources) with
 * source owner, medical/editorial review date, expiry, and approval workflow.
 * Never allow raw click data to auto-publish a resource — require human review.
 */

import type { LensIntent } from "./lens-planner.js";

export type ResourceCard = {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  intent: LensIntent[];
  representationTags: string[];
  type: "image_gallery" | "health_source" | "community_source" | "entity_source";
  reviewed: boolean;
  safetyNote?: string;
};

export type EntityCandidate = {
  canonicalName: string;
  disambiguator: string;
  searchQuery: string;
  culturalContextTags: string[];
  verifiedSummary: string;
};

// ── Reviewed resource library ─────────────────────────────────────────────────

export const REVIEWED_LIBRARY: ResourceCard[] = [
  {
    id: "eczema-skin-of-color-gallery",
    title: "Eczema in Skin of Color — Image Library",
    url: "https://eczemainskinofcolor.org/image-library/",
    description: "Clinician-facing and patient-facing educational images of eczema across Black, Brown, Hispanic/Latino, and White skin.",
    tags: ["eczema", "atopic dermatitis", "dermatology", "skin"],
    intent: ["health", "image"],
    representationTags: ["Black", "African diaspora", "Brown skin", "Hispanic/Latino", "Latine", "skin of color"],
    type: "image_gallery",
    reviewed: true,
    safetyNote: "Educational images only; they cannot diagnose a rash.",
  },
  {
    id: "cdc-pregnancy-hypertension",
    title: "CDC — High Blood Pressure During Pregnancy",
    url: "https://www.cdc.gov/high-blood-pressure/about/high-blood-pressure-during-pregnancy.html",
    description: "Public-health information about high blood pressure, preeclampsia, and urgent warning signs during and after pregnancy.",
    tags: ["blood pressure", "hypertension", "pregnancy", "preeclampsia", "postpartum"],
    intent: ["health"],
    representationTags: ["all communities", "Black women", "Latine", "maternal health"],
    type: "health_source",
    reviewed: true,
    safetyNote: "For symptoms such as severe headache, vision changes, trouble breathing, or upper abdominal pain during/postpartum pregnancy, seek urgent medical care.",
  },
  {
    id: "cdc-hypertension-facts",
    title: "CDC — High Blood Pressure Facts",
    url: "https://www.cdc.gov/high-blood-pressure/data-research/facts-stats/index.html",
    description: "Population-level hypertension facts and differences in blood-pressure control by demographic group in the United States.",
    tags: ["blood pressure", "hypertension", "heart health", "population context"],
    intent: ["health"],
    representationTags: ["Black adults", "Hispanic adults", "all communities"],
    type: "health_source",
    reviewed: true,
    safetyNote: "Population data describe groups, not an individual diagnosis or outcome.",
  },
  {
    id: "black-mamas-matter",
    title: "Black Mamas Matter Alliance",
    url: "https://blackmamasmatter.org/",
    description: "A Black women-led cross-sectoral alliance focused on Black maternal health, rights, and justice.",
    tags: ["maternal health", "pregnancy", "postpartum", "preeclampsia", "Black women", "reproductive health"],
    intent: ["health"],
    representationTags: ["Black women", "African American women", "African diaspora", "maternal health"],
    type: "community_source",
    reviewed: true,
  },
  {
    id: "nami-mental-health",
    title: "NAMI — Mental Health by the Numbers",
    url: "https://www.nami.org/mhstats",
    description: "National Alliance on Mental Illness statistics on mental health prevalence across communities.",
    tags: ["mental health", "depression", "anxiety", "community mental health"],
    intent: ["health"],
    representationTags: ["all communities", "Black adults", "Hispanic adults"],
    type: "health_source",
    reviewed: true,
  },
  {
    id: "sickle-cell-disease-org",
    title: "Sickle Cell Disease Association of America",
    url: "https://www.sicklecelldisease.org/",
    description: "Patient and community resources for sickle cell disease, including treatment guidance and community programs.",
    tags: ["sickle cell", "sickle-cell", "blood disorder", "chronic illness"],
    intent: ["health"],
    representationTags: ["Black", "African diaspora", "African American", "Caribbean"],
    type: "community_source",
    reviewed: true,
  },
];

// ── Entity disambiguation index ───────────────────────────────────────────────
// Culture-first defaults: the community-lens candidate is always listed first.

export const ENTITY_INDEX: Record<string, EntityCandidate[]> = {
  "michelle williams": [
    {
      canonicalName: "Michelle Williams",
      disambiguator: "Singer and former member of Destiny's Child",
      searchQuery: "Michelle Williams Destiny's Child singer",
      culturalContextTags: ["Black", "Black woman", "music", "R&B", "Destiny's Child"],
      verifiedSummary: "Michelle Williams is an American singer and a former member of the R&B group Destiny's Child.",
    },
    {
      canonicalName: "Michelle Williams",
      disambiguator: "Actor known for Dawson's Creek",
      searchQuery: "Michelle Williams Dawson's Creek actor",
      culturalContextTags: ["acting", "television", "Dawson's Creek"],
      verifiedSummary: "Michelle Williams is an American actor known for roles including Jen Lindley in Dawson's Creek.",
    },
  ],
  "beyonce": [
    {
      canonicalName: "Beyoncé",
      disambiguator: "Musician, singer-songwriter, and cultural icon",
      searchQuery: "Beyoncé singer Destiny's Child solo artist",
      culturalContextTags: ["Black", "Black woman", "music", "R&B", "pop", "Houston"],
      verifiedSummary: "Beyoncé Knowles-Carter is an American singer-songwriter, actress, and cultural icon.",
    },
  ],
  "diana ross": [
    {
      canonicalName: "Diana Ross",
      disambiguator: "Singer and lead member of The Supremes",
      searchQuery: "Diana Ross singer The Supremes Motown",
      culturalContextTags: ["Black", "Black woman", "music", "Motown", "R&B", "Detroit"],
      verifiedSummary: "Diana Ross is an American singer, actress, and former lead singer of The Supremes.",
    },
  ],
};

// ── Library lookup ────────────────────────────────────────────────────────────

export function findReviewedResources(
  normalizedQuery: string,
  intent: LensIntent,
  lensLabels: string[],
): ResourceCard[] {
  const queryWords = normalizedQuery.toLowerCase().split(/\s+/).filter(Boolean);
  return REVIEWED_LIBRARY
    .filter((card) => card.reviewed && card.intent.includes(intent))
    .filter((card) => queryWords.some((word) => card.tags.some((tag) => tag.includes(word))))
    .map((card) => {
      const representationMatch = lensLabels.some((lens) =>
        card.representationTags.some((tag) => tag.toLowerCase().includes(lens.toLowerCase())),
      );
      return { card, representationMatch };
    })
    .sort((a, b) => Number(b.representationMatch) - Number(a.representationMatch))
    .map(({ card }) => card);
}

export function findEntityCandidates(
  normalizedQuery: string,
  lensLabels: string[],
): EntityCandidate[] | undefined {
  const candidates = ENTITY_INDEX[normalizedQuery];
  if (!candidates) return undefined;
  // Re-rank by cultural context tag overlap with active lenses
  return [...candidates].sort((a, b) => {
    const score = (c: EntityCandidate) =>
      c.culturalContextTags.reduce(
        (total, tag) => total + Number(
          lensLabels.some((l) => tag.toLowerCase().includes(l.toLowerCase()) || l.toLowerCase().includes(tag.toLowerCase()))
        ),
        0,
      );
    return score(b) - score(a);
  });
}
