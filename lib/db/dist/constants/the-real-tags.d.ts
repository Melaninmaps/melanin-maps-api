/**
 * THE REAL — Professional Trust Signal Layer
 *
 * Mapping With Melanin™ permanent source-of-truth.
 * THE REAL applies to professional/service categories where community
 * members report on being believed, advocated for, treated with dignity,
 * and receiving culturally competent service. These are NOT atmosphere
 * signals (The Vibe) — they are professional trust signals.
 *
 * 151 tags across 9 categories.
 * Source: Mapping_With_Melanin_MASTER_Business_Directory_v2_THE_REAL.xlsx
 * "THE REAL Reference" sheet — NEVER MODIFY without founder approval.
 */
export type TheRealTagType = "real-specific" | "real-adaptive";
export interface TheRealTag {
    tag_key: string;
    label: string;
    category: string;
    type: TheRealTagType;
    /** null for real-specific tags */
    adaptive_family: string | null;
    /** semicolon-separated subcategory scope, or "all" */
    subcategory_scope: string;
    helper_text: string;
}
/**
 * THE REAL tag definitions — all 151 tags.
 * Display threshold: 5 community taps (lower than endorsement tags because
 * professional trust signals are harder to earn and carry more weight).
 */
export declare const THE_REAL_DISPLAY_THRESHOLD = 5;
export declare const THE_REAL_TAGS: TheRealTag[];
/** Category → THE REAL tags lookup */
export declare const THE_REAL_CATEGORY_MAP: Record<string, TheRealTag[]>;
/**
 * Categories that display THE REAL professional trust layer.
 * All other categories use The Vibe (atmosphere) layer.
 * Source: "Layer Routing" sheet.
 *
 * Special case: Health & Wellness fitness subcategories
 * (Fitness & Gyms, Personal Trainers, Yoga & Pilates) use The Vibe.
 */
export declare const THE_REAL_CATEGORIES: string[];
/**
 * Health & Wellness subcategories that use The VIBE (not THE REAL).
 * Movement/wellness experience exception per Layer Routing sheet.
 */
export declare const HEALTH_VIBE_SUBCATEGORIES: string[];
/** Returns true if a business's category uses THE REAL layer */
export declare function usesTheReal(category: string, subcategory?: string): boolean;
/** Returns THE REAL tags for a given category */
export declare function getTheRealTagsForCategory(category: string): TheRealTag[];
//# sourceMappingURL=the-real-tags.d.ts.map