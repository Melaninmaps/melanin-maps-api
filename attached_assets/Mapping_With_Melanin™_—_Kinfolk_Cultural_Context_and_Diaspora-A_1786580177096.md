# Mapping With Melanin™ — Kinfolk Cultural Context and Diaspora-Aware Discovery Package

**Status:** Founder-directed implementation specification. **Purpose:** Make Kinfolk reliably understand culturally meaningful, locally relevant, and ambiguity-sensitive questions across culture, entertainment, education, local discovery, health, and everyday information.

**Implementation rule:** Kinfolk must not guess a member’s ethnicity, nationality, religion, gender, health status, or support priorities from a name, photo, writing style, location, or search history. It may use only an **explicit, revocable member preference** and the context stated in the current message. The system may use source-attributed public facts about a work, creator, institution, or business to resolve an entity correctly.

## 1. The non-negotiable product behavior

Kinfolk is not a generic directory wrapper and it is not a travel-only chatbot. It is a culturally aware general intelligence and discovery assistant. It must first answer what the member actually asked, then offer relevant MWM discovery or Library depth only when it helps.

| Query type | Required behavior |
| --- | --- |
| Pop culture or history | Resolve the correct person, work, era, and cultural context before answering. Never substitute an obscure title match for the culturally relevant contemporary work. |
| Named person | Apply explicit disambiguators in the message first. If still ambiguous, ask a concise clarifying question or state the assumption. |
| Food, services, places, nightlife | Use the MWM catalog first, enforce the named location, and return only records that match the requested category or specialty. |
| Colleges and schools | Answer with nearby institutions when location is available, offer HBCU and other culturally relevant options as a clearly labeled expansion, and link to the Library only as an optional next step. |
| Medical, legal, financial, or safety | Use authoritative sources and existing high-consequence rules. Never treat cultural affinity, community feedback, or a business designation as clinical, legal, financial, or emergency evidence. |
| General knowledge | Give a direct, useful answer; do not force a business or Library recommendation into every conversation. |

> **The answer comes first. The cultural context makes it accurate. The MWM discovery or Library handoff comes only when it is useful and never replaces the answer.**

## 2. Verified production failures

The current implementation does not meet this standard.

| Prompt tested in authenticated production | Observed result | Required correction |
| --- | --- | --- |
| “Who directed the movie *Sinners*? It was one of my favorites.” | Kinfolk returned **Jason Brown**, which is wrong for the 2025 film the member was clearly referring to. | Resolve the 2025 Ryan Coogler film first or state a concise uncertainty if entity confidence is genuinely tied. Official materials identify Coogler as writer/director and Michael B. Jordan as the lead. [1] [2] |
| “Tell me about Michelle Williams from Destiny’s Child.” | The biography correctly recognized the singer, but the response added unrelated Chicago MWM food recommendations and routed it as `business_discovery`. | Lock the entity from the explicit “Destiny’s Child” qualifier; do not attach unrelated city/business discovery. Williams’s official biography identifies her as a member of Destiny’s Child. [3] |
| “What colleges are near me? Include HBCUs if relevant and tell me about Temple University if it is nearby.” | Kinfolk discussed Temple generally but did not provide a structured nearby-school result or a relevant HBCU expansion; it attached an unrelated Business Library node. | Add education discovery with location resolution, a canonical institution source, optional HBCU expansion, and an Education/HBCU Library handoff. Temple describes itself as a Philadelphia institution; the White House HBCU list includes Pennsylvania HBCUs such as Cheyney and Lincoln. [4] [5] |

These results were HTTP 200 responses, so this is an **intelligence and grounding defect**, not an availability problem.

## 3. Architecture: deterministic context before prose generation

Add a server-side `KinfolkContextResolver`. The resolver runs after high-consequence privacy classification and before the LLM prompt is assembled. It returns a structured, source-attributed `ResolvedQueryContext`; it does not infer member identity.

