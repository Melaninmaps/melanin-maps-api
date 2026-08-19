# Replit Prompt — Surgical Kinfolk Music Exploration Fix

## Owner-authorized behavior

Implement this patch so Kinfolk answers cultural/music questions directly before offering a member-selected, relevant next path. This patch specifically fixes the observed failure for:

```text
what rappers are from ATL
```

The member must receive a direct Atlanta hip-hop answer first. Kinfolk must **not** append the repeated generic sentence:

```text
I can give general context, but I could not verify a source for the specific factual details.
```

Kinfolk must **not** automatically produce `Your Guide To`, `Must-Visit Spots`, restaurant cards, bookstore cards, generic business cards, Sweet Auburn BBQ, Spelman Bookstore & Café, or any unrelated directory listing.

Below the direct answer, Kinfolk may offer only these optional choices:

```text
See local music events
Explore music venues & underground clubs
Learn more about these artists
Not right now
```

The member must select a choice before Kinfolk retrieves anything. There is no default selection and no global/nationwide fallback.

## Scope lock — read this before editing

You are authorized to change **only** the active Kinfolk files necessary to integrate the supplied package:

```text
1. One active main Kinfolk chat handler/orchestrator
2. One active Kinfolk registration/bootstrap file, only to register the supplied action route
3. The new server/kinfolk/music/* files supplied in this package
4. One active Kinfolk response-rendering component
5. The new client/src/features/kinfolk/KinfolkMusicExplorationResponse.tsx supplied in this package
6. Focused Kinfolk music tests supplied in this package
```

You are **not** authorized to change any of the following:

```text
App.tsx
router behavior outside the existing Kinfolk request and action routes
map search or directory-ranking logic
business search, business cards, generic guide builder, restaurant code, bookstore code
Living Library
mobile app
API routes unrelated to the two Kinfolk routes below
database schema or migrations
deployment configuration
environment variables
project-wide styling or design system
any preview, QR, waitlist, or production-release file
```

Do not interpret this prompt as permission to refactor Kinfolk, redesign the chat page, change generic recommendation behavior for other intents, or deploy anything.

## Supplied files to add exactly

Copy the following package files into the matching active server/client structure. Preserve the code exactly unless a TypeScript import path must be adjusted to match the active project.

```text
server/kinfolk/music/types.ts
server/kinfolk/music/musicCultureService.ts
server/kinfolk/music/registerMusicCultureRoutes.ts
server/kinfolk/music/musicCultureService.test.ts
client/src/features/kinfolk/KinfolkMusicExplorationResponse.tsx
```

Do not alter the first-turn contract, approved labels, category filters, source-note rule, or hard-stop behavior inside those files.

## Required active-file discovery — stop before touching code

Before copying a file or editing a line, report all of the following:

1. The exact active source path of the existing `POST /api/kinfolk/chat` handler.
2. The exact active source path where Kinfolk routes are registered.
3. The exact active client source path that renders the response shown after a Kinfolk answer.
4. The exact existing data access functions/repositories for city aliases, events, businesses/venues, and artist/topic research.
5. The exact `git diff --name-only` that you expect before build output.

If any required active file does not exist, if the main chat handler has a different response envelope, or if an event source is unavailable, stop and report that fact. Do not create a speculative replacement route, new schema, mock data, generic city guide, or global search fallback.

## Required server integration

### 1. Main Kinfolk handler: intercept before generic behavior

In the existing active `POST /api/kinfolk/chat` handler, import:

```ts
import { maybeHandleMusicCultureQuestion } from "./kinfolk/music/musicCultureService";
```

Adjust the relative path only if the active handler sits in a different directory.

Immediately after the handler has extracted the member question and member city, but **before** any of the following operations:

- generic LLM response generation;
- guide generation;
- `Your Guide To` construction;
- `Must-Visit Spots` construction;
- business/directory recommendation retrieval;
- restaurant/bookstore recommendation retrieval; or
- generic local business prompt construction,

insert this exact control-flow block, substituting only the active repository object and actual member-location property names:

```ts
const musicTurn = await maybeHandleMusicCultureQuestion({
  question,
  memberCity: {
    city: member.profileCity ?? null,
    stateCode: member.profileStateCode ?? null,
  },
  repository: musicCultureRepository,
});

if (musicTurn) {
  return res.status(200).json({
    ...musicTurn,
    // Retain the existing chat response field if the client expects it.
    message: musicTurn.answer,
  });
}
```

