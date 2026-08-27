/**
 * Mapping With Melanin™ — Master Vibe Label System
 *
 * PERMANENT SOURCE OF TRUTH — version-controlled, never stored in agent memory.
 * 131 vibe labels organized by category.
 *
 * Key rule: A vibe describes the ATMOSPHERE or type of visit — not whether
 * the business was good. Endorsements/quick reviews handle quality.
 *
 * Vibe-eligible categories: Food & Drink, Travel & Hospitality,
 * Arts Culture & Entertainment, Events & Celebrations, Children & Family,
 * Sports & Recreation, Beauty & Personal Care, Shopping & Retail.
 * Professional services (plumbers, attorneys, etc.) use endorsements only.
 *
 * Sourced from: Mapping_With_Melanin_MASTER_Business_Directory.xlsx → Vibe Reference tab
 */
export interface VibeLabel {
    label: string;
    helperText: string;
}
export declare const VIBES_BY_CATEGORY: Record<string, VibeLabel[]>;
/** Flat list of every vibe label across all categories — for validation */
export declare const ALL_VIBE_LABELS: string[];
/** Categories where vibes are shown. Professional service categories use endorsements only. */
export declare const VIBE_ELIGIBLE_CATEGORIES: string[];
/** Returns true if the given category supports vibe tagging */
export declare function isVibeEligible(category: string): boolean;
//# sourceMappingURL=vibe-labels.d.ts.map