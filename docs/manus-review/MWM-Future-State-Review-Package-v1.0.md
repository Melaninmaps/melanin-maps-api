# Mapping With Melanin™ — Sanitized Future-State Review Package
**Version:** 1.0  
**Date:** 2026-07-29  
**Repository Commit Reviewed:** `123527c9` (Build 99, iOS build #99, Android VC74)  
**Prepared for:** Independent Auditor (Manus)  
**Classification:** Sanitized — No source code, credentials, proprietary formulas, or private member data  

---

## HOW TO READ THIS DOCUMENT

Each claim is labeled:

- ✅ **CONFIRMED FOUNDER DECISION** — Locked. Not subject to reinterpretation.  
- 📐 **PROPOSED REPLIT INTERPRETATION** — Replit's current technical implementation of founder intent. Subject to founder review.  
- 🔲 **ASSUMPTION** — Replit's working assumption where the founder decision is not yet documented.  
- ❓ **UNRESOLVED FOUNDER DECISION** — Open question requiring explicit founder input before implementation or launch.  

---

## PART 1 — FOUNDER VISION: CURRENT UNDERSTANDING

### 1.1 What Mapping With Melanin Is

✅ **CONFIRMED:** Mapping With Melanin is a **private membership community**, not a public directory, rating platform, or social media app.

✅ **CONFIRMED:** The platform is built around **community-generated and community-protected cultural intelligence** — knowledge that comes from the community, is curated by the community, and ultimately serves the community.

✅ **CONFIRMED:** The platform is **safety-first**. Safety context is treated as a foundational layer of discovery, not a secondary feature or optional filter.

✅ **CONFIRMED:** The platform serves **Black Americans and the African diaspora** as its primary community, with additional communities deferred to a future expansion phase.

✅ **CONFIRMED:** Business discovery is built on **community trust context**, not just business information. A business's presence on the platform is shaped by member nominations, lived experiences, verification status, and cultural relevance.

✅ **CONFIRMED:** The platform is built for the **long term**. Nothing expires. Members' contributions, journeys, and history persist and grow in value. This is a lifelong companion, not an event or campaign app.

✅ **CONFIRMED:** The product name for the AI companion is **Kinfolk**. Not "AI Assistant," not "Chatbot," not "MWM AI."

✅ **CONFIRMED:** The platform must function as **Five Pillars**:
1. Community Understanding (safety, safety reporting, neighborhood intelligence)
2. Business Discovery and Trust
3. Cultural Heritage and Education
4. KinfolkAI Personal Companion
5. Community Health Profile (safety, opportunity, belonging, accessibility, growth — not a "score")

✅ **CONFIRMED:** Mapping With Melanin is **not an app — it is a platform**. The mobile app and web app are the current delivery surfaces, but the underlying knowledge, relationships, and trust signals constitute a platform that outlasts any individual interface.

---

### 1.2 Use Cases the Platform Is Designed to Serve

✅ **CONFIRMED** use cases:
- **Local discovery:** Finding community-trusted businesses, events, and resources in one's home city
- **Travel:** Preparing a safety-aware cultural travel plan; finding community-trusted businesses in a destination city
- **Relocation:** Preparing for a move to a new city; understanding neighborhoods, services, safety context, and community presence
- **Cultural exploration:** Discovering Black history, heritage sites, and cultural landmarks
- **Social:** Connecting with other members through community feed, Circles, and events
- **Business support:** Supporting, reviewing, nominating, and verifying Black-owned and minority-owned businesses
- **Safety:** Reporting safety incidents, sharing safety context, accessing neighborhood-level safety information
- **Resources:** Accessing scholarships, grants, housing assistance, employment, financial tools, and other community resources
- **Family:** Planning culturally relevant family activities; managing family membership and family-mode content filtering

---

### 1.3 Membership Structure

✅ **CONFIRMED:** The platform is **invite-only / waitlist-admission** for new members. Public users land on a waitlist flow; they cannot browse member content.

✅ **CONFIRMED** membership tiers:
- **Free (Community Member):** Basic access, limited KinfolkAI queries
- **Navigator:** Enhanced KinfolkAI access, additional features
- **Trailblazer:** Full access, highest KinfolkAI tier
- **Family Add-on:** Shared AI usage pool, additional seats

✅ **CONFIRMED** special roles:
- **Business Owner:** Claimed business profile, business dashboard, growth tools
- **Content Creator:** Ability to publish to the community library
- **Community Organizer:** Event creation and management
- **Ambassador (Cultural):** Trusted community contributor with curatorial authority in their area of expertise
- **Ambassador (Journey):** Trusted guide for multi-stop cultural experiences
- **Administrator:** Platform-level moderation, data review, and admin panel access

📐 **PROPOSED:** Memberships are delivered via:
- **iOS/Android:** RevenueCat (managing App Store / Play Store subscriptions)
- **Web:** Stripe (direct subscription with trial email sequences)
- **Billing UI:** Accessible from profile settings; upgrade flow integrated with content gates

---

### 1.4 Language and Naming Conventions

✅ **CONFIRMED:** "Black-owned" language is used **only when a business is verified or when the business owner has self-identified**. Generic copy uses "minority-owned" or "community businesses." This is a contextual rule — Black specificity is celebrated when earned, not suppressed.

✅ **CONFIRMED:** "Safety Score" is **never used in member-facing copy**. The term is "Community Insights" or "Community Understanding." (Internal database columns retain technical names; only member-facing copy is affected.)

✅ **CONFIRMED:** "Community Understanding" replaces "algorithm" in all member-facing and public-facing contexts.

✅ **CONFIRMED:** KinfolkAI uses three named voices: [voice names are a confirmed founder decision, exact names stored in memory — omitted from this sanitized document].

---

### 1.5 Roles Interaction Matrix

| Role | Creates Content | Verifies | Curates | Moderates | Accesses AI | Earns Revenue |
|------|----------------|----------|---------|-----------|-------------|---------------|
| Community Member | Reviews, Posts, Safety Reports | Nominations | Circles, Saved Places | Report only | Tier-limited | No |
| Navigator/Trailblazer | All above | Nominations | All above | Report only | Enhanced | No |
| Business Owner | Business content, events | Responds to reviews | Promotions | Report only | Business tools | Via promotions |
| Content Creator | Articles, library content | — | Library topics | Report only | Tier-limited | Via creator dashboard |
| Community Organizer | Events | — | — | Report only | Tier-limited | No |
| Ambassador (Cultural) | All above + curatorial content | Nominations (weighted) | Community-wide | Flag for admin review | Enhanced | ❓ Unresolved |
| Ambassador (Journey) | Journey content | Journey stops | Journey curation | Flag for admin review | Enhanced | ❓ Unresolved |
| Admin | All | All | All | Full moderation | Full | No |

❓ **UNRESOLVED:** Whether and how Ambassadors are compensated (direct, in-kind, or recognition-only).

---

## PART 2 — FUTURE-STATE SYSTEM MAP

### 2.1 Member Onboarding and Admission

```
Public visitor
  → Landing page (waitlist CTA — no member content visible)
  → Waitlist form (name, email, city, interest)
  → Invite issued by admin or referral
  → Account creation (email/password OR Apple Sign-In OR Google Sign-In)
  → Profile setup (4-step: basics, background, interests, permissions)
  → Community Understanding onboarding (5-question survey establishing baseline)
  → Date of birth gate (18+ required for full access)
  → KinfolkAI onboarding (preference collection, lifestyle context, communication style)
  → City selection (primary city, travel interests)
  → Home screen / member experience
```

✅ **CONFIRMED:** Non-members **cannot browse member content**. The map, feed, businesses, and all discovery features are gated behind authentication.

📐 **PROPOSED:** Authentication is handled via Express session + Replit OIDC, with Apple Sign-In (JWT + JWKS verification, nonce-enforced on iOS 26+) and Google Sign-In as additional providers. Password reset via 6-digit code flow.

---

### 2.2 Identity and Membership Status

Each member record carries:
- Authentication identity (email/Apple/Google)
- Membership tier and billing source (Stripe / RevenueCat / manual)
- Role flags (isBusinessOwner, isContentCreator, isCommunityOrganizer)
- Ambassador status (Cultural / Journey, per-city scope)
- Profile completeness flags (profileSetupComplete, dateOfBirth)
- Account health (verified, suspended, flagged)
- Family membership linkage

---

### 2.3 Community Feed

```
Member creates post
  → Content classification (text, link, image, shared saved place)
  → Audience rating applied (Everyone / Teen / Young Adult / Adult)
  → Location tagging (optional, city/venue level — not precise GPS)
  → Hashtag extraction
  → Visibility selection (Public to members / Connections only / Private)
  → Moderation queue (if flagged by keywords or reported)
  → Published to feed
  → Surfaces in: For You / Following toggles
  → Reactions, comments, reposts
```

📐 **PROPOSED:** The feed uses a relevance algorithm based on:
- Follow graph (user_follows + member_connections)
- Location match
- Hashtag interests
- Engagement recency

✅ **CONFIRMED:** "Community Understanding" replaces "algorithm" in all member-facing descriptions.

📐 **PROPOSED:** Family mode filters posts by audience rating against family_settings per household.

---

### 2.4 Business Discovery and Trust Context

```
Business entry points:
  1. Nomination by member → admin review → business notified → claim flow
  2. Business self-submission → admin review → listing created
  3. Community Reference (uncontacted listing) → no business notification

Trust context layers (shown to members):
  1. Verification status (admin-reviewed photo documentation)
  2. Ownership designation (black-owned / minority-owned / community-partner)
  3. Community reviews and lived experiences
  4. Compliment chips (aggregated positive themes)
  5. Safety signals (if any, from community safety reports)
  6. Owner response presence
  7. Hidden Gem designation (community-earned)
  8. Ambassador endorsement (if applicable)
  9. Promotional placement (ALWAYS labeled — never presented as organic)
```

✅ **CONFIRMED:** Paid promotional placement is **always disclosed**. KinfolkAI must never present sponsored results as organic trust.

✅ **CONFIRMED:** Businesses are represented as **evolving community relationships**, not static listings.

---

### 2.5 Safety Reporting and Neighborhood Intelligence

```
Safety incident report:
  Member submits report (incident type, location, description)
  → Server-side classification
  → Admin review queue
  → Aggregated into neighborhood safety context (never individual report attribution)
  → Surfaces in: map layer, business context, KinfolkAI guidance, safety hub

Safety hub features:
  - Neighborhood safety surveys (community-submitted, city-level context)
  - Safety incident map layer
  - Safety resources (hotlines, legal resources, emergency contacts)
  - Wellness tracker
  - Family safety settings
```

✅ **CONFIRMED:** Individual safety reports are **never attributed to individual members** in member-facing surfaces. Aggregation protects reporter identity.

📐 **PROPOSED:** "Sundown Towns" historical data is architecturally supported (cultural_sites table, safety category) but **not implemented pending 9 pre-implementation gates** including founder input on 6 open questions. (See Build 97 Historical Sundown Towns Audit in docs/product/.)

---

### 2.6 Events

```
Event creation:
  - Community Organizers and Business Owners may create events
  - Events have: title, description, date/time, location, category, audience rating
  - Events appear in: community feed, events tab, map layer, KinfolkAI recommendations
  - RSVP tracking (member-private)
  - Moderation: reported events enter admin review queue
```

---

### 2.7 Circles

```
Circle = A member-created shared list of places + discussion space

Creation:
  - Any member may create a Circle
  - Name, description, privacy (private / shared with link / open to members)
  - Optional: KinfolkAI curator mode (votes / random / by designated member)

Membership:
  - Invite by link or by member
  - Tier limits on number of Circles (per TIER_LIMITS constants)

Content:
  - Saved places (businesses, cultural sites, custom POIs)
  - Discussion thread
  - AI curator suggestions (when enabled)

Privacy:
  - Saved places in private Circles are not visible to the platform
  - Member participation in Circles is not surfaced to other members without consent
```

---

### 2.8 Cultural Sites and Heritage

```
Cultural site types (seeded):
  - Historical landmarks
  - HBCU campuses
  - Cultural institutions (museums, galleries, archives)
  - Community organizations
  - Sundown towns (pending founder gate — not yet live)
  - Other heritage categories

Discovery surfaces:
  - Map layer (separate from business layer, ON by default)
  - Heritage screen (detail view with history, context, photos)
  - Library horizontal scroll
  - KinfolkAI Journey recommendations
```

---

### 2.9 KinfolkAI

See Part 3 (full functional specification).

---

### 2.10 Resources

```
Resource categories:
  - Topic Library (70+ topics, member-subscribed, digest delivery)
  - Opportunity Center (jobs with Haversine near-me, mentorship registry)
  - Marketplace (community classifieds)
  - Wellness Tracker (check-ins, goals, streaks)
  - Financial Hub (curated external resources)
  - Safety Resources (always accessible, no membership gate for emergency info)
  - Employer Transparency (cultural signals about workplaces)
```

---

### 2.11 Memberships and Entitlements

```
Entitlement enforcement (server-side):
  - Tier checked on every KinfolkAI call (TIER_LIMITS constants)
  - Family AI usage pool shared across seats
  - Business Growth Tools (promotions) require business owner role
  - Premium content gates checked at API level, not UI level only
  - Billing portal accessible via profile settings

Trial and email sequences:
  - 3-day, 1-day, expiry, and win-back email sequences
  - Deduplication tracking on user record (email not resent if already received)
```

---

### 2.12 Notifications

```
Notification types:
  - New circle invitation
  - Review response from business owner
  - Ambassador endorsement
  - Safety alert (high-severity, area-level)
  - Event reminder
  - Community mention
  - Weekly digest (topic library)
  - Membership status changes
  - KinfolkAI nudges (recommendation followup)

Delivery:
  - Push notifications (Expo Notifications)
  - In-app notification center
  - Email (Twilio/SendGrid for transactional)
```

📐 **PROPOSED:** Admin nudge system allows manual triggering of recommendation nudge emails. Admin panel shows last nudge send date (Task #50, pending implementation).

---

### 2.13 Admin and Moderation

```
Admin panel capabilities:
  - Member management (view, suspend, delete, role assignment)
  - Business management (approve, verify, suspend, remove)
  - Content moderation (review reported posts, events, reviews)
  - Safety incident review
  - DocuSign document management (seller agreements, founding agreements, verification)
  - Topic library management (seed, edit, archive topics)
  - Waitlist management
  - Export (CSV export of leads and outreach data — Task #35, pending)
  - Nudge triggers (Task #50, pending)

Access control:
  - Admin routes require isAdmin role (server-side check)
  - Admin panel accessible from web only (not mobile)
```

---

### 2.14 Data Retention and Deletion

```
Member deletion request:
  - Account deactivated immediately
  - Apple refresh token revoked (Apple TN3194 compliance)
  - Session invalidated
  - Personal data anonymized per retention policy
  - Community contributions (reviews, posts) anonymized but preserved (community value)
  - Safety reports preserved in anonymized aggregate

Data portability:
  ❓ UNRESOLVED: No formal data export / download-your-data flow exists yet
```

---

### 2.15 Mobile, Web, API, Database, AI, and Third-Party Dependencies

| Layer | Technology | Notes |
|-------|-----------|-------|
| Mobile | Expo SDK 57 / React Native 0.86 | iOS + Android, OTA updates via EAS |
| Web | React + Vite, served via Express | Members-only features gated via MembershipGate |
| API Server | Express 5 (Node.js) | Railway deployment, pnpm monorepo |
| Database | PostgreSQL via Drizzle ORM | Railway Postgres (production) |
| Auth | Replit OIDC + Apple Sign-In + Google Sign-In | Session-based, Express sessions |
| AI (Kinfolk) | OpenAI GPT (model configurable) | Replit AI Integrations proxy |
| Maps (iOS) | Apple Maps (PROVIDER_DEFAULT) | No Google Maps SDK on iOS |
| Maps (Android) | Google Maps Android SDK | API key in EAS Dashboard |
| Maps (Web) | Google Maps JS API | Key served server-side |
| Payments (mobile) | RevenueCat | iOS + Android subscriptions |
| Payments (web) | Stripe | Direct subscription + webhook |
| Crash reporting | Sentry (native) + internal crash logger | DSN set in EAS Dashboard |
| Push notifications | Expo Notifications | |
| SMS | Twilio | Phone-based auth flow |
| Document signing | DocuSign JWT | Admin-initiated; requires one-time consent |
| Storage | Railway Postgres (data), Replit Object Storage (files) | |
| Monitoring | Internal /api/readyz + health monitor | Railway process |
| Error tracking | Sentry (Build 99+) | |

---

## PART 3 — KINFOLK: COMPLETE FUNCTIONAL SPECIFICATION

*Based on founder-provided "KINFOLK'S ROLE IN THE ECOSYSTEM — NON-NEGOTIABLE" document, cross-referenced with current implementation state.*

### 3.1 Primary Purpose

✅ **CONFIRMED:** Kinfolk is **not a standalone chatbot**. It is the **permission-aware intelligence layer** that helps the ecosystem understand, organize, connect, and responsibly surface community knowledge.

Kinfolk has nine connected roles:
1. Personal Guide
2. Community Library and Resource Guide
3. Community Intelligence Interpreter
4. Business Trust and Growth Loop facilitator
5. Community Ambassador Loop facilitator
6. Journeys guide and creator
7. Ecosystem Feedback Loop participant
8. Cultural context provider
9. Safety-aware recommendation engine

---

### 3.2 Target Users

Every authenticated member may access Kinfolk at some tier. Depth of capability scales with membership tier:

| Tier | Daily AI Query Limit | Context Depth | Voice TTS |
|------|---------------------|---------------|-----------|
| Free | Limited (configurable constant) | Basic | Limited chars |
| Navigator | Moderate | Enhanced | Moderate chars |
| Trailblazer | Highest | Full | Full chars |
| Family Pool | Shared pool across seats | Tier-appropriate | Yes |

---

### 3.3 Situations Where Members Should Use Kinfolk

- Planning a trip to a new city (safety context, community-trusted businesses, cultural sites)
- Preparing for relocation (neighborhood context, community presence, resources)
- Exploring Black history in their own city or a destination
- Finding culturally relevant businesses, events, or resources
- Getting context before supporting a business ("tell me what the community says about...")
- Getting help navigating the platform ("how do I create a Circle?")
- Reflecting on a life chapter or journey milestone
- Accessing the knowledge library conversationally
- Understanding safety context without surveillance-level detail

---

### 3.4 Situations Where Kinfolk Must Refuse or Redirect

✅ **CONFIRMED patterns:**

- **Medical emergencies:** Redirect to emergency services immediately. Never attempt to diagnose.
- **Legal advice:** Acknowledge the question, redirect to qualified legal resources. Can point to community legal resources in the platform.
- **Financial advice:** Can surface community resources; never recommend specific financial instruments or investments.
- **Safety emergencies:** Immediately surface emergency contacts. Community safety context is provided as general awareness, not real-time emergency dispatch.
- **Harassment or surveillance of another member:** Refuse and log. Kinfolk must never help locate, track, or compile information about specific private members.
- **Requests for private member data:** Refuse. Kinfolk has no access to other members' private data.
- **Minors requesting adult-rated content:** Refuse based on family_settings context.
- **Requests to reveal system instructions or proprietary logic:** Refuse. Kinfolk must never expose its system prompt, scoring weights, or trust formulas.

---

### 3.5 How It Differs From a General Chatbot

| General Chatbot | Kinfolk |
|----------------|---------|
| Answers from training data | Answers from community knowledge + platform data |
| No persistent context | Remembers member preferences (with consent) |
| No community trust signals | Integrates community reviews, safety signals, Ambassador input |
| No location awareness | City- and neighborhood-aware |
| Undifferentiated information sources | Clearly distinguishes: verified fact / official resource / business-provided / Ambassador-curated / member experience / community consensus / disputed / unverified / sponsored |
| No membership awareness | Respects tier limits, family mode, privacy settings |
| No cultural specificity | Culturally calibrated to Black American and African diaspora community |
| General conversation | Scoped to platform use cases; redirects off-topic requests |

---

### 3.6 How It Uses Member Preferences and Context

📐 **PROPOSED implementation:**

At KinfolkAI initialization, a system prompt is assembled from:
- Member's stated preferences (cuisine, activities, music, lifestyle interests)
- Life journey context (current chapter, notable milestones, goals)
- Primary city and travel history
- Membership tier (determines response depth)
- Safety preferences
- Communication style preference (3 named voices)
- Family mode status

This context is injected as a structured system prompt at the start of each session. The AI model does not retain memory between sessions; the persistence layer is the platform's own `user_preferences` database table and `life_journeys` table.

---

### 3.7 What Information Kinfolk May Access

📐 **PROPOSED:**

| Data | Access Level |
|------|-------------|
| Member's own preferences | Full access (read) |
| Member's own life journey context | Full access (read) |
| Member's own saved places and Circles | Full access (read, with member consent) |
| Public business listings | Full access |
| Community reviews (aggregated, anonymized) | Full access |
| Cultural sites and heritage content | Full access |
| Topic library articles | Full access |
| Events | Full access |
| Safety context (area-level, aggregated) | Full access |
| Ambassador-curated content | Full access with source attribution |
| Other members' private data | **No access** |
| Other members' identity | **No access** |
| Exact safety report counts below privacy threshold | **No access** |
| Proprietary ranking weights | **No access** |

---

### 3.8 What Information Kinfolk Must Never Access

✅ **CONFIRMED (non-negotiable):**
- Other members' private messages
- Other members' location data
- Other members' private Circles or saves
- Individual safety report author identity
- Internal scoring weights or trust formulas
- Admin moderation decisions (specific cases)
- Payment or billing details of any member
- Any data the member has not consented to share with Kinfolk

---

### 3.9 How Consent Is Obtained

📐 **PROPOSED:**
- KinfolkAI onboarding (5-step) explicitly requests permission to remember preferences
- Members may update or delete preferences at any time via Profile → Settings → KinfolkAI
- Family mode consent is obtained at family settings setup
- Life journey context is opt-in (member initiates the journey flow)

❓ **UNRESOLVED:** Formal consent UI for "use my conversation to improve Kinfolk" has not been implemented. Conversations are not currently used for model training.

---

### 3.10 How Memory Works

📐 **PROPOSED:**
- **Explicit memory:** Stored in `user_preferences` table (lifestyle, cities, interests, communication style, dietary preferences, etc.)
- **Journey memory:** Stored in `life_journeys` and `entity_connections` tables
- **Session memory:** Multi-turn conversation history maintained within a session (not persisted across sessions)
- **No cross-session conversation history** is currently stored or injected

❓ **UNRESOLVED:** Whether cross-session conversation history should be stored (privacy vs. personalization tradeoff — confirmed open founder decision per Kinfolk Constitution).

---

### 3.11 How Members Review, Correct, Delete, or Disable Memory

📐 **PROPOSED:**
- Profile → Settings → KinfolkAI: view and edit all stored preferences
- Delete preferences: available, resets to defaults
- Disable Kinfolk entirely: available (feature flag per account)
- Life Journey deletion: available from the Life Journey screen

❓ **UNRESOLVED:** A formal "what does Kinfolk know about me" transparency screen has not been built. This is a required pre-launch item per the Community Intelligence Constitution (Principle #10: visibility as choice).

---

### 3.12 Conversation Privacy

✅ **CONFIRMED:** Conversations are private to the member. They are not:
- Shared with other members
- Shown to admins in normal operation
- Used to train the underlying AI model
- Sold or shared with third parties

📐 **PROPOSED:** Server-side, the conversation messages exist in-memory for the duration of the API request and are not persisted to the database.

❓ **UNRESOLVED:** Whether Kinfolk conversations should be logged for abuse investigation (privacy vs. safety tradeoff). Current implementation: no conversation logging.

---

### 3.13 How Recommendations Are Sourced and Verified

📐 **PROPOSED conceptual flow (proprietary formulas omitted):**

```
Member query (e.g., "recommend a soul food restaurant in Philadelphia")
  → KinfolkAI constructs retrieval parameters (category, city, filters)
  → Platform database query (businesses matching criteria)
  → Community trust context appended (reviews, safety signals, verification status)
  → Ambassador endorsement noted if present
  → Promotional placement flagged if present
  → Confidence level assessed (based on data volume — see Community Signal Strength Standard)
  → Response generated with source transparency
  → Member receives: recommendations + trust context + confidence level + source type labels
```

✅ **CONFIRMED:** Kinfolk must never present sponsored or promoted placement as organic community trust.

✅ **CONFIRMED:** Low-confidence recommendations must be labeled as such. Kinfolk must not manufacture confidence.

---

### 3.14 How Cultural Context Is Handled

✅ **CONFIRMED:** Cultural context is applied through the **two-layer registry** model (city as container; community knowledge as living layer within each city). Kinfolk does not apply cultural generalizations; it applies specific community knowledge for the specific city and context.

✅ **CONFIRMED:** Code-switching and communication style are handled via the **three-setting voice decoupling** model. Members choose how Kinfolk communicates with them.

✅ **CONFIRMED:** Kinfolk must never stereotype based on demographic characteristics. Cultural specificity comes from community-contributed knowledge, not from assumptions about a member's background.

---

### 3.15 How Location and Safety Context Are Handled

📐 **PROPOSED:**
- Location context = city-level (not precise GPS) unless the member explicitly initiates a location-aware feature (maps, near-me)
- Safety context = area-level aggregates (never individual report attribution)
- Kinfolk surfaces safety context as **community awareness**, not surveillance or personal risk scoring
- Kinfolk will note safety signals when recommending destinations but will not generate fear-based or discriminatory location guidance

---

### 3.16 How Minors and Family Accounts Are Handled

📐 **PROPOSED:**
- Family mode is activated via family_settings
- Kinfolk respects audience ratings (content_rating field on posts, events, articles)
- Adult-rated content is blocked when family mode is active
- Kinfolk will not discuss age-inappropriate topics with accounts flagged as minor or in family mode
- 18+ gate at account creation (date of birth required); accounts under 18 not currently supported

❓ **UNRESOLVED:** Whether a supervised minor account type (13-17) will be introduced. Current stance: 18+ only.

---

### 3.17 How Legal, Medical, Financial, Emergency, and Safety Questions Are Handled

| Question Type | Kinfolk Behavior |
|--------------|-----------------|
| Medical emergency | "Please call 911 or your local emergency number immediately." No diagnosis attempt. |
| Mental health crisis | Surfaces crisis resources (988 Lifeline, etc.). Never provides clinical guidance. |
| Legal question | Acknowledges. Surfaces community legal resources from platform library. Cannot provide legal advice. |
| Financial question | Can surface community resources (financial hub). Cannot recommend specific financial products. |
| Safety emergency | Immediately surfaces emergency contacts. General safety context provided as awareness only. |
| Safety threat to self or others | Surfaces crisis resources. Escalation to human review is not yet implemented. |
| General safety question | Provides area-level community context. Clearly labels source (community reports vs. verified). |

---

### 3.18 How Member-Generated vs. Verified Information Is Distinguished

✅ **CONFIRMED (non-negotiable per Kinfolk's Role document, Section 2):**

Kinfolk must clearly distinguish among:
- Verified facts (platform-reviewed documentation)
- Official resources (government, institutional)
- Business-provided information (self-reported, may be promotional)
- Ambassador-curated information (trusted but individual perspective)
- Member experiences (individual lived experience)
- Community consensus (pattern across multiple independent member contributions)
- Disputed claims (conflicting community signals)
- Unverified submissions (submitted but not reviewed)
- Paid or sponsored information (ALWAYS labeled)

These categories must never be flattened into a single undifferentiated answer.

---

### 3.19 How Misinformation, Hallucinations, Bias, and Outdated Information Are Controlled

📐 **PROPOSED controls:**

| Risk | Control |
|------|---------|
| Hallucination | Kinfolk responses about specific businesses, places, or events are grounded in platform database lookups — not generated from training data alone |
| Outdated information | Data recency labels ("last updated," "last reviewed") surfaced where available |
| Bias | Cultural calibration through community-contributed knowledge; periodic human review of response patterns |
| Low-confidence responses | Confidence signals from Community Signal Strength Standard (5 dimensions: Prevalence, Volume, Momentum, Relevance, Confidence) |
| Sponsored content presentation | Hard rule: promotional placement always labeled; AI response generation explicitly instructed to distinguish organic vs. paid |

❓ **UNRESOLVED:** Formal human review cadence for Kinfolk response quality has not been established.

---

### 3.20 How Kinfolk Behaves When Confidence Is Low

📐 **PROPOSED:**
- Explicitly states uncertainty: "The community has limited feedback on this area"
- Provides fewer or no specific recommendations rather than manufacturing confidence
- Suggests alternative ways to find the information (check the map, browse the business list, ask the community)
- Never generates fabricated reviews, ratings, or safety context

---

### 3.21 How Businesses, Sponsorships, and Organic Recommendations Are Separated

✅ **CONFIRMED:** This is non-negotiable. Three categories exist:

1. **Organic community trust** — businesses surfaced because of community nominations, verified status, reviews, and cultural relevance
2. **Ambassador-curated** — explicitly attributed to a named Ambassador perspective
3. **Promoted/sponsored** — businesses that have purchased promotional placement through the Growth Tools system (ads, featured placement, etc.) — **always labeled**

KinfolkAI must never present category 3 as category 1. The system prompt includes explicit instructions to this effect.

---

### 3.22 How Abuse, Manipulation, Prompt Injection, Harassment, and Surveillance Are Prevented

📐 **PROPOSED:**

| Attack Type | Control |
|-------------|---------|
| Prompt injection | System prompt construction is server-side; user input is parameterized, not concatenated into system instructions |
| Jailbreak attempts | Model-level safety settings; platform-level logging of flagged patterns (not yet fully implemented) |
| Member surveillance requests | Kinfolk has no access to other members' data regardless of how the request is phrased |
| Competitive manipulation | Trust signals require minimum sample sizes before surfacing (privacy threshold) |
| Coordinated review bombing | Community Signal Strength Standard includes manipulation detection rules; admin review queue |
| Harassment via Kinfolk output | Content filtered through model safety settings; reported output reviewed by admin |

❓ **UNRESOLVED:** Formal prompt injection audit has not been completed. This is a recommended pre-launch gate.

---

### 3.23 How Kinfolk Is Monitored, Audited, and Improved

📐 **PROPOSED (partially implemented):**

- KinfolkAI usage tracked via `voice_usage` table (TTS usage) and AI call counters
- Pool exhaustion prevention: authenticated-only route, lightweight health probe separate from chat endpoint
- Error logging: Sentry (Build 99+) captures exceptions; Railway logs capture API errors

❓ **UNRESOLVED:** 
- No A/B testing infrastructure for response quality
- No automated response quality scoring
- No systematic audit cadence for response bias or accuracy
- No human escalation path for Kinfolk-generated harm

---

### 3.24 Failure Modes and Graceful Fallbacks

✅ **CONFIRMED (non-negotiable per Kinfolk's Role document, Section 8):**

Core platform functions must work when Kinfolk is unavailable. Members must still be able to:
- Access saved items
- Browse permitted community information
- View businesses and events
- Access safety information
- Use Circles
- Review resources
- Report concerns
- Manage their account

📐 **PROPOSED implementation:**
- Kinfolk routes are isolated (`/api/kinfolk/*`) — failure in Kinfolk does not affect other platform routes
- UI surfaces a graceful "Kinfolk is temporarily unavailable" message when the endpoint returns an error
- All discovery features (map, business list, events, safety hub) are fully functional without Kinfolk
- Safety resources (emergency contacts, crisis lines) are hardcoded into the client — no API dependency

---

### 3.25 Availability, Outage Behavior, and Cost Controls

📐 **PROPOSED:**

| Control | Current State |
|---------|--------------|
| Model provider | OpenAI via Replit AI Integrations proxy (portable to other providers via API key swap) |
| Usage limits | Per-tier daily limits enforced server-side via TIER_LIMITS constants |
| Family pool limits | Shared pool tracked in `family_ai_usage` table, checked before each call |
| Cost monitoring | Railway logs; no automated cost alerting yet |
| Outage behavior | 503 response → UI shows graceful fallback message |
| Provider failover | Not implemented; single provider dependency |

❓ **UNRESOLVED:** No automated cost alerting or circuit breaker if AI spend spikes unexpectedly.

---

### 3.26 Model-Provider Portability

📐 **PROPOSED:**
- All Kinfolk calls route through a single function (`buildSystemPrompt` + OpenAI client)
- The OpenAI client uses Replit AI Integrations proxy, configurable via environment variable
- Migration to a different provider (Anthropic, Gemini, etc.) requires: new client configuration + system prompt review for provider-specific formatting
- No model-specific features are used that would prevent migration

Tasks #39 (upgrade GPT-4o → GPT-5) and #40 (upgrade GPT-4o-mini → GPT-5-mini) are pending.

---

### 3.27 Logging and Observability

📐 **PROPOSED (Build 99 state):**

| Layer | Tool | Coverage |
|-------|------|----------|
| Native crashes (iOS/Android) | Sentry (Build 99+) | SIGABRT, SIGSEGV, OOM |
| JS exceptions | Sentry + internal crash logger | ErrorBoundary, global error handler, unhandled rejections |
| API errors | Railway logs (pino) | All Express route errors |
| Pool health | /api/readyz + health monitor | Every 5 minutes |
| KinfolkAI calls | Railway logs | Request/response timing |
| AI usage per tier | family_ai_usage table | Counted per call |

---

### 3.28 Human Escalation and Reporting

📐 **PROPOSED (partially implemented):**
- Members can report content (posts, reviews, businesses, events) via report flows
- Reports enter admin review queue (admin panel)
- No direct Kinfolk-specific escalation path (e.g., "this Kinfolk response was harmful")

❓ **UNRESOLVED:** Kinfolk-specific feedback mechanism ("this response was wrong/harmful") not yet built.

---

## PART 4 — ARCHITECTURE AND IMPLEMENTATION PLAN

### 4.1 Features That Must Exist Before Launch

| Feature | Current State | Gap |
|---------|--------------|-----|
| Waitlist-gated admission | ✅ Complete | None |
| Authentication (email, Apple, Google) | ✅ Complete | Physical device test required (Build 99 gate) |
| Members-only content gating | ✅ Complete | None |
| Business discovery (map + list) | ✅ Complete | None |
| Safety reporting | ✅ Complete | None |
| Community feed | ✅ Complete | None |
| KinfolkAI (basic) | ✅ Complete | Source map symbolication pending |
| Crash reporting (Sentry) | ✅ Complete (Build 99) | Physical device verification required |
| Pool exhaustion prevention | ✅ Complete (Build 99) | 48-check soak test in progress (~3.8h remaining) |
| Members-only onboarding language | ✅ Complete | None |
| Philadelphia launch content | ✅ Complete | None |
| OTA update infrastructure | ✅ Complete | OTAs published |

---

### 4.2 First Post-Launch Builds (Prioritized)

| Feature | Priority | Notes |
|---------|----------|-------|
| Sentry source map symbolication | Launch-critical | Requires SENTRY_ORG + SENTRY_PROJECT from founder |
| Admin: show last nudge send date | High | Task #50 |
| Admin: Export CSV | High | Task #35 |
| Prevent stale role on DB failure | High | Task #32 |
| Add role to OpenAPI spec | Medium | Task #33 |
| Spinning indicator on Refresh button | Medium | Task #41 |
| GPT-5-mini upgrade | Medium | Task #40 |
| GPT-5 upgrade | Medium | Task #39 |
| New domain email addresses | Medium | Task #18 |
| Privacy Policy page (App Store requirement) | Launch-critical | Task #19 |
| KinfolkAI "what do you know about me" transparency screen | High | Required per Community Intelligence Constitution |

---

### 4.3 Later Roadmap

Per Build-Phase Inventory (docs/product/MWM-BUILD-PHASE-INVENTORY-v1.0.md):

- Builds 99–106+: Trust phases, advanced Kinfolk capabilities, Community Health Profile, HBCU map flagship, employer transparency, full Journey system, social graph expansion, creator monetization

---

## PART 5 — KNOWN RISKS AND OPEN QUESTIONS

### 5.1 Technical Risks

| Risk | Severity | Current State |
|------|----------|--------------|
| Pool exhaustion (Railway Postgres) | P0 | Four architectural fixes applied (Build 99); 48-check soak test in progress |
| OTA / native binary version mismatch | High | runtimeVersion pinned as string "1.1.5-native.2"; Build 99 native binary required |
| Apple Sign-In iOS 26+ nonce enforcement | High | Implemented (expo-crypto SHA256 nonce); needs fresh physical device test |
| Google Maps iOS pod failure | Resolved | ios.config.googleMapsApiKey intentionally omitted (see memory: rn-maps-duplicate-fix.md) |
| Sentry source map upload | Medium | SENTRY_ALLOW_FAILURE=true applied; symbolication incomplete pending org/project configuration |
| Stale role served if DB lookup fails | Medium | Task #32 pending |
| TS type errors (pre-existing, non-blocking) | Low | 7 pre-existing errors documented; none affect runtime behavior |

---

### 5.2 Privacy Concerns

| Concern | Status |
|---------|--------|
| Cross-session Kinfolk conversation storage | Unresolved — conversations not currently stored |
| "What does Kinfolk know about me" transparency screen | Not built; required per Constitution Principle #10 |
| Safety report attribution protection | Implemented (aggregation, minimum sample size) |
| Family mode minor protection | Implemented; no supervised minor account type yet |
| Data export / portability | Not implemented |
| Kinfolk conversation logging for abuse investigation | Unresolved policy question |

---

### 5.3 Safety Concerns

| Concern | Status |
|---------|--------|
| Kinfolk handling crisis situations | Partial — emergency redirect language exists; no human escalation path |
| Safety report manipulation / false reports | Admin review queue exists; no automated manipulation detection |
| Sundown Towns data | Architecture ready; implementation blocked on 9 pre-implementation gates including 6 open founder questions |
| Member stalking / surveillance via platform | Guards in place; Kinfolk cannot access other member data; formal audit not completed |

---

### 5.4 Legal / Compliance Concerns

| Concern | Status |
|---------|--------|
| Privacy Policy page | Not yet built; Task #19, App Store requirement |
| GDPR / CCPA compliance | No formal assessment completed |
| Data retention policy | Partially documented; no formal policy document published |
| Apple Sign-In account deletion compliance (TN3194) | Implemented (token revocation on delete) |
| Minor account compliance (COPPA) | 18+ gate enforced; no formal COPPA assessment |
| Terms of Service | Not verified whether current ToS covers AI-generated content |

---

### 5.5 Moderation Challenges

| Concern | Status |
|---------|--------|
| AI-generated content submitted to community feed | No detection or labeling system |
| Coordinated nomination or review manipulation | Signal Strength Standard defines detection rules; not yet fully implemented |
| Ambassador conflict of interest | Disclosure framework not yet built |
| Content rating accuracy (audience ratings on posts/events) | Self-reported by poster; no automated classification |

---

### 5.6 AI Reliability Issues

| Concern | Status |
|---------|--------|
| Hallucination in business recommendations | Mitigated by grounding in DB lookup; residual risk from AI supplementing with training data |
| Bias in cultural recommendations | No formal audit completed |
| Outdated business information presented confidently | Data recency signals not yet injected into Kinfolk context |
| KinfolkAI response quality monitoring | Not implemented |
| Single AI provider dependency | OpenAI only; no failover |

---

### 5.7 Scalability and Cost Concerns

| Concern | Status |
|---------|--------|
| Database connection pool exhaustion at scale | 4 architectural fixes applied; soak test in progress |
| AI API cost at scale | Per-tier limits enforced; no automated cost alerting |
| Railway single-server deployment | No auto-scaling; acceptable for current user volume |
| Object storage cost at scale | Not assessed |

---

### 5.8 App Store / Google Play Concerns

| Concern | Status |
|---------|--------|
| Privacy Policy page required by App Store | Task #19, not yet built |
| Apple TN3194 account deletion compliance | Implemented |
| App Store review account (with content access) | Required in App Store Connect before submission |
| Prior rejection root cause (Build 96) | DB outage during review; not an Apple code violation |

---

### 5.9 Data Quality Concerns

| Concern | Status |
|---------|--------|
| Business data completeness (lat/lng, hours, photos) | Variable; some businesses have incomplete data |
| Cultural site data completeness | Limited initial seed; Philadelphia-focused for launch |
| Topic library content quality | 70+ topics seeded; content quality not formally reviewed |
| Safety report geographic coverage | Limited to member-submitted reports; coverage gaps in under-represented cities |

---

### 5.10 Conflicts Between Current Implementation and Founder Vision

| Item | Conflict | Status |
|------|----------|--------|
| Kinfolk cross-session memory | Vision: lifelong companion with memory. Implementation: no cross-session storage. | ❓ Open founder decision on privacy/personalization tradeoff |
| Kinfolk "what do you know about me" screen | Vision: visibility as choice (Constitution Principle #10). Implementation: not built. | Required pre-launch |
| Community Intelligence feedback loop | Vision: full loop from contribution → moderation → verification → confidence → Kinfolk → member action → new feedback. Implementation: contribution + moderation + basic aggregation exist; confidence scoring and full loop not complete. | Multi-build roadmap |
| Ambassador compensation | Vision suggests economic participation. Implementation: no compensation mechanism. | ❓ Open founder decision |
| Sundown Towns | Vision: cultural sites include historical trauma sites. Implementation: architecture ready, blocked on founder gates. | 9 pre-implementation gates, 6 open questions |
| Trust Engine | Vision: explainable, community-visible trust signals. Implementation: trust signals exist but Trust Engine demonstration layer not built. | Deferred pending Railway stability |

---

## PART 6 — COMPLETION EVIDENCE

### 6.1 Document Version

| Field | Value |
|-------|-------|
| Document version | 1.0 |
| Repository commit reviewed | `123527c9` |
| Date | 2026-07-29 |
| Build | iOS #99 / Android VC74 |
| App version | 1.1.5 |
| Runtime version | 1.1.5-native.2 |
| Production URL | https://www.mappingwithmelanin.com |

---

### 6.2 Feature Inventory (Existing at Build 99)

**Authentication and Identity**
- ✅ Email / password authentication
- ✅ Apple Sign-In (nonce-enforced, iOS 26+ compatible)
- ✅ Google Sign-In
- ✅ Phone-based login
- ✅ Password reset (6-digit code)
- ✅ Profile setup (4-step onboarding)
- ✅ Date of birth gate
- ✅ Biometric authentication
- ✅ Account deletion with Apple token revocation

**Membership and Billing**
- ✅ Free / Navigator / Trailblazer tiers
- ✅ Family plan (add-on seats, shared AI pool)
- ✅ Stripe web subscriptions + webhooks
- ✅ RevenueCat iOS/Android subscriptions
- ✅ Trial email sequences (4 types)
- ✅ MembershipGate web component
- ✅ UpgradeModal mobile component
- ✅ Billing history
- ✅ Waitlist-gated admission
- ✅ Invite system

**Business Discovery**
- ✅ Business map (iOS: Apple Maps, Android: Google Maps, Web: Google Maps JS)
- ✅ Business list with category filters
- ✅ Business detail (photos, hours, contact, reviews, owner response)
- ✅ Business claim and verification flow
- ✅ Nomination flow
- ✅ Community Reference listings (uncontacted)
- ✅ Hidden Gem designation
- ✅ Ownership badges (BlackOwnedBadge, OwnershipBadges component)
- ✅ Business Growth Tools (promotions, 5 placement types, Stripe-powered checkout)
- ✅ Business owner dashboard
- ✅ Owner response to reviews
- ✅ Business move alerts
- ✅ Weekly schedule calendar
- ✅ Business preview cards

**Safety**
- ✅ Safety incident reporting
- ✅ Neighborhood safety surveys
- ✅ Safety hub (resources, wellness, safety-aware discovery)
- ✅ Safety map layer
- ✅ Community safety context in business detail
- ✅ Family safety settings (audience ratings, family mode)

**Community Feed**
- ✅ Post creation (text, link, image, shared saved place)
- ✅ Audience rating (Everyone / Teen / Young Adult / Adult)
- ✅ Location tagging (city/venue level)
- ✅ Hashtags (tappable, followable)
- ✅ Link preview (auto-generated)
- ✅ Reactions, comments, reposts
- ✅ For You / Following toggle
- ✅ Visibility picker (public / connections / private)
- ✅ Reporting
- ✅ Social profile (visitor profile screen)

**Events**
- ✅ Event creation (Organizer / Business Owner)
- ✅ Events discovery tab
- ✅ Event detail with RSVP
- ✅ Events in KinfolkAI context

**Circles**
- ✅ Circle creation (privacy, name, description)
- ✅ Saved places in Circles
- ✅ Circle discussion
- ✅ KinfolkAI curator mode (votes / random / by member)
- ✅ Tier limits on Circle count

**KinfolkAI**
- ✅ Multi-turn conversation
- ✅ Tier-limited daily usage
- ✅ Family AI usage pool
- ✅ Preference injection (lifestyle, city, communication style)
- ✅ Life journey context injection
- ✅ Three-voice communication style system
- ✅ TTS "Listen" button (voice_usage tracking)
- ✅ KinfolkAI onboarding (5-step preference collection)
- ✅ Circle curator mode

**Cultural Heritage**
- ✅ Cultural sites map layer (11 category pins, ON by default)
- ✅ Cultural heritage detail screen
- ✅ HBCU campus entries
- ✅ Library horizontal scroll (16 live site cards)
- ✅ Deep-link from map to heritage detail

**Resources**
- ✅ Topic Library (70+ topics, 3-tab UI: Library / Browse / Issues)
- ✅ Topic delivery preferences
- ✅ Opportunity Center (jobs with near-me GPS, mentorship profiles)
- ✅ Marketplace (community classifieds)
- ✅ Wellness Tracker
- ✅ Financial Hub

**Notifications**
- ✅ Push notification infrastructure
- ✅ In-app notification center
- ✅ Email sequences (trial, membership)
- ✅ Recommendation nudge (admin-triggered)

**Admin**
- ✅ Admin panel (web)
- ✅ Member management
- ✅ Business approval and verification
- ✅ Content moderation queue
- ✅ Safety incident review
- ✅ DocuSign integration (3 document types)
- ✅ Topic library management
- ✅ Waitlist management

**Crash Reporting and Monitoring**
- ✅ Internal crash logger (JS exceptions, unhandled rejections, ErrorBoundary)
- ✅ Sentry integration (native crash capture, Build 99+)
- ✅ /api/readyz pool health monitoring
- ✅ Debug crash log screen (with Sentry test panel)

---

### 6.3 Unresolved-Decision Register

| # | Decision Required | Impact |
|---|------------------|--------|
| 1 | Ambassador compensation model | Cannot build Ambassador economic features without this |
| 2 | Cross-session Kinfolk memory (privacy vs. personalization) | Determines whether lifelong companion vision is achievable without major privacy controls |
| 3 | Kinfolk conversation logging for abuse investigation | Privacy policy, Trust & Safety architecture |
| 4 | Supervised minor account type (13-17) | COPPA compliance, family plan expansion |
| 5 | Sundown Towns implementation (6 open questions) | Historical trauma data; requires full founder input before any implementation |
| 6 | Community Health Profile public vs. member-only visibility | Affects PR, App Store description, trust positioning |
| 7 | Tour Activation and city type definitions | Platform-ready; Tour Status is founder-controlled separately |
| 8 | Ambassador journey compensation and conflict-of-interest disclosure model | Required before Ambassador-curated content is presented to members |
| 9 | Formal data retention and deletion policy | Legal/compliance requirement |
| 10 | Privacy Policy page content (before App Store submission) | Task #19 — must be authored and published |

---

### 6.4 Assumptions Requiring Founder Approval

1. The platform will remain **18+ only** for the foreseeable launch phase (no teen accounts).
2. Ambassadors are **recognized contributors**, not compensated employees or contractors, until the compensation model is decided.
3. Charlotte, NC remains a supported platform city; Philadelphia, PA leads the launch content.
4. Kinfolk will use **OpenAI as the sole AI provider** until an explicit decision to add failover.
5. The current **5-tier trust architecture** (Free / Navigator / Trailblazer / Family / Business) is complete for launch; no additional tiers before Build 99 submission.
6. Source maps for Sentry will be uploaded in the next build after `SENTRY_ORG` and `SENTRY_PROJECT` are provided.

---

*End of document. This package is read-only. No implementation changes were made in its preparation.*

*Prepared by: Replit Agent (main)*  
*Review requested by: Founder*  
*Intended recipient: Independent Auditor (Manus)*
