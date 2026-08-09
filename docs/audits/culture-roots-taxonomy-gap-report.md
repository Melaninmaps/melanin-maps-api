# CULTURE & ROOTS — TAXONOMY GAP REPORT
**Date:** August 9, 2026  
**Source spec:** `docs/product/MWM-Culture-Roots-Diaspora-Discovery-Spec.md`  
**Audit status:** Complete — read-only, no changes made  
**Gate:** Do not implement any Culture & Roots feature until this report is reviewed and canonical values are approved

---

## SUMMARY

The platform has useful partial primitives — ownership country labels, cultural-site free-text columns, `culturalInterests`/`diasporaCountries` preference fields, generic Culture/Community topic categories — but lacks the spec's unified, searchable, canonical Culture & Roots hierarchy and cross-entity tagging.

**Most critical design rule from this audit:** Do NOT use `ownershipDesignations` as the culture/heritage model. Ownership and cultural community are separate dimensions.

---

## AREA 1 — LIBRARY CATEGORIES

| | |
|---|---|
| **Current files** | `artifacts/mobile/app/(tabs)/library.tsx:37-63`, `artifacts/web/src/pages/library.tsx:54-80` |
| **Current values** | Health, Travel, Relocation, Careers, Money, History, Education, Food, Culture, Wellness, Community (community_culture), Safety, Business, Employment, Finance, Family, Entertainment, Technology, Environment, Giving Back, Government, MWM Updates, Food & Lifestyle, Health & Wellness, Financial Wellness |
| **Existing tabs** | Feed, Browse Topics, Happening Now — no Culture & Roots tab, no region/country/community/language/diaspora browse |
| **Already maps to spec** | `Culture` and `community_culture` as generic categories |
| **Gap** | No dedicated "Culture & Roots" surface; no hierarchical multi-select discovery by Region → Country → Culture → Language → Diaspora → Topic |
| **Searchable today?** | Topic text/category via API only — no hierarchical roots filters |
| **Kinfolk-readable?** | Generic cultural interests only, not canonical roots |
| **Recommended canonical** | User-facing: `Culture & Roots`; internal: `culture_roots`; facets: `region`, `country_or_territory`, `culture_or_community`, `language`, `diaspora_or_local_community`, `topic`; retain `culture`/`community_culture` as aliases |

---

## AREA 2 — BUSINESS ownershipDesignations

