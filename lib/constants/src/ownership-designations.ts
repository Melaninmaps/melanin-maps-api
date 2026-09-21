/**
 * Mapping With Melanin™ — Master Ownership Designation List
 *
 * PERMANENT SOURCE OF TRUTH — version-controlled, never stored in agent memory.
 * 90 designations across African, Caribbean, Latin, Asian, MENA, and identity categories.
 *
 * Rule: ALL designations are self-identified / documented only.
 * NEVER infer from name, photo, location, cuisine, or any other signal.
 *
 * Sourced from: Mapping_With_Melanin_MASTER_Business_Directory.xlsx → Ownership Reference tab
 */

export const OWNERSHIP_DESIGNATIONS = [
  // ── African Diaspora ───────────────────────────────────────────────────────
  "Black / African American-Owned",
  "Foundational Black American-Owned",
  "African-Owned",
  "West African-Owned",
  "Nigerian-Owned",
  "Ghanaian-Owned",
  "Liberian-Owned",
  "Sierra Leonean-Owned",
  "Senegalese-Owned",
  "Guinean-Owned",
  "Gambian-Owned",
  "Ivorian-Owned",
  "Cameroonian-Owned",
  "Congolese-Owned",
  "East African-Owned",
  "Ethiopian-Owned",
  "Eritrean-Owned",
  "Somali-Owned",
  "Kenyan-Owned",
  "Sudanese-Owned",
  "South Sudanese-Owned",
  // ── Caribbean / West Indian ────────────────────────────────────────────────
  "Caribbean / West Indian-Owned",
  "Afro-Caribbean-Owned",
  "Jamaican-Owned",
  "Haitian-Owned",
  "Trinidadian & Tobagonian-Owned",
  "Guyanese-Owned",
  "Barbadian-Owned",
  "Bahamian-Owned",
  "Grenadian-Owned",
  "Saint Lucian-Owned",
  "Vincentian-Owned",
  // ── Latino / Hispanic ──────────────────────────────────────────────────────
  "Dominican-Owned",
  "Puerto Rican-Owned",
  "Cuban-Owned",
  "Afro-Latino-Owned",
  "Latino / Hispanic-Owned",
  "Mexican-Owned",
  "Salvadoran-Owned",
  "Guatemalan-Owned",
  "Honduran-Owned",
  "Nicaraguan-Owned",
  "Costa Rican-Owned",
  "Panamanian-Owned",
  "Colombian-Owned",
  "Venezuelan-Owned",
  "Ecuadorian-Owned",
  "Peruvian-Owned",
  "Brazilian-Owned",
  "Belizean-Owned",
  // ── Indigenous ────────────────────────────────────────────────────────────
  "Indigenous / Native-Owned",
  // ── Asian American ────────────────────────────────────────────────────────
  "Asian American-Owned",
  "South Asian-Owned",
  "Indian-Owned",
  "Pakistani-Owned",
  "Bangladeshi-Owned",
  "Sri Lankan-Owned",
  "Nepalese-Owned",
  "Southeast Asian-Owned",
  "Vietnamese-Owned",
  "Filipino-Owned",
  "Cambodian-Owned",
  "Thai-Owned",
  "Indonesian-Owned",
  "East Asian-Owned",
  "Korean-Owned",
  "Chinese-Owned",
  "Japanese-Owned",
  // ── Arab / MENA ───────────────────────────────────────────────────────────
  "Arab / MENA-Owned",
  "Lebanese-Owned",
  "Palestinian-Owned",
  "Syrian-Owned",
  "Jordanian-Owned",
  "Egyptian-Owned",
  "Moroccan-Owned",
  "Algerian-Owned",
  "Tunisian-Owned",
  "Iraqi-Owned",
  "Yemeni-Owned",
  "Persian / Iranian-Owned",
  "Turkish-Owned",
  // ── Identity & Role ───────────────────────────────────────────────────────
  "Immigrant-Owned",
  "Refugee-Owned",
  "Woman-Owned",
  "LGBTQIA+-Owned",
  "Veteran-Owned",
  "Disability-Owned",
  "Divine Nine-Affiliated",
  "Family-Owned",
  "Cooperative / Worker-Owned",
  "Multicultural / Multiethnic-Owned",
  // ── Legacy / General ──────────────────────────────────────────────────────
  "Minority-Owned (general / legacy)",
] as const;

/**
 * Explicit community ownership designations eligible for MWM's Diaspora
 * Promotion Catalog. These labels are documentary-only; they are never
 * inferred from a business name, cuisine, neighborhood, imagery, language,
 * or a member's profile. Role-only designations remain valid filters but do
 * not establish a Diaspora ownership designation on their own.
 */