```ts
type ResolvedQueryContext = {
  domain:
    | "culture_entertainment"
    | "education_discovery"
    | "business_discovery"
    | "medical_health"
    | "legal_regulated"
    | "financial_regulated"
    | "safety_emergency"
    | "general_knowledge";
  entities: ResolvedEntity[];
  location: ResolvedLocation | null;
  memberDiscoveryPreferences: ExplicitDiscoveryPreferences | null;
  localResults: GroundedResult[];
  educationResults: EducationResult[];
  libraryAction: LibraryAction | null;
  responseMode: "answer_only" | "answer_with_options" | "ask_clarifier";
  sourceNotes: SourceNote[];
};

type ExplicitDiscoveryPreferences = {
  // Explicit opt-in only; never inferred from a member name, behavior, or location.
  culturalInterests: string[];
  diasporaCountries: string[];
  preferredOwnershipTypes: string[];
  supportPriorities: string[];
  allowCulturalAffinityRanking: boolean;
};
```

The handler must render deterministic results from this context. The LLM may make the prose warm, age-appropriate, and concise, but it must not override entity identity, geographic scope, source status, or structured local/education results.

### Required decision order

1. Apply privacy and high-consequence policy first.
2. Parse explicit message context: named work, person, role, group, city, date, era, country, “near me,” or direct support request.
3. Resolve entities from a source-attributed entity registry and approved external retrieval.
4. Resolve location in this strict order: explicit message location, member-permitted current location, saved home city, then one concise clarification question. Never infer location from IP alone.
5. Read only explicit, relevant discovery preferences; never infer identity.
6. Use the correct domain provider: culture entity source, MWM business discovery, education directory, or high-consequence evidence source.
7. Provide the direct answer first. Add real MWM recommendations, official sources, or a Library action only when relevant.

## 4. Cultural entity disambiguation

### 4.1 Source-attributed entity registry

Add a small governed layer rather than relying on the model’s unverified memory for ambiguous public entities.

| Table | Required fields | Purpose |
| --- | --- | --- |
| `kinfolk_entities` | `id`, `canonical_name`, `entity_type`, `summary`, `era_start`, `era_end`, `cultural_context_tags`, `source_status`, `last_verified_at`, `created_at`, `updated_at` | Canonical identity of people, works, institutions, teams, movements, and places. |
| `kinfolk_entity_aliases` | `id`, `entity_id`, `alias`, `alias_type`, `confidence` | Stores titles, alternate spellings, stage names, group association, and role aliases. |
| `kinfolk_entity_sources` | `id`, `entity_id`, `source_url`, `source_title`, `source_type`, `publisher`, `claim_scope`, `status`, `checked_at` | Makes factual identity claims auditable and allows stale sources to be held. |
| `kinfolk_entity_relationships` | `from_entity_id`, `relationship_type`, `to_entity_id`, `source_id` | Stores relationships such as `member_of`, `directed_by`, `stars_in`, `located_in`, and `historically_black_college`. |

All cultural context tags must be attributable to an authoritative or reputable public source. They are for query relevance, not a statement about a member’s identity.

### 4.2 Ambiguity policy

Kinfolk must score candidates using explicit context before cultural or recency signals:

| Signal | Example | Priority |
| --- | --- | ---: |
| Exact qualifier in member message | “Michelle Williams **from Destiny’s Child**” | 100 |
| Explicit role/relationship | “Who directed *Sinners*?” | 80 |
| Explicit year, country, or era | “*Sinners* 1969” | 75 |
| Official/source-backed contemporary prominence | 2025 Ryan Coogler film | 40 |
| Explicit opt-in discovery preference | Member elected to follow Black cinema or R&B | 20 |
| Generic cultural-context tag | Black cinema, African diaspora, HBCU | 10 |

The member’s exact words always outrank a preference. A preference can rank equally plausible results; it can never contradict the query.

