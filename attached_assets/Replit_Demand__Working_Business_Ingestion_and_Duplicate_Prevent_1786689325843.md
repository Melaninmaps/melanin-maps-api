# Replit Demand: Working Business Ingestion and Duplicate Prevention

## Copy and paste this message to Replit

> We need you to fix and prove the business-search and ingestion system. Do not send another README, test protocol, or statement that something is “shipped” without showing the actual source changes, database results, API responses, and test evidence.
>
> The required user experience is:
>
> 1. A user can type a request such as **“Find Black-owned grocery stores in Atlanta.”**
> 2. A user can submit a **URL** containing business information.
> 3. A user can upload an **image** containing business names, addresses, flyers, screenshots, or directories.
> 4. The system extracts candidate businesses, searches/enriches them using configured providers, verifies location/category/ownership evidence, deduplicates them against the existing database, and either updates one canonical record, creates one new record, or sends the candidate to an admin review queue.
>
> Implement this as a real end-to-end workflow. Do not treat a manually prepared list of four businesses or a verification document as proof that the workflow works.
>
> ### Non-negotiable implementation requirements
>
> **A. One governed write path.** Every business creation or update must use one shared transactional function, such as `createOrResolveBusiness()`. This function must be used by natural-language search ingestion, URL ingestion, image ingestion, admin Google Places approval, admin manual creation, member suggestions, community references, and any enrichment job. No route may directly insert into `businesses` while bypassing this function.
>
> **B. Mandatory identity fields.** Every canonical business row must receive a normalized name and a non-null dedupe key whenever sufficient identity information exists. The key must use the same algorithm everywhere and must normalize accents, punctuation, whitespace, “Cafe/Café,” parenthetical labels, city suffixes, phone numbers, website domains, addresses, and coordinates.
>
> **C. Safe duplicate decision order.** Before inserting, the system must check, in this order: provider place ID, normalized official website domain, normalized phone, same normalized name plus identical coordinates, same normalized name plus normalized full address/city/state, and finally a conservative fuzzy candidate match sent to review. Same names at different verified locations must remain separate.
>
> **D. Database protection.** The database must have a partial unique index that prevents two non-duplicate canonical rows from sharing a populated dedupe key. The insert must use a transaction and a database conflict target. A client-side pre-check alone is not acceptable.
>
> **E. Public visibility.** Map pins, list/search results, count endpoints, related-business results, exports used for public counts, and direct detail lookups must all exclude `is_duplicate=true`, permanently hidden, removed, deleted, and non-live rows. Tester/admin access must not bypass duplicate and permanently-hidden filtering in public views.
>
> **F. Real Merge behavior.** The review-queue Merge action must lock the review item, identify the candidate row, set `is_duplicate=true`, set `duplicate_of_id` to the canonical row, record the reason and timestamp, remove the duplicate from public visibility, preserve its evidence, and mark the review item resolved only after the business update succeeds. It must be transactional and idempotent.
>
> **G. Evidence-based ownership claims.** For a request containing “Black-owned,” the system must not set `black_owned=true` solely because a search result, user text, AI output, or business name says so. It must preserve source URLs and quoted evidence, identify the evidence type, assign a confidence score, and send candidates below the configured threshold to review. The system must distinguish “Black-owned,” “Black-founded,” “community-owned,” “co-op,” and “serves the Black community.” These are not interchangeable.
>
> **H. Source provenance.** Every field obtained or changed during ingestion must retain provider/source URL, retrieval timestamp, evidence text or structured source data, and the ingestion request ID. The system must never claim that it searched “the web” unless the configured provider calls and returned sources are recorded.
>
> **I. Idempotency.** Repeating the same natural-language query, URL, image, Google Places result, or admin approval must not create another canonical business. Repeating an ingestion request must return the existing canonical ID and may only append new evidence or fill missing fields.
>
> ### Required implementation output
>
> Return all of the following in the response, with file paths and commit hash:
>
> 1. The complete source diff for the shared ingestion/upsert function.
> 2. The complete source diff for natural-language, URL, and image ingestion routes.
> 3. The complete source diff for admin discovery approval.
> 4. The complete source diff for review-queue Merge and Keep Both.
> 5. The database migration creating required columns, indexes, review records, provenance storage, and candidate-to-review linkage.
> 6. The exact provider adapters and the names of every required environment variable. Do not use placeholder providers while claiming the feature is complete.
> 7. Automated tests and their complete output.
> 8. The SQL verification output from the deployed database.
> 9. HTTP request/response evidence for all three ingestion inputs.
> 10. A list of known limitations. Do not call a feature complete if a provider, route, migration, or UI is still absent.
>
> ### Required acceptance tests
>
> The implementation is not accepted until every test below passes:
>
> **Test 1 — Natural-language search.** Submit “Find Black-owned grocery stores in Atlanta.” Return candidate IDs, names, addresses, coordinates, ownership evidence URLs, evidence excerpts, scores, dedupe decisions, and final statuses. Every candidate must be either one canonical record or a review item; no duplicate live rows may be created.
>
> **Test 2 — Same query repeated.** Submit the exact query again. The number of canonical businesses must not increase. The response must identify existing canonical IDs.
>
> **Test 3 — URL ingestion.** Submit an official business URL. Extract structured data and visible business information, preserve the source URL, enrich missing fields, and resolve to an existing canonical row when appropriate.
>
> **Test 4 — Image ingestion.** Upload an image containing at least two businesses. Return OCR/vision-extracted candidates, confidence per extracted field, source image ID, web evidence, and dedupe decisions. Do not publish a low-confidence candidate automatically.
>
> **Test 5 — Naming variants.** Submit “Cafe,” “Café,” punctuation variants, parenthetical city labels, and abbreviated names for the same location. These must resolve to one canonical business.
>
> **Test 6 — Separate locations.** Submit the same business name at two verified addresses. The system must retain two canonical locations and must not merge them.
>
> **Test 7 — Repeated Google Places approval.** Approve the same provider place ID twice. The second request must return the first canonical ID and create zero new rows.
>
> **Test 8 — Concurrent approval.** Send two identical approval requests at the same time. The database must contain one canonical row after both complete.
>
> **Test 9 — Merge.** Merge one confirmed duplicate from the review queue. Verify the duplicate business row changes state, receives `duplicate_of_id`, disappears from public map/list/detail results, and the review item becomes resolved. Repeat the Merge request and verify no second mutation occurs.
>
> **Test 10 — Public leakage.** Request map pins, list results, counts, and direct detail for a confirmed duplicate and a permanently hidden record. None may be exposed publicly, including to tester accounts.
>
> **Test 11 — Review idempotency.** Restart the application twice. Review items and seed migrations must not duplicate.
>
> **Test 12 — Rollback.** Force an error after candidate creation but before review resolution. Verify the business update and review status both roll back.
>
> ### Required proof format
>
> For each test, provide:
>
> - Test ID and timestamp.
> - Git commit hash and deployed version.
> - Exact request body or uploaded-file identifier.
> - Exact response status and JSON response.
> - Before/after database counts.
> - Relevant database rows by ID.
> - Source URLs and evidence excerpts.
> - Pass or fail result.
>
> A screenshot of a UI page or a README statement is not sufficient proof of database correctness. Do not mark this task complete until the source diff, migrations, automated test output, SQL output, and deployed HTTP results are included.

