# Mapping With Melanin™ — KinfolkAI Learning Architecture Brief
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Priority:** High — This brief supersedes the RAG grounding approach in Library Build Spec v2.

---

## The Core Principle

The MWM Library is not a static content repository. It is **KinfolkAI's growing brain.** Every search a user performs, every topic they follow, and every Knowledge Thread they generate feeds back into the Library as structured knowledge. KinfolkAI learns from the Library, and the Library grows from KinfolkAI. They are the same system.

---

## How the Learning Loop Works

The architecture has three interconnected layers:

**Layer 1 — The Search:** A user asks Kinfolk something (e.g., "I'm a Black woman in New Mexico dealing with infertility"). Kinfolk does not just answer from its training data. It actively searches across reputable external sources to find the most current, relevant information.

**Layer 2 — The Library Write-Back:** The results of that search are not discarded. They are structured and written back into the Library as a new topic, chapter, or sub-chapter — tagged with the sources used, the date retrieved, and the user's demographic context. The Library grows with every meaningful search.

**Layer 3 — Applied Logic on the Next Search:** When the next user (or the same user) searches a related topic, Kinfolk does not start from zero. It first queries the Library for what has already been learned, uses that as a foundation, and then searches for anything new or contradictory. Over time, Kinfolk becomes smarter on every topic the community cares about — and the Library becomes a living, community-sourced knowledge base.

---

## What "Search Across Any Reputable Platform" Means

Kinfolk should be built with a **web search tool** integrated into its reasoning loop. This is distinct from RAG (which pre-embeds static documents). The behavior should be:

1. User asks a question.
2. Kinfolk evaluates whether its Library already has strong, recent knowledge on this topic.
3. If the Library knowledge is thin or outdated, Kinfolk triggers a live web search, prioritizing the curated source list (bwhi.org, blackpast.org, andscape.com, etc.) but not limited to them.
4. Kinfolk synthesizes the search results with its existing Library knowledge and the user's profile context.
5. Kinfolk responds to the user with a culturally tailored answer.
6. The synthesized knowledge is written back to the Library as a new or expanded chapter, attributed to its sources.

---

## Applied Logic — The "Learn as It Goes" Requirement

The phrase "apply logic to the next search" means Kinfolk must maintain **topic memory** across searches, not just session memory. Concretely:

When a user searches "infertility" and Kinfolk learns that Black women in the Southwest face specific barriers to IVF access (e.g., fewer fertility clinics, insurance gaps in New Mexico), that finding is stored in the Library under the "Infertility" topic with a geographic tag. The next time any user asks about infertility in the Southwest, Kinfolk already knows this context and leads with it — it does not re-discover it from scratch.

This is the difference between a chatbot and a living knowledge system.

---

## Implementation Instructions for Replit

### Step 1 — Equip Kinfolk with a Web Search Tool
Integrate a web search capability into the KinfolkAI backend. The recommended approach is to use the OpenAI function-calling API with a search tool (e.g., Bing Search API, Brave Search API, or Serper.dev). The tool should be called automatically when Kinfolk determines its Library knowledge is insufficient.

```javascript
// Example tool definition for the LLM
{
  "name": "search_web",
  "description": "Search the web for current, authoritative information on a topic. Use this when the Library does not have sufficient knowledge. Prioritize sources from the MWM approved source list.",
  "parameters": {
    "query": "string — the search query",
    "source_preference": "array — preferred domains to prioritize (e.g. ['bwhi.org', 'blackpast.org'])"
  }
}
```

### Step 2 — Build the Library Write-Back Pipeline
After every KinfolkAI response that used a web search, run a background job that:
1. Extracts the key facts, statistics, and sources from the response.
2. Checks the Library for an existing topic that matches.
3. If a match exists: appends the new information as a new sub-chapter with a timestamp and source attribution.
4. If no match exists: creates a new Library topic with the synthesized content.

This write-back should be asynchronous (non-blocking) so it does not slow down the user's experience.

### Step 3 — Build the Library Read-First Lookup
Before Kinfolk calls the web search tool, it must first query the Library:

```javascript
// Pseudocode for Kinfolk's reasoning loop
async function generateResponse(userQuery, userProfile) {
  // 1. Check the Library first
  const libraryKnowledge = await searchLibrary(userQuery, userProfile.location, userProfile.demographics);
  
  // 2. Evaluate freshness and completeness
  if (libraryKnowledge.isComplete && libraryKnowledge.isRecent) {
    return synthesize(libraryKnowledge, userProfile);
  }
  
  // 3. Supplement with live web search
  const webResults = await searchWeb(userQuery, PREFERRED_SOURCES);
  
  // 4. Synthesize and respond
  const response = await synthesize(libraryKnowledge, webResults, userProfile);
  
  // 5. Write new knowledge back to Library (async, non-blocking)
  writeBackToLibrary(userQuery, response, webResults).catch(console.error);
  
  return response;
}
```

### Step 4 — Geographic & Demographic Tagging
Every Library entry written by Kinfolk must be tagged with the demographic context that generated it. This enables the "Black woman in New Mexico vs. Asian woman in NJ" differentiation. The tags are:
- `location_state` (e.g., "New Mexico")
- `location_city` (optional)
- `demographic_context` (derived from user profile, never stored as PII — only used as a content tag)
- `source_urls` (array of URLs used)
- `retrieved_at` (timestamp)

---

## What This Is NOT

To be clear for the engineering team: this is **not** a simple chatbot with memory. It is a knowledge graph that grows with community use. The Library is the long-term memory store. KinfolkAI is the reasoning engine that reads from and writes to that store. Every user who searches a topic makes the experience better for the next user who searches the same topic.

---

## No-Touch Guardrails (Unchanged)

**DO NOT touch, alter, or refactor:**
- The authentication system (`/login`, session cookies, password reset flows)
- The Business Directory (`/businesses`) or Map (`/map`) rendering logic
- The Safety Hub (`/safety`) or Marketplace (`/marketplace`)
- The existing curated "Books" UI panel and "Add Community Evidence" functionality
