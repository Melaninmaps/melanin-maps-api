# Mapping With Melanin — Verified City Business Discovery and Kinfolk On-the-Road Package

**Purpose:** Allow Replit to discover real businesses across cities, collect truthful source evidence, prevent duplicates, publish only canonical MWM listings, and let Kinfolk help a family find practical services—such as laundromats, groceries, barbers, salons, mechanics, pharmacies, or hotels—while traveling.

> **Core rule:** Discovery is not publication. A business found on the web is a `candidate`; a business that has passed source, duplicate, location, and live-surface verification is a `published_verified` MWM listing. Kinfolk must clearly label the difference.

## 1. Operational choices for the discovery system

The platform needs a durable application workflow, not a series of founder-managed browser searches. These two approaches are both viable; the founder should select the operating cadence.

| Approach | What happens | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- | --- |
| **Founder/curator-triggered city batch** | An authorized operator starts a batch such as “Atlanta: Black-owned groceries, barbers, laundromats, Dominican salons.” Candidates enter a review queue and only verified places publish. | Safest and easiest to control; not instant nationwide coverage. | Provider/API usage may apply; no continuously running process required. | Lower. |
| **Background city-coverage engine** | The application regularly runs approved discovery queries for selected cities/categories, detects changes, and queues candidates for verification/review. | Builds coverage without founder research but needs licensed source access, monitoring, rate limits, a curator queue, and audit logs. | Provider/API usage plus persistent background-service costs may apply. | Higher. |

The application must not scrape Google Search or Google Maps result pages. If Google data is used, Replit must use a properly licensed Maps/Places product and comply with its applicable terms. Search providers, local directories, chambers, and official sites are **candidate sources**; the platform must retain source URLs and never copy a provider’s ratings or reviews as MWM facts.

## 2. Discovery taxonomy: what Replit must search in every selected city

The discovery engine must expand beyond the examples in this request. It should use a controlled taxonomy of practical needs, cultural businesses, and ownership designations. “Minority-owned” is never inferred from a name, image, neighborhood, language, or category.

| Discovery group | Examples of business/service queries | Notes |
| --- | --- | --- |
| Everyday essentials | grocery store, market, bodega, butcher, bakery, laundromat, dry cleaner, pharmacy, gas station, convenience store | High value for travel and family use. |
| Food and hospitality | restaurant, café, brunch, caterer, Caribbean food, Ethiopian food, Nigerian food, Latin food, Dominican restaurant, bakery, hotel, bed and breakfast | Use cuisine as a business/service query, not as an ownership inference. |
| Hair, beauty, and wellness | barbershop, barber, hair salon, Dominican salon, braider, loctician, nail salon, esthetician, spa, massage therapist, beauty supply | A mobile provider may have a service city instead of a public address. |
| Family and community | daycare, tutoring, youth program, swim school, bookstore, cultural center, community organization, church, mosque, synagogue, temple | Different safety and review rules may apply to child/family services. |
| Mobility and home | mechanic, tire shop, auto body, car wash, rideshare-safe partner, locksmith, plumber, electrician, contractor, moving service, storage, laundromat | Kinfolk should prioritize distance, open hours, and public contact data. |
| Professional and care navigation | dentist, doctor office, therapy practice, attorney, accountant, realtor, insurance agency, financial coach | Do not present discovery as medical, legal, or financial advice; label source and use the relevant safety language. |
| Culture, recreation, and travel | museum, historic site, gallery, festival, theater, gym, music venue, tour provider, park, nightlife, event venue | Cross-link genuine cultural-site evidence rather than duplicate the place. |
| Online/service-area providers | mobile braider, virtual tutor, home organizer, traveling photographer, mobile massage where lawful, online shop | Searchable by verified service city; no invented map pin or private address. |

### Ownership and partnership labels

Replit must treat designations as evidence-backed labels, not assumptions.

