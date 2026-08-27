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
export declare const OWNERSHIP_DESIGNATIONS: readonly ["Black / African American-Owned", "African-Owned", "West African-Owned", "Nigerian-Owned", "Ghanaian-Owned", "Liberian-Owned", "Sierra Leonean-Owned", "Senegalese-Owned", "Guinean-Owned", "Gambian-Owned", "Ivorian-Owned", "Cameroonian-Owned", "Congolese-Owned", "East African-Owned", "Ethiopian-Owned", "Eritrean-Owned", "Somali-Owned", "Kenyan-Owned", "Sudanese-Owned", "South Sudanese-Owned", "Caribbean / West Indian-Owned", "Afro-Caribbean-Owned", "Jamaican-Owned", "Haitian-Owned", "Trinidadian & Tobagonian-Owned", "Guyanese-Owned", "Barbadian-Owned", "Bahamian-Owned", "Grenadian-Owned", "Saint Lucian-Owned", "Vincentian-Owned", "Dominican-Owned", "Puerto Rican-Owned", "Cuban-Owned", "Afro-Latino-Owned", "Latino / Hispanic-Owned", "Mexican-Owned", "Salvadoran-Owned", "Guatemalan-Owned", "Honduran-Owned", "Nicaraguan-Owned", "Costa Rican-Owned", "Panamanian-Owned", "Colombian-Owned", "Venezuelan-Owned", "Ecuadorian-Owned", "Peruvian-Owned", "Brazilian-Owned", "Belizean-Owned", "Indigenous / Native-Owned", "Asian American-Owned", "South Asian-Owned", "Indian-Owned", "Pakistani-Owned", "Bangladeshi-Owned", "Sri Lankan-Owned", "Nepalese-Owned", "Southeast Asian-Owned", "Vietnamese-Owned", "Filipino-Owned", "Cambodian-Owned", "Thai-Owned", "Indonesian-Owned", "East Asian-Owned", "Korean-Owned", "Chinese-Owned", "Japanese-Owned", "Arab / MENA-Owned", "Lebanese-Owned", "Palestinian-Owned", "Syrian-Owned", "Jordanian-Owned", "Egyptian-Owned", "Moroccan-Owned", "Algerian-Owned", "Tunisian-Owned", "Iraqi-Owned", "Yemeni-Owned", "Persian / Iranian-Owned", "Turkish-Owned", "Immigrant-Owned", "Refugee-Owned", "Woman-Owned", "LGBTQIA+-Owned", "Veteran-Owned", "Disability-Owned", "Family-Owned", "Cooperative / Worker-Owned", "Multicultural / Multiethnic-Owned", "Minority-Owned (general / legacy)"];
export type OwnershipDesignation = (typeof OWNERSHIP_DESIGNATIONS)[number];
/**
 * Designations that imply blackOwned = true on the business record.
 * Used during import and business submission to auto-set the boolean index.
 */
export declare const BLACK_OWNED_DESIGNATIONS: readonly string[];
/** Returns true if any of the given designations implies Black-owned. */
export declare function isBlackOwned(designations: string[]): boolean;
//# sourceMappingURL=ownership-designations.d.ts.map