/**
 * MWM Specialties Vocabulary v1.0
 *
 * Controlled vocabulary of Specialties per subcategory.
 * Specialties are a first-class searchable field — 5–8 per business.
 * Custom suggestions from businesses go to the admin specialty_suggestions queue.
 *
 * RULES:
 * - Always key by the exact subcategory name used in the platform
 * - 15–30 terms per subcategory; aim for cultural specificity
 * - Never duplicate a term across subcategories
 * - Any new term must be added here AND mirrored to lib/constants/src/specialties.ts
 */
export declare const SPECIALTIES_BY_SUBCATEGORY: Record<string, string[]>;
/** Flat deduplicated list of all approved specialty terms across all subcategories */
export declare const ALL_SPECIALTIES: string[];
/** Returns the approved specialties list for a given subcategory name */
export declare function getSpecialtiesForSubcategory(subcategory: string): string[];
/** Returns true if a given specialty is approved for a subcategory */
export declare function isApprovedSpecialty(subcategory: string, specialty: string): boolean;
//# sourceMappingURL=specialties.d.ts.map