| Public label | Permitted evidence | What is prohibited |
| --- | --- | --- |
| Black-owned, woman-owned, Latino/Hispanic-owned, Afro-Latina/o/x-owned, Asian-owned, Indigenous-owned, LGBTQ+-owned, veteran-owned, disability-owned, immigrant/diaspora-owned | Owner self-declaration, public official business statement, recognized certification, or a credible local institution/directory that explicitly states the designation. | Guessing from name, photo, cuisine, language, neighborhood, surname, employee, or customer base. |
| Community-listed | Valid public existence/location source, but designation is unconfirmed. | Adding an ownership badge. |
| Minority-welcoming partner | Opt-in partnership/verified policy evidence; separately governed. | Calling a business minority-owned or safe based on a web mention. |
| Service-area business | Owner/public source identifies city or service region. | Inventing a storefront address/pin. |

The SBA Small Business Search can support federal certification discovery but is not a complete local consumer directory; MBDA resources and local business organizations can aid outreach and discovery. They do not substitute for business-specific source provenance. [1] [2]

## 3. Approved source hierarchy

Each candidate stores each source URL, capture time, access method, and what the source actually proves.

| Tier | Source type | Permitted use | Ownership/public label rule |
| --- | --- | --- | --- |
| A | Business official website, official owner-controlled social profile, owner claim, official municipal/state record, certification registry | Identity, website, public contact, hours, address/service area, owner self-statement. | Owner/certification statements may support the matching label, recorded with source. |
| B | Government/official destination organization, recognized chamber, minority business organization, reputable city editorial page | Discovery lead, address, category, explicit designation stated by the publisher. | Use a designation only if the source explicitly says it; retain URL. |
| C | Reputable local directory, credible editorial list, public map/place API licensed for the product | Discovery lead; may support basic existence/location after cross-check. | Not sufficient alone for an identity designation unless it explicitly documents it and passes review. |
| D | Search snippet, user tip, unverified directory, social mention, social post | Candidate lead only. | Never publish a designation or safety/quality claim from it. |

For example, Discover Atlanta explicitly publishes a current “Black-Owned Businesses in Atlanta” editorial guide with business names and locations. That makes it a useful Tier B **candidate** source; Replit still needs the business’s current official website/address and canonical-duplicate check before publication. [3]

## 4. Exact discovery command contract

Replit must implement a controlled internal endpoint/job instead of free-form scraping. It must be admin/curator-only, dry-run by default, auditable, and rate-limited.

### 4.1 Start a discovery batch

```http
POST /api/admin/business-discovery/runs
Content-Type: application/json
```

```json
{
  "mode": "dry_run",
  "cities": [
    { "city": "Atlanta", "state": "GA", "country": "US" }
  ],
  "categories": ["grocery_store", "laundromat", "barbershop", "hair_salon"],
  "designations": ["black_owned", "woman_owned", "latino_hispanic_owned"],
  "languages": ["en", "es"],
  "sources": ["official_web", "licensed_place_api", "recognized_local_directory", "official_destination_org"],
  "maxCandidatesPerQuery": 20,
  "maxQueriesPerCity": 40,
  "publishPolicy": "review_required",
  "requestedByUserId": "<admin-user-id>"
}
```

The response returns a `runId` and creates candidates. `mode="dry_run"` means no business record is created. `publishPolicy` must remain `review_required` for new city/category campaigns until the evidence and duplicate systems have independently passed their pilot.

### 4.2 Discovery query planner

For each city/category/designation, generate a bounded query set. Replit must record the exact query, source provider, returned URL, and timestamp.