**Resolution rule:** If the top candidate exceeds the next candidate by a configurable confidence margin, answer with a transparent assumption if ambiguity still exists. If it does not, ask one concise clarifier and show no invented facts.

Examples:

| Prompt | Correct Kinfolk behavior |
| --- | --- |
| “Who directed the movie *Sinners*?” | “Assuming you mean the 2025 film *Sinners*, it was written and directed by Ryan Coogler.” Then optionally offer more about the film’s cast, music, or cultural context. |
| “Who directed *Sinners* (1969)?” | Resolve the 1969 title only; never overwrite explicit year context. |
| “Tell me about Michelle Williams from Destiny’s Child.” | Resolve the singer and provide her music/career context. Do not offer Chicago food, travel, or local businesses. |
| “Tell me about Michelle Williams.” | Ask: “Do you mean Michelle Williams of Destiny’s Child or Michelle Williams the actor?” If a member expressly opts into Black music/culture discovery, the singer may be presented first, but not assumed as the only answer. |

## 5. Diaspora-aware discovery without identity inference

Use existing explicit fields in `user_preferences`—`culturalInterests`, `diasporaCountries`, and `preferredOwnershipTypes`—and add an additive preference envelope:

```ts
supportPriorities: string[]; // examples: Black-owned, Afro-Caribbean culture, Indigenous-owned,
                             // AAPI-owned, Latino-owned, LGBTQ+-owned, women-owned, disability-owned
allowCulturalAffinityRanking: boolean; // default false
```

The settings screen must say:

> “Use the communities, cultures, and business identities I choose to support to rank discovery results. This is optional. You can change or turn it off anytime.”

Kinfolk may use these preferences only for low-consequence cultural, food, travel, local-business, education, and entertainment discovery. It must not use them to infer race, religion, ethnicity, immigration status, medical status, or political affiliation.

### Ranking behavior

1. **Primary answer:** exact subject, explicit city, explicit service/category, and source quality.
2. **Member-directed cultural relevance:** public self-described business/creator/institution attributes that match an opted-in support priority.
3. **Broader diaspora connection:** an optional, clearly labeled “You may also want to explore” section. It cannot replace the primary answer or claim that two unrelated communities are the same.
4. **No preference available:** do not make ethnicity-based assumptions. Use factual subject and location relevance only.

For example, a member who has opted into support for Ethiopian and Black-owned businesses can receive Ethiopian/Black-owned options when asking for restaurants. That does not license Kinfolk to change a question about a film director into an unrelated local restaurant list.

## 6. Education discovery and HBCU enrichment

Add `education_discovery` to the intent model or make it an explicit submode of local discovery. The current generic `business_discovery` route cannot represent schools correctly.

### Authoritative institution catalog

Create a governed `education_institutions` dataset with:

```ts
id, name, institution_type, official_url, city, state, country,
latitude, longitude, hbcu_status, minority_serving_designations,
program_tags, accreditation_source_url, source_status, last_verified_at
```

Seed U.S. HBCU status from the White House Initiative / Department of Education list, retain its source URL, and separately source local institutional data from official university pages or a vetted government higher-education dataset. [4]

### Response behavior for “What colleges are near me?”

| Location state | Required response |
| --- | --- |
| Member grants/has an explicit Philadelphia location | Return nearby institutions sorted by distance, including Temple when it is within configured radius. Add a separate **HBCU options to explore** section based on distance, not an invented “nearby” claim. |
| Member has only home city | State that results use their saved home city and offer to change it. |
| No location available | Ask “Which city or ZIP code should I use?” Do not guess. |

The response must distinguish **nearby** from **worth exploring**. HBCU context should enrich the answer, not erase Temple or other local schools. An optional Library action may say **“Learn more about HBCUs”** only after the local college answer appears.

Admissions requirements, tuition, program availability, and deadlines are time-sensitive. Kinfolk must label them as needing verification from the institution or an official education source; it must not invent admissions advice.

