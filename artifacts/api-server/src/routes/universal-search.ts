/**
 * GET /api/search/universal
 *
 * One search endpoint. Seven entity types. Match classification. Fallback ladder.
 * This is the canonical search service for Map, Explore, Directory, Library, Kinfolk.
 *
 * Founder authorization: Checkpoint 1 — Foundation
 * Rules: additive only, existing endpoints untouched, no demand notifications yet.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { FEATURE_FLAGS } from "../constants/featureFlags";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// ── Match tiers — ordered best to worst ──────────────────────────────────────
export type MatchTier =
  | "city_exact"
  | "exact_name"
  | "exact_specialty"
  | "community_confirmed"
  | "related_category"
  | "vibe_match"
  | "nearby_alternative";

const TIER_RANK: Record<MatchTier, number> = {
  city_exact: 7,       // Location-aware match: city token detected in query, result is in that city
  exact_name: 6,
  exact_specialty: 5,
  community_confirmed: 4,
  related_category: 3,
  vibe_match: 2,
  nearby_alternative: 1,
};

// ── Concept taxonomy ──────────────────────────────────────────────────────────
// Maps search tokens → partial category keywords used with ILIKE '%keyword%'.
// Using partial terms so "Food" matches "Food", "Food & Drink", "Food & Beverage".
// Multiple terms = OR — any one matching is sufficient.
const CONCEPT_TO_CATEGORY: Record<string, string[]> = {
  // ── Food ─────────────────────────────────────────────────────────────────
  waffle:        ["Food"],
  waffles:       ["Food"],
  brunch:        ["Food"],
  breakfast:     ["Food"],
  lunch:         ["Food"],
  dinner:        ["Food"],
  soul:          ["Food"],
  "soul food":   ["Food"],
  seafood:       ["Food"],
  pizza:         ["Food"],
  burger:        ["Food"],
  sandwich:      ["Food"],
  vegan:         ["Food", "Health"],
  vegetarian:    ["Food"],
  coffee:        ["Food"],
  cafe:          ["Food"],
  cafeteria:     ["Food"],
  bakery:        ["Food"],
  cake:          ["Food"],
  dessert:       ["Food"],
  tea:           ["Food"],
  "tea party":   ["Food", "Event"],
  "tea parties": ["Food", "Event"],
  ethiopian:     ["Food"],
  caribbean:     ["Food"],
  jamaican:      ["Food"],
  african:       ["Food"],
  restaurant:    ["Food"],
  restaurants:   ["Food"],
  food:          ["Food"],
  catering:      ["Food"],
  pancake:       ["Food"],
  pancakes:      ["Food"],
  diner:         ["Food"],
  diners:        ["Food"],
  blueberry:     ["Food"],
  omelette:      ["Food"],
  omelet:        ["Food"],
  steak:         ["Food"],
  bbq:           ["Food"],
  barbecue:      ["Food"],
  "fried chicken": ["Food"],
  "chicken wings": ["Food"],
  wings:         ["Food"],
  sushi:         ["Food"],
  tacos:         ["Food"],
  taco:          ["Food"],
  ramen:         ["Food"],
  pho:           ["Food"],
  // ── Automotive ───────────────────────────────────────────────────────────
  transmission:  ["Automotive"],
  mechanic:      ["Automotive"],
  mechanics:     ["Automotive"],
  automotive:    ["Automotive"],
  "auto repair": ["Automotive"],
  "car repair":  ["Automotive"],
  "oil change":  ["Automotive"],
  tires:         ["Automotive"],
  tire:          ["Automotive"],
  brakes:        ["Automotive"],
  detailing:     ["Automotive"],
  "auto detailing": ["Automotive"],
  "body shop":   ["Automotive"],
  alignment:     ["Automotive"],
  exhaust:       ["Automotive"],
  // ── Beauty / Hair / Personal Care ────────────────────────────────────────
  hair:          ["Beauty", "Personal Care"],
  salon:         ["Beauty", "Personal Care"],
  barber:        ["Beauty", "Personal Care"],
  barbershop:    ["Beauty", "Personal Care"],
  nail:          ["Beauty", "Personal Care"],
  nails:         ["Beauty", "Personal Care"],
  lashes:        ["Beauty", "Personal Care"],
  alopecia:      ["Beauty", "Personal Care", "Health"],
  "hair loss":   ["Beauty", "Personal Care", "Health"],
  wig:           ["Beauty", "Personal Care"],
  braids:        ["Beauty", "Personal Care"],
  braiding:      ["Beauty", "Personal Care"],
  braider:       ["Beauty", "Personal Care"],
  "braid shop":  ["Beauty", "Personal Care"],
  "hair braiding": ["Beauty", "Personal Care"],
  locs:          ["Beauty", "Personal Care"],
  extensions:    ["Beauty", "Personal Care"],
  "beauty supply": ["Beauty", "Retail"],
  spa:           ["Beauty", "Health", "Personal Care"],
  massage:       ["Beauty", "Health", "Personal Care"],
  stylist:       ["Beauty", "Personal Care"],
  grooming:      ["Beauty", "Personal Care"],
  // ── Legal ────────────────────────────────────────────────────────────────
  attorney:      ["Legal"],
  lawyer:        ["Legal"],
  "tax attorney": ["Legal", "Financial"],
  notary:        ["Legal"],
  immigration:   ["Legal"],
  // ── Financial ────────────────────────────────────────────────────────────
  tax:           ["Financial"],
  accounting:    ["Financial"],
  accountant:    ["Financial"],
  financial:     ["Financial"],
  insurance:     ["Financial"],
  mortgage:      ["Financial"],
  bookkeeping:   ["Financial"],
  payroll:       ["Financial"],
  // ── Health ───────────────────────────────────────────────────────────────
  doctor:        ["Health"],
  dentist:       ["Health", "Dental"],
  dental:        ["Health", "Dental"],
  therapy:       ["Health", "Wellness"],
  therapist:     ["Health", "Wellness"],
  medical:       ["Health"],
  healthcare:    ["Health"],
  fitness:       ["Health", "Sports"],
  gym:           ["Health", "Sports"],
  nutrition:     ["Health", "Wellness"],
  wellness:      ["Health", "Wellness"],
  // Medical specialties — these are commonly searched but lack CONCEPT_TO_CATEGORY entries,
  // causing them to produce zero mappedCategories → bypassing the nearby_alternative guard.
  obgyn:         ["Health"],
  "ob/gyn":      ["Health"],
  gynecologist:  ["Health"],
  gynecology:    ["Health"],
  pediatrician:  ["Health"],
  pediatrics:    ["Health"],
  physician:     ["Health"],
  specialist:    ["Health", "Professional"],
  clinic:        ["Health"],
  psychiatrist:  ["Health", "Wellness"],
  psychiatry:    ["Health", "Wellness"],
  urologist:     ["Health"],
  urology:       ["Health"],
  cardiologist:  ["Health"],
  orthopedic:    ["Health"],
  dermatologist: ["Health"],
  optometrist:   ["Health", "Vision"],
  chiropractor:  ["Health", "Wellness"],
  acupuncture:   ["Health", "Wellness"],
  doula:         ["Health", "Family"],
  midwife:       ["Health", "Family"],
  midwifery:     ["Health", "Family"],
  // Trades — "plumber" vs "plumbing" both need entries
  plumber:       ["Home", "Property", "Trades", "Home Services", "Plumbing"],
  electrician:   ["Home", "Property", "Trades", "Home Services", "Electrical"],
  contractor:    ["Home", "Property", "Trades", "Home Services", "Construction"],
  handyman:      ["Home", "Property", "Trades", "Home Services"],
  roofer:        ["Home", "Property", "Trades", "Home Services", "Roofing"],
  roofing:       ["Home", "Property", "Trades", "Home Services", "Roofing"],
  hvac:          ["Home", "Property", "Trades", "Home Services", "HVAC"],
  painter:       ["Home", "Property", "Trades", "Home Services", "Painting"],
  painting:      ["Home", "Property", "Trades", "Home Services", "Painting"],
  // ── Retail / Shopping ────────────────────────────────────────────────────
  boutique:      ["Retail", "Shopping"],
  clothing:      ["Retail", "Shopping"],
  jewelry:       ["Retail", "Shopping"],
  flowers:       ["Retail", "Shopping"],
  florist:       ["Retail", "Shopping"],
  bookstore:     ["Retail", "Shopping"],
  books:         ["Retail", "Education"],
  // ── Home / Trades ────────────────────────────────────────────────────────
  welding:       ["Home", "Property", "Professional"],
  welder:        ["Home", "Property", "Professional"],
  plumbing:      ["Home", "Property"],
  electrical:    ["Home", "Property"],
  construction:  ["Home", "Property"],
  landscaping:   ["Home", "Property"],
  cleaning:      ["Home", "Property"],
  remodeling:    ["Home", "Property"],
  // ── Education ────────────────────────────────────────────────────────────
  hbcu:          ["Education", "Culture"],
  tutor:         ["Education"],
  daycare:       ["Children", "Family", "Education"],
  school:        ["Education"],
  college:       ["Education"],
  // ── Culture / Arts / Heritage ─────────────────────────────────────────
  "underground railroad": ["Culture", "Arts"],
  "civil rights": ["Culture", "Arts"],
  heritage:      ["Culture", "Arts"],
  culture:       ["Culture", "Arts"],
  museum:        ["Culture", "Arts"],
  gallery:       ["Culture", "Arts"],
  jazz:          ["Culture", "Arts", "Food"],
  concert:       ["Culture", "Arts"],
  festival:      ["Culture", "Arts", "Event"],
  music:         ["Culture", "Arts"],
  // ── Events ───────────────────────────────────────────────────────────────
  event:         ["Event", "Celebration"],
  wedding:       ["Event", "Celebration"],
  party:         ["Event", "Celebration"],
  venue:         ["Event", "Celebration"],
  // ── Travel ───────────────────────────────────────────────────────────────
  // ── Entertainment / Nightlife ─────────────────────────────────────────────
  nightlife:     ["Entertainment & Recreation", "Bar / Nightlife"],
  bar:           ["Entertainment & Recreation", "Bar / Nightlife"],
  bars:          ["Entertainment & Recreation", "Bar / Nightlife"],
  club:          ["Entertainment & Recreation", "Bar / Nightlife"],
  clubs:         ["Entertainment & Recreation", "Bar / Nightlife"],
  lounge:        ["Entertainment & Recreation", "Bar / Nightlife"],
  lounges:       ["Entertainment & Recreation", "Bar / Nightlife"],
  // ── Travel ───────────────────────────────────────────────────────────────
  travel:        ["Travel", "Hospitality"],
  tour:          ["Travel", "Culture"],
  hotel:         ["Travel", "Hospitality"],
  // ── Professional ─────────────────────────────────────────────────────────
  realtor:       ["Professional", "Real Estate", "Financial"],
  "real estate": ["Professional", "Real Estate", "Financial"],
  marketing:     ["Professional"],
  photography:   ["Professional", "Media", "Creative"],
  // ── Faith & Spirituality ──────────────────────────────────────────────────
  // Partial keywords match "Faith & Spirituality", "Community & Nonprofit"
  church:        ["Faith", "Spiritual", "Community"],
  churches:      ["Faith", "Spiritual", "Community"],
  mosque:        ["Faith", "Islam", "Muslim", "Community"],
  mosques:       ["Faith", "Islam", "Muslim"],
  gurdwara:      ["Faith", "Sikh"],
  gurdwaras:     ["Faith", "Sikh"],
  temple:        ["Faith", "Spiritual", "Hindu", "Buddhist"],
  temples:       ["Faith", "Spiritual"],
  synagogue:     ["Faith", "Jewish"],
  synagogues:    ["Faith", "Jewish"],
  "house of worship": ["Faith", "Spiritual"],
  "place of worship": ["Faith", "Spiritual"],
  ame:           ["Faith", "Church", "AME"],
  "african methodist": ["Faith", "Church", "AME"],
  "cogic":       ["Faith", "Church"],
  "pentecostal": ["Faith", "Church"],
  "apostolic":   ["Faith", "Church"],
  baptist:       ["Faith", "Church"],
  "black church": ["Faith", "Church", "Community"],
  "historic black church": ["Faith", "Church", "Community"],
  "historic church": ["Faith", "Church"],
  "black catholic": ["Faith", "Church", "Catholic"],
  catholic:      ["Faith", "Church", "Catholic"],
  episcopal:     ["Faith", "Church"],
  methodist:     ["Faith", "Church"],
  lutheran:      ["Faith", "Church"],
  presbyterian:  ["Faith", "Church"],
  adventist:     ["Faith", "Church"],
  "seventh day": ["Faith", "Church"],
  "ethiopian orthodox": ["Faith", "Church", "Ethiopian", "Orthodox"],
  "eritrean orthodox": ["Faith", "Church", "Eritrean", "Orthodox"],
  "coptic":      ["Faith", "Church", "Orthodox"],
  quaker:        ["Faith", "Spiritual", "Community"],
  "meeting house": ["Faith", "Quaker"],
  islam:         ["Faith", "Islam", "Muslim"],
  muslim:        ["Faith", "Islam", "Muslim"],
  islamic:       ["Faith", "Islam", "Muslim"],
  jewish:        ["Faith", "Jewish"],
  judaism:       ["Faith", "Jewish"],
  "black jewish": ["Faith", "Jewish"],
  hindu:         ["Faith", "Hindu"],
  sikh:          ["Faith", "Sikh"],
  buddhist:      ["Faith", "Buddhist"],
  buddhism:      ["Faith", "Buddhist"],
  jain:          ["Faith", "Jain"],
  "bahai":       ["Faith", "Bahai"],
  "unitarian":   ["Faith", "Spiritual", "Community"],
  interfaith:    ["Faith", "Interfaith", "Community"],
  multifaith:    ["Faith", "Interfaith", "Community"],
  "spanish mass": ["Faith", "Catholic", "Spanish"],
  "haitian church": ["Faith", "Church", "Haitian"],
  "african church": ["Faith", "Church", "African"],
  "west african church": ["Faith", "Church", "African"],
  "gospel choir": ["Faith", "Church", "Music"],
  gospel:        ["Faith", "Church", "Music", "Arts"],
  "food pantry church": ["Faith", "Community"],
  "faith volunteer": ["Faith", "Community"],
  "faith community": ["Faith", "Spiritual", "Community"],
  "houses of faith": ["Faith", "Spiritual"],
  meditation:    ["Faith", "Buddhist", "Spiritual", "Health", "Wellness"],
  "langar":      ["Faith", "Sikh"],
};

// ── Faith / heritage / library intent triggers ────────────────────────────────
const FAITH_TRIGGERS = [
  "church", "mosque", "gurdwara", "synagogue", "temple", "cathedral",
  // Fixed: "ame " (with trailing space) missed "AME" at end of string — use bare word.
  // detectIntentType uses .includes() so word-boundary is not needed here.
  "ame church", "african methodist episcopal", "cogic", "baptist", "pentecostal",
  "apostolic", "methodist", "catholic", "episcopal", "lutheran", "presbyterian",
  "adventist", "quaker", "meeting house", "islam", "muslim", "jewish", "judaism",
  "hindu", "sikh", "buddhist", "buddhism", "jain", "bahai", "unitarian",
  "interfaith", "multifaith", "gospel", "langar", "house of worship",
  "place of worship", "spiritual community", "faith community", "congregation",
  "parish", "diocese", "ministry", "chapel", "shrine", "tabernacle", "zion",
  "black church", "historic church", "houses of faith", "meditation center",
  "spanish mass", "haitian church", "african church", "orthodox church",
  "ethiopian orthodox", "african orthodox", "coptic", "masjid", "jumu'ah",
];

const HERITAGE_TRIGGERS = [
  "hbcu", "historically black", "underground railroad", "civil rights",
  "freedom trail", "sundown town", "diaspora", "ancestor", "heritage",
  "black history",
];

const COUNTRY_TRIGGERS = [
  "kenya", "ghana", "nigeria", "ethiopia", "south africa", "jamaica",
  "haiti", "trinidad", "barbados", "guyana", "cuba", "brazil", "colombia",
  "mexico", "india", "egypt", "morocco", "senegal", "cameroon", "tanzania",
  "zimbabwe", "uganda", "angola", "mozambique", "madagascar", "zambia",
];

// ── Intent type detection ────────────────────────────────────────────────────
type IntentType =
  | "named_business"
  | "food_item"
  | "specialty_service"
  | "heritage"
  | "faith"
  | "library_country"
  | "library_topic"
  | "category_browse"
  | "event"
  | "vibe_experience"
  | "general";

function detectIntentType(q: string): IntentType {
  const lower = q.toLowerCase().trim();

  // Heritage wins over everything except faith for explicitly historical queries
  if (HERITAGE_TRIGGERS.some((t) => lower.includes(t))) return "heritage";

  // Faith intent — check before country so "Ethiopian Orthodox" → faith, not country
  if (FAITH_TRIGGERS.some((t) => lower.includes(t))) return "faith";

  // Country/culture book
  if (COUNTRY_TRIGGERS.some((t) => lower === t || lower.startsWith(t + " ") || lower.endsWith(" " + t))) {
    return "library_country";
  }

  // Food items (multi-word first)
  if (
    lower.includes("soul food") || lower.includes("tea part") ||
    lower.includes("brunch") || lower.includes("waffle") ||
    lower.includes("seafood") || lower.includes("ethiopian") ||
    lower.includes("caribbean") || lower.includes("vegan")
  ) return "food_item";

  // Event signals
  if (/\b(tonight|this week|weekend|festival|concert|jazz|event)\b/i.test(q)) return "event";

  // Specialty beauty/trade service
  if (/\b(alopecia|stylist|braids|braiding|braider|locs|welder|welding|attorney|therapist)\b/i.test(q)) return "specialty_service";

  // Medical/healthcare specialties — must fire BEFORE isProperNoun check because
  // many medical terms are acronyms or proper-looking words (OBGYN, OBGYN Philadelphia).
  // A query like "OBGYN Philadelphia" would otherwise match isProperNoun and become
  // named_business, returning fuzzy-name alternatives like employment nonprofits.
  if (/\b(obgyn|ob\/gyn|gynecol|gynecolog|pediatri|physician|psychiatr|urolog|cardiolog|orthoped|dermatolog|optometri|chiropract|doula|midwif|radiolog|oncolog|neurolog|ophthalmol|endocrinol|gastroenterol|pulmonolog|rheumatol|hematolog|nephrolog|anesthesiol|patholog|allergist|immunolog|osteopath)\b/i.test(q)) return "healthcare";

  // Named business heuristic: title-cased multi-word with no category keywords.
  // Guard: only fire if the query doesn't contain any trade/profession keywords that
  // were mapped via CONCEPT_TO_CATEGORY (those queries have category anchors and
  // should use the general path to get proper mappedCategories populated).
  const words = q.trim().split(/\s+/);
  const isProperNoun = words.length >= 2 && words.every((w) => /^[A-Z]/.test(w));
  if (isProperNoun) return "named_business";

  return "general";
}

// ── Extract searchable tokens from raw query ──────────────────────────────────
function extractConcepts(q: string): {
  normalizedConcept: string;
  searchTokens: string[];
  mappedCategories: string[];
} {
  const lower = q.toLowerCase().trim();
  const searchTokens: string[] = [q.trim()]; // always include raw query
  const mappedCategories: Set<string> = new Set();

  // Extract individual words, bigrams, and trigrams for concept mapping.
  // SEMANTIC PRECISION RULE: push an n-gram to searchTokens ONLY when that
  // specific n-gram matched — never push a shorter sub-token just because its
  // containing bigram/trigram matched. Violating this turns "black church" into
  // a "black" ILIKE token that pulls in "Black Dragon Take Out" as a faith result.
  const words = lower.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const bigram  = i < words.length - 1 ? `${word} ${words[i + 1]}` : null;
    const trigram = i < words.length - 2 ? `${word} ${words[i + 1]} ${words[i + 2]}` : null;

    // De-pluralization fallback: "restaurants"→"restaurant", "spas"→"spa", etc.
    // Only fires when the exact word has no entry, so it never overrides explicit
    // plural entries (e.g. "churches" is already mapped directly above).
    const singular = CONCEPT_TO_CATEGORY[word]
      ? null
      : word.endsWith("ies") && word.length > 4
        ? word.slice(0, -3) + "y"
        : word.endsWith("s") && word.length > 4
          ? word.slice(0, -1)
          : null;
    const wordCats = CONCEPT_TO_CATEGORY[word] ?? (singular ? (CONCEPT_TO_CATEGORY[singular] ?? []) : []);
    const bigramCats  = bigram  ? (CONCEPT_TO_CATEGORY[bigram]  ?? []) : [];
    const trigramCats = trigram ? (CONCEPT_TO_CATEGORY[trigram] ?? []) : [];

    [...wordCats, ...bigramCats, ...trigramCats].forEach((c) => mappedCategories.add(c));

    // Each token is only added to searchTokens if IT ITSELF matched — not its sub-tokens.
    if (wordCats.length  > 0)                    searchTokens.push(word);
    if (bigramCats.length > 0  && bigram)         searchTokens.push(bigram);
    if (trigramCats.length > 0 && trigram)        searchTokens.push(trigram);
  }

  // Normalize concept: strip generic adjectives, keep meaningful terms
  const stopAdjectives = new Set([
    "fruity", "pebble", "crispy", "golden", "classic", "fresh", "homemade",
    "best", "good", "great", "amazing", "special", "fancy", "nice",
  ]);
  const meaningful = words.filter((w) => !stopAdjectives.has(w));
  const normalizedConcept = meaningful.join(" ");

  return {
    normalizedConcept,
    searchTokens: [...new Set(searchTokens)],
    mappedCategories: [...mappedCategories],
  };
}

/**
 * pg returns text[] columns as JavaScript arrays (not JSON strings).
 * JSON.parse on a JS array throws SyntaxError and silently kills the whole
 * result set when it's inside a catch-all try/catch.
 * This helper handles both cases safely.
 */
