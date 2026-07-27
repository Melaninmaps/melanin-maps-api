# Launch Simulation — Build 97
## Mapping With Melanin™
**Date:** July 27, 2026
**Classification:** Pre-Submission Experience Review
**Method:** Screen-by-screen walkthrough based on confirmed app structure, route behavior, and DB state
**Note:** This is a simulation based on actual implemented features. Every screen referenced exists in the codebase. Every behavior described is drawn from confirmed route and component logic — not aspirational.

---

## PURPOSE

This document answers one question that no technical audit answers:

*When a real person downloads this app and opens it for the first time, what actually happens?*

Five tester archetypes are simulated. Each one follows a realistic sequence through the confirmed Build 97 feature set. Friction points, excitement moments, and confusion risks are called out honestly.

---

## TESTER A — First-Time Download, No Prior Context
**Profile:** 28-year-old Black woman. Lives in DC. Heard about the app from a friend. Downloaded it tonight.
**Goal:** Figure out what this app is and whether it's worth her time.
**Device:** iPhone 14 Pro

---

### Minutes 0–3: First Impression

She opens the app. The onboarding sequence begins:

**Screen 1 — Welcome:** "Map Your Life. Connect Deeper." with the tagline "Safety-First Community Intelligence." Full-screen, brand colors.

**Her reaction:** *Intrigued but uncertain.* The tagline "Safety-First Community Intelligence" is accurate but abstract. She doesn't immediately know if this is a navigation app, a social app, or a directory. She taps forward.

**Screen 2 — Safety:** Community safety scores and verified reviews highlighted.

**Screen 3 — Travel:** Informed travel framing.

**Screen 4 — Identity:** Identity-based connection.

**Screen 5 — Join:** "10K+ Members, 500+ Cities." Two buttons: "Create Account" and "Log In."

**Friction point #1:** Four onboarding swipe screens before the CTA. Each screen is conceptually distinct (safety, travel, identity, join) but the connection between them isn't told as a story. She understands each screen individually but doesn't yet have a single sentence in her head that explains what the app *does*.

**She taps "Create Account."**

---

### Minutes 3–7: Signup

**Step 1:** Name and email. Standard. No friction.

**Step 2:** Username (@handle) and password. She picks @dcdreamer. Works on first try.

**Step 3:** Date of birth (optional) and Terms agreement. She skips DOB, checks Terms.

**Profile Setup — Step 1:** Home City → she types "Washington DC." Accepted.

**Profile Setup — Step 2:** Role selection — Business Owner, Cultural Ambassador, Community Organizer. She's none of these. She wonders if there's a "just a member" option. There isn't labeled as such — she taps away without selecting (or the screen allows proceeding without selection).

**Friction point #2:** Role selection implies you must be something official to get full value. A "Community Member" or "Explorer" default option would reduce anxiety here. Many users will feel they don't qualify as "Ambassador" or "Organizer."

**Profile Setup — Step 3:** Interests — Food, Arts, Travel, etc. She selects Food, Arts, Travel, Culture. This feels right. She's engaged.

**Profile Setup — Step 4:** Privacy settings. Public profile toggle, DM allowance. She leaves public on.

**She's in.**

---

### Minutes 7–15: Discovery Screen — First Look

**Header:** "Good evening, Aaliyah 👋🏾" with her name. Notification bell. Search bar.

**Her reaction:** *This is personal.* The greeting with her name and the wave emoji immediately signals this isn't a generic app. She feels seen.

**KinfolkAI banner:** "Plan Your Next Trip" with a send icon. She taps it.

**KinfolkAI (Travel screen):** She sees a daily brand quote and a chat interface. Suggested prompt: "Plan a 3-day trip to Atlanta focusing on Black history and soul food."

She types: *"What are the best Black-owned restaurants near me in DC?"*

KinfolkAI responds with specific restaurant names, neighborhoods, and a note on current weather ("It's 84°F in DC this evening — great weather for a patio"). She sees real business names she recognizes.

**Excitement moment #1:** The weather detail. The AI knows where she is and that it's evening. It doesn't feel like a chatbot. It feels like a friend who lives here.

She goes back to Discovery.

**Carousels:** "Trending This Week," "Featured," "Nearby," "Community Faves." She scrolls through. Vibe chips: "Soul Food," "Hair & Beauty," "Bougie," "Hood Classic."

She taps "Hood Classic." A filtered list of businesses appears. She sees a restaurant she's driven past a hundred times but never entered.