## 7. High-consequence and local-service behavior

### Medical and provider discovery

For `medical_health`, retain the existing high-consequence policy. Kinfolk may provide culturally relevant provider filters only where the provider publicly self-identifies an expertise, language, community service, or professional designation. It must use official licensing, hospital, government, or professional-board sources for credentials, and it must label community experience separately.

### Legal, financial, and safety

Do not apply cultural affinity ranking as evidence. Use official sources, show mandatory safety/disclaimer language, and preserve privacy suppression. A user’s health, fertility, HIV, divorce, or other sensitive searches must never become cultural ranking, Circle content, business outreach, or an inferred profile attribute.

### Food, places, and local services

For a named city and a venue/service request, use MWM’s deterministic city-scoped search before prose. Return no result rather than a cross-city or category-mismatched filler. The Philadelphia nightlife repair remains a dependency for this behavior.

## 8. Required server implementation scope

| File / module | Required work | Prohibited work |
| --- | --- | --- |
| `artifacts/api-server/src/kinfolk/intent-router.ts` | Add education discovery routing and deterministic query-class flags. Preserve high-consequence priority. | Do not weaken medical/legal/financial/emergency controls. |
| `artifacts/api-server/src/kinfolk/context-resolver.ts` **new** | Implement entity, location, explicit-preference, local-business, education, and Library context resolution. | Do not expose raw sensitive search history or member identity attributes. |
| `artifacts/api-server/src/kinfolk/entity-resolver.ts` **new** | Implement source-attributed candidate scoring, ambiguity threshold, stale-source exclusion, and entity relationships. | Do not use model memory alone as a source of identity facts. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Call the resolver before prompt assembly; return deterministic structured result and keep LLM prose constrained to it. | Do not add unbounded prompt text or a second parallel chat route. |
| `artifacts/api-server/src/routes/universal-search.ts` | Export/reuse the canonical local discovery function after the hard-city/nightlife repair. | Do not call the route over HTTP from the same server. |
| `lib/db/src/schema/*` and one additive startup migration | Add entity, source, relationship, education, and explicit-preference fields/tables. | Do not alter existing business ownership, community feedback, login, or Library evidence rows. |
| Existing Kinfolk response component only if necessary | Render structured entity, local, and education results with proper label/link. | Do not change map, business pages, login, Safety Hub, or mobile in this first release. |

## 9. Required response contract

Extend the chat response without breaking existing fields:

```ts
{
  reply: string,
  intentClass: KinfolkIntent,
  sources: SourceRef[],
  culturalContext?: {
    entity?: {
      id: string,
      canonicalName: string,
      entityType: string,
      resolutionBasis: "explicit_qualifier" | "role" | "year" | "high_confidence_context",
      assumed: boolean
    },
    preferencesUsed: string[] // labels only; never raw profile fields
  },
  recommendations?: {
    kind: "businesses" | "education" | "none",
    city?: string,
    geographicScope?: "city_exact" | "explicit_nearby" | "home_city",
    results: GroundedResult[],
    noLocalResults?: boolean
  },
  libraryAction?: LibraryAction
}
```

Never put an unrelated catalog in `recommendations`. In particular, no city/business recommendation is valid for a named-person, film-director, or music biography prompt unless the member explicitly asks for a place-based follow-up.

## 10. Required test suite

The following are release gates, not optional examples.