export const DIASPORA_OWNERSHIP_DESIGNATIONS = OWNERSHIP_DESIGNATIONS.filter(
  (designation) =>
    !new Set([
      "Immigrant-Owned",
      "Refugee-Owned",
      "Woman-Owned",
      "LGBTQIA+-Owned",
      "Veteran-Owned",
      "Disability-Owned",
      "Divine Nine-Affiliated",
      "Family-Owned",
      "Cooperative / Worker-Owned",
    ]).has(designation),
);

export type OwnershipDesignation = (typeof OWNERSHIP_DESIGNATIONS)[number];

export const SUPPORT_LENS_MODES = [
  "all_businesses",
  "strict_documented_designations",
] as const;

export type SupportLensMode = (typeof SUPPORT_LENS_MODES)[number];

export function normalizeSupportLensMode(
  value: unknown,
  designationIds: readonly string[] = [],
): SupportLensMode {
  return value === "strict_documented_designations" && designationIds.length > 0
    ? "strict_documented_designations"
    : "all_businesses";
}

const OWNERSHIP_FILTER_ALIASES: Record<string, string> = {
  black: "black-african-american",
  "black-owned": "black-african-american",
  "black-african-american": "black-african-american",
  fba: "foundational-black-american",
  "foundational-black": "foundational-black-american",
  "foundational-black-american": "foundational-black-american",
  woman: "woman",
  women: "woman",
  lgbtq: "lgbtqia",
  lgbtqia: "lgbtqia",
  hispanic: "latino-hispanic",
  latino: "latino-hispanic",
  "hispanic-latino": "latino-hispanic",
  "latino-hispanic": "latino-hispanic",
  indigenous: "indigenous-native",
  native: "indigenous-native",
  "native-american-indigenous": "indigenous-native",
  "indigenous-native": "indigenous-native",
  minority: "minority-general-legacy",
  "melanated-diaspora": "minority-general-legacy",
  multiracial: "multicultural-multiethnic",
  "middle-eastern-north-african": "arab-mena",
  d9: "divine-nine-affiliated",
  "d9-affiliated": "divine-nine-affiliated",
  "divine-nine": "divine-nine-affiliated",
};

/** Stable comparison key for owner-provided and verified designation values. */
export function ownershipDesignationFilterId(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bowned\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return OWNERSHIP_FILTER_ALIASES[normalized] ?? normalized;
}

export const OWNERSHIP_FILTER_OPTIONS = OWNERSHIP_DESIGNATIONS.map((label) => ({
  id: ownershipDesignationFilterId(label),
  label,
}));

/**
 * High-signal filters displayed together when a member wants an intentional
 * intersectional support search. Every designation remains optional and must
 * be self-identified or documented by the business; no label is inferred.
 */
export const INTERSECTIONAL_SUPPORT_FILTER_IDS = [
  "foundational-black-american",
  "black-african-american",
  "woman",
  "divine-nine-affiliated",
  "veteran",
  "lgbtqia",
  "disability",
  "latino-hispanic",
] as const;

export const INTERSECTIONAL_SUPPORT_FILTER_OPTIONS = INTERSECTIONAL_SUPPORT_FILTER_IDS
  .flatMap((id) => OWNERSHIP_FILTER_OPTIONS.filter((option) => option.id === id));

const LEGACY_OWNERSHIP_FILTER_VALUES: Record<string, string[]> = {
  "black-african-american": ["black-owned", "Black-Owned"],
  "foundational-black-american": [
    "foundational-black-american-owned",
    "Foundational Black American-Owned",
    "fba-owned",
  ],
  woman: ["woman-owned", "women-owned", "Woman-Owned", "Women-Owned"],
  lgbtqia: ["lgbtq-owned", "lgbtqia-owned", "LGBTQ-Owned", "LGBTQIA-Owned"],
  "latino-hispanic": ["latino-owned", "hispanic-owned", "Latino-Owned", "Hispanic-Owned"],
  "indigenous-native": ["indigenous-owned", "native-owned", "Indigenous-Owned", "Native-Owned"],
  veteran: ["veteran-owned", "Veteran-Owned"],
  disability: ["disability-owned", "Disability-Owned"],
  "divine-nine-affiliated": ["d9-affiliated", "Divine Nine-Affiliated", "Divine Nine Affiliated"],
};

/** Returns all stored values that can faithfully represent one approved designation. */
export function ownershipDesignationStorageValues(raw: string): { id: string; values: string[] } {
  const id = ownershipDesignationFilterId(raw);
  const canonical = OWNERSHIP_FILTER_OPTIONS
    .filter((option) => option.id === id)
    .map((option) => option.label);
  return {
    id,
    values: [...new Set([raw, ...canonical, ...(LEGACY_OWNERSHIP_FILTER_VALUES[id] ?? [])])],
  };
}