---

# Technical requirements checklist

## 1. Data model

The `businesses` table must contain, at minimum, the following fields or their exact equivalents:

| Field | Requirement |
|---|---|
| `normalized_name` | Deterministic, accent-insensitive normalized name. |
| `dedupe_key` | Deterministic identity key used by every write path. |
| `provider_place_id` | Provider-native stable ID where available. |
| `canonical_business_id` | Optional explicit canonical pointer; required for duplicate rows if `duplicate_of_id` is not sufficient. |
| `is_duplicate` | Boolean, default `false`. |
| `duplicate_of_id` | Canonical target for duplicate rows. |
| `duplicate_reason` | Machine-readable reason, such as `same_provider_id`, `same_geo`, or `manual_review_merge`. |
| `duplicate_marked_at` | Timestamp. |
| `listing_status` | Must distinguish `pending_review`, `live_unclaimed`, `live_claimed`, and hidden states. |
| `source_provider` | Provider that supplied the record. |
| `source_url` | Evidence or official URL. |
| `source_record_id` | Provider record identifier. |
| `retrieved_at` | Timestamp of retrieval. |
| `ingestion_request_id` | Idempotency and audit identifier. |
| `evidence` | Structured JSON containing URLs, excerpts, field-level evidence, provider, and score. |

The review table must include a direct `candidate_business_id` and `canonical_business_id` rather than relying on name/address matching at Merge time.

