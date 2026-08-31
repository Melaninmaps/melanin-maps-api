# Kinfolk Correction — Direct Answers First, Then Optional Music Exploration

**Status:** Owner-review implementation specification. No source has been changed.

## The observed failure

The member asked a factual cultural question: **“what rappers are from ATL”**. Kinfolk did provide a short answer, but then failed in three separate ways.

| Failure | What the screen did | Why it is wrong |
|---|---|---|
| **Repeated generic limitation statement** | It appended: “I can give general context, but I could not verify a source for the specific factual details.” | This is distracting boilerplate. It makes Kinfolk sound uncertain even when it has provided an ordinary cultural overview, and it was explicitly directed to stop appearing in every answer. |
| **Sales-like automatic guide** | It created a “Your guide to” section and immediately presented food/bookstore cards. | The question was not a request for businesses, restaurants, bookstores, or a city guide. This breaks the member’s intent and makes Kinfolk feel promotional rather than helpful. |
| **No relevant next step** | It did not offer events for relevant local artists, music venues, underground clubs, or an artist-specific deep dive. | A relevant follow-up should be optional, music-specific, city-aware, and selected by the member. |

> **Required product rule:** Kinfolk answers the question first. It does not turn an ordinary factual or cultural question into a sales experience, a business list, or a generic “guide.” It offers a next path only when that path is genuinely relevant and only after the member chooses it.

## The required member experience

For the exact question **“what rappers are from ATL”**, the first Kinfolk turn should have only three parts: a direct factual answer, a small source note only if a material limitation exists, and one quiet optional music-exploration chooser. It must not show directory cards, food cards, bookstore cards, “must-visit spots,” or a generic city guide.

### Direct-answer example

This is the intended **shape and tone**; the live answer must be grounded in Kinfolk’s current research/context and use precise wording for artists who are Atlanta-born, Atlanta-raised, or associated with the wider metro scene.

> Atlanta has been central to hip-hop for decades. Artists commonly connected to Atlanta or the wider metro scene include OutKast, T.I., Ludacris, 2 Chainz, Future, Young Thug, Lil Baby, 21 Savage, and others. The city has shaped Southern hip-hop, trap, and many artists who came up in the Atlanta area.

The answer must distinguish a person being **Atlanta-born**, **Atlanta-raised**, or **associated with the Atlanta/metro scene** when that distinction matters. Kinfolk must not flatten metro-area artists into a false “from Atlanta” claim. It must not invent biographical facts.

### Optional exploration chooser

Directly below the answer, render a compact option block. It is not a sales prompt and it is not a business list.

**Prompt:** `Would you like to explore more of ATL music?`

| Member-selected option | Purpose | What may appear only after selection |
|---|---|---|
| `See local music events` | Find upcoming Atlanta-area music events that are relevant to the artist/music intent. | Dated events with date, venue, location, original organizer/source link, and clear “verify before going” wording when event currency requires it. |
| `Explore music venues & underground clubs` | Find local music venues, listening rooms, and underground-music spaces. | Only relevant verified music-venue/nightclub/live-music results in or near Atlanta; never restaurants, bookstores, or unrelated businesses. |
| `Learn more about these artists` | Continue the cultural question rather than switching to local commerce. | Artist-by-artist cultural/contextual information with source links or citations where available. |
| `Not right now` | End the follow-up without penalty or another prompt. | The direct answer remains visible. Nothing else is retrieved. |

There must be no preselected option. No event, venue, business, restaurant, bookstore, or guide card is retrieved before the member chooses a path.

## Source-note policy — exact behavioral rule

Remove the generic sentence:

> `I can give general context, but I could not verify a source for the specific factual details.`

It must never be appended automatically to ordinary cultural, historical, artistic, or general-information answers.

A source note may appear **only** if source limits materially change what the member should do next. It must be rendered as small secondary footer text after the answer or selected result—not as a paragraph inside Kinfolk’s primary response.

| Situation | Source-note behavior |
|---|---|
| General cultural overview, such as a question about Atlanta rappers | **No generic source note.** Answer directly. |
| Current event, show date, ticket availability, business hours, or venue availability | A short footer may say: `Event details can change. Confirm with the organizer before going.` |
| A narrow biographical claim that cannot be supported by the available evidence | Omit the unsupported claim; do not replace it with a generic disclaimer. |
| Medical, legal, financial, or other genuinely high-stakes content | Keep the applicable short, contextual disclaimer required for that subject. It must be specific to the topic and not repeated in unrelated cultural answers. |

## Required server behavior

The current failure indicates that the generic recommendation/guide path is running after a cultural factual answer. Insert a dedicated **music-and-culture informational intent** before both generic business discovery and generic guide generation.

### Intent contract

Use a new internal intent equivalent to:

```ts
type KinfolkIntent =
  | "culture_music_information"
  | "music_events"
  | "music_venues"
  | "artist_detail"
  // existing intents remain unchanged
```

The **first-turn** classification of terms such as `rapper`, `rappers`, `rap`, `hip-hop`, `hip hop`, `artist`, `artists`, `music scene`, `music culture`, `ATL music`, or a named musician must be `culture_music_information` **unless** the member expressly asks for an event, venue, club, or other local recommendation.

`ATL` must resolve to **Atlanta, Georgia** for this flow. That city resolution happens before any local option is offered. Kinfolk must not ask for a city when `ATL` was already supplied.

### First-turn response contract

