# Copy and paste this entire prompt to Replit

```text
OWNER-APPROVED FUTURE BUILD — KINFOLK → LIBRARY DIRECT TOPIC HANDOFF

## Product requirement

KinfolkAI is the front door to Mapping With Melanin. When a member asks Kinfolk to **“tell me more,” “show me more,” “show sources,” “open that topic,”** or otherwise asks to learn more about a topic the Library already contains, Kinfolk must take the member directly to the correct **existing MWM Library Book** with the topic panel already open.

Kinfolk must not merely explain that the Library exists, give a generic URL, or send the member away from the platform. The handoff must preserve the conversation and open the exact topic.

Example:

```text
Member: “Tell me more about African Diaspora History.”
Kinfolk: “Opening African Diaspora History in the Library.”
Result: /library?topic=fbfbc161-5121-4eca-a0a4-c35731b010f6&focus=overview&from=kinfolk
```

The Library loads the topic panel for `African Diaspora History` automatically. If the member says “Show sources for that,” the same topic opens with the evidence/source section in focus.

This is a future interoperability build. Do not include it in the current capacity or Library data-seeding emergency release unless the owner explicitly re-approves it as a separate deployment.

## Strict no-touch boundary

Touch only:

1. Kinfolk’s server-side optional navigation-action contract;
2. the Library route/topic-panel deep-link behavior;
3. focused client rendering for a Kinfolk-to-Library action;
4. focused tests, safe telemetry, and feature-flag configuration.

Do not change:

- Kinfolk model, prompt personality, source standards, chat architecture, provider configuration, or capacity behavior;
- Library evidence data, source seeding, topic descriptions, source ranking, or contribution policy;
- login/authentication, Map, business pages, Safety Hub, Circles, community, mobile, or any unrelated feature;
- Library visual design except the minimal state needed to open an existing selected topic;
- user privacy rules, analytics choices, or sensitive-topic protections.

## Server-side contract

Extend the existing Kinfolk chat response with an optional structured action. Do not parse navigation instructions from assistant prose in the client.

```ts
type LibraryNavigationAction = {
  type: "library_topic_open";
  label: string;
  topic: {
    id: string; // canonical published knowledge_nodes ID
    name: string;
    focus: "overview" | "evidence" | "related";
  };
  destination: string; // canonical internal path only
  confidence: "high";
};

