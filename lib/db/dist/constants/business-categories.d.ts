/**
 * Mapping With Melanin™ — Master Business Category Taxonomy
 *
 * This is the SINGLE SOURCE OF TRUTH for all category/subcategory values
 * across the platform: API validation, mobile filters, web dropdowns,
 * business onboarding, map filters, KinfolkAI, and Excel import sheets.
 *
 * To add or rename a category: edit here only. All consumers import from this file.
 */
export interface BusinessCategory {
    /** URL-safe slug, lowercase-hyphenated */
    id: string;
    /** Display name shown in UI */
    name: string;
    /** Subcategories within this category */
    subcategories: string[];
}
export declare const BUSINESS_CATEGORY_TAXONOMY: BusinessCategory[];
/** Flat list of all main category names — for API validation and dropdowns */
export declare const MAIN_CATEGORY_NAMES: string[];
/** Map of category name → subcategory array — for dependent dropdowns */
export declare const SUBCATEGORY_MAP: Record<string, string[]>;
/** Flat list of ALL subcategory names across every category */
export declare const ALL_SUBCATEGORY_NAMES: string[];
/**
 * Legacy category names from before the master taxonomy was introduced.
 * Accepted during API validation so existing businesses are never broken.
 * New submissions should use MAIN_CATEGORY_NAMES only.
 */
export declare const LEGACY_CATEGORY_NAMES: string[];
/** Full valid set: new taxonomy + legacy names. Use this for API validation. */
export declare const ALL_VALID_CATEGORY_NAMES: string[];
//# sourceMappingURL=business-categories.d.ts.map