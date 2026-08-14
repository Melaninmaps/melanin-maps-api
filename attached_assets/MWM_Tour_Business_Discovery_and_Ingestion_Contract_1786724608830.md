# MWM Tour Business Discovery and Ingestion Contract

## Non-negotiable outcome

Replit must treat every requested business as a **candidate requiring evidence**, never as a fact merely because a search result, screenshot, or AI model mentioned it. A request for four businesses means “return up to four verified candidates.” It must never create four records just to satisfy the requested number.

The only acceptable outcomes are:

| Outcome | Meaning |
|---|---|
| `VERIFIED_ADD` | The candidate has enough independent evidence for automatic insertion. |
| `EXISTING_UPDATE` | The business already exists; update only missing or newer evidence on the canonical record. |
| `MANUAL_REVIEW` | A plausible lead exists, but identity, address, ownership, or current operation is not sufficiently confirmed. |
| `REJECTED` | The candidate is fabricated, unresolvable, clearly closed, a duplicate, or unsupported by evidence. |
| `NO_MATCH` | Fewer candidates were verified than requested. Return the verified number and explain the shortfall. |

## Required behavior for the tour

The following requests must be supported:

```text
Find minority-owned laundry or laundromats in Atlanta.
Find four Black laundromats in Atlanta.
Find nighttime entertainment in Virginia.
Here is a screenshot from TikTok containing a list of businesses.
Here is an Instagram/Facebook/TikTok handle; find and verify this business.
Here is a URL; extract and verify the business.
```

For “find four,” the response must say, for example:

> “I verified 2 businesses. I found 2 additional leads but could not confirm their address or ownership, so I did not add them.”

It must never invent, infer, or pad the list.

## Candidate data contract

Every candidate must carry these fields before it can be inserted or reviewed:

```ts
type BusinessCandidate = {
  name: string;
  normalizedName: string;
  category: string | null;
  subcategory: string | null;
  ownershipClaim: string | null;
  ownershipEvidence: Evidence[];
  address: {
    formatted: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  coordinates: { latitude: number; longitude: number } | null;
  phone: string | null;
  website: string | null;
  socialProfiles: Array<{
    platform: "tiktok" | "instagram" | "facebook";
    url: string;
    handle: string | null;
    verifiedFromSource: boolean;
  }>;
  sourceEvidence: Evidence[];
  verificationStatus: "VERIFIED_ADD" | "EXISTING_UPDATE" | "MANUAL_REVIEW" | "REJECTED" | "NO_MATCH";
  confidenceScore: number;
  duplicateOfId: string | null;
  sourceInput: "natural_language" | "screenshot" | "url" | "social_url" | "admin_search";
};

type Evidence = {
  url: string | null;
  sourceType: "official_website" | "google_places" | "social_profile" | "directory" | "screenshot" | "user_supplied" | "other";
  field: "identity" | "address" | "category" | "ownership" | "phone" | "website" | "social_profile" | "open_status";
  extractedAt: string;
  excerpt: string | null;
  supports: boolean;
};
```

## Natural-language search workflow

For a request such as “find minority-owned laundry or laundromats in Atlanta,” Replit must:

1. Parse the requested category, city, state, ownership requirement, and requested maximum count.
2. Search the configured maps/business provider and the configured web-search provider.
3. Normalize every result before comparing it with the database.
4. Verify the business identity and current location.
5. Verify the ownership claim with explicit evidence. A category or name that merely suggests minority ownership is not proof.
6. Enrich missing phone, website, social profiles, category, hours, and coordinates without overwriting stronger existing evidence.
7. Deduplicate against the existing database before insertion.
8. Insert only candidates that meet the automatic threshold. Put the rest in manual review.
9. Return the actual verified count, not the requested count.

The search response must include a short reason for every excluded or unresolved candidate so the user can contact businesses while traveling.

## Screenshot, TikTok, Instagram, and Facebook workflow

A screenshot is a **lead source**, not proof. OCR/vision may extract business names, handles, addresses, and URLs, but each extracted item must be searched and verified independently.

For a supplied social profile:

