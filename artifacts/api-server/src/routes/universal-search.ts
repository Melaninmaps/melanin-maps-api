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

const router: IRouter = Router();

// ── Match tiers — ordered best to worst ──────────────────────────────────────
export type MatchTier =
  | "exact_name"
  | "exact_specialty"
  | "community_confirmed"
  | "related_category"
  | "vibe_match"
  | "nearby_alternative";

const TIER_RANK: Record<MatchTier, number> = {
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
  food:          ["Food"],
  catering:      ["Food"],
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
  therapy:       ["Health", "Wellness"],
  therapist:     ["Health", "Wellness"],
  medical:       ["Health"],
  healthcare:    ["Health"],
  fitness:       ["Health", "Sports"],
  gym:           ["Health", "Sports"],
  nutrition:     ["Health", "Wellness"],
  wellness:      ["Health", "Wellness"],
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
  "ame ", "cogic", "baptist", "pentecostal", "apostolic", "methodist",
  "catholic", "episcopal", "lutheran", "presbyterian", "adventist",
  "quaker", "meeting house", "islam", "muslim", "jewish", "judaism",
  "hindu", "sikh", "buddhist", "buddhism", "jain", "bahai", "unitarian",
  "interfaith", "multifaith", "gospel", "langar", "house of worship",
  "place of worship", "spiritual community", "faith community",
  "black church", "historic church", "houses of faith", "meditation center",
  "spanish mass", "haitian church", "african church",
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
  if (/\b(alopecia|stylist|braids|locs|welder|welding|attorney|therapist)\b/i.test(q)) return "specialty_service";

  // Named business heuristic: title-cased multi-word with no category keywords
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

    const wordCats    = CONCEPT_TO_CATEGORY[word]    ?? [];
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
      if (city) { offset++; params.push(`%${city}%`); }

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
           ${city ? `AND b.city ILIKE $${offset}` : ""}
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

  // ── PASS 3: Category/concept mapping ─────────────────────────────────────
  if (mappedCategories.length > 0 && results.size < limit) {
    try {
      // Use wildcard patterns so "Food" matches "Food", "Food & Drink", "Food & Beverage"
      const params: unknown[] = mappedCategories.map((c) => `%${c}%`);
      let extraClauses = "";

      if (city) { params.push(`%${city}%`); extraClauses += ` AND b.city ILIKE $${params.length}`; }
      if (lat !== undefined && lng !== undefined) {
        params.push(lat, lng, radius);
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

  // ── PASS 4: Fuzzy name fallback (pg_trgm) if still sparse ────────────────
  if (results.size < 3 && q.length >= 3) {
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
    : ["businesses", "events", "heritage", "library_topics"];

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

    let [businesses, events, libraryTopics] = await Promise.all([
      businessesPromise,
      requestedTypes.includes("events")
        ? searchEvents(trimmedQ, cityStr, 6)
        : Promise.resolve([]),
      requestedTypes.includes("library_topics")
        ? searchLibrary(trimmedQ, 5)
        : Promise.resolve([]),
    ]);

    // ── Faith intent post-filter (defense-in-depth semantic precision) ────────
    // Even after the extractConcepts bigram-token fix, apply a category check
    // for faith intent: only keep businesses whose category signals a faith or
    // community institution. Retain ALL results if the filter would empty the set.
    if (intentType === "faith" && businesses.length > 0) {
      const FAITH_CATEGORIES = new Set([
        "faith", "church", "spiritual", "mosque", "temple", "synagogue",
        "religious", "worship", "community", "nonprofit", "cultural center",
        "meditation", "gurdwara", "shrine", "chapel", "ministry",
      ]);
      const faithFiltered = businesses.filter((b) => {
        const cat = (b.category ?? "").toLowerCase();
        const sub = (b.subcategory ?? "").toLowerCase();
        return [...FAITH_CATEGORIES].some((kw) => cat.includes(kw) || sub.includes(kw));
      });
      if (faithFiltered.length > 0) businesses = faithFiltered;
      // If filter would empty results, fall back to all (e.g. small-city search)
    }

    // ── Correction 3: Distance-ranked heritage geographic expansion ──────────
    // Ladder: exact city → ≤50mi radius → same state → national (distance-sorted)
    let heritage: unknown[] = [];
    let heritageGeoExpansion: "city" | "nearby" | "state" | "national" | "none" = "none";
    let heritageGeoMessage: string | undefined;

    if (requestedTypes.includes("heritage")) {
      // Step 1 — exact city match
      if (cityStr) {
        const r = await searchHeritage(trimmedQ, { city: cityStr, limit: 5 });
        if (r.length > 0) { heritage = r; heritageGeoExpansion = "city"; }
      }

      // Step 2 — within 50 miles (requires lat/lng from client or geocode)
      if (heritageGeoExpansion === "none" && lat !== undefined && lng !== undefined) {
        const r = await searchHeritage(trimmedQ, { lat, lng, radiusMiles: 50, limit: 5 });
        if (r.length > 0) {
          heritage = r;
          heritageGeoExpansion = "nearby";
          heritageGeoMessage = cityStr
            ? `No results in ${cityStr}. Showing the closest sites within 50 miles — sorted by distance.`
            : "Showing the closest sites within 50 miles — sorted by distance.";
        }
      }

      // Step 3 — same state / region
      if (heritageGeoExpansion === "none" && stateStr) {
        const r = await searchHeritage(trimmedQ, { state: stateStr, lat, lng, limit: 5 });
        if (r.length > 0) {
          heritage = r;
          heritageGeoExpansion = "state";
          heritageGeoMessage = cityStr
            ? `No results near ${cityStr}. Showing sites throughout ${stateStr}.`
            : `Showing sites throughout ${stateStr}.`;
        }
      }

      // Step 4 — national (sorted nearest-first when lat/lng available)
      if (heritageGeoExpansion === "none") {
        const r = await searchHeritage(trimmedQ, { lat, lng, limit: 5 });
        if (r.length > 0) {
          heritage = r;
          heritageGeoExpansion = "national";
          heritageGeoMessage = cityStr
            ? `No results near ${cityStr}. Showing the closest matching sites from across the country.`
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
    const totalResults = businesses.length + events.length + heritage.length + libraryTopics.length;
    let libraryTopicQueued = false;
    let libraryQueueMessage: string | undefined;
    if (intentType === "library_country" && totalResults === 0) {
      libraryTopicQueued = true;
      libraryQueueMessage = `"${normalizedConcept}" isn't in our Library yet — this search is noted and will help shape it.`;
    }

    const fallbackUsed = businesses.length < 3 && (
      events.length > 0 || heritage.length > 0 || libraryTopics.length > 0 || mappedCategories.length > 0
    );
    const matchTiers = [...new Set(businesses.map((b) => b.matchTier))];

    const fallbackMessage = buildFallbackMessage(
      trimmedQ, intentType, businesses.length, mappedCategories.length > 0,
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
      results: { businesses, events, heritage, libraryTopics },
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