## 2. Identity and deduplication algorithm

The algorithm must be centralized in one tested module. It should normalize text with Unicode NFKD, remove diacritics, lowercase, normalize punctuation and whitespace, standardize common business suffixes, normalize phone digits, canonicalize website domains, normalize address components, and round coordinates only to a documented precision.

The algorithm must not merge two businesses only because their names are similar. It may automatically merge only when there is a strong identity signal, such as the same provider place ID, same official domain and matching location, same phone and matching name, or same normalized name plus identical coordinates/full address. Ambiguous cases must be reviewed.

## 3. Ingestion pipeline

Every ingestion request must produce a durable request record with input type, original query/URL/image ID, provider calls, candidates, evidence, decisions, and errors. The pipeline must be replayable and idempotent.

For natural-language requests, the parser must extract structured intent, including category, location, ownership requirement, and requested attributes. It must not silently ignore “Black-owned,” “Atlanta,” or “grocery stores.”

For URLs, the pipeline must validate URL safety, fetch the page with timeouts and size limits, parse JSON-LD and visible content, extract candidate fields, and preserve the URL as evidence. It must not treat arbitrary page text as verified ownership.

For images, the pipeline must store the original image reference, run OCR/vision extraction, return field-level confidence, and require web corroboration before publishing a candidate. It must not publish a business solely because an AI model read it from an image.

## 4. Provider configuration

Replit must name the actual providers used for each function:

| Function | Required disclosure |
|---|---|
| Maps/business search | Provider name, API endpoint, key secret name, rate limits, and returned fields. |
| General web search | Provider name, API endpoint, key secret name, result limits, and source retention behavior. |
| Image/OCR | Provider name, model/endpoint, key secret name, image limits, and confidence behavior. |
| URL extraction | Fetching library/service, timeout, redirect, robots/security policy, and parser behavior. |

An environment variable name without a connected provider is not an implementation.

## 5. Database and transaction requirements

The dedupe index must be partial and match the write condition. All insert and Merge operations must run in transactions. The database must handle concurrent identical writes. “Check then insert” without a unique constraint or lock is not acceptable.

Migrations must be idempotent, must fail loudly when required schema changes cannot be applied, and must include a verification query. Startup logs must distinguish applied, skipped, and failed migrations and must not report a healthy release while required migrations failed.

## 6. Public visibility requirements

Create one shared public predicate or public view and use it for map pins, lists, search, counts, related businesses, exports used by the public UI, and details. Admin screens may read all records, but public queries must never bypass the predicate for tester accounts.

## 7. Evidence and ownership requirements

Each ownership designation must have field-level evidence. The system must distinguish:

- Black-owned or Black-founded.
- Woman-owned.
- Community-owned or cooperative.
- Serves a Black community.
- Listed in a directory without independent ownership evidence.

Only the evidence-supported designation may be displayed. If evidence is insufficient, the candidate must be marked `needs_research` or `pending_review`, not automatically published.

## 8. What Replit must not do

Replit must not:

- Claim that a test passed without output.
- Claim that a patch shipped when only a README or SQL file exists.
- Insert directly into `businesses` from an alternate route.
- Use a random UUID to avoid duplicate detection.
- Mark a review item “merged” without changing the business row.
- Treat a search result or AI response as ownership proof.
- Merge same-name businesses at different locations automatically.
- Hide duplicate rows from one endpoint while exposing them through another.
- Use tester/admin privileges to bypass public visibility rules.

## 9. Release gate

The ingestion and deduplication work is **not accepted** until the complete proof package contains the source diff, migration output, automated test output, deployed HTTP output, read-only SQL results, and evidence records for the natural-language, URL, and image workflows. If any required artifact is missing, the status must remain **Not verified**.