| | |
|---|---|
| **Current file** | `lib/db/src/constants/ownership-designations.ts:11-88` |
| **Current count** | 90 values |
| **Relevant existing values** | `Black / African American-Owned`, `African-Owned`, West/Nigerian/Ghanaian/Liberian/Sierra Leonean/Senegalese/Guinean/Gambian/Ivorian/Cameroonian/Congolese/East African/Ethiopian/Eritrean/Somali/Kenyan/Sudanese/South Sudanese-Owned`, `Caribbean / West Indian-Owned`, `Afro-Caribbean-Owned`, `Jamaican-Owned`, `Haitian-Owned`, Trinidadian & Tobagonian, Guyanese, Barbadian, Bahamian, Grenadian, Saint Lucian, Vincentian, Dominican/Puerto Rican/Cuban/Afro-Latino/Latino-Hispanic/Mexican/Central American/South American, Indigenous/Native, Asian regional and country-specific, Arab/MENA and country-specific |
| **How searched** | GET /businesses `ownership` param — `black-owned` maps to boolean; others as JSON array match |
| **Already maps to spec** | Strong — Ethiopian, Jamaican, Haitian, Caribbean, West African country-specific labels already exist as ownership designations |
| **Gap** | These are OWNERSHIP labels, not community/roots identity. Ownership and cultural community are separate dimensions. Missing: many spec country identities in broader Caribbean/Asian/MENA/Indigenous lists; no independent `culturalCommunity`, `country`, `language`, or diaspora query on businesses |
| **Searchable today?** | Yes, as business ownership filter — NOT as a cultural community/roots filter |
| **Kinfolk-readable?** | Yes for preferred ownership types and recommendations — semantics are ownership, not roots |
| **Recommended canonical** | Preserve exact title-case ownership designation labels; add separate `culturalCommunities` (JSONB string[]) field on businesses for non-ownership cultural identity; canonical community values should be normalized (e.g. `Ethiopian`, `Jamaican`, `Haitian`) separate from `Ethiopian-Owned` |

---

## AREA 3 — KINFOLK PREFERENCE SCHEMA

| | |
|---|---|
| **Current file** | `lib/db/src/schema/user-preferences.ts:5-27` |
| **Existing relevant fields** | `culturalInterests` (JSONB string[]), `diasporaCountries` (JSONB string[]), `preferredOwnershipTypes` (JSONB string[]), `lifestyleServices` (JSONB string[]) |
| **How read by Kinfolk** | `kinfolk.ts:1260-1274` normalizes on GET; prompt uses culturalInterests at ~758/811, preferredOwnership at ~815, lifestyle at ~901-904, diasporaCountries at ~2669 |
| **Already maps to spec** | `diasporaCountries` is the strongest existing field — directly maps to the spec's diaspora/roots concept; `culturalInterests` for topic interests |
| **Gap** | No canonical multi-valued Culture & Roots hierarchy objects; no `region`, `countriesOrTerritories`, `culturesOrCommunities`, `languages`, `diasporaCommunities`, `communitiesToLearnAbout`, `communitiesToSupport` fields; no permission states for sensitive use |
| **Searchable today?** | Influences Kinfolk recommendations, not general /businesses search |
| **Kinfolk-readable?** | Yes for existing arrays |
| **Recommended canonical additions** | Extend `user_preferences` or add dedicated `user_culture_roots` table; add `cultureRoots` (multi-select objects with region/country/community/language/relationship_to_user/user_confirmed), `communitiesToLearnAbout`, `communitiesToSupport`; retain `culturalInterests` for topic compatibility; add `cultureRootsPermission` field per Sensitive-Context Privacy spec |

---

## AREA 4 — BUSINESS_IDENTITY TABLE

| | |
|---|---|
| **Current file** | `lib/db/src/schema/business-identity.ts:3-62` |
| **Existing fields** | `business_story`, `mission_statement`, `why_started`, `what_customers_should_know`, `ownership_badges`, `community_values`, `audiences_served`, trust/audience fields, `environment_tags`, `amenity_tags`, `accessibility_features`, `vibes`, team and initiatives |
| **Already maps to spec** | Narrative/community values/audiences can be consumed by Kinfolk |
| **Gap** | No `culturalCommunities`, `heritageIdentities`, `languages`, `countriesOfOrigin`, `diasporaCommunities` columns — all cultural identity must currently live in ownership designations or free-text narrative |
| **Searchable today?** | No direct identity endpoint/filter |
| **Kinfolk-readable?** | Narrative and community values yes; canonical culture fields — no |
| **Recommended canonical columns** | `culturalCommunities` (JSONB string[]), `heritageIdentities` (JSONB string[]), `languages` (string[]), `countriesOfOrigin` (string[]), `diasporaCommunities` (string[]); all self-identification/documentation — never inferred |

---

## AREA 5 — CULTURAL SITE TAXONOMY

| | |
|---|---|
| **Current file** | `lib/db/src/schema/cultural-sites.ts:5-37` |
| **Existing relevant columns** | `category` (default Heritage), `heritage_category`, `subcategory`, `ethnic_community`, `cultural_community`, `pin_type`, `country` (default United States) |
| **Heritage labels in mobile library** | HBCU, Civil Rights, African American Heritage, Native American Heritage, Hispanic & Latino Heritage, LGBTQ+ History, Women's History, Cultural Neighborhood, Freedom Trail, Religious Heritage, Immigrant Heritage |
| **Already maps to spec** | Schema has `cultural_community` and `ethnic_community` columns; heritage category aggregation exists; `country` field exists |
| **Gap** | Values are free text, not a controlled taxonomy; no canonical Ethiopian/Jamaican/Haitian enum; no region/country/community/language/diaspora hierarchy; no multi-select filter on the API |
| **Searchable today?** | Fields returned and heritage category aggregation exists, but no canonical enum or country/community filter |
| **Kinfolk-readable?** | Likely via cultural-site data, but no explicit preference linkage |
| **Recommended canonical** | Controlled `culturalCommunity` canonical IDs (not free text); pin categories: `heritage_site`, `museum`, `historical_place`, `hbcu_educational`, `cultural_center`; add `region`, `country_or_territory`, `language` filters to API |

---

## AREA 6 — EVENTS

| | |
|---|---|
| **Current file** | `lib/db/src/schema/events.ts:5-29` |
| **Existing relevant fields** | `category` (varchar, default Cultural), title/description/location/city/state only |
| **Seed categories** | market, open_mic, art_walk, festival, community_gathering, farmers_market, other |
| **Gap** | No tags, cultural community, heritage, diaspora, country, or language fields; events cannot be structurally matched to roots |
| **Searchable today?** | Category only |
| **Kinfolk-readable?** | Generic cultural/trip style can influence recommendations only |
| **Recommended canonical additions** | `eventTopics` array (festival, food, music, art, history, travel, community, faith, education), `culturalCommunities` array, `diasporaCommunities` array, `languages` array, `countriesOrTerritories` array |

---

## AREA 7 — SEARCH FILTERS (GET /businesses)

| | |
|---|---|
| **Current file** | `artifacts/api-server/src/routes/businesses.ts` |
| **Current params** | category, city, search, state, handle, culturalPreference, ownership, offset, limit |
| **Gap** | No `cultural_community`, `diaspora`, `heritage`, `roots`, `country`, `region`, or `language` filter; `culturalPreference` appears to be for personalization, not canonical roots facets |
| **Recommended canonical query params** | `region`, `countryOrTerritory`, `culturalCommunity`, `language`, `diasporaCommunity`, `topic`; support arrays for multi-select |

---

## AREA 8 — KNOWLEDGE TOPICS

| | |
|---|---|
| **Current file** | `lib/db/src/schema/knowledge.ts:63-87` |
| **Existing relevant fields** | `category`, `parent_category`, `entity_type`, `ownership_type`, `is_minority_owned` |
| **Runtime classifier categories** | travel, health, wellness, education, business, community_culture, culture, general→community_culture |
| **Library UI mapping** | `Culture` and `Community` (community_culture) |
| **Gap** | No canonical `culture_roots` category; no region/country/community/language/diaspora metadata on articles |
| **Recommended canonical** | User-facing category: `Culture & Roots`; internal: `culture_roots`; retain `culture`/`community_culture` as aliases; add `culturalCommunity`, `country`, `region`, `language` metadata columns on knowledge_articles |

---

## AREA 9 — USER PROFILE (users table)

| | |
|---|---|
| **Current file** | `lib/db/src/schema/auth.ts:16-98` |
| **Relevant existing fields** | `homeCity` (home_city, line 53); role/member/verification flags; bio |
| **Gap** | No `homeCountry`, `heritage`, `culturalRoots`, `diaspora`, `language`, or culture fields |
| **Recommended** | `homeCountry` on users table (optional, self-provided); culture roots in user_preferences or dedicated table — do NOT infer identity from any proxy data |

---

## AREA 10 — USER_PREFERENCES TABLE (full column inventory)

| Column | Type | Culture & Roots relevance |
|---|---|---|
| `cultural_interests` | JSONB string[] | Maps to topic interests — retain |
| `diaspora_countries` | JSONB string[] | STRONGEST EXISTING FIELD — maps to diaspora/roots; use as foundation for Task #164 |
| `preferred_ownership_types` | JSONB string[] | Ownership, not roots — retain separately |
| `lifestyle_services` | JSONB string[] | Lifestyle/activity preferences |
| `favorite_cities` | JSONB string[] | Location preferences |
| `regional_flavor` | varchar | Communication style, not geography |
| `know_before_you_go` | boolean | Travel safety preference |

**Gap:** No `cultureRoots` multi-object field, no `communitiesToLearnAbout`, no `communitiesToSupport`, no permission states, no region/country/language hierarchy.

---

## RECOMMENDED IMPLEMENTATION ORDER

1. **DO FIRST (no new tables):** Use existing `diasporaCountries` field as the foundation for Kinfolk cultural identity detection (Task #164). This is live in production and Kinfolk already reads it.

2. **Schema phase:** Add `culturalCommunities` JSONB column to businesses and business_identity; add `culturalCommunity` and `country` filter params to GET /businesses; add controlled vocabulary to cultural_sites.

3. **Library phase:** Add `Culture & Roots` tab to Library with hierarchical browse; wire to canonical community values from audit.

4. **Full hierarchy phase:** Add `user_culture_roots` table (multi-select with relationship_to_user + user_confirmed + permission states); integrate with Kinfolk system prompt.

**Do NOT start the Library surface until canonical community values are approved and the schema phase is complete.**
