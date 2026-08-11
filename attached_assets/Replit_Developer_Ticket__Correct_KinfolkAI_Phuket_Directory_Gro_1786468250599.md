# Replit Developer Ticket: Correct KinfolkAI Phuket Directory Grounding and Contradictory Disclaimers

**Priority:** P2 — content integrity and user trust  
**Owner:** Replit engineering  
**Affected surfaces:** `POST /api/kinfolk/chat`, business-directory search, KinfolkAI conversation UI, Phuket business data/indexing  
**Do not modify:** Login, authentication/session middleware, Map rendering, Safety Hub, Library UI, Marketplace, or unrelated business-detail components.

## Problem Statement

KinfolkAI now completes the Phuket birthday-planning journey, but its initial long-form response contains a trust-damaging contradiction. It says that it does not have specific Phuket listings in the community directory, then recommends places by name. After a Map → KinfolkAI navigation return, a follow-up request successfully recommends **Suay Restaurant — Phuket** as a birthday dinner option.

This creates two issues. First, users cannot tell whether a recommendation is grounded in Mapping With Melanin’s directory, general model knowledge, or both. Second, the exact directory search query `Suay Restaurant Phuket` currently returns no exact listing and falls back to unrelated U.S. restaurants.

> **User impact:** A person planning a real birthday surprise in Phuket should not be told there are no directory listings if Kinfolk later presents a specific Phuket restaurant as though it were directory-grounded.

## Verified Production Evidence

| Test | Observed result |
|---|---|
| Initial Kinfolk Phuket birthday request | Kinfolk returned a full itinerary but stated: *“While I don't have specific listings for Phuket in my community directory...”* |
| Same response | It named Café del Mar Phuket, Sugar Club, and Nika’s Restaurant without clear source labels or listing links. |
| Map → KinfolkAI → follow-up | Kinfolk returned: *“For a special birthday dinner in Phuket, I recommend Suay Restaurant — Phuket.”* |
| Authenticated directory query | `GET /api/search/universal?q=Suay+Restaurant+Phuket&surface=directory&limit=30` returned HTTP 200 with `namedBusinessNotFound: true`. |
| Directory metadata | `matchTiers: ["nearby_alternative"]`; first returned business was **14 Parishes Jamaican Restaurant, New Orleans, LA**. |

## Desired Product Behavior

Kinfolk must distinguish between **directory-grounded recommendations** and **general/travel knowledge**.

1. If verified or community-directory matches exist, Kinfolk must name only the retrieved entries that are relevant to the requested geography and category. It must provide a business card/link or clear label such as **“From the MWM directory.”**
2. If the directory has no relevant Phuket match, Kinfolk may still help with general travel planning, but it must say: **“I don’t have an MWM listing for this yet; here are general travel ideas to verify before booking.”** It must not imply those recommendations come from the MWM directory.
3. Kinfolk must never emit the “no specific listings” disclaimer if the retrieval payload contains one or more Phuket directory matches used in the answer.
4. If Kinfolk recommends a named place such as **Suay Restaurant — Phuket**, the retrieval layer must return a matching canonical business record or the answer must label it as non-directory travel guidance.
5. A named-business search must not quietly return unrelated U.S. alternatives as though they answer the query. If `namedBusinessNotFound` is true, the UI should clearly show that no exact listing was found and offer explicit alternatives, web search, or nomination actions.

## Root-Cause Areas to Investigate

| Area | Required investigation |
|---|---|
| Phuket record availability | Confirm whether Suay Restaurant — Phuket exists in the production business table, cultural-sites table, or a separate travel seed. |
| Entity index/search document | If it exists, confirm canonical `name`, aliases, `city`, `country`, coordinates, and searchable text have been indexed. |
| Geographic normalization | Normalize `Phuket`, `Phuket, Thailand`, and `Thailand` consistently across chat retrieval and directory search. |
| Retrieval-to-prompt handoff | Log the retrieved record IDs, business names, geographic match status, and result count passed to Kinfolk—never the user’s sensitive profile data. |
| Disclaimer guard | Make disclaimer text conditional on a structured retrieval result, not on model improvisation. |
| Named-business fallback | When `namedBusinessNotFound: true`, do not rank unrelated "restaurant" name matches as equivalent answers. Label them as alternatives only. |