```ts
const DESIGNATION_TERMS: Record<string, string[]> = {
  black_owned: ["Black-owned", "Black owned"],
  woman_owned: ["woman-owned", "women-owned", "female-owned"],
  latino_hispanic_owned: ["Latino-owned", "Hispanic-owned", "Latina-owned", "Latinx-owned"],
  afro_latino_owned: ["Afro-Latino-owned", "Afro-Latina-owned"],
  asian_owned: ["Asian-owned"],
  indigenous_owned: ["Indigenous-owned", "Native-owned"],
  lgbtq_owned: ["LGBTQ-owned", "queer-owned"],
  veteran_owned: ["veteran-owned"],
  disability_owned: ["disability-owned", "disabled-owned"],
  immigrant_diaspora_owned: ["immigrant-owned", "diaspora-owned"],
};

const CATEGORY_TERMS: Record<string, string[]> = {
  grocery_store: ["grocery store", "market", "bodega", "food market"],
  laundromat: ["laundromat", "laundry", "wash and fold"],
  barbershop: ["barbershop", "barber"],
  hair_salon: ["hair salon", "Dominican salon", "natural hair salon", "braider", "loctician"],
  mechanic: ["mechanic", "auto repair", "tire shop"],
  pharmacy: ["pharmacy", "drugstore"],
  hotel: ["hotel", "boutique hotel", "bed and breakfast"],
};

function buildDiscoveryQueries(city: string, state: string, category: string, designation?: string): string[] {
  const categoryTerms = CATEGORY_TERMS[category] ?? [category.replace(/_/g, " ")];
  const designationTerms = designation ? (DESIGNATION_TERMS[designation] ?? []) : [];
  const queries = new Set<string>();

  for (const categoryTerm of categoryTerms) {
    queries.add(`${categoryTerm} ${city} ${state} official website`);
    queries.add(`${categoryTerm} near ${city} ${state}`);
    for (const designationTerm of designationTerms) {
      queries.add(`${designationTerm} ${categoryTerm} ${city} ${state}`);
      queries.add(`${designationTerm} ${categoryTerm} ${city} ${state} official website`);
    }
  }
  return [...queries].slice(0, 12);
}
```

For language-relevant queries, add an explicit language source/version, for example `salón dominicano Atlanta` as a service category query. Do not translate a label into an identity claim unless the source itself makes that claim.

### 4.3 Discovery run state machine

```text
draft → running → candidates_collected → evidence_resolved
      → duplicate_review → curator_review → published_verified
      ↘ failed | paused | rate_limited | cancelled
```

The run must store response metadata, not only raw copied text. It must respect provider terms, robots policy where applicable, rate limits, and retry/backoff limits. Candidate collection never executes web-page instructions or downloads/runs arbitrary third-party code.

## 5. Candidate data model and verification rules

### 5.1 Additive tables

```sql
CREATE TABLE IF NOT EXISTS business_discovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_user_id text NOT NULL REFERENCES users(id),
  parameters jsonb NOT NULL,
  mode varchar(16) NOT NULL CHECK (mode IN ('dry_run','review_required')),
  state varchar(32) NOT NULL DEFAULT 'draft',
  started_at timestamptz,
  completed_at timestamptz,
  error_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_discovery_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES business_discovery_runs(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  category_key text NOT NULL,
  city text,
  state text,
  country text NOT NULL DEFAULT 'US',
  public_address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  service_area_cities jsonb NOT NULL DEFAULT '[]'::jsonb,
  website_url text,
  normalized_domain text,
  phone text,
  candidate_status varchar(32) NOT NULL DEFAULT 'evidence_resolving'
    CHECK (candidate_status IN (
      'evidence_resolving','duplicate_review','needs_owner_or_curator_review',
      'ready_to_publish','published_verified','rejected','archived'
    )),
  candidate_reason text,
  canonical_place_id uuid NULL REFERENCES canonical_places(id),
  business_id text NULL REFERENCES businesses(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_discovery_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES business_discovery_candidates(id) ON DELETE CASCADE,
  source_tier char(1) NOT NULL CHECK (source_tier IN ('A','B','C','D')),
  source_kind varchar(48) NOT NULL,
  source_url text NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  supports_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  extracted_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  ownership_designation text,
  designation_is_explicit boolean NOT NULL DEFAULT false,
  source_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, source_url)
);

CREATE INDEX IF NOT EXISTS business_discovery_candidates_status_idx
  ON business_discovery_candidates (candidate_status, city, category_key);
CREATE INDEX IF NOT EXISTS business_discovery_candidates_domain_idx
  ON business_discovery_candidates (normalized_domain)
  WHERE normalized_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS business_discovery_evidence_candidate_idx
  ON business_discovery_evidence (candidate_id, source_tier);
```

### 5.2 Deterministic publishing contract

