# Mapping With Melanin™ — Library Build Specification v2 (Revised)
**Prepared by:** Manus AI
**Date:** August 11, 2026
**Status:** Approved for Implementation

This document revises the previous Library build specification to align with the current live state of the platform, resolving naming collisions and answering the engineering team's architectural questions. 

---

## 1. Architectural Decisions & Naming Resolution

Based on the engineering review of the initial spec, the following decisions have been finalized to ensure a clean build without disrupting existing functionality:

### Naming Collision Resolved
The platform currently uses the term **"Book"** for curated editorial collections (e.g., the existing 34 curated Books like "Maternal Health"). 
- **Decision:** The new AI-generated dynamic content will be called **"Knowledge Threads"** (and "Sub-threads").
- This preserves the integrity of the existing editorial Books while clearly distinguishing the dynamic, user-generated AI explorations.

### RAG Source Grounding Approach
Implementing true RAG (live URL fetching and embedding) represents a massive infrastructure shift.
- **Decision:** We will use **System Prompt Grounding** for this phase. The authoritative sources researched (BWHI, BlackPast, Andscape, etc.) will be injected directly into the KinfolkAI system prompt as authoritative context. Full live-fetching RAG is deferred to a future roadmap phase.

### AI-Generated Content Storage & Retention
Storing every dynamically generated Knowledge Thread permanently would lead to unbounded database growth.
- **Decision:** Knowledge Threads will be ephemeral by default (stored in session state or a temporary cache table with a 30-day TTL). Only Threads explicitly "Saved" by the user will be persisted permanently to their profile.

---

## 2. Phased Implementation Plan

To minimize risk and deliver immediate value, the Replit team is instructed to execute this build in two distinct phases. **Phase A is authorized for immediate implementation.**

### Phase A: Data Cleanup & Cross-Pollination (Immediate)
This phase introduces no new UI and carries zero risk to the existing curated Book structure.

1. **Topic Deduplication:**
   - Write a migration script to merge duplicate topics in the existing database.
   - Example: Merge the three "Diabetes" entries into one primary entry.
   - Merge the two "Sickle Cell Disease" entries.
   - Merge the two "Fertility" entries.
   - Ensure all foreign key relations (e.g., `user_issue_follows`) are updated to point to the surviving primary topic ID before dropping the duplicates.

2. **Cross-Pollination Sync (`user_library_interests`):**
   - Create the `user_library_interests` table to track when a user saves or follows a topic (e.g., "Ethiopia").
   - Update the KinfolkAI context injection logic: When a user interacts with KinfolkAI in the `/travel` or `/businesses` modules, query their `user_library_interests`.
   - Inject this context into the prompt: *"The user is interested in: [List]. Proactively suggest relevant businesses or events if applicable to their query."*

### Phase B: The "Living Library" (Knowledge Threads)
This phase introduces the dynamic AI generation flow alongside the existing curated Books.

1. **Database Schema Additions:**
   ```sql
   -- Represents a dynamically generated exploration saved by the user
   CREATE TABLE knowledge_threads (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     topic_name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     last_updated TIMESTAMP DEFAULT NOW()
   );

   -- Represents the conversational branches within a thread
   CREATE TABLE thread_branches (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     thread_id UUID REFERENCES knowledge_threads(id) ON DELETE CASCADE,
     title VARCHAR(255) NOT NULL,
     content TEXT NOT NULL,
     parent_branch_id UUID REFERENCES thread_branches(id),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Dynamic Generation Endpoint (`POST /api/library/generate-thread`):**
   - **Input:** `topic`, `user_profile` (gender, location, ethnicity).
   - **System Prompt Injection:** Use the curated sources to ground the response. Example: *"You are Kinfolk. Generate a comprehensive overview of [Topic]. Tailor the context for a [User Demographic] living in [User Location]. Base your knowledge on authoritative sources like [Source List]."*

3. **Front-End Integration:**
   - Ensure the new "Knowledge Threads" UI lives alongside, not replacing, the existing curated "Books" panel (which currently shows "We're building this Book" and "Add Community Evidence").
   - Add a "Start a Knowledge Thread with Kinfolk" CTA below the curated Book content.

---

## 3. Curated Source Grounding List (For System Prompts)

The following sources have been researched and verified. Inject these domains into the KinfolkAI system prompt to ground its knowledge base across the diaspora.

**Health, Wellness & Maternal Care**
- Black Women's Health Imperative (bwhi.org)
- Black Mamas Matter Alliance (blackmamasmatter.org)
- The Loveland Foundation (thelovelandfoundation.org)
- BEAM (beam.community)

**Global Diaspora, History & Politics**
- BlackPast.org (blackpast.org)
- African Union (au.int)
- Caribbean Community (caricom.org)
- Migration Policy Institute (migrationpolicy.org)

**Culture, Art & Sports**
- Andscape (andscape.com)
- Confédération Africaine de Football (cafonline.com)
- Black Cultural Archives (blackculturalarchives.org)

**Business & Economics**
- U.S. Black Chambers Inc. (usblackchambers.org)
- Urban Institute - Racial Wealth Divide (urban.org)

---

## 4. Strict No-Touch Guardrails

**⚠️ CRITICAL INSTRUCTION FOR REPLIT:** 
This build is strictly isolated to the `/library` route and the `KinfolkAI` context injection. 

**DO NOT touch, alter, or refactor:**
- The authentication system (`/login`, session cookies, password reset flows)
- The Business Directory (`/businesses`) or Map (`/map`) rendering logic
- The Safety Hub (`/safety`) or Marketplace (`/marketplace`)
- The existing curated "Books" UI panel and "Add Community Evidence" functionality.
