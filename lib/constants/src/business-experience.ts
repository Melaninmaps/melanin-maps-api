import {
  ENDORSEMENT_CATEGORY_MAP,
  ENDORSEMENT_TAGS,
  type EndorsementTagDef,
} from "./endorsement-tags";
import {
  OFFICIAL_QUICK_REVIEW_TAGS,
  type OfficialQuickReviewTag,
} from "./official-feedback-catalog";
import {
  COMMUNITY_CODES,
  ENDORSEMENT_TAG_VARIANTS,
  type CommunityCode,
} from "./endorsement-tag-variants";
import {
  VIBES_BY_CATEGORY,
  isVibeEligible,
  type VibeLabel,
} from "./vibe-labels";
import { usesTheReal } from "./the-real-tags";
import { foldBusinessSearchLabel } from "./business-search-normalization";

export type BusinessExperienceKind = "vibe" | "reaction" | "price";

export interface BusinessExperienceVariant {
  communityCode: CommunityCode;
  label: string;
  saidVerb: string;
}

export interface BusinessExperienceChoice {
  key: string;
  label: string;
  helperText: string;
  kind: BusinessExperienceKind;
  variants: BusinessExperienceVariant[];
}

export interface BusinessExperiencePolicy {
  category: string;
  subcategory: string | null;
  experienceLayer: "vibe" | "real";
  atmosphereLabel: string;
  reactionLabel: string;
  vibeChoices: BusinessExperienceChoice[];
  reactionChoices: BusinessExperienceChoice[];
  priceChoices: BusinessExperienceChoice[];
}

export const EXPERIENCE_COMMUNITY_OPTIONS: ReadonlyArray<{
  code: CommunityCode;
  label: string;
}> = [
  { code: "default", label: "Universal wording" },
  { code: "hispanic", label: "Latino / Hispanic wording" },
  { code: "ethiopian", label: "Ethiopian wording" },
  { code: "caribbean", label: "Caribbean wording" },
  { code: "west_african", label: "West African wording" },
  { code: "vietnamese", label: "Vietnamese diaspora wording" },
  { code: "korean", label: "Korean diaspora wording" },
  { code: "brazilian", label: "Brazilian wording" },
  { code: "indigenous", label: "Indigenous community wording" },
  { code: "somali", label: "Somali wording" },
  { code: "arabic", label: "Arabic-speaking diaspora wording" },
];

const CATEGORY_NAME_BY_FOLDED = new Map(
  Object.values(ENDORSEMENT_CATEGORY_MAP).map((name) => [foldBusinessSearchLabel(name), name]),
);

const CATEGORY_ID_BY_NAME = new Map(
  Object.entries(ENDORSEMENT_CATEGORY_MAP).map(([id, name]) => [name, Number(id)]),
);

const PRICE_CHOICES: BusinessExperienceChoice[] = [
  { key: "price_1", label: "$", helperText: "Budget-friendly", kind: "price", variants: [] },
  { key: "price_2", label: "$$", helperText: "Moderate", kind: "price", variants: [] },
  { key: "price_3", label: "$$$", helperText: "Special-occasion pricing", kind: "price", variants: [] },
  { key: "price_4", label: "$$$$", helperText: "Luxury pricing", kind: "price", variants: [] },
];

const LEGACY_REACTIONS: BusinessExperienceChoice[] = [
  { key: "sent_the_group_chat", label: "Sent the Group Chat", helperText: "Worth putting your people on", kind: "reaction", variants: [] },
  { key: "cooks_like_home", label: "Cooks Like Home", helperText: "Familiar flavor and care", kind: "reaction", variants: variantsForFamily("cooks_like_home") },
  { key: "worth_the_drive", label: "Worth the Drive", helperText: "Worth going out of your way for", kind: "reaction", variants: [] },
  { key: "portions_with_love", label: "Portions With Love", helperText: "Generous and thoughtfully served", kind: "reaction", variants: [] },
  { key: "grandma_approved", label: "Grandma Approved", helperText: "Trusted across generations", kind: "reaction", variants: variantsForFamily("elder_approved") },
  { key: "seasoned_right", label: "Seasoned Right", helperText: "The flavor showed up", kind: "reaction", variants: [] },
];