// Add only as an optional backward-compatible field.
type KinfolkChatResponse = {
  response: string;
  intentClass: string;
  provenanceNote?: string;
  sources: Source[];
  navigationActions?: LibraryNavigationAction[];
};
```

Example response payload:

```json
{
  "response": "Opening African Diaspora History in the Library.",
  "intentClass": "culture_entertainment",
  "sources": [],
  "navigationActions": [
    {
      "type": "library_topic_open",
      "label": "Open African Diaspora History",
      "topic": {
        "id": "fbfbc161-5121-4eca-a0a4-c35731b010f6",
        "name": "African Diaspora History",
        "focus": "overview"
      },
      "destination": "/library?topic=fbfbc161-5121-4eca-a0a4-c35731b010f6&focus=overview&from=kinfolk",
      "confidence": "high"
    }
  ]
}
```

## Resolution rules

1. Detect explicit navigation/learning intent: “tell me more,” “show me more,” “open,” “show sources,” “read more,” “take me to the Library,” or an equivalent unambiguous member request.
2. Resolve a topic only through the canonical MWM knowledge graph/topic search. The LLM may propose a name but must never invent a topic ID or URL.
3. Resolve in this order:
   - explicitly named published topic;
   - canonical name, approved synonym, or exact title match;
   - a unique high-confidence topic/entity reference in the current private chat session;
   - one concise clarification if multiple plausible topics exist.
4. Create `library_topic_open` only if exactly one published canonical topic is resolved at high confidence.
5. If no published Library topic exists, do not invent a Book or deep link. Offer a normal Library search action or a concise explanation that the topic has not been built yet.
6. If a topic has zero verified evidence, still open the genuine existing topic panel, but do not imply that sources exist. The Library evidence seed is responsible for filling it truthfully.

## Client navigation behavior

### Canonical route

Use this internal route format only:

```text
/library?topic=:knowledgeNodeId&focus=overview|evidence|related&from=kinfolk
```

### Library requirements

When `/library` receives a valid `topic` query parameter:

1. Fetch the topic’s existing graph by canonical ID.
2. Open the right-side Library topic panel automatically after data loads.
3. Display the selected topic name, description, sources, relationships, and existing Library controls exactly as if the member had clicked it manually.
4. Honor `focus`:
   - `overview`: top of the selected topic panel;
   - `evidence`: verified source section after it renders;
   - `related`: related Books/relationships section.
5. Preserve normal category browsing and search behavior.
6. Show a visible “Back to Kinfolk” control or preserve browser history so the member returns to the same conversation.
7. If the ID is invalid, unpublished, or not accessible, show a safe in-Library not-found state; never crash and never expose internal IDs or error details.

### Kinfolk client requirements

1. For an explicit direct request with high confidence, record the assistant response then automatically navigate to the `destination` in the structured action.
2. For ambiguous/medium-confidence intent, present a single clear action chip instead of auto-navigating.
3. Never navigate based on a text string alone. The client must use only server-provided structured action data.
4. Retain the current chat session in browser history/state. Do not create a new session just because the member opened Library.
5. Do not log raw member queries into route parameters, analytics, or referrer data.

## Privacy and safety rules

1. Do not create a Library navigation action from a sensitive health, HIV, fertility, divorce, legal, financial, relationship, or safety query unless the member explicitly asks to open that topic in that same private chat.
2. Never disclose that a member arrived from a sensitive Kinfolk conversation to a business, circle, group, community feed, or external analytics destination.
3. Strip `from=kinfolk` context from sensitive analytics. At most record a member-approved, non-sensitive action class such as `library_topic_open`.
4. Respect existing age, tier, group, and access controls before rendering an action.

## Feature flag and rollout

Implement behind a disabled-by-default feature flag named:

```text
kinfolk_library_navigation
```

Roll out in this order:

1. internal/admin verification;
2. founding testers only;
3. broader web release only after manual and automated verification pass.

Do not enable it for all members in the same release that introduces the feature.

## Required tests

1. “Tell me more about African Diaspora History” returns exactly one `library_topic_open` action with topic ID `fbfbc161-5121-4eca-a0a4-c35731b010f6`.
2. Opening the returned destination opens African Diaspora History in the Library panel after a hard refresh.
3. “Show sources for that” uses `focus=evidence` and focuses the source/evidence area after the panel loads.
4. A unique synonym resolves to the correct canonical topic ID.
5. An ambiguous topic name produces clarification/choices, not an invented navigation action.
6. A nonexistent topic produces no canonical deep link and does not crash Library.
7. Existing normal Kinfolk chat remains unchanged when no navigation intent is present.
8. A sensitive query does not emit a navigation action without explicit same-conversation member direction.
9. Existing Library browse/search, Follow, Share, and Add Community Evidence interactions remain unchanged.
10. Existing Kinfolk legal-routing, cultural-routing, preference, and capacity tests remain green.

## Required proof back to the owner and Manus

Return:

1. exact source files changed;
2. feature flag name and default state;
3. unit/integration test results;
4. one logged-in browser recording or screenshots showing the request, structured action, automatic route change, and pre-opened Library topic;
5. a hard-refresh proof that the direct URL still opens the correct Library panel;
6. privacy test evidence showing no sensitive query is placed in a route, analytics payload, or public context;
7. confirmation that no unrelated platform feature changed.

Do not begin implementation until the full Library evidence data job is independently verified or the owner explicitly prioritizes this feature ahead of it.
```
