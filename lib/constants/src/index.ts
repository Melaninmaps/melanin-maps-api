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

// ── Conservative search clarification ─────────────────────────────────────
export {
  findSafeSearchClarification,
  isSafeSearchClarification,
} from "./search-clarification";
export type {
  CatalogSearchTerm,
  SafeSearchClarification,
} from "./search-clarification";

// ── Ownership designations ─────────────────────────────────────────────────
export {
  OWNERSHIP_DESIGNATIONS,
  DIASPORA_OWNERSHIP_DESIGNATIONS,
  OWNERSHIP_FILTER_OPTIONS,
  INTERSECTIONAL_SUPPORT_FILTER_IDS,
  INTERSECTIONAL_SUPPORT_FILTER_OPTIONS,
  BLACK_OWNED_DESIGNATIONS,
  ownershipDesignationFilterId,
  ownershipDesignationStorageValues,
  normalizeOwnershipDesignationFilterIds,
  SUPPORT_LENS_MODES,
  normalizeSupportLensMode,
  extractExplicitOwnershipDesignationFilterIds,
  isBlackOwned,
} from "./ownership-designations";
export type { OwnershipDesignation } from "./ownership-designations";
export type { SupportLensMode } from "./ownership-designations";

// ── Vibe labels ────────────────────────────────────────────────────────────
export {
  VIBES_BY_CATEGORY,
  ALL_VIBE_LABELS,
  VIBE_ELIGIBLE_CATEGORIES,
  isVibeEligible,
} from "./vibe-labels";
export type { VibeLabel } from "./vibe-labels";
export { findVibeKeysForSearch } from "./vibe-search";

// ── Endorsement tags ───────────────────────────────────────────────────────
export {
  ENDORSEMENT_TAGS,
  ENDORSEMENT_CATEGORY_MAP,
  ENDORSEMENT_DISPLAY_THRESHOLD,
  getTagsForCategory,
} from "./endorsement-tags";
export type { EndorsementTagDef } from "./endorsement-tags";

// ── Founder-approved workbook feedback catalog ──────────────────────────────
// This source catalog preserves the exact Vibe and one-tap praise wording
// approved in UPDATEDVIBESCATEGORYforbusinesses-1.xlsx.
export {
  OFFICIAL_QUICK_REVIEW_TAGS,
  OFFICIAL_VIBE_TAGS,
} from "./official-feedback-catalog";
export type {
  OfficialQuickReviewTag,
  OfficialVibeTag,
} from "./official-feedback-catalog";

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
  usesTheRealExperienceLayer,
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

// ── Canonical geography and city aliases ────────────────────────────────────
export {
  HERITAGE_CITIES,
  getHeritageCity,
  resolveHeritageCity,
} from "./heritage-cities";
export type {
  HeritageCity,
  HeritageCityResolution,
} from "./heritage-cities";

// ── Local map discovery grouping ───────────────────────────────────────────
export {
  MAP_DISCOVERY_FOCUSES,
  matchesMapDiscoveryFocus,
  countMapDiscoveryFocuses,
} from "./map-discovery";
export type {
  MapDiscoveryFocus,
  MapDiscoveryFocusId,
  MapDiscoveryRecord,
} from "./map-discovery";

// ── On-demand essential-services map layer ─────────────────────────────────
export {
  MAP_ESSENTIAL_SERVICE_CATEGORIES,
  MAP_ESSENTIAL_SERVICE_PLACE_TYPES,
  MAP_ESSENTIAL_SERVICE_RESULT_CAP,
  MAP_ESSENTIAL_SERVICE_MAX_RADIUS_MILES,
  MAP_ESSENTIAL_SERVICE_DEFAULT_RADIUS_MILES,
  findMapEssentialServiceCategory,
} from "./map-essential-services";
export type {
  MapEssentialServiceCategory,
  MapEssentialServiceCategoryDefinition,
} from "./map-essential-services";