/** Normalize a bounded, member-selected list and ignore unsupported values. */
export function normalizeOwnershipDesignationFilterIds(values: readonly unknown[], limit = 8): string[] {
  const allowed = new Set(OWNERSHIP_FILTER_OPTIONS.map((option) => option.id));
  return [...new Set(values
    .filter((value): value is string => typeof value === "string")
    .map(ownershipDesignationFilterId)
    .filter((id) => allowed.has(id)))]
    .slice(0, Math.max(1, limit));
}

/** Detect only explicitly stated support designations in a member's chat request. */
export function extractExplicitOwnershipDesignationFilterIds(message: string): string[] {
  const text = message.normalize("NFKC").toLocaleLowerCase("en-US");
  const matched: string[] = [];
  const businessNoun = "(?:business(?:es)?|compan(?:y|ies)|shops?|stores?)";
  const support = (designation: string) =>
    new RegExp(`\\bsupport\\s+(?:${designation})\\s+(?:owned\\s+)?${businessNoun}\\b`).test(text);
  const ownedBy = (designation: string) =>
    new RegExp(`\\b${businessNoun}\\s+owned\\s+by\\s+(?:${designation})(?:\\s+(?:people|person|owners?))?\\b`).test(text);
  const ownedLabel = (designation: string) =>
    new RegExp(`\\b${designation}[-\\s](?:owned|led)\\b`).test(text);
  const explicit = (designation: string) => support(designation) || ownedBy(designation) || ownedLabel(designation);

  const hasFoundationalBlack = /\b(?:fba|foundational(?:ly)?\s+black(?:\s+american)?)\b/.test(text)
    && (support("foundational(?:ly)?\\s+black(?:\\s+american)?") || ownedBy("foundational(?:ly)?\\s+black(?:\\s+american)?") || ownedLabel("foundational(?:ly)?\\s+black(?:\\s+american)?"));
  if (hasFoundationalBlack) matched.push("foundational-black-american");
  if (!hasFoundationalBlack && explicit("(?:black|african[-\\s]?american)s?")) matched.push("black-african-american");
  if (explicit("(?:woman|women|female)")) matched.push("woman");
  if (explicit("(?:divine\\s*nine|d9)")) matched.push("divine-nine-affiliated");
  if (explicit("(?:veteran|veterans|military)")) matched.push("veteran");
  if (explicit("(?:lgbtq(?:ia)?|queer)")) matched.push("lgbtqia");
  if (explicit("(?:disability|disabled)")) matched.push("disability");
  if (explicit("(?:hispanic|hispanics|latino|latinos|latina|latinas|latinx)")) matched.push("latino-hispanic");
  if (explicit("(?:asian|asian american|asians)")) matched.push("asian-american");
  if (explicit("guatemalans?")) matched.push("guatemalan");
  return normalizeOwnershipDesignationFilterIds(matched);
}

/**
 * Designations that imply blackOwned = true on the business record.
 * Used during import and business submission to auto-set the boolean index.
 */
export const BLACK_OWNED_DESIGNATIONS: readonly string[] = [
  "Black / African American-Owned",
  "Foundational Black American-Owned",
  "African-Owned",
  "West African-Owned",
  "Nigerian-Owned",
  "Ghanaian-Owned",
  "Liberian-Owned",
  "Sierra Leonean-Owned",
  "Senegalese-Owned",
  "Guinean-Owned",
  "Gambian-Owned",
  "Ivorian-Owned",
  "Cameroonian-Owned",
  "Congolese-Owned",
  "East African-Owned",
  "Ethiopian-Owned",
  "Eritrean-Owned",
  "Somali-Owned",
  "Kenyan-Owned",
  "Sudanese-Owned",
  "South Sudanese-Owned",
  "Caribbean / West Indian-Owned",
  "Afro-Caribbean-Owned",
  "Jamaican-Owned",
  "Haitian-Owned",
  "Trinidadian & Tobagonian-Owned",
  "Guyanese-Owned",
  "Barbadian-Owned",
  "Bahamian-Owned",
  "Grenadian-Owned",
  "Saint Lucian-Owned",
  "Vincentian-Owned",
  "Afro-Latino-Owned",
];

/** Returns true if any of the given designations implies Black-owned. */
export function isBlackOwned(designations: string[]): boolean {
  return designations.some((d) => BLACK_OWNED_DESIGNATIONS.includes(d));
}
