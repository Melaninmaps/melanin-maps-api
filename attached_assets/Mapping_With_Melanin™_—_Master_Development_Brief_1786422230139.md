# Mapping With Melanin™ — Master Development Brief
**Prepared by:** Manus AI
**Date:** August 11, 2026
**Status:** Approved for Implementation

This is the definitive master brief for the Replit engineering team. It supersedes all previous piecemeal instructions. It covers the strict surgical update protocol, the exact UI rebuild for the Business Detail Screen, the Community Intelligence ecosystem, and the KinfolkAI learning architecture.

---

## 1. The Surgical Update Protocol (Strict Guardrails)

The platform is currently in a delicate state. Previous updates have caused regressions. You are instructed to use a **surgical update protocol**. 

**The Rule:** Only touch the exact files, tables, and components required to implement the features described in this document. 

**STRICT NO-TOUCH ZONES:**
- Do NOT touch the authentication system (`/login`, session management, password resets).
- Do NOT touch the map rendering logic or the sundown town data layer.
- Do NOT touch the existing curated "Books" UI panel in the Library.
- Do NOT touch the Safety Hub or Marketplace.

**When Seeding Data:**
If instructed to seed businesses, you must *only* touch the database seeding scripts and the specific tables required (`businesses`, `business_categories`, `business_tags`). Do not alter the schema of unrelated tables to accommodate seeding. Validate that the map still loads and plots the seeded businesses correctly before committing.

---

## 2. Business Detail Screen Rebuild (UI/UX)

The current web business page is missing critical visual and data elements that exist in the original mobile designs. You must rebuild the Business Detail component to exactly match the provided design references.

### Visual Architecture (Top to Bottom)
1. **Hero Image Area:** Full-bleed hero image with a back arrow (left), share icon, and save/bookmark icon (right) overlaid on the image.
2. **Header Block:** 
   - Business Name (e.g., "Jefferson Street BBQ")
   - Category, Verification Badge, and Price Tier (e.g., "Food  [Verified icon]  $$")
   - Top Right: A circular "Confidence Score" gauge (e.g., "98 / 100 High Confidence" in green text).
3. **Ownership & Tags:**
   - Pill-shaped tags with icons: `[✊🏾 Black-Owned]`, `[✊🏾 Black Owned]`
   - Disclaimer text below tags: *"Ownership designations indicate the business is owned and operated 51% or more by the identified group. Businesses may self-identify or submit documentation for VERIFIED status."*
   - Vibe/Status Tags: `[🛡️ Community Trusted]`, `[💚 Welcoming Environment]`
4. **Community Rating:**
   - Crown icon followed by "Put Your People On" text and the aggregate rating (e.g., "4.9 (634)").
5. **Community Safety Stats Card:**
   - A distinct card with a shield icon.
   - Three columns: 
     - **Would Return Alone:** Percentage (e.g., "95%")
     - **Safety Rating:** Out of 5 (e.g., "4.8")
     - **Recommend:** Percentage (e.g., "99%")
6. **Rate Your Safety Experience:** A CTA card prompting the user to contribute safety data.
7. **Community Says Card:**
   - Heart icon with "Community Says" and an "+ Add Yours" button.
   - User-generated vibe tags (e.g., `[1 said "Date Night Approved"]`).
8. **Sticky Bottom Action Bar:**
   - Three equal-width buttons: `[📞 Call]`, `[✅ Check In]`, `[⭐ Review]`.
9. **Floating KinfolkAI Widget:**
   - A floating pill/bubble overlapping the bottom content: `[✨ KinfolkAI™ Ask me anything ✨]`.

### Functional Requirements
- **Media Upload:** Users must be able to add images to the business profile (not just link to Instagram/TikTok).
- **Social URLs:** The business data model must support and display direct links to the business's social media profiles.

---

## 3. The Community Intelligence Ecosystem

Mapping With Melanin is not Yelp. It is a curated ecosystem where community feedback drives safety, discovery, and business growth. "Minority-owned" does not automatically mean "welcoming to all." The platform relies on real-time, nuanced community feedback.

### The Feedback Loop
1. **Vibe & Mood Tagging:** Users don't just leave 5-star reviews; they tag the *vibe*. (e.g., "Date Night Approved", "Auntie Energy", "Great bedside manner").
2. **Safety Scoring:** The "Would Return Alone" metric is the most critical differentiator. This must be prominently displayed and easily updatable by users.
3. **Cross-Pollination (The Ecosystem):** 
   - If User A and User B both tag a restaurant as "Date Night Approved" and both save the same art gallery, KinfolkAI must recognize this pattern.
   - When User A asks Kinfolk for a recommendation, Kinfolk should recommend other places User B liked, *even if they are strangers*, because their vibe preferences align.

### Business Building (B2B Value)
KinfolkAI must aggregate this community feedback to help the businesses themselves. 
- **Example:** If 1,067 users tagged a restaurant with "Romantic Vibe," KinfolkAI should proactively prompt the business owner on their dashboard: *"Your community loves your romantic vibe. Let's create a Valentine's Day menu to capitalize on this."*

---

## 4. KinfolkAI Learning Architecture

KinfolkAI is not a static chatbot. It is a learning engine that uses the Library as its long-term memory.

### The "Learn As It Goes" Requirement
1. **Live Web Search:** Kinfolk must be equipped with a live web search tool (e.g., via OpenAI function calling). When a user asks a question, Kinfolk must search reputable external platforms to find the most current, culturally relevant information.
2. **Library Write-Back:** When Kinfolk learns something new from a search, it must synthesize that information and write it back to the MWM Library as a new topic, chapter, or sub-chapter.
3. **Applied Logic on the Next Search:** When the next user searches a related topic, Kinfolk must query the MWM Library *first*. It applies the logic and context it learned from previous searches to the new search, rather than starting from scratch.

### Demographic Context
Every piece of knowledge Kinfolk writes to the Library must be tagged with the demographic and geographic context of the user who initiated the search. 
- **Example:** A Black woman in New Mexico searching for infertility resources requires different medical statistics, clinic availability, and cultural context than an Asian woman in New Jersey. Kinfolk must recognize these distinctions, store them contextually in the Library, and apply them correctly to future queries.

---

## Final Authorization

The Replit team is authorized to implement the features exactly as described in this Master Brief, adhering strictly to the surgical update protocol and no-touch guardrails.