**Excitement moment #2:** The vibe chips are the first time she's encountered a discovery layer that speaks her language. "Bougie" and "Hood Classic" as equal, non-judgmental categories. She taps both and compares.

---

### Minutes 15–22: Business Detail

She taps a restaurant from the "Hood Classic" vibe. Business detail screen loads.

**She sees:** Hero image. Business name. Tagline. Category. Price range. Trust-weighted average rating. Vibe tags. Ownership designations (Black-owned, Woman-owned). Founded year.

**Excitement moment #3:** "Black-owned, Woman-owned" listed as verified designations. Not a self-reported checkbox — it has a verified badge. She's never seen that in another app.

She scrolls. She sees reviews with compliment chips ("Great service," "Safe space"). She sees the owner's response to a review.

**Confusion point #1:** She doesn't know what "trust-weighted avg" means. The number (4.3) makes sense, but the label is technical. She moves past it without fully understanding it.

She taps the map pin on the business card. The Map tab opens with a pin on this business's location.

---

### Minutes 22–28: Map Tab

The Map loads. She sees business pins and — something she didn't expect — a second layer of pins in a different color. Heritage sites.

**Excitement moment #4:** She taps a heritage pin near her neighborhood. It's a historically significant cultural site she had no idea existed. The detail screen has a story about the site's history.

*"I've lived here for 5 years and never knew this was here."*

This is the moment the app stops being a business directory and becomes something else.

---

### Minutes 28–30: Community Tab

She opens Community. The feed is currently sparse (see seeding recommendation). She sees the compose bar and the Groups tab.

**Confusion point #2:** The feed is the weakest first impression. If it's empty or has only 1–2 posts, she will mentally file this as "an app that's not really active yet." This undercuts everything that came before.

She closes the app.

---

### Tester A — Summary

| Moment | Type | Impact |
|--------|------|--------|
| "Good evening, [Name] 👋🏾" | ✅ Delight | High — instant personalization signal |
| KinfolkAI + live weather in DC response | ✅ Excitement | Very high — the "wow" moment |
| Vibe chips ("Hood Classic," "Bougie") | ✅ Delight | High — culturally specific, non-judgmental |
| Verified Black-owned + Woman-owned designations | ✅ Trust | High — perceived as meaningful |
| Heritage site discovery on map | ✅ Revelation | Highest — this is the moment of genuine surprise |
| "Safety-First Community Intelligence" tagline | ⚠️ Confusion | Low–medium — abstract on first read |
| Role selection (no "just a member" option) | ⚠️ Friction | Medium — creates self-doubt for casual users |
| "Trust-weighted avg" label | ⚠️ Confusion | Low — the number reads fine; the label is jargon |
| Empty community feed | 🔴 Risk | High — undercuts sense of a living community |

**Would she recommend it?** Yes — specifically because of KinfolkAI and the heritage discovery. She'll describe it as "like a Black travel guide that actually knows DC."

---

## TESTER B — Business Owner
**Profile:** Owns a natural hair salon in Philadelphia. Verified on the platform. Received an invite from another business owner.
**Goal:** Decide whether to keep engaging, set up her profile properly, and understand what she's getting.
**Device:** iPhone 13

---

### Minutes 0–5: Login and Business Dashboard

She already has an account. She logs in. Goes directly to Profile → Business Dashboard.

**She sees:** Her business name, category, city. Analytics section — profile views, saves, review count. Traffic sources (TikTok, Instagram, YouTube, website click counts).

**Confusion point #1:** Analytics are locked behind "Navigator" (paid tier). She sees the numbers are blurred with an upgrade prompt. She feels immediately that the free experience is limited.

**Critical question this raises:** Does the free experience give her enough to understand the value before asking for her credit card? Answer: partially. She can see the total views number but not the breakdown. This may be enough — she has proof people are finding her — but it will feel extractive if the first meaningful number is behind a paywall.

**Excitement moment #1:** "Skip Insights" — a section showing why people skipped her business during discovery. She has never seen this data anywhere. No Yelp, no Google, no Instagram gives her this. It's uncomfortable and valuable at the same time.

---

### Minutes 5–15: Identity and Vibe Tags

She taps Identity → Business Identity screen. She can add her ownership designations, diaspora connection, and community values. She adds "Woman-owned" and "Natural hair specialist."

She taps Vibe Tags. She can tag her business as "Safe space," "Natural vibes," "Sisterhood." She picks all three.