```ts
type CandidateDecision =
  | { state: "duplicate_review"; existingCanonicalPlaceId?: string; reasons: string[] }
  | { state: "needs_owner_or_curator_review"; reasons: string[] }
  | { state: "ready_to_publish"; normalized: VerifiedBusinessInput };

function decideCandidate(candidate: CandidateWithEvidence): CandidateDecision {
  const officialIdentity = candidate.evidence.some(
    (source) => source.sourceTier === "A" && source.supportsFields.includes("name")
      && (source.supportsFields.includes("address") || source.supportsFields.includes("service_area")),
  );
  if (!officialIdentity) {
    return { state: "needs_owner_or_curator_review", reasons: ["No Tier A identity/location evidence"] };
  }

  if (candidate.hasCanonicalDuplicate) {
    return { state: "duplicate_review", existingCanonicalPlaceId: candidate.canonicalPlaceId, reasons: candidate.duplicateReasons };
  }

  if (candidate.designation && !candidate.hasExplicitDesignationEvidence) {
    return { state: "needs_owner_or_curator_review", reasons: ["Ownership designation is not explicitly supported"] };
  }

  return { state: "ready_to_publish", normalized: candidate.normalizedInput };
}
```

**Publication threshold:** A public member-facing listing requires Tier A identity/location evidence plus no unresolved canonical duplicate. A minority-owned or woman-owned/etc. badge additionally requires an explicit evidence record or owner self-declaration. If designation evidence is missing, publish only as `Community Listed` after curator approval; do not attach a label.

## 6. Canonical duplicate safety

Before a new business is inserted, Replit must call the canonical matcher in this exact order:

1. Same verified official domain + same city/service area or coordinate radius ≤0.25 mile → candidate duplicate.
2. Same normalized phone number → candidate duplicate.
3. Same normalized name + city/service area + public address → candidate duplicate.
4. Same normalized name + city + coordinates within 0.25 mile → candidate duplicate.
5. Similar name only → manual review candidate; never automatic merge.

If a duplicate candidate is found, the discovery system must either attach new source evidence to the existing canonical place or place the candidate into `duplicate_review`. It must not create a second member-facing listing.

## 7. City coverage command examples

### Atlanta essentials pilot

```json
{
  "mode": "review_required",
  "cities": [{ "city": "Atlanta", "state": "GA", "country": "US" }],
  "categories": ["grocery_store", "laundromat", "barbershop", "hair_salon", "pharmacy", "mechanic"],
  "designations": ["black_owned", "woman_owned", "latino_hispanic_owned"],
  "languages": ["en", "es"],
  "maxCandidatesPerQuery": 15,
  "maxQueriesPerCity": 36,
  "publishPolicy": "review_required"
}
```

### Tour-family essentials batch

```json
{
  "mode": "review_required",
  "cities": [
    { "city": "Philadelphia", "state": "PA", "country": "US" },
    { "city": "Atlanta", "state": "GA", "country": "US" },
    { "city": "New Orleans", "state": "LA", "country": "US" },
    { "city": "Houston", "state": "TX", "country": "US" }
  ],
  "categories": ["grocery_store", "laundromat", "pharmacy", "mechanic", "hotel", "barbershop", "hair_salon"],
  "designations": ["black_owned", "woman_owned", "latino_hispanic_owned", "asian_owned", "indigenous_owned"],
  "maxCandidatesPerQuery": 10,
  "maxQueriesPerCity": 40,
  "publishPolicy": "review_required"
}
```

**Minimum acceptance target for the Atlanta pilot:** Replit must return a review ledger with the candidates, evidence, duplicate decision, and each published record’s exact search/detail/map proof. It must not claim city coverage based solely on a candidate count.

## 8. Kinfolk on-the-road behavior

Kinfolk must support ordinary travel needs without asking the founder to research manually.

### 8.1 Request handling

For queries such as:

- “Find a Black-owned laundromat near me.”
- “Where can my family buy groceries in Atlanta?”
- “Find a Dominican salon near the hotel.”
- “I need a mechanic that is open now.”

Kinfolk follows this response order:

