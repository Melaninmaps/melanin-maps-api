# Replit Codebase Audit — August 5, 2026

> **Reference only. No changes made from this document.**
> Audit baseline: commit `504ce15b` (animated preview page)
> Current production as of audit filing: `07c11d78` (built from `cfecc74707d5`)

---

## WHAT REPLIT HAS ACTUALLY BUILT (verified in code)

### Server Routes (200+ endpoints exist)

#### CORE FEATURES (FUNCTIONAL)
- **Auth:** login-email, Apple Sign-In, register, forgot-password, reset-password, logout
- **Businesses:** full CRUD, search, categories, broadcasts, identity, improvement suggestions
- **Cultural Sites:** full CRUD, reseed, stories
- **Events:** CRUD with RSVP
- **Reviews:** create, photos, thumbs-up
- **Community Posts:** full CRUD
- **Map:** directions, safety-context, embed-url, nav-voice
- **Waitlist:** join, count, invite, leaderboard, my-entry, recommend-business, social-refer
- **Notifications:** register, preferences, mark-read
- **Admin:** users, businesses, metrics, invites, seed endpoints

#### KINFOLK AI (PARTIALLY BUILT — 74 references in kinfolk.ts)
- `/kinfolk/chat` — conversational AI
- `/kinfolk/speak` — voice interaction
- `/kinfolk/transcribe` — speech-to-text
- `/kinfolk/business-action-plan` — business intelligence
- `/kinfolk/community-trends` — trend analysis
- `/kinfolk/expansion-analysis` — growth analysis
- `/kinfolk/feedback` — user feedback
- `/kinfolk/health` — system health
- `/kinfolk/lists` — curated lists
- `/kinfolk/log-search` — search logging
- `/kinfolk/memory-summary` — user memory
- `/kinfolk/preferences` — user preferences
- `/kinfolk/proactive` — proactive recommendations
- `/kinfolk/relocation` — relocation assistance
- `/kinfolk/sessions` — conversation sessions
- `/kinfolk/tasks` — task management
- `/kinfolk/tasks/bulk` — bulk tasks
- `/kinfolk/twin-recommendations` — personalized recs
- `/kinfolk/voice-usage` — voice analytics
- `/kinfolk/aave-level` — cultural language level
- `/kinfolk/skip-feedback` — skip feedback

#### SAFETY FEATURES (PARTIALLY BUILT)
- `/safety/checkins` — check-in system
- `/safety/heatmap` — safety heatmap
- `/safety/location-shares` — location sharing
- `/safety/officer-watch` — police monitoring
- `/safety/officer-watch/pending` — pending reports
- `/safety-tips` — safety tips
- `/safety-tips/nearby` — location-based tips
- `/safety-context` — route safety context
- `/safety-context/supported` — supported areas
- `/reports` — incident reports
- `/reports/proximity-warnings` — nearby warnings
- `/incidents` — incident tracking

#### PARTNERSHIP TRACKING (BUILT)
- `/external-clicks` — tracks clicks to business/institution websites
  - Captures: `institutionName`, `institutionType`, `institutionUrl`, `referenceType`, `referenceId`, `source`, `isSafetyRelated`, `city`, `state`, `userId`
  - Comment in code: "Users clicking through to a business/employer website → tracked here"
- `/external-clicks/analytics` — analytics dashboard for click data

#### REFERRAL SYSTEM (BUILT)
- `/referrals/my-code` — get user's referral code
- `/referrals/track` — track referral conversions
- `/waitlist/leaderboard` — city leaderboard
- `/waitlist/social-refer` — social sharing referral
- `/waitlist/recommend-business` — recommend a business

#### WAITLIST (BUILT — accepts these fields)
- `email`, `firstName`, `lastName`, `city`, `state`
- `isBusinessOwner`, `websiteUrl`
- `referralCode`, `referredBy`
- `familyEmails` (up to 6)
- `cityNomination`
- `previewChoice` (safety, discovery, business, community) — **NOTE: "ambassador" NOT yet added** *(fixed Aug 5, 2026)*
- UTM tracking (`utmSource`, `utmMedium`, `utmCampaign`)

#### TRAVEL & JOURNEYS
- `/travel-planner/generate` — AI trip planning
- `/travel/flights` — flight search
- `/travel/flights/status` — flight status
- `/travel/recommendations` — travel recs
- `/journeys` — life journeys
- `/journeys/types/list` — journey types