function toSnakeKey(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90);
}

function normalizeSubcategory(value: string | null | undefined): string {
  return toSnakeKey(value ?? "");
}

/**
 * The approved founder boundary: Education & Learning is evaluated with
 * practical community feedback, and only actual care/early-learning entries
 * in Children & Family use that same The Real layer. Play spaces, camps,
 * parties, and other family activities retain atmosphere-oriented Vibes.
 */
const CHILDCARE_AND_EARLY_EDUCATION_SUBCATEGORIES = new Set([
  "childcare",
  "childcare_daycare",
  "daycare_childcare",
  "preschool",
  "preschools",
  "early_childhood_education",
  "after_school_care",
]);

/**
 * Imported directory records occasionally carry a useful, descriptive service
 * label rather than one of the short controlled subcategory values above — for
 * example, "Spanish Immersion Preschool / Hispanic Culture". Match only the
 * explicit school, teacher, and care terms approved for The Real; this does
 * not sweep play spaces, camps, parties, or general family activities into a
 * practical-service feedback layer.
 */
function isCareOrEducationSubcategory(subcategoryKey: string): boolean {
  if (CHILDCARE_AND_EARLY_EDUCATION_SUBCATEGORIES.has(subcategoryKey)) return true;
  return /(?:^|_)(?:teacher|teachers|school|schools|daycare|childcare|preschool|preschools|pre_k|prekindergarten|kindergarten|early_childhood|early_education|after_school|aftercare)(?:_|$)/.test(subcategoryKey);
}

export function usesTheRealExperienceLayer(
  category: string | null | undefined,
  subcategory?: string | null,
): boolean {
  const categoryName = resolveCanonicalCategory(category);
  const subcategoryKey = normalizeSubcategory(subcategory);
  return usesTheReal(categoryName, subcategory ?? undefined)
    || categoryName === "Education & Learning"
    || isCareOrEducationSubcategory(subcategoryKey);
}

function resolveCanonicalCategory(category: string | null | undefined): string {
  const folded = foldBusinessSearchLabel(category ?? "");
  if ([
    "food", "restaurant", "restaurants", "food drink", "food dining", "food diaspora",
    "food treats", "food community", "food experience", "food trucks", "food history",
    "food wellness", "food youth",
  ].includes(folded)) return "Food & Drink";
  if ([
    "beauty", "beauty grooming", "beauty personal care", "beauty hair", "beauty wellness",
    "beauty barber", "beauty culture", "beauty retail",
  ].includes(folded)) return "Beauty & Personal Care";
  if ([
    "health", "healthcare", "healthcare wellness", "health wellness", "senior home care",
    "family health", "family wellness", "health family", "health pharmacy",
  ].includes(folded)) return "Health & Wellness";
  if (["legal", "legal services", "legal consulting", "legal government services", "money legal"].includes(folded)) return "Legal & Government Services";
  if ([
    "finance", "financial", "financial services", "finance banking", "financial business services",
    "business wealth", "business wealth building", "professional financial",
  ].includes(folded)) return "Financial & Business Services";
  if ([
    "professional", "professional services", "professional business", "professional home services",
    "science manufacturing",
  ].includes(folded)) return "Professional Services";
  if ([
    "daycare", "childcare", "child care", "children family", "children family education",
    "family childcare",
  ].includes(folded)) return "Children & Family";
  if ([
    "education workforce", "education training", "education trades", "education childcare",
  ].includes(folded)) return "Education & Learning";
  if ([
    "retail", "retail culture", "retail fashion", "retail everyday life", "retail experience",
    "retail shopping", "shopping retail", "consumer goods", "retail wellness",
  ].includes(folded)) return "Shopping & Retail";
  if ([
    "travel", "travel hospitality", "travel lodging", "travel experience", "travel experiences",
  ].includes(folded)) return "Travel & Hospitality";
  if ([
    "events culture", "creative events",
  ].includes(folded)) return "Events & Celebrations";
  if ([
    "art culture", "culture experience", "entertainment recreation", "nightlife",
  ].includes(folded)) return "Arts, Culture & Entertainment";
  if (["professional creative"].includes(folded)) return "Media & Creative Services";
  if ([
    "home trades", "home skilled services", "home services",
    "home everyday services", "housing real estate", "housing stability", "housing stabilization",
    "construction trades",
  ].includes(folded)) return "Home & Property Services";
  if ([
    "auto transportation", "auto services", "home auto", "transportation", "transportation logistics",
  ].includes(folded)) return "Automotive & Transportation";
  if (["pet care", "pet services", "pets"].includes(folded)) return "Pets & Animal Services";
  if (["technology digital"].includes(folded)) return "Technology & Digital Services";
  if (["food agriculture", "agriculture specialty producers"].includes(folded)) return "Agriculture & Specialty Producers";
  if (["faith spirituality"].includes(folded)) return "Faith & Spirituality";
  if ([
    "family community", "community resources", "community resource", "culture belonging",
    "survive stabilize",
  ].includes(folded)) return "Community & Nonprofit";
  return CATEGORY_NAME_BY_FOLDED.get(folded) ?? category?.trim() ?? "Other Services";
}

