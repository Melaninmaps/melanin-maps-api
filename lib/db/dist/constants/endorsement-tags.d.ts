/**
 * Mapping With Melanin™ — Master Endorsement Tag Definitions
 *
 * PERMANENT SOURCE OF TRUTH — version-controlled, never stored in agent memory.
 * 340 endorsement tags across 22 categories.
 * Display threshold: 10 community taps.
 * Display format: "{count} {said_verb} {label}"
 *
 * Sourced from: endorsement_tags_seed.json v1.0
 */
export interface EndorsementTagDef {
    tag_key: string;
    tag_family: string | null;
    tag_type: "universal" | "adaptive" | "specific" | "vibe";
    default_label: string;
    helper_text: string;
    category_ids: number[];
    subcategory_keys: string[];
    sort_weight: number;
}
export declare const ENDORSEMENT_TAGS: EndorsementTagDef[];
/** Category ID → name mapping (matches seed data) */
export declare const ENDORSEMENT_CATEGORY_MAP: Record<number, string>;
/** Tags that are active for a given category ID */
export declare function getTagsForCategory(categoryId: number): EndorsementTagDef[];
export declare const ENDORSEMENT_DISPLAY_THRESHOLD = 10;
//# sourceMappingURL=endorsement-tags.d.ts.map