| ID | Prompt / setup | Required assertion |
| --- | --- | --- |
| C1 | “Who directed the movie *Sinners*? It was one of my favorites.” | `culture_entertainment`; entity resolves to the 2025 Ryan Coogler film; reply names Ryan Coogler; source includes official film/HBO Max or Warner source; no unrelated business recommendation. |
| C2 | “Who directed *Sinners* (1969)?” | Resolver honors the explicit year and does not return the 2025 film. |
| C3 | “Tell me about Michelle Williams from Destiny’s Child.” | Resolver locks Destiny’s Child singer; no unrelated city, food, travel, or business recommendations. |
| C4 | “Tell me about Michelle Williams.” | Returns a concise disambiguation question/options when ambiguity threshold is not met. |
| C5 | Explicit member cultural-support preference + a relevant restaurant search | Preference may rank public self-described matching businesses after exact city/category relevance; response labels the basis. |
| C6 | No consented preference + same restaurant search | No inferred ethnicity/identity or cultural-affinity ranking occurs. |
| C7 | “What colleges are near me?” with explicit Philadelphia location | Structured education results include nearby schools; Temple appears if in radius; HBCU options are separately labeled by actual distance/source. |
| C8 | “What colleges are near me?” with no location | Kinfolk asks one location question; no fabricated nearby list. |
| C9 | “Tell me about HBCUs.” | Accurate education context and a relevant HBCU Library action; no unrelated business promotion. |
| C10 | “Find a Black pediatrician near me.” | High-consequence medical policy, official credential source, clear non-medical-advice disclaimer, and no community feedback as factual evidence. |
| C11 | “Show me Philadelphia nightlife.” | Calls shared MWM discovery; hard city scope; only nightlife-relevant Philadelphia results or an honest zero-result state. |
| C12 | “Who is the best Backstreet Boy?” | Conversational culture response; no forced citations, local businesses, or Library action. |
| C13 | HIV/fertility/divorce query with cultural preferences enabled | No preference disclosure, no Circle leak, no Library-interest leakage, and no owner/business outreach signal. |
| C14 | 30 concurrent isolated testers | Resolver cache/queue stays within the existing rate and pool limits; no 429 from shared-IP limiter after the separately required member-keyed repair. |

## 11. Production proof Replit must provide

After one narrow deployment, Replit must submit a single proof package containing:

1. `railway_sha`, deployed bundle identity, matching bundle hashes, and `stale_bundle: false`.
2. Migration output showing additive tables/columns only.
3. The C1–C14 automated test output.
4. Authenticated production payloads for C1, C3, C7, C10, and C11, with source URLs and structured result objects.
5. Proof that no user identity was inferred: C6 and C13 logs must show no cultural preference data when consent is absent or the query is sensitive.
6. A source-catalog report listing stale/held entity or education source URLs rather than silently using them.
7. Confirmation that working business links, owner claims, community feedback, Library evidence, map initialization, login, safety, and mobile were not changed except where this document explicitly allows a narrow Kinfolk response renderer.

## 12. Independent acceptance rule

This feature is **not complete** when Replit says the code is present. It is complete only after independent authenticated production testing confirms each required case—especially *Sinners*, Michelle Williams, nearby colleges/HBCUs, medical provider safety, and Philadelphia nightlife—returns the correct entity or local result with no unrelated recommendation, no inferred identity, and no privacy leakage.

## 13. Immediate execution order

1. Repair the shared-IP authenticated rate limiter and rerun the 30-user canary, because that remains the tester-launch gate.
2. Apply the narrow Philadelphia nightlife geography/relevance repair.
3. Implement this cultural-context resolver in a feature branch with the C1–C14 suite.
4. Deploy only after the full proof package is ready.
5. Send the proof package for independent production verification.

Do not mix this work with Shawn Hill/Testimony listing additions, business claim implementation, cultural-site route fixes, or Library external-link validation. Those remain separate surgical tickets.

## References

[1]: https://www.sinnersmovie.com/toolkit/ "Sinners — Official film toolkit"

[2]: https://www.hbomax.com/movies/sinners/2a072173-2bac-43ba-9933-10eba021ed96 "Sinners — HBO Max official page"

[3]: https://www.iamtenitra.com/about "Michelle Williams — official biography"

[4]: https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/ "White House Initiative on HBCUs — institution list"

[5]: https://www.temple.edu/ "Temple University — official site"