function variantsForFamily(family: string | null | undefined): BusinessExperienceVariant[] {
  if (!family) return [];
  return ENDORSEMENT_TAG_VARIANTS
    .filter((variant) => variant.tag_family === family && variant.community_code !== "default")
    .filter((variant) => COMMUNITY_CODES.includes(variant.community_code as CommunityCode))
    .map((variant) => ({
      communityCode: variant.community_code as CommunityCode,
      label: variant.display_label,
      saidVerb: variant.said_verb,
    }));
}

function vibeChoice(vibe: VibeLabel): BusinessExperienceChoice {
  return {
    key: toSnakeKey(vibe.label),
    label: vibe.label,
    helperText: vibe.helperText,
    kind: "vibe",
    variants: [],
  };
}

function reactionChoice(tag: EndorsementTagDef): BusinessExperienceChoice {
  return {
    key: tag.tag_key,
    label: tag.default_label,
    helperText: tag.helper_text,
    kind: "reaction",
    variants: variantsForFamily(tag.tag_family),
  };
}

function officialReactionChoice(tag: OfficialQuickReviewTag): BusinessExperienceChoice {
  const compatibleLegacy = ENDORSEMENT_TAGS.find((candidate) => (
    candidate.default_label.trim().toLocaleLowerCase() === tag.label.trim().toLocaleLowerCase()
    && candidate.tag_family
  ));
  return {
    key: tag.key,
    label: tag.label,
    helperText: tag.helperText,
    kind: "reaction",
    // Rendering variants remains an explicit member preference. The catalog
    // never derives a community label from a member profile or location.
    variants: variantsForFamily(compatibleLegacy?.tag_family),
  };
}

function isOfficialQuickReviewInScope(tag: OfficialQuickReviewTag, subcategory: string): boolean {
  if (tag.subcategoryScope.trim().toLowerCase() === "all") return true;
  if (!subcategory) return false;
  return tag.subcategoryScope
    .split(";")
    .map((entry) => normalizeSubcategory(entry))
    .includes(subcategory);
}

/**
 * The founder-approved workbook is the source for new one-tap feedback.
 * The prior endorsement catalog remains in the project for historic display
 * compatibility, but it does not replace the approved labels for new choices.
 */
function officialCategoryReactionChoices(categoryName: string, subcategory: string): BusinessExperienceChoice[] {
  const approved = OFFICIAL_QUICK_REVIEW_TAGS.filter((tag) => tag.category === categoryName);
  if (approved.length === 0) return [];
  const inScope = approved.filter((tag) => isOfficialQuickReviewInScope(tag, subcategory));
  const ordered = [...inScope, ...approved.filter((tag) => !inScope.includes(tag))];
  return ordered.slice(0, 16).map(officialReactionChoice);
}