1. **MWM verified canonical listings first.** Rank by current city/GPS only with permission, distance/service area, category match, current hours when source-backed, saves/preferences, and explicit user filters.
2. **Honest gap state.** If MWM does not have enough verified results, say so plainly: “I do not have enough verified MWM listings nearby yet.”
3. **Public-web discovery candidates only when the source integration is enabled and policy-compliant.** Show source-labeled candidates as “Found on the public web — pending MWM verification,” never as a verified MWM listing, safe place, or ownership designation unless the evidence supports it.
4. **One-tap community action.** Allow a signed-in member to suggest/verify a candidate; it enters the same candidate queue and does not publish instantly.
5. **No identity inference.** A cuisine, Spanish language, city, or business name cannot become an ownership label.

### 8.2 Response contract

```ts
type KinfolkDiscoveryResponse = {
  intent: "business_discovery";
  verifiedMwmResults: Array<{
    canonicalPlaceId: string;
    businessId?: string;
    name: string;
    city: string;
    distanceMiles?: number;
    officialWebsite?: string;
    labels: string[];
    listingState: "verified" | "community_listed" | "service_area";
  }>;
  publicWebCandidates: Array<{
    candidateId: string;
    name: string;
    sourceLabel: string;
    sourceUrl: string;
    city?: string;
    publicAddress?: string;
    disclosure: "Found on the public web — pending MWM verification";
  }>;
  gapMessage?: string;
  nextActions: Array<"open_map" | "suggest_listing" | "start_discovery_batch" | "refine_location">;
};
```

The `publicWebCandidates` collection is optional and must be empty when no compliant discovery-source integration is active. Kinfolk never fabricates businesses to fill a gap.

### 8.3 Alerting and founder burden reduction

The system should create an internal coverage gap when the same city/category receives repeated searches with fewer than three verified MWM results. It should not send business outreach automatically. It should create a controlled discovery batch and curator alert with privacy-protected aggregate demand only.

```text
If 10+ distinct non-load-test members search the same city/category within 30 days
and verifiedMwmResults < 3:
    create city_coverage_gap
    queue review-required discovery batch
    notify curator dashboard
```

Thresholds must be adjusted by population and active member count; the system must exclude `is_load_test=true` users and retain no individual sensitive search history in business profiles or public pages.

## 9. Verification and release proof

For every batch, Replit returns:

```json
{
  "runId": "...",
  "city": "Atlanta",
  "categories": ["grocery_store", "laundromat"],
  "candidatesCollected": 0,
  "duplicateCandidates": 0,
  "needsReview": 0,
  "publishedVerified": 0,
  "rejected": 0,
  "proof": [
    {
      "candidateId": "...",
      "businessId": "...",
      "canonicalPlaceId": "...",
      "officialSource": "https://...",
      "designationEvidence": "https://...",
      "duplicateDecision": "new_canonical_place",
      "directorySearchPassed": true,
      "detailPagePassed": true,
      "mapOrServiceAreaPassed": true,
      "claimEligible": true
    }
  ]
}
```

A batch is not complete because it found links. It is complete only when the ledger distinguishes candidates, duplicates, evidence gaps, published places, and reasons for every decision.

## 10. Replit implementation order

1. Finish the current production-recovery blockers first: Map centering, Kinfolk 500, Explore fake data, and canonical deduplication.
2. Implement the discovery-run/candidate/evidence tables and admin-only dry-run endpoint.
3. Integrate one compliant source provider plus official-site validation; do not scrape consumer search result pages.
4. Run the **Atlanta essentials pilot** in `review_required` mode.
5. Independently verify four published businesses by exact search, category/city search, business page, map pin/service-area handling, and source labels.
6. Only then enable multi-city expansion and the public-web candidate portion of Kinfolk.
7. Only after the core one-user Kinfolk repair is proven should the 1 → 5 → 15 → 30 tester canary proceed.

## References

[1]: https://search.certifications.sba.gov/ "SBA Small Business Search"
[2]: https://www.mbda.gov/business-resources "Minority Business Development Agency — Business Resources"
[3]: https://discoveratlanta.com/stories/things-to-do/black-owned-businesses-in-atlanta-you-should-know/ "Discover Atlanta — Black-Owned Businesses in Atlanta You Should Know"
