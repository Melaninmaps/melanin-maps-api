# Replit Business Search and Ingestion Contract

## Purpose

This is the required behavior when a user uploads an image, sends a URL, or asks Replit to search for businesses. The system must **discover, enrich, verify, deduplicate, and then either add or review** each candidate. It must never blind-insert every search result.

## Supported user inputs

| Input | Required behavior |
|---|---|
| Image | Run OCR/vision extraction for business names, addresses, phone numbers, websites, and visible ownership/category claims. Treat image text as a lead, not proof. Search and verify each candidate. |
| URL | Fetch the page, parse JSON-LD and OpenGraph data, extract visible text, identify candidate businesses, and use the URL as source evidence. Search and verify each candidate. |
| Natural-language request | Parse category, geography, ownership attribute, and keywords. Example: “Black-owned grocery stores in Atlanta” becomes category `Grocery Store`, city `Atlanta`, ownership attribute `Black-owned`. Search, enrich, verify, and deduplicate. |

## Required search workflow

1. Parse the input into structured constraints.
2. Produce candidate businesses from the image, URL, or search provider.
3. For every candidate, query a maps/business provider and a web-search provider when available.
4. Fetch the official website when one is found. Extract the name, address, phone, website, hours, category, and ownership evidence.
5. Preserve every source URL, provider record ID, retrieval time, and field-level evidence.
6. Normalize accents, punctuation, apostrophes, parentheses, em dashes, abbreviations, phone numbers, and whitespace.
7. Compute the deduplication key before writing.
8. Match against the existing database by normalized name plus identical coordinates, or normalized name plus exact address/city/state.
9. Also catch naming variants at the same location when token similarity is at least `0.90`.
10. If a match exists, update missing fields on the canonical row; never create a second row.
11. If identity/location evidence is weak, create a review item rather than an active business.
12. For ownership attributes such as “Black-owned,” require explicit evidence from an official website, a self-identifying business profile, a reputable directory, or direct user-provided evidence. Never infer ownership from a person’s name, photograph, neighborhood, language, or appearance.
13. Only records scoring at least 70/100 and satisfying the requested ownership evidence may be added as active records.

## Required database fields

The business table must include `dedupe_key`, `status`, `duplicate_of_id`, `source_provider`, `source_record_id`, `source_url`, `retrieved_at`, and a JSON/JSONB `evidence` field. A unique partial index must enforce one active canonical row per deduplication key.

## Required endpoint behavior

The Replit application should expose one authenticated endpoint similar to:

```ts
POST /api/businesses/ingest
Content-Type: application/json

{
  "kind": "query",
  "text": "Black-owned grocery stores in Atlanta"
}
```

For a URL:

```json
{
  "kind": "url",
  "url": "https://example.com/business-list"
}
```

For an image, upload the file to storage first and send:

```json
{
  "kind": "image",
  "fileUrl": "https://storage.example.com/uploads/list.png"
}
```

The endpoint must return `CREATED`, `UPDATED_EXISTING`, or `NEEDS_REVIEW` for each candidate, together with the reason and canonical ID.

## Example expected behavior

For “Black-owned grocery stores in Atlanta,” Replit must not add a business solely because a search engine returned its name. It must find location evidence, verify the category, find explicit ownership evidence, compute the deduplication key, compare against existing rows, and then either create one active canonical row, update an existing row, or place the candidate in review.

If the same business appears in an uploaded image, an article URL, and a maps result, Replit must create **one** row with multiple evidence records. If a business appears under `Cafe`, `Café`, and `Business Name — Atlanta`, the normalized and same-location matching must consolidate those results. If two businesses have the same name at different addresses, Replit must retain both until a human confirms they are duplicates.

## What “all information available on the web” means operationally

No system can guarantee that every fact on the internet is available or current. Replit must therefore store the information it can substantiate from the configured providers and clearly distinguish verified fields, provider-derived fields, user-supplied fields, and unresolved fields. It must not fabricate missing information or present an unverified ownership claim as fact.

## Files to install

Install `replit_business_ingestion_pipeline.ts` alongside the existing deduplication module. Connect its `VisionAdapter`, `PageAdapter`, and `SearchAdapter` to the providers configured in the Replit project. The core pipeline is vendor-neutral and is designed to work with the project’s existing database layer.
