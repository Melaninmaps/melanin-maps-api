# Mapping With Melanin™ — Library Build Specification & Content Audit
**Prepared by:** Manus AI
**Date:** August 11, 2026

This document contains the complete audit of the existing MWM Library, the expanded taxonomy for the "Living Library," a curated list of reputable sources for AI grounding, and the exact build specifications for the Replit engineering team.

---

## Part 1: Current Library Audit & Gaps

### Existing Structure
The current Library (`/library`) features three tabs: **Feed**, **Browse Topics**, and **Happening Now**. 
The "Browse Topics" view contains 11 categories and 286 topics:
- **Business** (2 topics)
- **Careers & Professional** (4 topics)
- **Community** (6 topics)
- **Culture & Community** (7 topics)
- **Divine Nine** (9 topics)
- **Education** (3 topics)
- **Faith & Spirituality** (12 topics)
- **Health** (28 topics) — *Excellent depth, includes IVF, Uterine Fibroids, Maternal Health, Sickle Cell.*
- **History** (2 topics)
- **Places** (167 topics)
- **Travel** (52 topics)

### Identified Gaps & Data Issues
1. **Empty Content State:** The library currently shows "Articles coming soon." The UI allows users to "Follow" topics, but clicking into them does not yield content.
2. **Duplicate Topics:** The database contains duplicates (e.g., *Diabetes* appears 3 times, *Sickle Cell Disease* twice, *Fertility* twice).
3. **Missing Categories:** Sports, International Politics, African/Caribbean Economics, and granular Diaspora/Immigration topics are underrepresented.

---

## Part 2: The "Living Library" Vision

The MWM Library will transition from a static article repository into a **Living Library** powered by KinfolkAI. 

### Core Concepts
1. **Dynamic "Books" and "Chapters":** When a user searches for a topic (e.g., "Infertility" or "Ethiopia"), the Library dynamically generates a "Book." The AI determines what sub-chapters are relevant based on the user's demographic profile (e.g., tailoring medical stats for a Black woman in New Mexico vs. an Asian woman in New Jersey).
2. **Branching & Growth:** Users can ask follow-up questions, which automatically generate new "Sub-chapters" appended to the Book.
3. **Cross-Pollination:** If a user saves "Ethiopia" in the Library, KinfolkAI will subsequently suggest Ethiopian-owned businesses, restaurants, or cultural events in the `Businesses` and `Travel` modules.

---

## Part 3: Reputable Source Grounding

To prevent AI hallucinations, KinfolkAI must be grounded via RAG (Retrieval-Augmented Generation) using authoritative sources. Replit must configure the AI to prioritize these domains:

### 1. Health, Wellness & Maternal Care
*Grounding for: IVF, Fibroids, Endometriosis, PCOS, Maternal Mortality, Mental Health*
- **Black Women's Health Imperative:** bwhi.org
- **Black Mamas Matter Alliance:** blackmamasmatter.org
- **The Loveland Foundation (Mental Health):** thelovelandfoundation.org
- **BEAM (Black Emotional and Mental Health Collective):** beam.community
- **Office of Minority Health (HHS):** minorityhealth.hhs.gov

### 2. Global Diaspora, History & Politics
*Grounding for: African nations, Caribbean history, Immigration, Pan-Africanism*
- **BlackPast.org:** blackpast.org (Comprehensive global African history)
- **African Union:** au.int (Official continental policy and news)
- **Caribbean Community (CARICOM):** caricom.org (Regional integration and data)
- **Migration Policy Institute:** migrationpolicy.org (Diaspora and immigration data)
- **Digital Schomburg (NYPL):** digitalschomburg.org (Archival history)

### 3. Culture, Art & Sports
*Grounding for: Music, Literature, African Football, NBA/NFL, Cricket*
- **Andscape:** andscape.com (Intersection of race, sports, and culture)
- **Confédération Africaine de Football (CAF):** cafonline.com
- **Black Cultural Archives (UK):** blackculturalarchives.org
- **Archives of African American Music and Culture:** aaamc.indiana.edu

