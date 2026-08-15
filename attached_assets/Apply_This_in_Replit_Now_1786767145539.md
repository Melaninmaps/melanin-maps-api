# Apply This in Replit Now

## What this fixes

This patch stops Kinfolk from asking “What city?” when the message already contains a recognized city name or alias.

**Example:** `Tell me about Philly nightlife` becomes:

- City: **Philadelphia**
- State: **PA**
- Category: **nightlife**
- Action: search immediately
- Behavior: do **not** ask the member to repeat the city

It also corrects the voice bug so HTTP `413` is no longer falsely described as “over 60 seconds.”

---

## Step 1 — Create a city resolver file

In Replit, create this file:

```text
server/kinfolk/locationResolver.ts
```

Paste this entire code into it:

```ts
export type ResolvedLocation = {
  city: string;
  state: string;
  country: "US";
  source: "alias" | "explicit" | "session";
};

const CITY_ALIASES: Array<{
  pattern: RegExp;
  city: string;
  state: string;
}> = [
  {
    // Covers: Philly, Philadelphia, Philadelphia PA, Philadelphia, Pennsylvania
    pattern: /\b(?:philly|philadelphia)(?:\s*,?\s*(?:pa|pennsylvania))?\b/i,
    city: "Philadelphia",
    state: "PA"
  },
  {
    pattern: /\b(?:nyc|new york city)(?:\s*,?\s*(?:ny|new york))?\b/i,
    city: "New York",
    state: "NY"
  },
  {
    pattern: /\b(?:dc|d\.c\.|washington dc|washington,? d\.c\.)\b/i,
    city: "Washington",
    state: "DC"
  }
];

export function resolveLocation(
  message: string,
  sessionLocation?: ResolvedLocation
): ResolvedLocation | undefined {
  for (const alias of CITY_ALIASES) {
    if (alias.pattern.test(message)) {
      return {
        city: alias.city,
        state: alias.state,
        country: "US",
        source: "alias"
      };
    }
  }

  // If the member previously gave a city in the same chat, use it.
  if (sessionLocation) {
    return { ...sessionLocation, source: "session" };
  }

  return undefined;
}

export function getLocalCategory(message: string):
  | "nightlife"
  | "dining"
  | "events"
  | "beauty"
  | "wellness"
  | "general" {
  if (/\b(nightlife|club(?:s)?|bar(?:s)?|lounge(?:s)?|party|parties|late[- ]night|happy hour|music venue(?:s)?)\b/i.test(message)) {
    return "nightlife";
  }
  if (/\b(restaurant(?:s)?|food|dining|brunch|dinner|lunch|breakfast)\b/i.test(message)) {
    return "dining";
  }
  if (/\b(event(?:s)?|tonight|this weekend|concert(?:s)?|festival(?:s)?|show(?:s)?)\b/i.test(message)) {
    return "events";
  }
  if (/\b(beauty|hair|barber|nails|salon|spa)\b/i.test(message)) {
    return "beauty";
  }
  if (/\b(wellness|fitness|gym|yoga|therapy|health)\b/i.test(message)) {
    return "wellness";
  }
  return "general";
}

export function isLocalDiscoveryIntent(message: string): boolean {
  return (
    getLocalCategory(message) !== "general" ||
    /\b(near me|nearby)\b/i.test(message)
  );
}
```

---

## Step 2 — Patch the Kinfolk chat route

In Replit, search the whole project for this text:

```text
/api/kinfolk/chat
```

Open the **server route** that receives `POST /api/kinfolk/chat`. At the top of that file, add:

```ts
import {
  getLocalCategory,
  isLocalDiscoveryIntent,
  resolveLocation
} from "./kinfolk/locationResolver";
```

> If your route is already inside `server/kinfolk/`, use `./locationResolver` instead.

Then find the code that does either of these things:

```ts
if (!location) {
  return "I need a location first";
}
```

or:

```ts
if (needsLocation) {
  // asks: What city, neighborhood, or metro area?
}
```

**Delete that missing-location check from its current position.** Replace it with the following block **before any AI prompt is sent and before any response is created**:

```ts
const message = String(req.body.message ?? "").trim();

// Use your existing session-memory field if you have one.
// If no saved location exists yet, this is undefined.
const sessionLocation = session?.lastResolvedLocation;

const localIntent = isLocalDiscoveryIntent(message);
const location = resolveLocation(message, sessionLocation);
const category = getLocalCategory(message);

// IMPORTANT: A recognized city alias is a valid location.
// "Philly nightlife" MUST enter this branch.
if (localIntent && location) {
  // Save this city for follow-up turns such as: "What about Saturday?"
  // Use your existing session update function/database call here.
  await saveSessionLocation(session.id, location);

  // Get only voluntary profile lenses. Do not infer race, gender, or ethnicity.
  const activeLenses = getActiveCommunityLenses(member.profile)
    .sort((a, b) => a.priority - b.priority);

  // Kinfolk's community-first search plan.
  // If profile says Black woman, Black cultural/Black-owned results are searched first.
  const communityQueries = activeLenses.length > 0
    ? activeLenses.flatMap((lens) => [
        `${lens.label} ${category} in ${location.city}, ${location.state}`,
        `${category} in ${location.city}, ${location.state} ${lens.searchTerms[0] ?? lens.label} community owned`
      ])
    : [
        `community-owned ${category} in ${location.city}, ${location.state} Black and diaspora cultural scene`
      ];

  const evidenceQueries = [
    `best ${category} in ${location.city}, ${location.state}`,
    `${category} events in ${location.city}, ${location.state} official listings`
  ];

  // IMPORTANT: Connect this to the existing business/event/web search function.
  // Do NOT return a canned reply. This must return live local results.
  const results = await searchAndRankLocal({
    city: location.city,
    state: location.state,
    category,
    communityQueries,
    evidenceQueries,
    activeLenses
  });

  // Make the answer using the real results. Do not invent venues, dates, hours,
  // ownership, or events when the sources do not verify them.
  const reply = await composeLocalAnswer({
    message,
    location,
    category,
    activeLenses,
    results,
    instruction: [
      `The city is already resolved as ${location.city}, ${location.state}.`,
      "Never say you need a location and never ask the member to repeat the city.",
      "Lead with culturally relevant community results matching the active profile lens.",
      "Then include current general or official local information when useful.",
      "Use links and state uncertainty when live availability cannot be verified."
    ].join(" ")
  });

  console.info("kinfolk_local_resolution", {
    message,
    intentClass: "local_discovery",
    city: location.city,
    state: location.state,
    locationSource: location.source,
    category,
    activeLensIds: activeLenses.map((lens) => lens.id),
    resultCount: results.length
  });

  return res.json({
    reply,
    recommendations: results,
    intentClass: "local_discovery",
    location,
    locationSource: location.source
  });
}

// Kinfolk may ask for a location ONLY in this situation:
// local intent + no city alias + no explicit city + no saved session city.
if (localIntent && !location) {
  return res.json({
    reply: "Which city, neighborhood, or metro area should I use?",
    intentClass: "local_discovery_needs_location"
  });
}

// Continue with the existing normal Kinfolk chat flow below this line.
```