## Required Implementation

### A. Add a structured grounding object to the chat retrieval result

Before the model prompt is composed, build a server-controlled object similar to:

```ts
type DirectoryGrounding = {
  query: string;
  requestedLocation?: { city?: string; country?: string };
  exactMatches: Array<{
    id: string;
    name: string;
    city: string;
    country?: string;
    category?: string;
    url: string;
  }>;
  nearbyAlternatives: Array<{
    id: string;
    name: string;
    city: string;
    country?: string;
    url: string;
  }>;
  directoryMatchCount: number;
  exactMatchFound: boolean;
};
```

### B. Make response wording deterministic around grounding

| `DirectoryGrounding` condition | Required response rule |
|---|---|
| `exactMatchFound === true` | Use the exact MWM listings; do **not** say the directory has no listings. Add an MWM directory label/link for every referenced business. |
| No exact match; `directoryMatchCount === 0` | Kinfolk may offer general travel context, but must label it as **general guidance to verify**. It must not claim or imply directory verification. |
| Only unrelated alternatives exist | Do not call them search results for the named business. Present them only beneath a clear **“Possible alternatives, not an exact match”** label. |
| Model output names a non-retrieved business | Remove/replace it, or label it as non-directory travel guidance with an explicit verification reminder. |

### C. Fix named-business search quality

For `Suay Restaurant Phuket`, either:

1. Return the canonical Suay listing with `namedBusinessNotFound: false`; or
2. Return `namedBusinessNotFound: true` with no irrelevant U.S. restaurant records in the exact-results section.

Add a canonical alias index for businesses where needed:

```ts
aliases: [
  "Suay Restaurant Phuket",
  "Suay Restaurant — Phuket",
  "Suay Phuket",
  "Suay Restaurant Thailand"
]
```

Only add aliases after confirming they correspond to the actual directory record.

## Acceptance Criteria

| Scenario | Pass condition |
|---|---|
| `Suay Restaurant Phuket` directory search | Returns either the canonical Suay record as an exact match, or a clearly labeled exact-not-found response without unrelated U.S. restaurants presented as an answer. |
| Initial Phuket birthday prompt | If directory matches exist, Kinfolk names and links those matches, with no contradictory no-listings disclaimer. |
| Initial Phuket birthday prompt, no matches case | Kinfolk delivers useful general travel guidance, clearly labels it as non-directory guidance, and does not invent directory grounding. |
| Follow-up dinner question | If Kinfolk recommends Suay, the response includes the matching directory ID/link and source label; otherwise it states it is general guidance. |
| Map → KinfolkAI continuity | The authenticated user remains logged in and post-navigation chat works. |
| Regression: Philadelphia and Atlanta directory recommendations | Exact/nearby directory labels remain correct; no generic disclaimer appears when matching business records are present. |
| Regression: safety/medical prompts | No sensitive user profile data or private preferences appear in grounding logs, UI labels, or link metadata. |

## Test Plan

1. Seed or confirm a canonical Suay Restaurant — Phuket record, including `city = Phuket`, `country = Thailand`, valid coordinates if it should appear on the map, and aliases if appropriate.
2. Run the named-business search endpoint with `Suay Restaurant Phuket`, `Suay Phuket`, and `Suay Restaurant — Phuket`.
3. Run the initial birthday prompt with directory retrieval logging enabled in production-safe mode.
4. Inspect the returned structured grounding object and the rendered response.
5. Navigate Map → KinfolkAI and run `Give me one birthday dinner idea in Phuket.`
6. Record screenshots plus redacted server logs showing result count, selected record IDs, and the final response-source state.

## Definition of Done

This ticket is complete only when the named-business query, initial itinerary, and post-navigation follow-up all pass the acceptance criteria in a clean production browser session. Replit must provide the redacted retrieval payload and a screen recording of the user-visible flow before requesting another independent audit.