- Preserve the exact original URL in `socialProfiles` and `sourceEvidence`.
- Normalize the platform and handle, but never discard the original URL.
- Treat a live profile with a matching business name and city as identity evidence.
- Treat a social profile as an acceptable contact path even when no official website exists.
- Do not claim that the business is open, active, or currently located at an address unless a source supports that field.
- If the profile is private, unavailable, or ambiguous, keep it as user-supplied evidence and send the candidate to manual review.

A social handle supplied by the user must never be lost because website verification failed.

## Verification rules

Automatic insertion requires all of the following:

| Requirement | Rule |
|---|---|
| Identity | A name plus at least one authoritative or corroborating source. |
| Location | A full address or a provider place record with a stable place ID and city/state. |
| Category | A source-backed category matching the request. |
| Ownership | Required only when the user requested an ownership designation; the designation must have explicit evidence. |
| Freshness | Evidence should be current or the candidate must be marked stale/manual review. |
| Duplicate | No existing canonical match by identity/location/phone/website/social URL. |
| Provenance | Every populated field must have source evidence or be marked user-supplied. |

A website is optional. A verified social profile can supply contact evidence, but it does not automatically prove address, ownership, or current operation.

## Duplicate prevention

Use this matching order, from strongest to weakest:

1. Exact provider place ID.
2. Exact normalized website domain plus compatible name.
3. Exact normalized phone number.
4. Same normalized name plus coordinates within 100 meters.
5. Same normalized name plus normalized street address.
6. Same normalized name plus city and a matching social profile.
7. Fuzzy name similarity alone is never enough for automatic merging.

Before insert, perform a transaction with a row lock or database conflict-safe upsert. Every candidate must receive a deterministic `dedupeKey` built from the strongest available identity/location evidence. If a match is found, return `EXISTING_UPDATE` and the canonical ID.

A second import of the same screenshot, URL, social handle, or natural-language request must create **zero new canonical businesses**.

## No-fake and no-padding rules

The following are hard failures:

- Creating a placeholder business to satisfy a requested count.
- Treating an AI-generated name, address, phone, or website as evidence.
- Treating a search-result snippet alone as verified identity and address.
- Treating the word “Black,” “minority,” or a cultural name in a business name as ownership proof.
- Assigning a website that belongs to a similarly named business.
- Copying an address from an unrelated social post without identity matching.
- Merging two businesses solely because their names are similar.
- Dropping a supplied social profile because a website is missing.
- Publishing a manual-review candidate as if it were verified.

## Required admin/review behavior

The review item must show the candidate, every source URL, the supplied screenshot or social URL, the exact fields supported by each source, duplicate matches, and the reason automatic verification failed. The reviewer can choose `Approve and add`, `Update existing`, `Keep both`, `Reject`, or `Needs more evidence`.

Merge must be transactional and must set `is_duplicate=true`, `duplicate_of_id`, and hidden status on the duplicate row. Approve-and-add must use the same dedupe key and upsert function as automated ingestion.

## Acceptance tests Replit must pass

| Test | Expected result |
|---|---|
| “Find four Black laundromats in Atlanta” when only two are verified | Return two verified businesses; create no placeholders. |
| Same request repeated | Zero additional canonical records. |
| Screenshot containing five TikTok businesses | Extract all five as leads; add only verified candidates; preserve screenshot evidence. |
| User supplies Instagram only | Preserve Instagram URL and handle; website may remain null. |
| User supplies Facebook only | Preserve Facebook URL and handle; no fake website. |
| Social profile has wrong city | Manual review or reject; do not merge with a same-name business. |
| Two businesses share a name in different cities | Keep both. |
| Same business has punctuation/accent/name variant | One canonical record. |
| Unverifiable website | Keep social/user evidence and send to review; do not discard or fabricate. |
| Duplicate screenshot imported twice | Zero new canonical records on second import. |
| Ownership cannot be verified | Do not publish the ownership designation; manual review. |
| Provider returns fewer than requested | Return the true count and explain the shortfall. |

## Release proof required from Replit

Replit must return a deployed commit SHA, source diffs for the ingestion route and shared upsert function, database migration/index names, and redacted API results for all acceptance tests. The proof must include counts before and after each test and must not include tokens, cookies, passwords, or private user data.

A statement that the feature is “implemented” is not acceptance. The system is accepted only when the no-padding, no-fake, no-duplicate, social-preservation, and repeat-import tests pass against the deployed Railway URL.