### 4. Business & Economics
*Grounding for: Wealth building, Entrepreneurship, Financial Literacy*
- **U.S. Black Chambers Inc.:** usblackchambers.org
- **Urban Institute (Racial Wealth Divide):** urban.org

---

## Part 4: Replit Build Specification

**⚠️ CRITICAL GUARDRAIL FOR REPLIT:** 
This build is strictly isolated to the `/library` route and the `KinfolkAI` data connections. **DO NOT touch, alter, or refactor:**
- The authentication system (`/login`, session cookies, password reset flows)
- The Business Directory (`/businesses`) or Map (`/map`) rendering logic
- The Safety Hub (`/safety`) or Marketplace (`/marketplace`)

### 1. Database Schema Updates (PostgreSQL / Prisma / Drizzle)
Add the following tables to support the Living Library:

```sql
-- Represents a dynamically generated 'Book' for a user
CREATE TABLE library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  topic_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Represents chapters/sub-chapters within a book
CREATE TABLE library_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES library_books(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  parent_chapter_id UUID REFERENCES library_chapters(id), -- For sub-chapters
  created_at TIMESTAMP DEFAULT NOW()
);

-- Links library interests to the Kinfolk AI preference profile
CREATE TABLE user_library_interests (
  user_id UUID REFERENCES users(id),
  topic_name VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id, topic_name)
);
```

### 2. Back-End Logic (Node.js / Express / Next.js API)
1. **Topic Deduplication Script:** Write a migration script to merge duplicate topics in the existing database (e.g., merge the three "Diabetes" entries into one, updating all foreign key relations).
2. **Dynamic Generation Endpoint (`POST /api/library/generate`):**
   - **Input:** `topic` (e.g., "Infertility"), `user_profile` (extracted from session: gender, location, race/ethnicity if provided).
   - **Action:** Call the LLM (OpenAI/Anthropic) using a RAG prompt grounded in the reputable sources listed in Part 3.
   - **Prompt Instruction:** *"You are Kinfolk, an expert guide for the Mapping With Melanin community. Generate a comprehensive overview of [Topic]. Tailor the medical, cultural, or historical context specifically for a [User Demographic] living in [User Location]. Structure the response with clear H2 chapters."*
3. **Branching Endpoint (`POST /api/library/branch`):**
   - Allows users to ask a follow-up question inside a Book. The AI generates a new `library_chapter` with `parent_chapter_id` linking it to the context.
4. **Cross-Pollination Sync:** When a user saves a Book (e.g., "Ethiopia"), insert a record into `user_library_interests`. The KinfolkAI travel/business prompt must inject this table's data: *"The user is interested in: [List]. Proactively suggest relevant businesses or events."*

### 3. Front-End UI (React / Tailwind)
1. **Search & Discovery (`/library`):**
   - Replace the "Articles coming soon" empty state.
   - Implement a prominent search bar: *"Search any topic, country, sports team, or health condition..."*
2. **The "Book" View (`/library/book/[id]`):**
   - **Left Sidebar:** Table of Contents (Chapters and nested Sub-chapters).
   - **Main Content Area:** Render the AI-generated markdown content.
   - **Bottom Action Bar:** "Ask Kinfolk to expand on this..." (Text input for branching/sub-chapters).
3. **Save/Follow Integration:**
   - Add a prominent "Save to My Library" button on every Book.
   - Show a toast notification: *"Saved! Kinfolk will now suggest related businesses and events."*

### 4. QA & Testing Requirements
- **Test 1:** Search "Infertility" as a Black woman in NM vs. an Asian woman in NJ. Verify the AI generates different, culturally specific statistics and context.
- **Test 2:** Search "Ethiopia," save the Book, then navigate to `/travel` and ask Kinfolk "Where should I eat?" Verify Kinfolk suggests Ethiopian restaurants.
- **Test 3:** Verify that navigating to `/login` and `/map` still works perfectly with no regressions.