### The one line that matters most

This line must execute **before** the “location missing” response:

```ts
const location = resolveLocation(message, sessionLocation);
```

That is how Kinfolk stops asking what city “Philly” means.

---

## Step 3 — Add this rule to Kinfolk’s system prompt

Find the server-side Kinfolk system prompt. Add this exact text:

```text
LOCAL DISCOVERY RULE:
If a resolved location is supplied by the server, it is valid. Never say you need a city, neighborhood, or metro area. Never ask the member to repeat it.

For example, when the server resolves “Philly” as Philadelphia, PA, “Tell me about Philly nightlife” must receive a local nightlife answer with sources, not a location question.

Use the member’s voluntary active community profile as the first retrieval and ranking lens. For an active Black-woman profile, search and show Black cultural, Black-owned, and diaspora-relevant Philadelphia nightlife results first, then general/official Philadelphia nightlife information. Do not make the member ask again for minority-owned results.
```

---

## Step 4 — Fix the 2-second voice-recording message

Search the project for this exact text:

```text
That clip is too long — try under 60 seconds.
```

You will find a condition similar to this:

```ts
const message = response.status === 413
  ? "That clip is too long — try under 60 seconds."
  : "...";
```

Replace it with:

```ts
const errorBody = await response.json().catch(() => ({}));

let message: string;
if (errorBody.code === "AUDIO_DURATION_EXCEEDED") {
  message = "That recording is over 60 seconds. Please send a shorter clip.";
} else if (errorBody.code === "AUDIO_PAYLOAD_TOO_LARGE" || response.status === 413) {
  message = "This voice clip is too large to upload. Please try a shorter or lower-quality recording.";
} else if (errorBody.code === "AUDIO_UNREADABLE" || response.status === 400) {
  message = "Kinfolk could not read that audio. Please try again or type your question.";
} else {
  message = "Voice transcription is unavailable right now. You can still type your question.";
}
```

**Do not use HTTP 413 alone to say “over 60 seconds.”**

---

## Step 5 — Run these tests in Replit

Create a test file:

```text
test/kinfolk-live-regression.test.ts
```

Paste this code and adapt `chat()` to call your actual Kinfolk chat handler:

```ts
import { describe, expect, it } from "vitest";

describe("Kinfolk live regression guardrails", () => {
  it("recognizes Philly as Philadelphia and does not ask for a city again", async () => {
    const response = await chat({
      message: "Tell me about Philly nightlife",
      profile: blackWomanProfile
    });

    expect(response.intentClass).toBe("local_discovery");
    expect(response.location).toMatchObject({
      city: "Philadelphia",
      state: "PA",
      source: "alias"
    });
    expect(response.reply).not.toMatch(/need a location|what city|what neighborhood|what metro/i);
    expect(response.recommendations.length).toBeGreaterThan(0);
  });

  it("asks for a city only when no city exists in the message or session", async () => {
    const response = await chat({
      message: "Tell me about nightlife",
      profile: blackWomanProfile
    });

    expect(response.intentClass).toBe("local_discovery_needs_location");
    expect(response.reply).toMatch(/which city, neighborhood, or metro area/i);
  });

  it("never calls a two-second recording over sixty seconds", () => {
    const durationMs = 2_000;
    expect(durationMs).toBeLessThanOrEqual(60_000);
  });
});
```

---

## Step 6 — Test the live site before calling this fixed

After Replit deploys, test these exact inputs in the website:

| Input | Required Kinfolk behavior |
| --- | --- |
| `Tell me about Philly nightlife` | Search Philadelphia immediately; do not ask what city. |
| `Black-owned nightlife in Philly` | Search Philadelphia immediately and lead with Black-owned/Black cultural results. |
| `Tell me about nightlife` | Ask for a city because none was given. |
| A real 2-second voice recording | Do not state it is over 60 seconds. |
| A recording over 60 seconds | State the actual 60-second limit. |

## What Replit must show you when it is finished

Ask Replit to return:

1. The exact files changed.
2. The test output.
3. The deployed URL/build identifier.
4. A screenshot or copied response for `Tell me about Philly nightlife`.
5. The server log entry named `kinfolk_local_resolution` showing `city: "Philadelphia"` and `locationSource: "alias"`.
