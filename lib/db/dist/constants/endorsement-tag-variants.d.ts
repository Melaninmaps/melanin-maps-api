/**
 * Mapping With Melanin™ — Endorsement Tag Variant Definitions
 *
 * PERMANENT SOURCE OF TRUTH — version-controlled, never stored in agent memory.
 * 132 cultural/linguistic variants across 11 communities.
 * Resolution: (family, community, subcategory) → (family, community, NULL) → tag default_label
 *
 * Sourced from: endorsement_tag_variants_seed.json v1.0
 */
export interface EndorsementTagVariantDef {
    tag_family: string;
    community_code: string;
    display_label: string;
    said_verb: string;
    subcategory_key: string | null;
}
export declare const COMMUNITY_CODES: readonly ["default", "hispanic", "ethiopian", "caribbean", "west_african", "vietnamese", "korean", "brazilian", "indigenous", "somali", "arabic"];
export type CommunityCode = (typeof COMMUNITY_CODES)[number];
export declare const ENDORSEMENT_TAG_VARIANTS: EndorsementTagVariantDef[];
//# sourceMappingURL=endorsement-tag-variants.d.ts.map