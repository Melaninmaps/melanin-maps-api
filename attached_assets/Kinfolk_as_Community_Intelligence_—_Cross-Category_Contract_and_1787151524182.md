# Kinfolk as Community Intelligence — Cross-Category Contract and Preview Refinement

**Status:** Product and preview-content specification only. No current preview panel, route, source, animation, mobile build, API, or deployment has been changed.

## The answer to the ATL rappers question

We cannot truthfully identify the exact internal search query from the screenshot alone; that requires the request log, Kinfolk retrieval telemetry, and the provider/search trace for that specific turn. What the visible response **does** prove is that the relevant music-intelligence path did not control the turn. Kinfolk produced a general cultural answer, then the generic guide/recommendation system took over and surfaced unrelated food and bookstore cards.

The presence of a “Searching Atlanta, GA” label does **not** prove that Kinfolk searched for Atlanta music, underground artists, events, or music venues. The result content is the opposite signal: the system either did not use a music-specific search/retrieval plan or allowed generic city-guide results to overwrite it. That is the behavior the new music patch blocks.

Kinfolk can responsibly give an immediate, ordinary answer about widely known artists associated with Atlanta or the metro scene. It must qualify birthplace, upbringing, and scene association accurately when the distinction matters. It should **not** pretend that it already knows every underground artist, every current event, or every active club. Those facts are local, fast-changing, and often under-documented.

That limitation is not a weakness when Kinfolk handles it correctly. The right behavior is to give the useful answer first, then offer a choice to explore deeper. Once the member selects a music path, Kinfolk can draw from three distinct, clearly labeled sources of intelligence.

| Information layer | What Kinfolk may do | How it should be labeled |
|---|---|---|
| **Research-backed knowledge** | Answer durable cultural, historical, educational, or factual questions using its research and Living Library sources. | `Sources available` when citations are shown; no boilerplate disclaimer when a general answer is appropriate. |
| **Current local intelligence** | Retrieve city-specific events, venues, openings, availability, pricing, or schedules after the member chooses that path. | `Current details can change. Confirm with the organizer or source.` as a small footer only when material. |
| **Community-sourced intelligence** | Surface moderated contributions, recommendations, cultural context, and under-covered places or artists shared by members and cultural ambassadors. | `Community-Sourced` with a signal/count or moderation status where appropriate. |

For underground artists, Kinfolk should say what it knows without inventing names. If verified local data is thin, that is a **coverage opportunity**, not a reason to produce irrelevant businesses or claim an area has nothing of value. Kinfolk can offer “Explore community-sourced artists” or “Share an artist/event,” with every contribution moderated before it changes recommendations. Over time, those approved community contributions, cited research results, and verified local resources make the music path stronger for the next person.

> **Kinfolk’s promise is not that it knows everything immediately. Its promise is that it answers what you asked, knows what it does not know, and gives you a relevant way to go deeper without forcing an agenda.**

## This is the same logic across every category

The music correction is an example of a platform rule, not a special music feature. Kinfolk must apply the same sequence to cultural, practical, professional, local, and informational questions.

### The reusable Kinfolk intelligence sequence

| Step | Kinfolk must do | Kinfolk must not do |
|---|---|---|
| **1. Understand the question** | Identify the subject, member intent, location supplied, whether the answer is durable or time-sensitive, and whether the topic is high-stakes. | Assume every question is a request to buy, book, visit, or browse businesses. |
| **2. Resolve only necessary ambiguity** | Ask one small clarifying question only when the core noun has materially different meanings, such as “ATL market pricing” meaning housing, groceries, art, or retail. | Ask for information the member already supplied, such as a city already present in the question. |
| **3. Answer first** | Give a concise, useful, culturally aware answer to the actual question. | Lead with a disclaimer, a business list, or a promotional guide. |
| **4. Offer relevant paths** | Show 2–4 optional next steps tied exactly to the topic. | Preload results or force one type of next step. |
| **5. Retrieve only after choice** | Search the correct source set: current events, verified local resources, Living Library, or Community-Sourced signals. | Fall back to nationwide or unrelated local listings and label them as relevant. |
| **6. Explain currency and source limits quietly** | Use a small footer only for material live-detail uncertainty or high-stakes context. | Append “I could not verify…” to ordinary cultural, art, music, history, or general-information answers. |
| **7. Strengthen the community memory** | Store reusable cited research in the Living Library; aggregate moderated community signals and coverage gaps without exposing private member information. | Treat a single unverified comment as fact or publish a member submission without moderation. |

### How that looks in the examples you named

| Member question | Direct answer first | Optional relevant paths, only after the answer | Data and community-growth rule |
|---|---|---|---|
| **“What rappers are from ATL?”** | A concise answer about artists connected to Atlanta/metro hip-hop, with truthful wording about association. | `See local music events` · `Explore music venues & underground clubs` · `Learn more about these artists` · `Not right now` | Use research-backed artist context; retrieve events/venues only after selection; grow an underground-artist record through moderated Community-Sourced contributions. |
| **“What is ATL market pricing?”** | If “market” is ambiguous, ask one clarification: `Do you mean housing, grocery, art, or retail pricing?` If the member specifies housing, explain the general market context with dated/cited information. | For housing: `See neighborhood trends` · `Explore homebuyer resources` · `Find local housing support` · `Not right now` | Price information must carry an as-of date/source where live data matters; do not turn a market question into a generic realtor/business list. |
| **“What is the ATL art scene like?”** | A concise overview of Atlanta’s art ecosystem, neighborhoods, and cultural significance, grounded in available research. | `See current art events` · `Explore galleries, studios & art walks` · `Learn about local artists` · `Not right now` | Event information is current/local; artists, collectives, murals, and lesser-known spaces can grow through moderated Community-Sourced and Cultural Ambassador contributions. |
| **“How do I handle an eviction notice?”** | Plain-language general information, urgent deadline awareness, and specific legal-context limits. | `Prepare questions and documents` · `See local legal-aid options` · `Learn tenant rights for my area` · `Not right now` | High-stakes disclaimer remains short and specific; professional/local results stay consent-gated. |
| **“My hair has been thinning—what should I consider?”** | Respectful general education and a balanced next-step frame, without diagnosis. | `Understand the basics` · `Prepare for a care visit` · `Explore supportive hair care` · `Not right now` | Combine sourced health information, optional local professionals, and community-informed hair support only after consent. |