function categoryReactionChoices(categoryName: string, subcategory: string): BusinessExperienceChoice[] {
  const officialChoices = officialCategoryReactionChoices(categoryName, subcategory);
  if (officialChoices.length > 0) return officialChoices;

  const categoryId = CATEGORY_ID_BY_NAME.get(categoryName);
  if (!categoryId) return LEGACY_REACTIONS.slice(0, 4);

  const tags = ENDORSEMENT_TAGS.filter((tag) => tag.category_ids.includes(categoryId));
  const exact = subcategory
    ? tags.filter((tag) => tag.subcategory_keys.map(normalizeSubcategory).includes(subcategory))
    : [];
  const categoryWide = tags.filter((tag) => tag.subcategory_keys.length === 0);
  const remaining = tags.filter((tag) => !exact.includes(tag) && !categoryWide.includes(tag));
  const ordered = [...exact, ...categoryWide, ...remaining]
    .sort((a, b) => a.sort_weight - b.sort_weight);

  const choices: BusinessExperienceChoice[] = [];
  const seen = new Set<string>();
  for (const tag of ordered) {
    if (seen.has(tag.tag_key)) continue;
    seen.add(tag.tag_key);
    choices.push(reactionChoice(tag));
    if (choices.length >= 12) break;
  }

  if (categoryName === "Food & Drink") {
    for (const legacy of LEGACY_REACTIONS) {
      if (!seen.has(legacy.key) && choices.length < 12) choices.push(legacy);
    }
  }

  return choices.length > 0 ? choices : LEGACY_REACTIONS.slice(0, 4);
}

export function getBusinessExperiencePolicy(
  category: string | null | undefined,
  subcategory?: string | null,
): BusinessExperiencePolicy {
  const categoryName = resolveCanonicalCategory(category);
  const subcategoryKey = normalizeSubcategory(subcategory);
  const experienceLayer = usesTheRealExperienceLayer(categoryName, subcategoryKey) ? "real" : "vibe";
  const vibeChoices = experienceLayer === "vibe" && isVibeEligible(categoryName)
    ? (VIBES_BY_CATEGORY[categoryName] ?? []).map(vibeChoice).slice(0, 20)
    : [];

  return {
    category: categoryName,
    subcategory: subcategoryKey || null,
    experienceLayer,
    atmosphereLabel: "The Vibe",
    reactionLabel: experienceLayer === "real" ? "The Real" : "Community Feedback",
    vibeChoices,
    reactionChoices: categoryReactionChoices(categoryName, subcategoryKey),
    priceChoices: PRICE_CHOICES,
  };
}

export function normalizeBusinessExperiencePriceKey(
  policy: BusinessExperiencePolicy,
  storedValue: string | null | undefined,
): string | null {
  const normalized = storedValue?.trim();
  if (!normalized) return null;
  return policy.priceChoices.find((choice) => (
    choice.key === normalized || choice.label === normalized
  ))?.key ?? null;
}

export function resolveExperienceChoiceLabel(
  choice: BusinessExperienceChoice,
  communityCode: CommunityCode,
): string {
  if (communityCode === "default") return choice.label;
  return choice.variants.find((variant) => variant.communityCode === communityCode)?.label ?? choice.label;
}

export function isExperienceChoiceAllowed(
  policy: BusinessExperiencePolicy,
  kind: BusinessExperienceKind,
  key: string,
): boolean {
  const choices = kind === "vibe"
    ? policy.vibeChoices
    : kind === "reaction"
      ? policy.reactionChoices
      : policy.priceChoices;
  return choices.some((choice) => choice.key === key);
}

export function normalizeOwnerExperienceKey(value: string): string {
  return toSnakeKey(value);
}

export function getOwnerProfileExperienceChoices(
  policy: BusinessExperiencePolicy,
): BusinessExperienceChoice[] {
  return policy.vibeChoices.length > 0 ? policy.vibeChoices : policy.reactionChoices;
}
