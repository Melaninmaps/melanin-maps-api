/**
 * @workspace/constants — browser-safe platform constants.
 *
 * This package contains pure data constants with NO Node.js dependencies
 * (no pg, no drizzle, no process, no Buffer).  Safe to import in any
 * browser bundle without polyfills.
 *
 * @workspace/db re-exports everything here for API-server / mobile consumers.
 * Web pages should import directly from @workspace/constants.
 */

// ── Business category taxonomy ─────────────────────────────────────────────
export {
  BUSINESS_CATEGORY_TAXONOMY,
  MAIN_CATEGORY_NAMES,
  SUBCATEGORY_MAP,
  ALL_SUBCATEGORY_NAMES,
  LEGACY_CATEGORY_NAMES,
  ALL_VALID_CATEGORY_NAMES,
} from "./business-categories";
export type { BusinessCategory } from "./business-categories";

// ── Ownership designations ─────────────────────────────────────────────────
export {
  OWNERSHIP_DESIGNATIONS,
  BLACK_OWNED_DESIGNATIONS,
  isBlackOwned,
} from "./ownership-designations";
export type { OwnershipDesignation } from "./ownership-designations";

// ── Vibe labels ────────────────────────────────────────────────────────────
export {
  VIBES_BY_CATEGORY,
  ALL_VIBE_LABELS,
  VIBE_ELIGIBLE_CATEGORIES,
  isVibeEligible,
} from "./vibe-labels";
export type { VibeLabel } from "./vibe-labels";

// ── Endorsement tags ───────────────────────────────────────────────────────
export {
  ENDORSEMENT_TAGS,
  ENDORSEMENT_CATEGORY_MAP,
  ENDORSEMENT_DISPLAY_THRESHOLD,
  getTagsForCategory,
} from "./endorsement-tags";
export type { EndorsementTagDef } from "./endorsement-tags";

// ── Endorsement tag variants ───────────────────────────────────────────────
export {
  ENDORSEMENT_TAG_VARIANTS,
  COMMUNITY_CODES,
} from "./endorsement-tag-variants";
export type { EndorsementTagVariantDef, CommunityCode } from "./endorsement-tag-variants";

// ── THE REAL tags ──────────────────────────────────────────────────────────
export {
  THE_REAL_TAGS,
  THE_REAL_CATEGORY_MAP,
  THE_REAL_CATEGORIES,
  THE_REAL_DISPLAY_THRESHOLD,
  HEALTH_VIBE_SUBCATEGORIES,
  usesTheReal,
  getTheRealTagsForCategory,
} from "./the-real-tags";
export type { TheRealTag, TheRealTagType } from "./the-real-tags";