function safeParseArray(val: unknown): string[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { return JSON.parse(val) as string[]; } catch { return []; }
  }
  return undefined;
}

// ── Business search — multi-field, match-classified ──────────────────────────
interface BusinessResult {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  city: string;
  state: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  latitude?: number;
  longitude?: number;
  ownershipDesignations?: string[];
  blackOwned?: boolean;
  instagram?: string;
  website?: string;
  phone?: string;
  priceRange?: string;
  confidenceScore?: number;
  matchTier: MatchTier;
  matchReason: string;
  matchedFields: string[];
}

async function searchBusinesses(opts: {
  q: string;
  searchTokens: string[];
  mappedCategories: string[];
  intentType: IntentType;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  radius: number;
  limit: number;
  isTester?: boolean;
}): Promise<BusinessResult[]> {
  const {
    q, searchTokens, mappedCategories, intentType,
    city, state, lat, lng, radius, limit, isTester,
  } = opts;

  const results = new Map<string, BusinessResult>();

  const listingFilter = isTester
    ? "1=1"
    : "b.listing_status IN ('live_unclaimed', 'live_claimed')";

  const geoFilter = (lat !== undefined && lng !== undefined)
    ? `AND (
        3959 * acos(
          cos(radians($LAT)) * cos(radians(b.latitude)) *
          cos(radians(b.longitude) - radians($LNG)) +
          sin(radians($LAT)) * sin(radians(b.latitude))
        )
      ) <= $RADIUS`
    : "";

  // ── PASS 1: Exact name match ──────────────────────────────────────────────
  for (const token of searchTokens.slice(0, 3)) {
    if (token.length < 2) continue;
    try {
      const params: unknown[] = [`%${token}%`];
      let cityClause = "";
      let geoClause = "";
      let offset = 1;

      if (city) { offset++; params.push(`%${city}%`); cityClause = `AND b.city ILIKE $${offset}`; }
      if (state) { offset++; params.push(`%${state}%`); }

      if (lat !== undefined && lng !== undefined) {
        params.push(lat, lng, radius);
        geoClause = `AND (3959 * acos(GREATEST(-1, LEAST(1, cos(radians($${offset + 1})) * cos(radians(b.latitude)) * cos(radians(b.longitude) - radians($${offset + 2})) + sin(radians($${offset + 1})) * sin(radians(b.latitude)))))) <= $${offset + 3}`;
        offset += 3;
      }

      const rows = await pool.query<{
        id: string; name: string; category: string; subcategory: string;
        city: string; state: string; description: string; image_url: string;
        rating: string; review_count: string; verified: boolean;
        latitude: string; longitude: string; ownership_designations: string;
        black_owned: boolean; instagram: string; website: string;
        phone: string; price_range: string; confidence_score: string;
      }>(
        `SELECT b.id, b.name, b.category, b.subcategory, b.city, b.state,
                b.description, b.image_url, b.rating, b.review_count,
                b.verified, b.latitude, b.longitude, b.ownership_designations,
                b.black_owned, b.instagram, b.website, b.phone,
                b.price_range, b.confidence_score
         FROM businesses b
         WHERE b.status = 'active'
           AND ${listingFilter}
           AND b.name ILIKE $1
           ${cityClause} ${geoClause}
         ORDER BY b.verified DESC, b.confidence_score DESC NULLS LAST, b.name ASC
         LIMIT ${Math.min(limit, 20)}`,
        params,
      );

      for (const row of rows.rows) {
        if (results.has(row.id)) continue;
        results.set(row.id, {
          id: row.id, name: row.name, category: row.category,
          subcategory: row.subcategory ?? undefined, city: row.city, state: row.state,
          description: row.description ?? undefined, imageUrl: row.image_url ?? undefined,
          rating: row.rating ? parseFloat(row.rating) : undefined,
          reviewCount: row.review_count ? parseInt(row.review_count) : undefined,
          verified: row.verified, latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          ownershipDesignations: safeParseArray(row.ownership_designations),
          blackOwned: row.black_owned, instagram: row.instagram ?? undefined,
          website: row.website ?? undefined, phone: row.phone ?? undefined,
          priceRange: row.price_range ?? undefined,
          confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
          matchTier: "exact_name",
          matchReason: `Business name matches "${token}"`,
          matchedFields: ["name"],
        });
      }
    } catch { /* column may not exist in all envs — skip */ }
  }

  // ── PASS 2: Extended field search (description + community intelligence) ──
  const extendedToken = q.trim();
  if (extendedToken.length >= 2) {
    try {
      // Also join community_says if it exists
      const params: unknown[] = [`%${extendedToken}%`];
      let offset = 1;
      let p2CityClause = "";
      let p2GeoClause = "";
      if (city) { offset++; params.push(`%${city}%`); p2CityClause = `AND b.city ILIKE $${offset}`; }
      // Apply geo filter when caller supplied coordinates — prevents PASS 2 from
      // returning US businesses when the search is geo-bounded to an international city.
      if (lat !== undefined && lng !== undefined) {
        params.push(lat, lng, radius);
        const p2li = params.length;
        p2GeoClause = ` AND (3959 * acos(GREATEST(-1, LEAST(1, cos(radians($${p2li - 2})) * cos(radians(b.latitude)) * cos(radians(b.longitude) - radians($${p2li - 1})) + sin(radians($${p2li - 2})) * sin(radians(b.latitude)))))) <= $${p2li}`;
      }

      const rows = await pool.query<{
        id: string; name: string; category: string; subcategory: string;
        city: string; state: string; description: string; image_url: string;
        rating: string; review_count: string; verified: boolean;
        latitude: string; longitude: string; ownership_designations: string;
        black_owned: boolean; instagram: string; website: string;
        phone: string; price_range: string; confidence_score: string;
        matched_field: string; says_text: string;
      }>(
        `SELECT DISTINCT ON (b.id)
                b.id, b.name, b.category, b.subcategory, b.city, b.state,
                b.description, b.image_url, b.rating, b.review_count,
                b.verified, b.latitude, b.longitude, b.ownership_designations,
                b.black_owned, b.instagram, b.website, b.phone,
                b.price_range, b.confidence_score,
                CASE
                  WHEN b.description ILIKE $1 THEN 'description'
                  WHEN b.tags::text ILIKE $1 THEN 'tags'
                  WHEN b.owner_bio ILIKE $1 THEN 'owner_bio'
                  WHEN b.business_tagline ILIKE $1 THEN 'tagline'
                  ELSE 'other'
                END as matched_field,
                NULL::text as says_text
         FROM businesses b
         WHERE b.status = 'active'
           AND ${listingFilter}
           AND (
             b.description ILIKE $1
             OR b.tags::text ILIKE $1
             OR b.owner_bio ILIKE $1
             OR b.business_tagline ILIKE $1
           )
           ${p2CityClause} ${p2GeoClause}
         ORDER BY b.id, b.verified DESC
         LIMIT ${Math.min(limit, 20)}`,
        params,
      );

      for (const row of rows.rows) {
        if (results.has(row.id)) continue;
        results.set(row.id, {
          id: row.id, name: row.name, category: row.category,
          subcategory: row.subcategory ?? undefined, city: row.city, state: row.state,
          description: row.description ?? undefined, imageUrl: row.image_url ?? undefined,
          rating: row.rating ? parseFloat(row.rating) : undefined,
          reviewCount: row.review_count ? parseInt(row.review_count) : undefined,
          verified: row.verified, latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          ownershipDesignations: safeParseArray(row.ownership_designations),
          blackOwned: row.black_owned, instagram: row.instagram ?? undefined,
          website: row.website ?? undefined, phone: row.phone ?? undefined,
          priceRange: row.price_range ?? undefined,
          confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
          matchTier: "exact_specialty",
          matchReason: `Found in business ${row.matched_field.replace("_", " ")}`,
          matchedFields: [row.matched_field],
        });
      }
    } catch { /* skip */ }

    // Also check community_says table
    try {
      const csRows = await pool.query<{
        id: string; name: string; category: string; subcategory: string;
        city: string; state: string; description: string; image_url: string;
        rating: string; review_count: string; verified: boolean;
        latitude: string; longitude: string; ownership_designations: string;
        black_owned: boolean; instagram: string; website: string;
        phone: string; price_range: string; confidence_score: string;
        says_text: string;
      }>(
        `SELECT DISTINCT ON (b.id)
                b.id, b.name, b.category, b.subcategory, b.city, b.state,
                b.description, b.image_url, b.rating, b.review_count,
                b.verified, b.latitude, b.longitude, b.ownership_designations,
                b.black_owned, b.instagram, b.website, b.phone,
                b.price_range, b.confidence_score,
                cs.says_text
         FROM businesses b
         JOIN community_says cs ON cs.business_id = b.id
         WHERE b.status = 'active'
           AND ${listingFilter}
           AND cs.says_text ILIKE $1
           ${city ? `AND b.city ILIKE $2` : ""}
         ORDER BY b.id, b.verified DESC
         LIMIT ${Math.min(limit, 10)}`,
        city ? [`%${extendedToken}%`, `%${city}%`] : [`%${extendedToken}%`],
      );

      for (const row of csRows.rows) {
        if (results.has(row.id)) {
          // Upgrade tier if community confirms it
          const existing = results.get(row.id)!;
          if (TIER_RANK[existing.matchTier] < TIER_RANK["community_confirmed"]) {
            existing.matchTier = "community_confirmed";
            existing.matchReason = `Community members describe this business with "${extendedToken}"`;
            existing.matchedFields.push("community_says");
          }
          continue;
        }
        results.set(row.id, {
          id: row.id, name: row.name, category: row.category,
          subcategory: row.subcategory ?? undefined, city: row.city, state: row.state,
          description: row.description ?? undefined, imageUrl: row.image_url ?? undefined,
          rating: row.rating ? parseFloat(row.rating) : undefined,
          reviewCount: row.review_count ? parseInt(row.review_count) : undefined,
          verified: row.verified, latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          ownershipDesignations: safeParseArray(row.ownership_designations),
          blackOwned: row.black_owned, instagram: row.instagram ?? undefined,
          website: row.website ?? undefined, phone: row.phone ?? undefined,
          priceRange: row.price_range ?? undefined,
          confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
          matchTier: "community_confirmed",
          matchReason: `Community members describe this business with "${extendedToken}"`,
          matchedFields: ["community_says"],
        });
      }
    } catch { /* community_says may not exist */ }
  }

  // ── PASS 2.5: Location-aware multi-token search ───────────────────────────
  // Handles queries like "hair store Philadelphia" or "barber DC" where the user
  // embeds a city/state name in the search string without using the ?city= param.
  // We detect which tokens are real cities in our DB using ANY(), then filter the
  // remaining tokens (category/name intent) to businesses in that location.
  // Only runs when no explicit city/state/geo params were provided, and the query
  // has 2+ words — so it never interferes with single-term or geo-bounded searches.
  {
    const allWords = q.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    if (allWords.length >= 2 && !city && !state && lat === undefined) {
      try {
        const cityCheckRes = await pool.query<{ city_lower: string }>(
          `SELECT DISTINCT lower(city) AS city_lower
           FROM businesses
           WHERE status = 'active' AND lower(city) = ANY($1::text[])
           LIMIT 10`,
          [allWords],
        );
        const detectedCities = new Set(cityCheckRes.rows.map(r => r.city_lower));

        const STATE_ABBREVS_SET = new Set([
          "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
          "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
          "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
          "va","wa","wv","wi","wy","dc",
        ]);

        const locationTokens = allWords.filter(w =>
          detectedCities.has(w) || (w.length === 2 && STATE_ABBREVS_SET.has(w)),
        );
        const contentTokens = allWords.filter(
          w => !locationTokens.includes(w) && w.length >= 2,
        );

        if (locationTokens.length > 0 && contentTokens.length > 0) {
          const contentPatterns = contentTokens.map(t => `%${t}%`);

          const locRows = await pool.query<{
            id: string; name: string; category: string; subcategory: string;
            city: string; state: string; description: string; image_url: string;
            rating: string; review_count: string; verified: boolean;
            latitude: string; longitude: string; ownership_designations: string;
            black_owned: boolean; instagram: string; website: string;
            phone: string; price_range: string; confidence_score: string;
          }>(
            `SELECT b.id, b.name, b.category, b.subcategory, b.city, b.state,
                    b.description, b.image_url, b.rating, b.review_count,
                    b.verified, b.latitude, b.longitude, b.ownership_designations,
                    b.black_owned, b.instagram, b.website, b.phone,
                    b.price_range, b.confidence_score
             FROM businesses b
             WHERE b.status = 'active'
               AND ${listingFilter}
               AND lower(b.city) = ANY($1::text[])
               AND (
                 lower(b.name)           LIKE ANY($2::text[])
                 OR lower(b.category)    LIKE ANY($2::text[])
                 OR lower(b.subcategory) LIKE ANY($2::text[])
                 OR lower(b.description) LIKE ANY($2::text[])
               )
             ORDER BY b.verified DESC, b.confidence_score DESC NULLS LAST
             LIMIT ${Math.min(limit * 2, 20)}`,
            [locationTokens, contentPatterns],
          );

          for (const row of locRows.rows) {
            if (results.has(row.id)) continue;
            results.set(row.id, {
              id: row.id, name: row.name, category: row.category,
              subcategory: row.subcategory ?? undefined,
              city: row.city, state: row.state,
              description: row.description ?? undefined,
              imageUrl: row.image_url ?? undefined,
              rating: row.rating ? parseFloat(row.rating) : undefined,
              reviewCount: row.review_count ? parseInt(row.review_count) : undefined,
              verified: row.verified,
              latitude: row.latitude ? parseFloat(row.latitude) : undefined,
              longitude: row.longitude ? parseFloat(row.longitude) : undefined,
              ownershipDesignations: safeParseArray(row.ownership_designations),
              blackOwned: row.black_owned,
              instagram: row.instagram ?? undefined,
              website: row.website ?? undefined,
              phone: row.phone ?? undefined,
              priceRange: row.price_range ?? undefined,
              confidenceScore: row.confidence_score
                ? parseFloat(row.confidence_score)
                : undefined,
              matchTier: "city_exact",
              matchReason: `${row.category} in ${locationTokens.join("/")} matching "${contentTokens.join(" ")}"`,
              matchedFields: ["city", "category"],
            });
          }
        }
      } catch { /* non-fatal — city token lookup failed */ }
    }
  }

  // ── PASS 2.6: Server-side geo-extract fallback ────────────────────────────
  // When the frontend's geo-extract step failed (no ?lat/?lng were supplied)
  // but the query contains geographic tokens that aren't category/intent words
  // (e.g. "Phuket", "Bangkok", "Los Angeles"), resolve those tokens via
  // Nominatim server-side. The resolved coords are then used in PASS 3 so that
  // "restaurant Phuket Thailand" and "restaurants los angeles" both return
  // correctly geo-bounded MWM records even when the client sent no coordinates.
  //
  // Guard conditions (all must be true to run):
  //   • No explicit lat/lng from caller (frontend geo-extract already handled it)
  //   • No explicit city param
  //   • PASSES 1–2.5 returned 0 results (geo-extract only needed as a fallback)
  let effectiveLat: number | undefined = lat;
  let effectiveLng: number | undefined = lng;
  let serverExtractedGeo = false;
  const GEO_EXTRACT_RADIUS = 50; // miles — covers any metro area / island province

  // Run when no explicit geo params — even if earlier passes already have results,
  // because PASS 1 may have filled with national data when geo-extract wasn't sent.
  // When serverExtractedGeo=true those national results are cleared before PASS 3.
  if (lat === undefined && !city) {
    const GEO_STOP_WORDS = new Set([
      "the","a","an","in","at","for","with","of","and","or","near","around",
      "some","any","best","good","great","find","show","get","want","looking",
      "me","my","us","we","are","is","was","can","do","to","from","by","on",
      "things","places","spots","area","areas","black","owned","community",
      "go","out","tonight","nearby","local","where","what","which",
    ]);
    const candidateWords = q.toLowerCase().split(/\s+/);
    const geoTokens = candidateWords.filter(
      (w) => w.length >= 3 && !GEO_STOP_WORDS.has(w) && !CONCEPT_TO_CATEGORY[w] && !/^\d+$/.test(w),
    );
    if (geoTokens.length > 0) {
      const geoQ = geoTokens.join(" ");

      // ── BUSINESS-FIRST GATE (mirrors geo-extract endpoint) ──────────────────
      // Before calling Nominatim, check whether the geo candidate matches an MWM
      // business name. "Amina" is a Philadelphia restaurant — geocoding it as
      // "Amina, Dominican Republic" and then discarding the Pass-1 result in
      // Pass 3b is the root cause of the Amina search defect.
      // Only apply for short candidates (≤ 3 words) that could plausibly be
      // business names; longer strings like "Phuket nightlife scene" are geography.
      let skipGeocode = false;
      if (geoQ.split(/\s+/).length <= 3) {
        try {
          const bizGate = await pool.query<{ id: string }>(
            `SELECT id FROM businesses WHERE name ILIKE $1 AND status = 'active' LIMIT 1`,
            [geoQ],
          );
          if (bizGate.rows.length > 0) skipGeocode = true;
        } catch { /* DB unavailable — fall through to geocode */ }
      }

      if (!skipGeocode) {
        try {
          const geoResp = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geoQ)}&format=json&limit=3&addressdetails=0`,
            {
              headers: { "User-Agent": "MappingWithMelanin/1.0 (contact@mappingwithmelanin.com)" },
              signal: AbortSignal.timeout(3000),
            },
          );
          const geoHits = (await geoResp.json()) as Array<{
            lat: string; lon: string; class: string; type: string;
          }>;
          const VALID_GEO = new Set(["place","boundary","natural","landuse","administrative"]);
          const INVALID_GEO = new Set(["restaurant","bar","hotel","cafe","hospital","church","shop"]);
          const hit = geoHits.find((h) => VALID_GEO.has(h.class) && !INVALID_GEO.has(h.type));
          if (hit) {
            effectiveLat = parseFloat(hit.lat);
            effectiveLng = parseFloat(hit.lon);
            serverExtractedGeo = true;
          }
        } catch { /* non-fatal — proceed without server geo-extract */ }
      }
    }
  }

  // ── PASS 3: Category/concept mapping ─────────────────────────────────────
  // Run when: categories matched AND either (a) room in results, OR (b) server
  // geo-extract resolved a destination so we can add geo-bounded results even
  // if earlier passes already filled the results map with national data.
  //
  // IMPORTANT: only clear national results when PASS 3 can actually replace
  // them (i.e. when mappedCategories exist). For category-less geo queries
  // ("Phuket", "things to do Bangkok"), keep PASS 1 name-match results and
  // let PASS 3b below handle the geo-bounded all-category fallback instead.
  if (serverExtractedGeo && results.size > 0 && mappedCategories.length > 0) {
    // Discard national results from PASSES 1–2.5 — geo-bounded category results
    // from PASS 3 are strictly preferred when we've identified a destination.
    results.clear();
  }
  if (mappedCategories.length > 0 && (results.size < limit || serverExtractedGeo)) {
    try {
      // Use wildcard patterns so "Food" matches "Food", "Food & Drink", "Food & Beverage"
      const params: unknown[] = mappedCategories.map((c) => `%${c}%`);
      let extraClauses = "";

      if (city) { params.push(`%${city}%`); extraClauses += ` AND b.city ILIKE $${params.length}`; }
      if (effectiveLat !== undefined && effectiveLng !== undefined) {
        const geoRadius = serverExtractedGeo ? GEO_EXTRACT_RADIUS : radius;
        params.push(effectiveLat, effectiveLng, geoRadius);
        const li = params.length;
        extraClauses += ` AND (3959 * acos(GREATEST(-1, LEAST(1, cos(radians($${li - 2})) * cos(radians(b.latitude)) * cos(radians(b.longitude) - radians($${li - 1})) + sin(radians($${li - 2})) * sin(radians(b.latitude)))))) <= $${li}`;
      }

      const already = [...results.keys()];
      const excludeClause = already.length > 0
        ? `AND b.id NOT IN (${already.map((_, i) => `$${params.length + i + 1}`).join(", ")})`
        : "";
      if (already.length > 0) params.push(...already);

      // Build ILIKE conditions for each category (flexible partial match)
      const catIlikeParts = mappedCategories.map((_, i) => `b.category ILIKE $${i + 1}`).join(" OR ");

      const catRows = await pool.query<{
        id: string; name: string; category: string; subcategory: string;
        city: string; state: string; description: string; image_url: string;
        rating: string; review_count: string; verified: boolean;
        latitude: string; longitude: string; ownership_designations: string;
        black_owned: boolean; instagram: string; website: string;
        phone: string; price_range: string; confidence_score: string;
      }>(
        `SELECT b.id, b.name, b.category, b.subcategory, b.city, b.state,
                b.description, b.image_url, b.rating, b.review_count,
                b.verified, b.latitude, b.longitude, b.ownership_designations,
                b.black_owned, b.instagram, b.website, b.phone,
                b.price_range, b.confidence_score
         FROM businesses b
         WHERE b.status = 'active'
           AND ${listingFilter}
           AND (${catIlikeParts})
           ${extraClauses} ${excludeClause}
         ORDER BY b.verified DESC, b.confidence_score DESC NULLS LAST, b.name ASC
         LIMIT ${Math.min(limit - results.size, 15)}`,
        params,
      );

      for (const row of catRows.rows) {
        if (results.has(row.id)) continue;
        const concept = mappedCategories[0] ?? row.category;
        results.set(row.id, {
          id: row.id, name: row.name, category: row.category,
          subcategory: row.subcategory ?? undefined, city: row.city, state: row.state,
          description: row.description ?? undefined, imageUrl: row.image_url ?? undefined,
          rating: row.rating ? parseFloat(row.rating) : undefined,
          reviewCount: row.review_count ? parseInt(row.review_count) : undefined,
          verified: row.verified, latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          ownershipDesignations: safeParseArray(row.ownership_designations),
          blackOwned: row.black_owned, instagram: row.instagram ?? undefined,
          website: row.website ?? undefined, phone: row.phone ?? undefined,
          priceRange: row.price_range ?? undefined,
          confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
          matchTier: "related_category",
          matchReason: `${row.category} business — people searching for "${concept}" often visit similar spots`,
          matchedFields: ["category"],
        });
      }
    } catch { /* skip */ }
  }

  // ── PASS 3b: Geo-bounded all-category fallback ──────────────────────────
  // When the server resolved a destination (serverExtractedGeo=true) but NO
  // category words were found (mappedCategories=[]), PASS 3 above was skipped.
  // Examples: "Phuket", "things to do Bangkok", "Black owned Phuket".
  // Return all active MWM businesses within the geo radius (any category).
  // This also clears any national PASS-1 name-match noise if those results
  // are from the wrong city, replacing them with correctly located businesses.
  if (serverExtractedGeo && mappedCategories.length === 0 && effectiveLat !== undefined && effectiveLng !== undefined) {
    // Determine whether existing PASS 1 results are actually local.
    const localAlready = [...results.values()].filter((b) => {
      if (b.latitude === undefined || b.longitude === undefined) return false;
      const dLat = (b.latitude - effectiveLat!) * (Math.PI / 180);
      const dLng = (b.longitude - effectiveLng!) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(b.latitude * (Math.PI / 180)) * Math.cos(effectiveLat! * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
      const distMi = 3959 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return distMi <= GEO_EXTRACT_RADIUS;
    });
    // Only run the DB query if we need more local results
    if (localAlready.length < limit) {
      // Remove non-local results already in map (e.g. name-matched but wrong country)
      for (const [id, b] of results) {
        if (!localAlready.find((r) => r.id === id)) results.delete(id);
      }
      try {
        const params3b: unknown[] = [effectiveLat, effectiveLng, GEO_EXTRACT_RADIUS];
        const already3b = [...results.keys()];
        const excludeClause3b = already3b.length > 0
          ? `AND b.id NOT IN (${already3b.map((_, i) => `$${i + 4}`).join(", ")})`
          : "";
        if (already3b.length > 0) params3b.push(...already3b);
        const geoAllRows = await pool.query<{
          id: string; name: string; category: string; subcategory: string;
          city: string; state: string; description: string; image_url: string;
          rating: string; review_count: string; verified: boolean;
          latitude: string; longitude: string; ownership_designations: string;
          black_owned: boolean; instagram: string; website: string;
          phone: string; price_range: string; confidence_score: string;
        }>(
          `SELECT b.id, b.name, b.category, b.subcategory, b.city, b.state,
                  b.description, b.image_url, b.rating, b.review_count,
                  b.verified, b.latitude, b.longitude, b.ownership_designations,
                  b.black_owned, b.instagram, b.website, b.phone,
                  b.price_range, b.confidence_score
           FROM businesses b
           WHERE b.status = 'active'
             AND ${listingFilter}
             AND (3959 * acos(GREATEST(-1, LEAST(1,
                   cos(radians($1)) * cos(radians(b.latitude)) *
                   cos(radians(b.longitude) - radians($2)) +
                   sin(radians($1)) * sin(radians(b.latitude)))))) <= $3
             ${excludeClause3b}
           ORDER BY b.verified DESC, b.confidence_score DESC NULLS LAST
           LIMIT ${Math.min(limit - results.size, 20)}`,
          params3b,
        );
        for (const row of geoAllRows.rows) {
          if (results.has(row.id)) continue;
          results.set(row.id, {
            id: row.id, name: row.name, category: row.category,
            subcategory: row.subcategory ?? undefined, city: row.city, state: row.state,
            description: row.description ?? undefined, imageUrl: row.image_url ?? undefined,
            rating: row.rating ? parseFloat(row.rating) : undefined,
            reviewCount: row.review_count ? parseInt(row.review_count) : undefined,
            verified: row.verified, latitude: row.latitude ? parseFloat(row.latitude) : undefined,
            longitude: row.longitude ? parseFloat(row.longitude) : undefined,
            ownershipDesignations: safeParseArray(row.ownership_designations),
            blackOwned: row.black_owned, instagram: row.instagram ?? undefined,
            website: row.website ?? undefined, phone: row.phone ?? undefined,
            priceRange: row.price_range ?? undefined,
            confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
            matchTier: "exact_name",
            matchReason: `Business near the resolved destination`,
            matchedFields: ["geo"],
          });
        }
      } catch { /* non-fatal */ }
    }
  }

  // ── PASS 4: Fuzzy name fallback (pg_trgm) if still sparse ────────────────
  // Skip when server-side geo was extracted: an honest "no MWM listings yet"
  // is better than fuzzy-matching a business from a completely different city.
  if (!serverExtractedGeo && results.size < 3 && q.length >= 3) {
    try {
      const already = [...results.keys()];
      const excludeClause = already.length > 0
        ? `AND b.id NOT IN (${already.map((_, i) => `$${i + 2}`).join(", ")})`
        : "";

      const fuzzyRows = await pool.query<{
        id: string; name: string; category: string; subcategory: string;
        city: string; state: string; description: string; image_url: string;
        rating: string; review_count: string; verified: boolean;
        latitude: string; longitude: string; ownership_designations: string;
        black_owned: boolean; instagram: string; website: string;
        phone: string; price_range: string; confidence_score: string;
        similarity: string;
      }>(
        `SELECT b.id, b.name, b.category, b.subcategory, b.city, b.state,
                b.description, b.image_url, b.rating, b.review_count,
                b.verified, b.latitude, b.longitude, b.ownership_designations,
                b.black_owned, b.instagram, b.website, b.phone,
                b.price_range, b.confidence_score,
                similarity(LOWER(b.name), LOWER($1)) as similarity
         FROM businesses b
         WHERE b.status = 'active'
           AND ${listingFilter}
           AND similarity(LOWER(b.name), LOWER($1)) > 0.2
           ${excludeClause}
         ORDER BY similarity DESC, b.verified DESC
         LIMIT 8`,
        [q, ...already],
      );

      for (const row of fuzzyRows.rows) {
        if (results.has(row.id)) continue;
        results.set(row.id, {
          id: row.id, name: row.name, category: row.category,
          subcategory: row.subcategory ?? undefined, city: row.city, state: row.state,
          description: row.description ?? undefined, imageUrl: row.image_url ?? undefined,
          rating: row.rating ? parseFloat(row.rating) : undefined,
          reviewCount: row.review_count ? parseInt(row.review_count) : undefined,
          verified: row.verified, latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          ownershipDesignations: safeParseArray(row.ownership_designations),
          blackOwned: row.black_owned, instagram: row.instagram ?? undefined,
          website: row.website ?? undefined, phone: row.phone ?? undefined,
          priceRange: row.price_range ?? undefined,
          confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
          matchTier: "nearby_alternative",
          matchReason: `Similar name match for "${q}"`,
          matchedFields: ["name_fuzzy"],
        });
      }
    } catch { /* pg_trgm may not be installed */ }
  }

  // Sort: best tier first, then by confidence/rating
  return [...results.values()].sort((a, b) => {
    const tierDiff = TIER_RANK[b.matchTier] - TIER_RANK[a.matchTier];
    if (tierDiff !== 0) return tierDiff;
    return (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0);
  }).slice(0, limit);
}

// ── Event search ──────────────────────────────────────────────────────────────
async function searchEvents(q: string, city?: string, limit = 6): Promise<unknown[]> {
  try {
    const params: unknown[] = [`%${q}%`];
    const cityClause = city ? `AND (city ILIKE $2 OR location ILIKE $2)` : "";
    if (city) params.push(`%${city}%`);

    const rows = await pool.query(
      `SELECT id, title, category, city, date, description, image_url,
              'event' as result_type, 'related_category' as match_tier
       FROM events
       WHERE status = 'active'
         AND (title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)
         ${cityClause}
       ORDER BY date ASC
       LIMIT ${limit}`,
      params,
    );
    return rows.rows;
  } catch { return []; }
}

// ── Heritage / cultural sites search ─────────────────────────────────────────
async function searchHeritage(
  q: string,
  opts: {
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
    radiusMiles?: number;
    limit?: number;
  } = {},
): Promise<Array<Record<string, unknown>>> {
  const { city, state, lat, lng, radiusMiles, limit = 5 } = opts;
  const tableChecks = ["cultural_sites", "tour_cultural_sites"];

  for (const tbl of tableChecks) {
    try {
      let whereClause = `(name ILIKE $1 OR description ILIKE $1 OR heritage_category ILIKE $1)`;
      const params: unknown[] = [`%${q}%`];
      let orderClause = "";

      if (city) {
        params.push(`%${city}%`);
        whereClause += ` AND city ILIKE $${params.length}`;
      } else if (state) {
        params.push(state.toUpperCase());
        whereClause += ` AND UPPER(state) = $${params.length}`;
      } else if (lat !== undefined && lng !== undefined && radiusMiles !== undefined) {
        // Haversine proximity filter — LEAST(1,x) prevents acos domain errors
        whereClause += `
          AND latitude IS NOT NULL AND longitude IS NOT NULL
          AND (3959 * acos(LEAST(1.0, GREATEST(-1.0,
            cos(radians(${lat})) * cos(radians(CAST(latitude AS double precision)))
            * cos(radians(CAST(longitude AS double precision)) - radians(${lng}))
            + sin(radians(${lat})) * sin(radians(CAST(latitude AS double precision)))
          )))) < ${radiusMiles}`;
        orderClause = `ORDER BY (3959 * acos(LEAST(1.0, GREATEST(-1.0,
          cos(radians(${lat})) * cos(radians(CAST(latitude AS double precision)))
          * cos(radians(CAST(longitude AS double precision)) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(CAST(latitude AS double precision)))
        )))) ASC`;
      } else if (lat !== undefined && lng !== undefined) {
        // National — sort by distance when we have coords
        orderClause = `ORDER BY (3959 * acos(LEAST(1.0, GREATEST(-1.0,
          cos(radians(${lat})) * cos(radians(CAST(latitude AS double precision)))
          * cos(radians(CAST(longitude AS double precision)) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(CAST(latitude AS double precision)))
        )))) ASC NULLS LAST`;
      }

      // When lat/lng present and no order already set (e.g. state filter),
      // still sort by distance so state results appear nearest-first.
      if (orderClause === "" && lat !== undefined && lng !== undefined) {
        orderClause = `ORDER BY (3959 * acos(LEAST(1.0, GREATEST(-1.0,
          cos(radians(${lat})) * cos(radians(CAST(latitude AS double precision)))
          * cos(radians(CAST(longitude AS double precision)) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(CAST(latitude AS double precision)))
        )))) ASC NULLS LAST`;
      }

      const distanceExpr = (lat !== undefined && lng !== undefined)
        ? `, ROUND((3959 * acos(LEAST(1.0, GREATEST(-1.0,
            cos(radians(${lat})) * cos(radians(CAST(latitude AS double precision)))
            * cos(radians(CAST(longitude AS double precision)) - radians(${lng}))
            + sin(radians(${lat})) * sin(radians(CAST(latitude AS double precision)))
          ))))::numeric, 0) AS distance_miles`
        : "";

      const rows = await pool.query(
        `SELECT id, name, city, state, description, heritage_category,
                latitude, longitude, image_url, verified_source,
                '${tbl}' as source_table, 'heritage' as result_type,
                'exact_specialty' as match_tier${distanceExpr}
         FROM ${tbl}
         WHERE ${whereClause}
         ${orderClause}
         LIMIT ${limit}`,
        params,
      );
      if (rows.rows.length > 0) return rows.rows as Array<Record<string, unknown>>;
    } catch { /* table may not exist */ }
  }
  return [];
}

// ── Community organizations search ───────────────────────────────────────────
// Searches community_organizations for the query. Returns rows with result_type
// "community_org" so the frontend can render them in a distinct labeled section.
async function searchCommunityOrgs(
  q: string,
  city?: string,
  limit = 4,
): Promise<unknown[]> {
  try {
    const params: unknown[] = [`%${q}%`];
    const cityClause = city ? `AND (city ILIKE $2 OR state ILIKE $2)` : "";
    if (city) params.push(`%${city}%`);
    const rows = await pool.query(
      `SELECT id::text, name, category, city, state, description,
              website, 'community_org' as result_type, 'related_category' as match_tier
       FROM community_organizations
       WHERE (name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)
         AND is_active = true
         ${cityClause}
       ORDER BY name ASC
       LIMIT ${limit}`,
      params,
    );
    return rows.rows;
  } catch { return []; }
}

// ── Library topic search ──────────────────────────────────────────────────────
async function searchLibrary(q: string, limit = 5): Promise<unknown[]> {
  try {
    const rows = await pool.query(
      `SELECT kt.id, kt.topic_name AS name, kt.description, kt.category,
              'library_topic' as result_type, 'related_category' as match_tier
       FROM knowledge_topics kt
       WHERE (kt.topic_name ILIKE $1 OR kt.description ILIKE $1 OR kt.category ILIKE $1)
       LIMIT ${limit}`,
      [`%${q}%`],
    );
    return rows.rows;
  } catch { return []; }
}

// ── Log search event ──────────────────────────────────────────────────────────
async function logSearchEvent(opts: {
  userId?: string;
  rawQuery: string;
  normalizedConcept: string;
  intentType: string;
  surface: string;
  locationBucket: string;
  resultCount: number;
  matchTypes: MatchTier[];
  fallbackUsed: boolean;
}): Promise<void> {
  if (!FEATURE_FLAGS.search_event_logging) return;
  try {
    await pool.query(
      `INSERT INTO search_events
         (user_id, raw_query, normalized_concept, intent_type, surface,
          location_bucket, result_count, match_types_returned, fallback_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        opts.userId ?? null,
        opts.rawQuery,
        opts.normalizedConcept,
        opts.intentType,
        opts.surface,
        opts.locationBucket,
        opts.resultCount,
        opts.matchTypes,
        opts.fallbackUsed,
      ],
    );

    // Also log to business_search_inquiries if zero business results
    if (opts.resultCount === 0) {
      await pool.query(
        `INSERT INTO business_search_inquiries
           (id, searcher_user_id, search_query, city, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [opts.userId ?? null, opts.rawQuery, opts.locationBucket.split(",")[0] ?? null],
      ).catch(() => { /* table schema may differ */ });
    }
  } catch { /* never crash on logging */ }
}

// ── Build fallback message ────────────────────────────────────────────────────
function buildFallbackMessage(
  q: string,
  intentType: IntentType,
  resultCount: number,
  hasMappedCategories: boolean,
): string | null {
  if (resultCount >= 3) return null; // no fallback needed

  // named_business: clear separation handled in route handler — no blended message here
  if (intentType === "named_business") return null;

  if (intentType === "food_item" && resultCount === 0) {
    return `I couldn't confirm "${q}" nearby yet. People looking for similar specialty experiences also liked these spots.`;
  }

  if (intentType === "faith" && resultCount === 0) {
    return `No exact match found for "${q}" in our directory yet. Related faith institutions and community spaces are shown below.`;
  }

  if (intentType === "heritage" && resultCount === 0) {
    return `Heritage and cultural history for "${q}" — showing related cultural sites and resources.`;
  }

  if (intentType === "library_country") {
    return null; // library_country zero result handled separately via libraryTopicQueued
  }

  if (hasMappedCategories && resultCount < 3) {
    return `Showing related businesses for "${q}" — the community has more to discover in this space.`;
  }

  return resultCount === 0
    ? `No exact results found for "${q}". Explore the categories below or ask KinfolkAI.`
    : null;
}

// ── Main route ────────────────────────────────────────────────────────────────
router.get("/search/universal", async (req: Request, res: Response) => {
  if (!FEATURE_FLAGS.universal_search) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const {
    q,
    lat: latStr,
    lng: lngStr,
    city,
    state,
    radius: radiusStr = "25",
    limit: limitStr = "20",
    resultTypes: resultTypesStr,
    surface = "general",
  } = req.query as Record<string, string>;

  if (!q?.trim() || q.trim().length < 2) {
    res.status(400).json({ error: "q (query) required, minimum 2 characters" });
    return;
  }

  const trimmedQ = q.trim();
  const lat = latStr ? parseFloat(latStr) : undefined;
  const lng = lngStr ? parseFloat(lngStr) : undefined;
  const radius = Math.min(100, Math.max(1, parseFloat(radiusStr) || 25));
  const limit = Math.min(30, Math.max(1, parseInt(limitStr, 10) || 20));
  const user = (req as any).user as { id?: string; isTester?: boolean } | undefined;

  const requestedTypes = resultTypesStr
    ? resultTypesStr.split(",").map((s) => s.trim())
    : ["businesses", "events", "heritage", "library_topics", "community_orgs"];

  // Concept extraction
  const { normalizedConcept, searchTokens, mappedCategories } = extractConcepts(trimmedQ);
  const intentType = detectIntentType(trimmedQ);

  // Location bucket for logging
  const locationBucket = city
    ? `${city}${state ? `, ${state}` : ""}`
    : lat !== undefined
      ? `lat:${lat.toFixed(1)}_lng:${lng?.toFixed(1)}_r${radius}`
      : "unknown";

  try {
    const cityStr = typeof city === "string" ? city : undefined;
    const stateStr = typeof state === "string" ? state : undefined;

    // ── Parallel: businesses + events + library ───────────────────────────────
    const businessesPromise = requestedTypes.includes("businesses")
      ? searchBusinesses({
          q: trimmedQ, searchTokens, mappedCategories, intentType,
          city: cityStr, state: stateStr, lat, lng, radius, limit,
          isTester: user?.isTester,
        }).catch((err: unknown) => {
          req.log?.error({ err }, "Universal search — business search failed");
          return [] as BusinessResult[];
        })
      : Promise.resolve([] as BusinessResult[]);

    let [businesses, events, libraryTopics, communityOrgs] = await Promise.all([
      businessesPromise,
      requestedTypes.includes("events")
        ? searchEvents(trimmedQ, cityStr, 6)
        : Promise.resolve([]),
      requestedTypes.includes("library_topics")
        ? searchLibrary(trimmedQ, 5)
        : Promise.resolve([]),
      requestedTypes.includes("community_orgs")
        ? searchCommunityOrgs(trimmedQ, cityStr, 4)
        : Promise.resolve([]),
    ]);

    // ── Faith intent post-filter (defense-in-depth semantic precision) ────────
    // Even after the extractConcepts bigram-token fix, apply a category check
    // for faith intent: only keep businesses whose category signals a faith or
    // community institution. Retain ALL results if the filter would empty the set.
    if (intentType === "faith" && businesses.length > 0) {
      // Precise faith-category filter: keeps only businesses whose category/subcategory
      // signals an active faith community or house of worship.
      // "community" and "nonprofit" removed — far too broad (gyms, libraries, food banks
      // all use those labels and are irrelevant to a "find me a church" query).
      const FAITH_CATEGORIES = new Set([
        "faith", "faith & spirituality", "church", "spiritual", "mosque",
        "temple", "synagogue", "religious", "worship", "gurdwara", "shrine",
        "chapel", "ministry", "congregation", "parish", "diocese", "tabernacle",
        "house of worship", "place of worship", "meditation", "zion",
        "masjid", "orthodox", "coptic", "ame", "cogic", "baptist church",
        "pentecostal", "apostolic", "methodist church", "catholic church",
        "episcopal", "lutheran", "presbyterian", "adventist", "quaker",
        "interfaith", "multifaith",
      ]);
      const faithFiltered = businesses.filter((b) => {
        const cat = (b.category ?? "").toLowerCase();
        const sub = (b.subcategory ?? "").toLowerCase();
        return [...FAITH_CATEGORIES].some((kw) => cat.includes(kw) || sub.includes(kw));
      });
      if (faithFiltered.length > 0) businesses = faithFiltered;
      // If filter would empty results, fall back to all (e.g. small-city search)
    }

    // ── Universal nearby_alternative quality gate ────────────────────────────
    // "nearby_alternative" is a pg_trgm name-similarity match (similarity > 0.2).
    // This fires on the city name alone (e.g. "Philadelphia" in "Year Up Philadelphia"
    // matches "plumber Philadelphia" via trigram) — completely irrelevant to the query.
    //
    // Rule: a nearby_alternative result is only kept when:
    //   (a) the query has mapped category anchors (mappedCategories.length > 0), AND
    //   (b) the matched business category contains at least one of those anchors.
    // If there are no category anchors, drop all nearby_alternative results entirely —
    // an honest empty state beats an irrelevant recommendation for any intent type.
    if (mappedCategories.length > 0) {
      businesses = businesses.filter(
        (b) =>
          b.matchTier !== "nearby_alternative" ||
          mappedCategories.some((cat) =>
            b.category?.toLowerCase().includes(cat.toLowerCase()),
          ),
      );
    } else {
      // No category anchor to validate against — drop all nearby_alternative results
      businesses = businesses.filter((b) => b.matchTier !== "nearby_alternative");
    }

    // ── Correction 3: Distance-ranked heritage geographic expansion ──────────
    // Ladder: exact city → ≤50mi radius → same state → national (distance-sorted)
    let heritage: unknown[] = [];
    let heritageGeoExpansion: "city" | "nearby" | "state" | "national" | "none" = "none";
    let heritageGeoMessage: string | undefined;

    if (requestedTypes.includes("heritage")) {
      // For faith-intent queries (e.g. "churches Philadelphia"), the full query string
      // won't ILIKE-match heritage sites like "Mother Bethel AME Church" because the
      // query contains a city name + a plural noun, not the site's actual name.
      // Fix: extract the core faith trigger word and use it as the search term.
      // Also infer the city from the query text (since the frontend passes no explicit
      // ?city= param for free-text searches like "churches Philadelphia").
      const lowerQ = trimmedQ.toLowerCase();
      const faithTrigger: string | null = intentType === "faith"
        ? (FAITH_TRIGGERS.find((t) => lowerQ.includes(t)) ?? "church")
        : null;
      const heritageQuery = faithTrigger ?? trimmedQ;

      // Infer city from the faith query by stripping the trigger word + stop words.
      // "churches Philadelphia" → strip "church(es)" → strip stops → "philadelphia"
      const heritageCity: string | undefined = cityStr ?? (faithTrigger
        ? (() => {
            const escapedTrigger = faithTrigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const stripped = lowerQ
              .replace(new RegExp(`\\b${escapedTrigger}(?:es|s)?\\b`, "gi"), " ")
              .replace(/\b(in|near|at|around|the|a|an|all|black|historic|ame|sda|cme|sbc|og)\b/gi, " ")
              .split(/\s+/).filter((w) => w.length >= 3).join(" ").trim();
            return stripped.length >= 2 ? stripped : undefined;
          })()
        : undefined);

      // Step 1 — exact city match
      if (heritageCity) {
        const r = await searchHeritage(heritageQuery, { city: heritageCity, limit: 5 });
        if (r.length > 0) { heritage = r; heritageGeoExpansion = "city"; }
      }

      // Step 2 — within 50 miles (requires lat/lng from client or geocode)
      if (heritageGeoExpansion === "none" && lat !== undefined && lng !== undefined) {
        const r = await searchHeritage(heritageQuery, { lat, lng, radiusMiles: 50, limit: 5 });
        if (r.length > 0) {
          heritage = r;
          heritageGeoExpansion = "nearby";
          heritageGeoMessage = heritageCity
            ? `No results in ${heritageCity}. Showing the closest sites within 50 miles — sorted by distance.`
            : "Showing the closest sites within 50 miles — sorted by distance.";
        }
      }

      // Step 3 — same state / region
      if (heritageGeoExpansion === "none" && stateStr) {
        const r = await searchHeritage(heritageQuery, { state: stateStr, lat, lng, limit: 5 });
        if (r.length > 0) {
          heritage = r;
          heritageGeoExpansion = "state";
          heritageGeoMessage = heritageCity
            ? `No results near ${heritageCity}. Showing sites throughout ${stateStr}.`
            : `Showing sites throughout ${stateStr}.`;
        }
      }

      // Step 4 — national (sorted nearest-first when lat/lng available)
      if (heritageGeoExpansion === "none") {
        const r = await searchHeritage(heritageQuery, { lat, lng, limit: 5 });
        if (r.length > 0) {
          heritage = r;
          heritageGeoExpansion = "national";
          heritageGeoMessage = heritageCity
            ? `No results near ${heritageCity}. Showing the closest matching sites from across the country.`
            : "Showing matching sites from across the country.";
        }
      }
    }

    // ── Correction 1: Named business — clear "not found" state ───────────────
    // If intent is named_business and no exact name match exists, separate
    // the alternatives clearly — never blend them with the named result.
    let namedBusinessNotFound = false;
    let namedBusinessMessage: string | undefined;
    let namedBusinessNextActions: string[] | undefined;

    if (intentType === "named_business") {
      // A genuine name match requires the business name to contain at least half
      // of the significant query words — prevents a partial token like "tea"
      // from satisfying a search for "The Pink Tea Cup".
      const queryWords = normalizedConcept.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const hasGenuineNameMatch = businesses.some((b) => {
        if (b.matchTier !== "exact_name") return false;
        const bizNameLower = b.name.toLowerCase();
        const matchedWords = queryWords.filter((w) => bizNameLower.includes(w));
        // Need ≥50% of significant words to match, or the full normalised concept
        return matchedWords.length >= Math.max(1, Math.ceil(queryWords.length * 0.5))
          && bizNameLower.includes(normalizedConcept.toLowerCase().split(/\s+/).filter((w) => w.length > 2)[0] ?? "");
      });
      if (!hasGenuineNameMatch) {
        namedBusinessNotFound = true;
        namedBusinessMessage = `We couldn't find an exact MWM listing for "${normalizedConcept}".`;
        namedBusinessNextActions = ["search_web", "suggest_listing", "see_alternatives"];
        // Relabel all returned businesses so the UI can show them as a clearly
        // separated "You might also like" section, not as a match for the query.
        businesses.forEach((b) => { b.matchTier = "nearby_alternative"; });
      }
    }

    // ── Correction 2: Library country — queue, never dead-end ────────────────
    const totalResults = businesses.length + events.length + heritage.length + libraryTopics.length + (communityOrgs as unknown[]).length;
    let libraryTopicQueued = false;
    let libraryQueueMessage: string | undefined;
    if (intentType === "library_country" && totalResults === 0) {
      libraryTopicQueued = true;
      libraryQueueMessage = `"${normalizedConcept}" isn't in our Library yet — this search is noted and will help shape it.`;
    }

    // totalResults counts all entity types — fallback should only fire when the
    // combined cross-entity count is low, not just when businesses.length is low.
    // This prevents "No exact match found" appearing alongside 3 heritage results.
    const crossEntityTotal = businesses.length + heritage.length + (communityOrgs as unknown[]).length;
    const fallbackUsed = crossEntityTotal < 3 && (
      events.length > 0 || heritage.length > 0 || libraryTopics.length > 0 || mappedCategories.length > 0
    );
    const matchTiers = [...new Set(businesses.map((b) => b.matchTier))];

    const fallbackMessage = buildFallbackMessage(
      trimmedQ, intentType, crossEntityTotal, mappedCategories.length > 0,
    );

    void logSearchEvent({
      userId: user?.id, rawQuery: trimmedQ, normalizedConcept, intentType,
      surface, locationBucket, resultCount: totalResults,
      matchTypes: matchTiers, fallbackUsed,
    });

    res.json({
      query: trimmedQ,
      normalizedConcept,
      intentType,
      surface,
      totalResults,
      matchTiers,
      fallbackUsed,
      fallbackMessage,
      unmetDemandRecorded: totalResults === 0 && FEATURE_FLAGS.search_event_logging,
      // Correction 1 fields
      namedBusinessNotFound: namedBusinessNotFound || undefined,
      namedBusinessMessage,
      namedBusinessNextActions,
      // Correction 2 fields
      libraryTopicQueued: libraryTopicQueued || undefined,
      libraryQueueMessage,
      // Correction 3 fields
      heritageGeoExpansion: heritageGeoExpansion === "none" ? undefined : heritageGeoExpansion,
      heritageGeoMessage,
      results: { businesses, events, heritage, libraryTopics, communityOrgs },
    });
  } catch (err) {
    req.log?.error({ err }, "Universal search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

// ── GET /search/suggest — typeahead suggestions across entity types ────────────
router.get("/search/suggest/universal", async (req: Request, res: Response) => {
  const { q, city } = req.query as Record<string, string>;
  if (!q?.trim() || q.length < 2) {
    res.json({ suggestions: [] });
    return;
  }

  try {
    const params: unknown[] = [`${q}%`];
    const cityClause = city ? `AND b.city ILIKE $2` : "";
    if (city) params.push(`%${city}%`);

    const [bizRows, eventRows] = await Promise.all([
      pool.query<{ label: string; type: string; category: string }>(
        `SELECT name as label, 'business' as type, category
         FROM businesses
         WHERE status = 'active'
           AND listing_status IN ('live_unclaimed', 'live_claimed')
           AND name ILIKE $1 ${cityClause}
         ORDER BY name ASC LIMIT 5`,
        params,
      ).catch(() => ({ rows: [] })),

      pool.query<{ label: string; type: string; category: string }>(
        `SELECT title as label, 'event' as type, category
         FROM events
         WHERE status = 'active' AND title ILIKE $1
         ORDER BY date ASC LIMIT 3`,
        [`${q}%`],
      ).catch(() => ({ rows: [] })),
    ]);

    // Also add mapped concept suggestions
    const lowerQ = q.toLowerCase();
    const conceptSuggestions = Object.keys(CONCEPT_TO_CATEGORY)
      .filter((k) => k.startsWith(lowerQ) && k !== lowerQ)
      .slice(0, 3)
      .map((k) => ({ label: k, type: "concept", category: CONCEPT_TO_CATEGORY[k][0] }));

    res.json({
      suggestions: [
        ...bizRows.rows,
        ...eventRows.rows,
        ...conceptSuggestions,
      ].slice(0, 10),
    });
  } catch {
    res.json({ suggestions: [] });
  }
});

export default router;