The early `return` is mandatory. It is the surgical line that prevents the generic guide/business logic from running after a music-culture answer.

### 2. Repository adapter: use existing data only

Create `musicCultureRepository` by adapting only the already-active city, event, business, and artist/topic data access layer to the `MusicCultureRepository` interface in `server/kinfolk/music/types.ts`.

**Do not add a migration. Do not add a database table. Do not seed mock events or mock venues.**

The adapter must follow these rules:

| Method | Required data rule |
|---|---|
| `listCityAliases()` | Use the existing active city-alias source. Ensure `ATL` resolves to Atlanta, GA. If the alias is missing, add only the approved alias through the existing active city-alias seeding mechanism—not a new table or a generic name match. |
| `findUpcomingMusicEvents()` | Use the existing event source only. Return dated future events in the resolved city, restricted to music-relevant categories/tags. If no qualifying source exists, return `[]`. |
| `findVerifiedMusicVenues()` | Use the existing business/directory source only. Query the resolved city and restrict results to the categories in `APPROVED_MUSIC_VENUE_CATEGORIES`. Return only active, verified qualifying results. |
| `findArtistDetails()` | Use the existing Kinfolk research/Living Library source only. Return sourced artist context. If no supported detail exists, return `[]`; do not invent biographical claims. |

No route may fall back from a music path to restaurants, bookstores, retail businesses, “must-visit spots,” national lists, or generic directory results.

### 3. Register the action route

Register exactly one new **post-consent** action route from `registerMusicCultureRoutes.ts`:

```text
POST /api/kinfolk/music-exploration/actions
```

It must preserve the project’s existing Kinfolk authentication/session middleware. It must not replace or duplicate the existing chat endpoint.

### 4. Client integration

In the one active Kinfolk response renderer, render `KinfolkMusicExplorationResponse` **only** when:

```ts
response.intent === "culture_music_information"
```

For this intent:

- render the direct answer first;
- render the small source note only when the server sends a non-null `sourceNote`;
- render the four-option chooser only when supplied;
- never render the generic guide, generic directory cards, or generic business recommendation panel;
- do not open an external browser or force a separate page;
- send the selected option to `POST /api/kinfolk/music-exploration/actions`;
- replace the current Kinfolk response with the returned focused result.

Do not alter other Kinfolk intent renderers.

## Source-note rule

The generic limitation sentence must be removed from the music-culture path. It must not appear in the primary answer, chooser, or result body.

A source note is allowed only when it materially affects the action, such as a live event’s date or availability. For event results, render only this small footer note:

```text
Event details can change. Confirm with the organizer before going.
```

Do not use a generic “could not verify” sentence. Omit unsupported factual claims instead.

## Required tests

Add the supplied service test and adapt its import path only. The following checks must pass:

| Test | Required result |
|---|---|
| `what rappers are from ATL` | Direct answer, Atlanta resolved, `sourceNote: null`, exactly four choices, no preloaded results, no guide. |
| `Not right now` | No event, venue, artist, or business retrieval occurs. |
| Music events selected | Future Atlanta-area music events only; small event footer note only. |
| Music venues selected | Only active verified `live_music`, `music_venue`, `nightclub`, `listening_room`, or `underground_music` results. |
| Unrelated listing regression | Sweet Auburn BBQ and Spelman Bookstore & Café do not appear in any music path. |
| Artist detail selected | Cultural artist detail only; no business query/card. |
| Legal/medical existing behavior | Existing urgent-care and consent-gated professional paths remain unchanged. |

Run the project’s existing focused test command and type-check command. Do not run deployment, publish a build, or alter production.

## Required proof before asking for owner deployment approval

Return all of the following:

1. The active-file discovery report.
2. The final `git diff --name-only`.
3. The final `git diff --stat`.
4. The complete changed-file list, which must contain only the scope-locked files above.
5. Passing test output and type-check output.
6. A local or Replit-preview capture of the exact question `what rappers are from ATL` showing the direct answer and the four choices.
7. Captures of the event, venue, artist-detail, and `Not right now` outcomes.
8. Explicit confirmation that no restaurant, bookstore, generic business card, `Your Guide To`, or `Must-Visit Spots` section appeared.

If any extra source file is needed, if tests fail, or if the response still produces an unrelated listing, stop and ask for new owner approval. Do not broaden scope or create a workaround.