## How Kinfolk gets there technically

The existing music patch supplies the first reusable slice: **intent → direct answer → optional topic-specific chooser → consent-gated retrieval → small material-only source note → no generic fallback**. The same contract should become the shared Kinfolk orchestration layer for every domain.

The next implementation should not be a collection of unrelated special cases. It should use a shared intent contract with domain-specific policies.

```text
Member question
  → intent + topic + location + freshness + risk classification
  → direct-answer policy
  → optional exploration policy
  → selected-path retrieval policy
  → source/currency note policy
  → reusable Living Library + moderated Community-Sourced learning signal
```

| Shared contract field | Purpose |
|---|---|
| `topic` | Music, arts, housing, health, legal, education, travel, food, and so forth. |
| `requestType` | General knowledge, current event, local discovery, professional help, price/trend, artist/place detail, or community context. |
| `locationState` | Provided, inferred from a recognized local phrase, optional, or truly needed. |
| `freshnessNeed` | Durable, current, or live. Determines whether an as-of/source footer is material. |
| `riskLevel` | Ordinary, decision-support, or high-stakes. Determines required safeguards. |
| `answerPolicy` | The direct answer template, source expectations, and tone. |
| `explorationOptions` | Only the 2–4 paths appropriate to this precise topic and request. |
| `retrievalPolicy` | The only allowed sources/categories after a member chooses a path. |
| `learningDestination` | Living Library topic, moderated Community-Sourced signal, coverage-gap record, or no storage. |

The system should learn at the **aggregate** level. For example, repeated interest in underground Atlanta artists may create a moderated coverage-gap signal for cultural ambassadors and community submissions. It must not silently treat individual chat messages as public endorsements, publish a person’s location, or make recommendations from unmoderated claims.

## Preview refinement — show Kinfolk as the community-intelligence companion

Do **not** add a third Kinfolk panel or redesign the approved preview. Refine the already-drafted additive **Kinfolk AI** panel so it demonstrates this broader community-intelligence promise instead of centering a medical example. The Living Library panel remains the separate demonstration of durable, cited knowledge. The Kinfolk panel demonstrates how a question becomes the right next step in the community.

### Revised additive Kinfolk panel

**Card headline:** **Ask What Matters. Find Your Way In.**  
**Supporting copy:** *Kinfolk answers the question, then opens the right door into your community—only if you want it.*  
**CTA:** `This is me →`  
**Selected-state label:** `Kinfolk AI`

The phone header uses a polished gold-outline **conversation bubble with a small compass point**. The three content-area icons are subject-specific polished gold-outline icons: a microphone for music, a ticket for events, and a map pin for local discovery. The feather remains a brand-level accent only.

| 3.5-second demonstration | Exact phone copy | What the visitor understands |
|---|---|---|
| **Slide 1 — Kinfolk answers the actual question** | **Member:** `What rappers are from ATL?`  **Kinfolk:** `Atlanta and the wider metro scene have been central to hip-hop for decades. Artists commonly connected to the scene include OutKast, T.I., Ludacris, 2 Chainz, Future, Young Thug, Lil Baby, and 21 Savage.` | Kinfolk can answer ordinary cultural questions directly. It is not waiting for a medical issue or trying to sell something. |
| **Slide 2 — Kinfolk offers the right doors, not a sales list** | **Prompt:** `Would you like to explore more of ATL music?`  **Options:** `Local music events` · `Music venues & underground clubs` · `Learn about these artists` · `Not right now` | The member stays in control. Kinfolk knows the next useful possibilities but does not preload unrelated businesses. |
| **Slide 3 — The community makes the answer richer** | **Header:** `ATL Music, from the community`  **Tile 1:** `Community-Sourced: local music event`  **Tile 2:** `Research-backed: artist context`  **Tile 3:** `Coverage gap: help us surface more underground artists`  **Footer:** `Community Intelligence grows when we share what matters.` | Questions can lead to trusted local discovery and a stronger shared record for the next member, without explaining the technical flywheel. |

No actual named event, club, artist, or business should appear in the preview unless it is verified at the time the panel is implemented. The preview should demonstrate the **interaction pattern**, not invent live inventory.

## Owner-safe next implementation sequence

1. Apply the already-prepared music patch only after its narrow source scope and acceptance tests are approved.
2. Observe the public exact-question output and confirm the generic guide has stopped.
3. Build the cross-category intent contract as a **separate** owner-approved phase; do not broaden the music patch into every domain at once.
4. Only after the Kinfolk behavior is verified should the drafted Kinfolk preview panel be updated. That is a separate preview-only change with the existing preview scope lock.

This sequence gives you a crisp public story because the preview is demonstrating behavior that has first been made real.