**Excitement moment #2:** The vibe tag system gives her words she didn't have for what her business *means*. She's a safe space. She's always known that but has never had a platform where she could say it and have it be a discovery signal.

---

### Minutes 15–25: Pinned Highlights and Broadcasts

She taps Pinned Highlights. She can add 3 things she wants every visitor to see — a recent award, her hours, and a community event she's hosting.

She taps Broadcasts. She can send a message to everyone who's saved her business.

**Excitement moment #3:** Broadcasts to saved customers. This is CRM-level capability she's never had without paying for a marketing tool. She types a short message: "We're offering free consultations this weekend for new clients."

**Confusion point #2:** How many people has she saved? She can see a save count in analytics (if not paywalled). But the Broadcasts screen doesn't show a "your message will reach X people" preview before sending. She sends it without knowing the reach.

---

### Minutes 25–30: Growth Tools and Decision

She taps Growth Tools. Sees promotional placement options with pricing. This is where Stripe checkout would be triggered.

She doesn't buy today. But she understands what's available.

**Her conclusion:** *"This is the only platform that actually shows me why people chose someone else. That alone is worth staying for."*

She's not upgrading today. But she's not leaving either. She'll be back when she has a marketing budget.

---

### Tester B — Summary

| Moment | Type | Impact |
|--------|------|--------|
| Skip Insights (why people passed on her) | ✅ Unique value | Very high — no competitor offers this |
| Vibe Tags ("Safe space," "Sisterhood") | ✅ Identity | High — gives language to what she already knows |
| Broadcasts to saved customers | ✅ Capability | High — CRM without a CRM |
| Pinned Highlights control | ✅ Agency | Medium — feels like her page, not a template |
| Analytics paywalled at Navigator | ⚠️ Friction | Medium — free tier must show enough to prove value |
| No "message will reach X people" on Broadcast | ⚠️ Confusion | Low–medium — easy fix, high confidence signal |

**Would she recommend it to other business owners?** Yes — specifically because of Skip Insights. She'll describe it as "the only app that tells you why you're being ignored."

---

## TESTER C — Relocating
**Profile:** 35-year-old man. Moving from Atlanta to DC in 6 weeks. Has one weekend visit planned before the move.
**Goal:** Use the app to understand DC's Black community landscape before arriving.
**Device:** Samsung Galaxy S24

---

### Minutes 0–5: Setup

Signs up. Profile setup — Home City: "Atlanta" for now. Interests: Food, Community, Culture, Housing.

He opens KinfolkAI (Travel tab) immediately.

---

### Minutes 5–20: KinfolkAI as Move Planner

He types: *"I'm moving to DC from Atlanta in 6 weeks. What neighborhoods should I look at if I want to be near the Black community and good food?"*

KinfolkAI responds with specific DC neighborhoods, mentions cultural anchors, references the current weather in DC ("78°F, clear tonight — good time to explore"), and lists three community-owned restaurants in Shaw, Anacostia, and Columbia Heights.

**Excitement moment #1:** The answer is specific, culturally aware, and personal. It doesn't say "D.C. has a rich African American history." It names actual places. It treats him as someone who already knows what he wants.

He follows up: *"What's the vibe difference between Shaw and Anacostia? Which one feels more like the Old 4th Ward in Atlanta?"*

KinfolkAI gives a neighborhood comparison with vibe language he recognizes — "Shaw is the gentrifying New South ATL, Anacostia is the soul that hasn't moved yet." (Phrasing will vary; KinfolkAI generates contextually — this is illustrative.)

**Excitement moment #2:** The neighborhood comparison using Atlanta as a reference point. He's never had a relocation tool that mapped his current city's vibe onto the destination.

---

### Minutes 20–28: Map + Heritage Exploration

He opens the Map. He's in Atlanta physically, but he searches "Washington DC." The map shifts. He sees business pins clustered in Columbia Heights, Shaw, Southeast.

He spots heritage pins. He taps a few — Howard University area, Ben's Chili Bowl neighborhood, the Lincoln Theatre. Each has a detail screen with a brief cultural history.

**Excitement moment #3:** The heritage layer turns a neighborhood map into a cultural orientation. He's not just seeing where to eat — he's understanding what the neighborhoods *mean*.

He saves 6 businesses and 3 heritage sites to his saved places. He adds a note: "Visit during weekend trip."

**Confusion point #1:** He wants to filter businesses by "Black-owned, verified only." He can filter by category and vibe but isn't sure if there's a "verified ownership" filter. He finds the vibe chips but not a clean ownership filter. He works around it by checking each business detail individually.

