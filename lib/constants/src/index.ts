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

// ── Business discovery normalization ───────────────────────────────────────
export {
  BUSINESS_SEARCH_NORMALIZATION_VERSION,
  RESTAURANT_CAPABLE_FOOD_INTENT,
  foldBusinessSearchLabel,
  normalizeBusinessCategoryIntent,
  getBusinessCategorySearchAliases,
  matchesBusinessCategoryIntent,
} from "./business-search-normalization";

// ── Ownership designations ─────────────────────────────────────────────────
export {
  OWNERSHIP_DESIGNATIONS,
  OWNERSHIP_FILTER_OPTIONS,
  BLACK_OWNED_DESIGNATIONS,
  ownershipDesignationFilterId,
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

// ── Unified business experience choices ─────────────────────────────────────
export {
  EXPERIENCE_COMMUNITY_OPTIONS,
  getBusinessExperiencePolicy,
  normalizeBusinessExperiencePriceKey,
  resolveExperienceChoiceLabel,
  isExperienceChoiceAllowed,
  normalizeOwnerExperienceKey,
  getOwnerProfileExperienceChoices,
} from "./business-experience";
export type {
  BusinessExperienceKind,
  BusinessExperienceVariant,
  BusinessExperienceChoice,
  BusinessExperiencePolicy,
} from "./business-experience";

// ── Social video providers and member display preferences ───────────────────
export {
  SOCIAL_VIDEO_PLATFORMS,
  SOCIAL_VIDEO_PLATFORM_OPTIONS,
  detectSocialVideoPlatform,
  getSocialVideoPlatformLabel,
  sanitizeSocialVideoPreferences,
} from "./social-video-platforms";
export type { SocialVideoPlatform } from "./social-video-platforms";

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

// ── Specialties vocabulary ─────────────────────────────────────────────────
export {
  SPECIALTIES_BY_SUBCATEGORY,
  ALL_SPECIALTIES,
  getSpecialtiesForSubcategory,
  isApprovedSpecialty,
} from "./specialties";