For `culture_music_information`:

```ts
{
  answer: string,                    // Direct answer to the question.
  sourceNote: null | string,         // null for ordinary cultural questions.
  explorationPrompt: "Would you like to explore more of ATL music?",
  explorationOptions: [
    { id: "music_events", label: "See local music events" },
    { id: "music_venues", label: "Explore music venues & underground clubs" },
    { id: "artist_detail", label: "Learn more about these artists" },
    { id: "dismiss", label: "Not right now" }
  ],
  results: null,                     // Never preload results.
  guide: null                        // Never create a generic city guide.
}
```

**Hard stop rule:** If the intent is `culture_music_information`, code must not call the generic business recommender, generic “guide” builder, restaurant recommender, bookstore recommender, or must-visit-spots builder. The response must return before any of those paths run.

### Selected-path contract

Only after a member selects an option may Kinfolk retrieve targeted content.

```ts
music_events  -> upcoming, Atlanta-area, music-relevant events only
music_venues  -> verified Atlanta-area music venues / live-music spaces / underground-music spaces only
artist_detail -> selected artist/context research only; no local business list
```

For `music_venues`, strict filters are mandatory:

```text
city = Atlanta, GA or explicitly expanded metro area
category/tag ∈ {live_music, music_venue, nightclub, listening_room, underground_music}
active = true
verified = true when the directory marks verification
```

Results that fail those filters must not appear. Specifically, **Sweet Auburn BBQ, Spelman Bookstore & Café, restaurants, bookstores, and generic retail businesses must never be returned for an ATL-rappers/music question or any of its follow-up paths.**

If no qualifying local result exists, say so clearly and offer the member an explicit expansion or a request to explore artist context instead. Do not fall back to a nationwide or unrelated business list.

## Required client behavior

The client must render the direct answer as the primary result. It must show the exploration chooser only when the server returns `explorationOptions`. It must not render a `Your Guide To`, `Must-Visit Spots`, or generic business-card component for this intent.

| UI element | Required behavior |
|---|---|
| Primary answer | Normal Kinfolk response text. No generic source-limitation sentence. |
| Source note | Render only when `sourceNote` is non-null; small footer text after the answer/results. |
| Exploration chooser | One compact block below the answer, with the four options above. |
| Results | Empty until member chooses an option. |
| Music events | Display date, event name, venue/location, and source/organizer link. |
| Music venues | Display only category-validated music spaces. Use canonical detail URLs. |
| Artist detail | Present learning content and optional source links; do not display business cards. |
| “Not right now” | Dismiss chooser; do not fetch results and do not show a replacement promotion. |

All MWM-owned accents must remain polished gold-outline components. Do not use Unicode emoji in Kinfolk-owned interface elements.

## Surgical source scope

The current project may use different active file names than earlier Kinfolk patches. Replit must first provide an **active-file map** and stop for owner confirmation if it cannot implement this within the allowed source scope below.

| Allowed functional responsibility | Maximum allowed active source file(s) |
|---|---|
| Main Kinfolk request handler / orchestrator | One existing active server file that currently sends the first Kinfolk response. |
| Intent and response policy | One existing active intent/policy/composer file, or one new focused `musicCultureIntent` module plus its import. |
| Consent-gated music retrieval | One existing active retrieval/action file, or one new focused music-retrieval module plus its import. |
| Kinfolk response renderer | One existing active client response component. |
| Tests | One existing or new focused server test file and one existing or new focused client/component test file, if the project test layout requires both. |

Do not modify the generic directory ranking, map search, Living Library, app routes, mobile app, API contracts unrelated to Kinfolk, database schema, deployment configuration, or any unrelated page. No migration is authorized.

## Required acceptance tests

Replit must add or update focused tests and provide their passing output before requesting deployment approval.

| Test input | Required result |
|---|---|
| `what rappers are from ATL` | Direct answer first; resolves Atlanta; `sourceNote = null`; 0 business/venue/event result cards; 0 generic-guide cards; chooser has exactly the four approved options. |
| `what rappers are from ATL` → `Not right now` | No retrieval occurs; direct answer remains; no replacement business prompt/card appears. |
| `what rappers are from ATL` → `See local music events` | Only Atlanta-area music-relevant upcoming events appear; none are restaurants/bookstores/retail listings. |
| `what rappers are from ATL` → `Explore music venues & underground clubs` | Only category-validated Atlanta/explicit-metro music spaces appear; never generic businesses. |
| `what rappers are from ATL` → `Learn more about these artists` | Artist-learning content appears; no local business cards appear. |
| `What clubs are open in ATL tonight?` | Existing nightlife behavior may run, but only after the city resolves. The source note appears only if event/availability currency is material. |
| `I need a lawyer for an eviction` | Existing legal direct guidance, short legal disclaimer, and consent-based attorney offer remain unchanged. |
| `I have chest pain and cannot breathe` | Existing urgent-care behavior remains unchanged; no optional local results are preloaded. |

## Required proof before implementation approval

Before editing, Replit must return:

1. The exact active server handler, intent/composer, retrieval, and client component paths.
2. The specific current condition that creates the generic guide/business cards after a cultural answer.
3. A proposed `git diff --name-only` containing only the permitted scope above.
4. The planned tests.

Do not implement until that evidence is returned and owner approval is given. After implementation, Replit must provide the final changed-file list, test output, a public browser capture of the exact ATL question, and proof that no unrelated file changed.