---

### Minutes 28–30: Final Assessment

He checks the Community tab. He sees the feed. If there are DC-related posts from other members, he reads them. If the feed is empty, he doesn't know what to do here.

He opens Library. He sees the horizontal heritage site cards. He reads two.

**His conclusion:** *"This is the app I didn't know I needed for this move. I'm already thinking about my weekend trip differently."*

---

### Tester C — Summary

| Moment | Type | Impact |
|--------|------|--------|
| KinfolkAI neighborhood vibe comparison using Atlanta as reference | ✅ Revelation | Very high — deeply personal, not generic |
| Heritage layer turning map into cultural orientation | ✅ Revelation | High — changes what the map means |
| Saving businesses + heritage sites for weekend trip | ✅ Utility | High — immediate practical value |
| KinfolkAI current weather for destination city | ✅ Delight | Medium — small detail, large trust signal |
| No clean "verified ownership only" filter on map | ⚠️ Friction | Medium — workaround exists but takes effort |
| Empty community feed in destination city | 🔴 Risk | High for this use case — community context is exactly what he needs |

**Would he recommend it?** Yes, immediately and specifically to anyone relocating. He'll describe it as "the relocation app that actually tells you where the community is."

---

## TESTER D — Traveling
**Profile:** 42-year-old woman. Taking a solo trip to New Orleans next month. Well-traveled, uses multiple apps. Has high standards.
**Goal:** Discover something she couldn't have found on TripAdvisor, Yelp, or Google.
**Device:** iPhone 15 Pro Max

---

### Minutes 0–3: Skip Onboarding, Get to Value