#### FINANCIAL
- `/financial/goals` — financial goals
- `/financial/resources` — financial resources

#### WELLNESS
- `/wellness/checkin`, `/wellness/goals`, `/wellness/meetings`, `/wellness/streak`
- `/wellness/crisis-resources`

#### MARKETPLACE
- `/marketplace` — listings
- `/marketplace/categories`
- `/marketplace/my/listings`
- `/marketplace/saved`
- `/marketplace-fees/config`, `/marketplace-fees/my`

#### KNOWLEDGE HUB
- `/knowledge/articles`, `/knowledge/bookmarks`, `/knowledge/categories`
- `/knowledge/delivery-preferences`, `/knowledge/digest`
- `/knowledge/experts`, `/knowledge/feed`, `/knowledge/happening-now`
- `/knowledge/hubs/resolve`, `/knowledge/issues`, `/knowledge/topics`

#### OTHER FEATURES
- **Mentorship:** `/mentorship`, `/mentorship/me`, `/mentorship/specialties`
- **Jobs:** `/jobs`, `/jobs/my-posts`, `/jobs/saved`
- **Groups:** `/groups`, `/groups/my-invites`
- **Guides:** `/guides` (create, list, detail)
- **Spaces:** `/spaces`, `/space-reports`
- **Stories:** `/stories`
- **Vibes:** `/vibes/list`, `/vibes/search`, `/vibes/tag`, `/vibes/my-tags`
- **Smart Pathways:** `/smart-pathways/compare`, `/smart-pathways/meta`, `/smart-pathways/pins`
- **Points/Rewards:** `/points`, `/rewards`, `/redemptions`
- **Saved Places:** `/saved-places`, `/saved-locations`
- **Lists:** `/lists`
- **Wishlist:** `/wishlist`
- **Show Love:** `/show-love`, `/show-love/spotlight`
- **Hashtags:** `/hashtags/trending`, `/hashtags/search`, `/hashtags/following`
- **Alerts:** `/alerts`
- **Signals:** `/signals`
- **Surveys:** `/surveys`
- **DocuSign:** `/docusign/*` (consent, seller agreement, webhook)
- **Stripe/Billing:** `/stripe/`, `/billing/`
- **RevenueCat:** `/revenuecat/sync`, `/revenuecat/webhook`

---

### Mobile Screens (100+ screens exist)

Key screens: discover, map, community, profile, events, businesses, cultural-heritage, safety-hub, kinfolk-memory, kinfolk-settings, kinfolk-tasks, life-journey, travel-planner, financial-hub, health-hub, marketplace, mentorship, jobs, groups, guides, spaces, vibe-search, smart-search, creator-profile, creator-public, dashboard, referral, waitlist, preview, onboarding (5 screens)

#### Onboarding Flow (5 screens)
1. `/onboarding/index` — Welcome/intro
2. `/onboarding/safety` — Safety preferences
3. `/onboarding/travel` — Travel interests
4. `/onboarding/identity` — "Who Do You Want to Support?" (ownership designations + diaspora countries)
5. `/onboarding/agreement` — Terms
6. `/onboarding/join` — Final join

#### Identity screen collects
- Ownership designations (which communities to support)
- Diaspora countries (via `DiasporaFlagPicker`)
- Stored in `AsyncStorage` as `PENDING_OWNERSHIP_PREFS_KEY`

---

## WHAT'S MISSING / NOT CONNECTED

1. **previewChoice "ambassador"** — waitlist only accepted: safety, discovery, business, community. *(Fixed Aug 5, 2026)*
2. **Onboarding data → Kinfolk AI** — Identity preferences stored in AsyncStorage but unclear if they feed into Kinfolk's recommendation engine on the server
3. **Allied Business distinction** — No clear tier system (minority-owned vs. community-verified non-minority)
4. **Business accountability/discrimination scoring** — Safety reports exist but no automated deprioritization logic
5. **Diaspora international business additions** — No specific flow for adding businesses in other countries
6. **Life-stage intelligence triggers** — Journeys exist but unclear if they proactively prompt based on behavior patterns
7. **Creator content matching** — Creator profiles exist but no demand-signal matching to creators
8. **Font scaling** — ZERO protection (`allowFontScaling` not set anywhere)