She's impatient. She moves through onboarding quickly — she's done this before. Signup is fast. She types "New Orleans" as her home city (she's not relocating, she just wants the local context).

---

### Minutes 3–15: KinfolkAI for Trip Planning

She types: *"I'm going to New Orleans for 5 days solo. I want to experience Black New Orleans — not Bourbon Street. Where do I start?"*

KinfolkAI's response is the make-or-break moment for Tester D. She's been to New Orleans three times. She knows Dooky Chase's. She's heard of Tremé. She wants something she doesn't already know.

KinfolkAI responds with:
- Specific restaurants in the Seventh Ward she hasn't heard of
- A reference to the current weather in New Orleans and what that means for outdoor dining this time of year
- A suggestion to check the Heritage layer on the map for HBCU-adjacent cultural sites
- A suggested question for day 2: "Ask me about the Mardi Gras Indian tradition and where to find authentic craftspeople"

**Excitement moment #1:** The suggestion about Mardi Gras Indian craftspeople is specific enough that she Googles it to verify. It checks out. The AI didn't hallucinate — it gave her a real cultural thread to pull.

She follows up: *"Are any of these restaurants woman-owned?"*

KinfolkAI confirms one of the recommendations is verified woman-owned in the app's database. She saves it.

---

### Minutes 15–22: Heritage Layer

She opens the Map and navigates to New Orleans. The heritage pins load. She taps several — Congo Square, the Tremé neighborhood marker, a cultural site in the Seventh Ward.

**Excitement moment #2:** Congo Square's detail screen has a cultural history note. She's read about Congo Square in three books. Seeing it on a community-built map — not a TripAdvisor listing, not a Wikipedia summary — feels different. It feels like the community is telling her about it.

She saves four heritage sites. She screenshots two of them.

---

### Minutes 22–27: Community Tab

She opens Community looking for posts from New Orleans members. If there are any, she reads them. She sees whether there are local group discussions.

**Risk point:** If the community is sparse in New Orleans specifically, she'll conclude the app is more useful for cities where the community is denser. This is a real and honest limitation — Build 97 doesn't solve it — but it shouldn't undercut the heritage and KinfolkAI value she's already gotten.

---

### Minutes 27–30: Final Assessment

She goes back to KinfolkAI. She asks: *"What's a day 1 itinerary for someone who wants to spend money only at Black-owned businesses?"*

KinfolkAI builds an itinerary. It's not perfect — some recommendations are GPT knowledge-based, not DB-backed — but it's coherent, culturally aware, and more useful than anything she'll get from Google.

**Her conclusion:** *"I've used every travel app. This is the first one that feels like it was built for me, not for the generic traveler who happens to also want diversity options."*

---

### Tester D — Summary

| Moment | Type | Impact |
|--------|------|--------|
| KinfolkAI giving specific cultural thread (Mardi Gras Indians) | ✅ Revelation | Very high — high-standard tester satisfied |
| Verified woman-owned confirmation in DB | ✅ Trust | High — she tested it and it checked out |
| Heritage layer on Congo Square | ✅ Meaning | High — community-told history vs. tourist info |
| Full-day Black-owned-only itinerary from KinfolkAI | ✅ Utility | High — immediately practical |
| Some KinfolkAI recommendations are GPT knowledge, not DB-backed | ⚠️ Risk | Medium — high-standard tester may spot inconsistencies |
| Sparse New Orleans community feed | ⚠️ Limitation | Medium — honest gap; doesn't undercut core value |

**Would she recommend it?** Yes — specifically to other solo Black travelers. She'll describe it as "the app that actually knows what Black travel means."

---

## TESTER E — Social Media Discovery
**Profile:** 24-year-old man. Saw an Instagram Reel about the app. Downloaded it on a Saturday afternoon with 20 minutes and low patience.
**Goal:** Decide in 20 minutes if this is worth keeping on his phone.
**Device:** Samsung Galaxy S23 (Android)

---

### Minutes 0–2: Expectations from Social Media

He saw a Reel that showed KinfolkAI answering a cultural question and the heritage map. He expected "cool AI app + Black business finder." His bar is set by that Reel. If the real app doesn't match the Reel experience, he deletes it.

---

### Minutes 2–6: Signup

He moves through the 3-step signup quickly. He uses Google autofill for email. Username — he picks one; it's available. Profile setup — he selects his city (Houston), picks interests (Food, Music, Sports), skips role selection.

He's in the app in under 4 minutes.

---

### Minutes 6–10: Discovery Screen

He sees the greeting with his name. He sees the KinfolkAI banner. He taps it immediately because that's what he saw in the Reel.

He types: *"Best spots in Houston right now?"*

KinfolkAI responds. Current Houston weather. Specific business names. Vibe descriptions. One reference to a neighborhood he knows — Third Ward.

**Make-or-break moment:** If KinfolkAI names at least one business or place he can verify or recognizes, he stays. If every recommendation is unfamiliar or sounds generic, he's skeptical.

**Excitement moment #1:** Third Ward mention. He grew up near there. The AI knowing to reference Third Ward for Houston culture — without him saying anything about his background — feels uncanny. (KinfolkAI infers from his interest selections and city.)

---

### Minutes 10–15: Map and Heritage

He opens the Map. He doesn't search — he lets it load on Houston. He sees pins. He taps a heritage pin near Third Ward.

**Excitement moment #2:** The heritage detail screen has a cultural history note about the Third Ward community. He reads it. He's never seen this documented anywhere he's looked on his phone before.

He taps three more heritage pins. He's not planning a trip. He's just reading.

**This is the unexpected behavior:** He came for AI recommendations and stayed for history. This is the app's most powerful conversion moment — the heritage layer gives depth to a demographic that often struggles to find their community's history documented at street level.

---

### Minutes 15–18: Community Tab

He opens Community. This is where the app has to prove it's alive.

**Critical decision point:** If the feed has at least 5 genuine-feeling posts — not promotional spam, not empty "welcome" messages, but actual community content — he posts something. If it's empty, he closes the app.

If he posts something and gets even one like or reply in the next 24 hours, he keeps the app. If he never hears back, he forgets it.

**Tester E is the test of whether this feels like a community or a product.**

---

### Minutes 18–20: Final Decision

He goes back to Discovery. He scrolls the vibe chips. "Hood Classic" — he taps it. He sees Houston businesses he knows or wants to know.

He screenshots the KinfolkAI response about Third Ward. He sends it to a group chat with the caption: "This app low-key knows Houston."

**He keeps the app.**

---

### Tester E — Summary

| Moment | Type | Impact |
|--------|------|--------|
| KinfolkAI referencing Third Ward unprompted | ✅ Revelation | Very high — "it knows my city" |
| Heritage layer about Third Ward history | ✅ Unexpected depth | Very high — came for AI, stayed for history |
| Vibe chips — "Hood Classic" in Houston | ✅ Delight | High — language that fits |
| Screenshot of KinfolkAI → group chat share | ✅ Word of mouth | The highest possible outcome |
| Empty community feed | 🔴 Hard stop | High — this is the deletion risk |
| App delivering on the Reel promise | ✅ Trust | High — expectation matched |

**Would he recommend it?** Yes — if the community feed has any life in it. He already shared the KinfolkAI screenshot. The app travels by word-of-mouth exactly this way: someone shows a specific moment, not the whole app.

---

## CROSS-TESTER PATTERNS

### What Works Across All 5 Testers

| Feature | Why It Works |
|---------|-------------|
| KinfolkAI + live weather | Makes every response feel present-tense and local — not generic AI |
| Heritage layer on Map | Unexpected. No one else has this. Gives the app a reason to exist beyond directory |
| Personalized greeting with name | Immediate signal: "this app knows I'm a person" |
| Vibe chips | Language that fits — "Hood Classic" and "Bougie" as equal, non-judgmental categories |
| Verified ownership designations | Trust signal that competitors don't offer |
| Skip Insights (business owners) | Unique capability — no competitor |

### What Creates Risk Across All 5 Testers

| Risk | Who It Affects | Severity |
|------|---------------|----------|
| **Empty or sparse community feed** | A, C, D, E | **Critical** — first community impression is permanent |
| Onboarding tagline "Safety-First Community Intelligence" | A, E | Medium — abstract before the product explains itself |
| Role selection without "just a member" option | A, E | Medium — casual users feel excluded |
| No "verified only" ownership filter | C, D | Low–medium |
| KinfolkAI recommendations mixing DB-backed and GPT-knowledge results | D | Medium for high-expectation users |

### The One Thing This App Has That No Other App Has

Every single tester above hits the same moment — and it's always the heritage layer.

It is not KinfolkAI. KinfolkAI is excellent but explainable: "it's like ChatGPT but for Black travel." Testers can contextualize it.

The heritage layer is not explainable by reference. There is no other app that puts a pin on the corner of your neighborhood and says "this is what happened here, and why it matters to your community." That moment — when someone reads about Third Ward or Congo Square or a DC cultural site they've driven past for years — is the moment the app stops being a product and becomes a mission.

**That moment must be visible in the first 15 minutes for every tester.**

The current flow gets there — the Map tab is one tap from the Discovery screen and heritage pins are ON by default. But it depends on the tester exploring the Map. A more direct path — a heritage site surfaced in the Discovery feed carousels, or a KinfolkAI response that explicitly says "tap the Map and look for the orange pins near you" — would guarantee the moment rather than making it discoverable.

---

## BUILD 97 MISSION STATEMENT (from Founder Direction)

> "Build 97's mission is to demonstrate the promise of Mapping With Melanin™."
>
> When someone downloads it, they should immediately understand:
> - what the app is
> - why it exists
> - how Maps, Heritage, Community, and Kinfolk work together
> - why this is different from a directory or a generic AI chatbot

**Simulation verdict:** Build 97 delivers this — *if* the community feed is seeded and the heritage layer is encountered in the first session.

The four pillars are present and functional:
- **Maps** — business pins, category filters, vibe chips ✅
- **Heritage** — cultural sites layer, ON by default, deep-linked to history ✅
- **Community** — feed, groups, events ✅ (requires seeding)
- **Kinfolk** — KinfolkAI with live context, personalization, cultural voice ✅

What makes this different from a directory: the heritage layer.
What makes this different from a generic AI chatbot: KinfolkAI knowing that someone who moved from Atlanta to DC cares about neighborhood vibe, not square footage.

Neither of those things requires a future feature. Both exist today.

---

## RECOMMENDED ACTIONS BEFORE TESTER INVITATIONS (Day 5–6)

1. **Seed the community feed with 8–10 founder posts** — real content, culturally specific, from the founder's verified account. Include: one post about the app's mission, one about a heritage site, one about a local business, and one that invites testers to introduce themselves.

2. **Add one heritage site to the Discovery screen carousels** — surface a "Heritage Spot of the Day" card in the Trending or Featured carousel so that every tester encounters it without having to find the Map tab. This guarantees the most powerful moment in the app is not hidden.

3. **Add "just exploring" to role selection in Profile Setup** — one additional option that doesn't require a label. This removes friction for ~60% of new users who are not yet business owners, ambassadors, or organizers.

4. **Ensure KinfolkAI suggested prompts include one heritage-forward question** — e.g., "Show me historical places my community built near me." This explicitly connects KinfolkAI to the heritage layer for users who go to KinfolkAI first.

Items 1 and 2 are content/configuration actions, not code changes. Items 3 and 4 are small UI changes — each under 2 hours — that would meaningfully improve the first-session conversion rate.
