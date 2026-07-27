# AUDIT-004 — Community Member Experience Audit

| Field | Value |
|-------|-------|
| **Audit ID** | AUDIT-004 |
| **Area** | Community Member — Full Lifecycle |
| **Date** | July 26, 2026 |
| **Phase** | 0 — Read-Only Audit |
| **Status** | COMPLETE — findings delivered for founder review |
| **Scope** | Registration, onboarding, first use, returning use, progression, capability access |
| **Code changes made** | None |

---

## Audit Summary

The Community Member experience has significant infrastructure in place — a rich user schema, a 5-screen onboarding flow, 8 primary tabs, and a database-level trust progression system. However, the progression system is **entirely invisible to the member**. Members join with no identity moment, progress with no feedback, and contribute with no recognition. The platform knows a member's trust level, reputation score, and contribution history — but never tells the member.

The second major finding: **"Community Member" does not exist as a database-level role.** It is a documentation and UI label applied to all `individual` accounts. There is no moment in the registration or onboarding flow where a person becomes a Community Member.

---

## 1. Current State — What Exists Today

### Registration

Three auth methods implemented:
- **Email + password** — full flow, email verification token, login screen
- **Apple Sign-In** — iOS only, JWKS-verified JWT, nonce-enforced (iOS 26+)
- **Phone (SMS OTP)** — infrastructure present (Twilio Verify), phone-login.tsx screen

On registration, every user receives:
- `role = "user"` (one of: user, tester, admin)
- `memberType = "individual"` (the Community Member state)

**Critical finding:** There is no "community_member" role or member type at the database level. The term "Community Member" is used in documentation and UI copy but is never set on the account. All standard sign-ups receive `individual`. The other member types (`navigator`, `trailblazer`, `community_builder`, `legacy_member`, `business`, `founding`, `beta`, `business_referral`) are assigned post-registration.

### Onboarding

Five-screen flow in `artifacts/mobile/app/onboarding/`:

| Screen | File | Content |
|--------|------|---------|
| 1. Welcome | index.tsx | "Map Your Life. Connect Deeper. Live With Purpose." |
| 2. Safety | safety.tsx | "Travel Smarter. Travel Informed." — community safety scores |
| 3. Travel | travel.tsx | "Plan Your Journey Your Way." — KinfolkAI itineraries |
| 4. Identity | identity.tsx | "Who Do You Want to Support?" — 10 designation preferences |
| 5. Join | join.tsx | "Connect With a Global Community." — Create Account / Login / Waitlist |

The Join screen CTA is: **"Create Account — It's Free"**

There is no mention of becoming a "Community Member." No community language. No sense of joining something with specific meaning. The value proposition is functional ("It's Free") rather than identity-based ("Become Part of This Community").

A "Join the Waitlist" option also exists on the join screen — meaning some users see the onboarding but cannot register.

### Profile Setup (Post-Signup)

A 4-step profile setup flow exists at `artifacts/mobile/app/profile-setup.tsx`:
- Completed after signup
- Sets `profileSetupComplete = true` on the user record
- Fields collected: name, username, bio, home city, industry, role identity (business owner, content creator, community organizer)

**Finding:** The profile setup sets functional identity fields but does not include:
- A welcome moment ("You're now a Community Member of Mapping With Melanin™")
- Any introduction to what Community Member means
- Any explanation of how to progress to Contributor or Trusted Contributor

### User Schema — What Exists

The `users` table (`lib/db/src/schema/auth.ts`) is remarkably rich. Key fields for the Community Member experience:

**Progression fields (exist but invisible to member):**
| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `trustLevel` | integer | 1 | Community trust score (1–4) |
| `reputationScore` | integer | 0 | Contribution reputation |
| `identityVerified` | boolean | false | Identity verification complete |
| `helpfulReviewsCount` | integer | 0 | Count of upvoted reviews |
| `policyViolationsCount` | integer | 0 | Moderation record |

**Role identity fields:**
| Field | Type | Default |
|-------|------|---------|
| `isBusinessOwner` | boolean | false |
| `isContentCreator` | boolean | false |
| `isCommunityOrganizer` | boolean | false |
| `isInfluencer` | boolean | false |

**Social fields:**
| Field | Type |
|-------|------|
| `followersCount` | integer |
| `followingCount` | integer |
| `bio` | varchar(300) |
| `homeCity` | varchar(100) |
| `username` | varchar(30) unique |

**Privacy fields:**
| Field | Default |
|-------|---------|
| `isPrivate` | false |
| `showCity` | true |
| `allowDm` | true |
| `displayNameFormat` | "full" |

**Notification fields (8 granular toggles):**
- notifEvents, notifBusiness, notifMessages, notifReviews, notifCommunity, notifPromotions, notifDigest, notifTips
- Quiet hours (enabled by default, 10pm–8am)

**Finding:** Every major field needed to power a full Community Member experience exists in the schema. The gap is entirely in the UI and experience layer — none of this is surfaced to the member in a meaningful way.

### The Invisible Progression System

The platform has a documented 4-level trust system (found in `artifacts/api-server/src/routes/trust.ts`):

| Level | Name | How Earned | What Unlocks |
|-------|------|-----------|--------------|
| 1 | Default | All new accounts | Standard access |
| 2 | Verified | Identity verification (Navigator+ only) | trustLevel bump, boosted content weight |
| 3 | Trusted | High reputationScore (helpful review votes, +5 per vote) | Content bypasses moderation queue |
| 4 | Community Ambassador | Manually granted by admin | — |

**Critical finding:** This system exists in the database and API but is **completely invisible to the member.** No member can see their trust level. No member receives a notification when they advance. No member knows what action will increase their trust or what benefit it unlocks. The system runs silently in the background.

### Primary Tabs (Authenticated Members)

| Tab | File | Access Level |
|-----|------|--------------|
| Discover / Home | (tabs)/index.tsx | All members |
| Map | (tabs)/map.tsx | All members |
| Safety Hub | (tabs)/safety-hub.tsx | All members |
| Community | (tabs)/community.tsx | All members (post limits apply) |
| Library | (tabs)/library.tsx | All members |
| Resources | (tabs)/resources.tsx | All members |
| Events | (tabs)/events.tsx | All members |
| Profile | (tabs)/profile.tsx | All members |

### Capability Limits by Member Type

| Capability | Individual (free) | Navigator | Trailblazer |
|-----------|-------------------|-----------|-------------|
| Community posts | 5/month | Unlimited | Unlimited |
| Saved places | 30 | Unlimited | Unlimited |
| Kinfolk Circles | 3 | Higher limit | Higher limit |
| KinfolkAI queries | Limited (monthly pool) | Larger pool | Largest pool |
| Identity verification | No (Navigator+ only) | Yes | Yes |
| Family seats | 0 | Limited | Expanded |

**Finding:** Free members hit capability limits without knowing the limits exist. There is no proactive disclosure of limits at signup or in the onboarding flow. Members discover limits when they are blocked.

### Moderation Queue for New Members

New members who mention businesses in posts are held in a moderation queue until:
- Account age > 30 days AND
- 5+ posts submitted

This is a trust-building mechanism. **Members are not told this exists or that their posts may be delayed.**

### Guest vs. Authenticated Access

Guests (no account) can:
- View business listings (browse mode)
- View map (limited)
- See some community content

Guests cannot:
- Post to community feed
- Comment
- Join Kinfolk Circles
- Access KinfolkAI features
- Save places
- Submit safety surveys

**Finding:** The line between guest and member access is not clearly communicated during onboarding. Members do not know what they gain by creating an account until they try to do something and are blocked.

---

## 2. Future State — What Has Been Planned

From `docs/product/FUTURE_STATE_REGISTER.md`:

**Directly relevant FSR entries:**
- **FSR-003** — Cultural Ambassador Program: formal recognition for trusted contributors who guide community culture
- **FSR-005** — Structured Mentorship for safety: connects experienced members with newcomers
- **FSR-009** — Living Legacy Stories: member-authored cultural narratives tied to places
- **FSR-017** — Living Legacy Stories terminology: official brand language for community narratives

**Experience Progression levels defined in PLATFORM_WORKFLOW.md:**
1. Guest
2. Community Member
3. Contributor
4. Trusted Contributor
5. Cultural Ambassador
6. Mentor
7. Community Leader

These levels are documented but not implemented in the product UI.

**Finding:** The architecture for the full progression exists in documentation and partially in the database. The product does not yet expose any of this progression to the member.

---

## 3. Journey — How a Community Member Moves Through the Platform

### Fresh Install to First Action

```
Fresh Install
  → Onboarding (5 screens, skippable at any point)
  → Join screen: "Create Account — It's Free" or Skip to Login
  → Signup screen (email/phone/Apple)
  → Email verification (if email)
  → Profile Setup (4 steps: name, username, bio, identity)
  → Home / Discover screen
```

**Gap at every transition:** No moment at which the member is welcomed as a Community Member. The profile setup completes without ceremony. The home screen appears without context. The member has no map of what they can do or where they're going.

### First Use (Discover Screen)

A new member lands on the home screen and sees:
- Business discovery feed (seeded with static businesses + API results)
- Category filters
- Search bar

What they do NOT see:
- Any acknowledgment that they just joined a community
- Any introduction to the platform's other capabilities
- Any indication of their current status or what they can do
- Any explanation of what "Community Member" means for their experience

### Contribution Path (Becoming a Contributor)

Current trigger: A member becomes a de facto "contributor" when they:
- Write a review (helpfulReviewsCount starts counting)
- Submit a safety survey
- Post to the community feed
- Submit a business report

None of these actions are framed as "contributing to the community." They are functional actions without mission context.

The moderation queue (30 days + 5 posts) is the only current gate between a new member and full posting access. Members do not know this queue exists.

### Returning Member Experience

No personalization difference currently exists between:
- A 1-day-old member with 0 contributions
- A 3-year-old member with 50 helpful reviews and trustLevel 3

Both see the same home screen. Both have the same default experience. The platform knows the difference in the database but does not express it in the product.

### Trust Level Advancement

How trust currently advances (invisible to the member):
- Level 1 → 2: Complete identity verification (Navigator+ required)
- Level 2 → 3: Accumulate helpful review votes (5 points per vote)
- Level 3 → 4: Admin manually grants Community Ambassador

The member has no way to know:
- What their current trust level is
- How trust is earned
- What trust level unlocks
- That this system exists at all

---

## 4. Connections — Community Member to Platform Features

### Business Discovery
- Identity preferences selected during onboarding (identity.tsx) feed into business search and KinfolkAI prioritization
- **Gap:** Members are not told this connection exists. They don't know their preferences are shaping their results

### Safety Surveys
- Any authenticated member can submit a neighborhood safety survey
- Trust level and member type weight the survey's influence on safety scores
- **Gap:** Members are not told their safety input matters more as they contribute more

### KinfolkAI
- Free members have a monthly query pool
- Higher tiers get larger pools
- **Gap:** Free members don't know how many queries they have remaining until they're blocked

### Community Feed
- Posts require moderation for new members (30 days + 5 posts)
- Visibility is shaped by the Following/For You algorithm
- **Gap:** Members don't know the moderation queue exists

### Heritage Sites
- Cultural heritage screen (`cultural-heritage.tsx`) exists as a full browsable screen
- Heritage sites tile exists in the map tab (navigates to cultural-heritage.tsx)
- **Gap:** The connection between member identity (e.g., Diaspora heritage selected in onboarding) and heritage site personalization is not visible. Members don't know their identity selections affect what heritage content they see.

### Circles (Kinfolk Circles)
- Free members can join up to 3 circles
- **Gap:** Members don't know the limit until they try to join a fourth

### Notifications
- 8 granular notification categories exist in the schema
- Quiet hours enabled by default (10pm–8am)
- **Gap:** Members are not introduced to notification preferences during onboarding. No notification preferences walkthrough exists.

---

## Audit Findings — Structured

### STRUCTURAL (Architecture-level gaps)

**S-001 — "Community Member" Has No Identity Moment**

There is no moment in the registration, onboarding, or profile setup flow where a person becomes a "Community Member" of Mapping With Melanin™. The CTA is "Create Account — It's Free" — a functional, commodity framing. The experience does not treat joining as meaningful.

Every member of the platform has the same `role = "user"` and `memberType = "individual"`. "Community Member" exists as a concept in documentation only.

**Impact:** New members have no understanding of what they joined, what it means, or what they're part of. The emotional and identity value of being a Community Member of Mapping With Melanin™ is never established.

**Required decision:** Should the registration flow introduce "Community Member" as the identity of a new member? What does that moment look and feel like?

---

**S-002 — Progression System Is Completely Invisible**

A full 4-level trust progression system exists in the database and API. Members earn trust through verified identity, helpful reviews, and community contributions. The system actively shapes their experience (moderation queue bypass, content weighting). But members never see any of this.

No member can answer:
- "What level am I?"
- "How do I get to the next level?"
- "What will the next level unlock for me?"
- "What have I contributed?"

**Impact:** Every contribution disappears into a void. There is no motivation to contribute more. There is no recognition for past contribution. Members who have earned trust have no sense of having earned anything.

**Required decision:** Should the progression system be surfaced to members? What does the "Contributor" milestone look and feel like? What is the recognition moment when a member becomes a Trusted Contributor?

---

**S-003 — Capability Limits Are Invisible Until They Block**

Free members hit limits (5 posts/month, 30 saved places, 3 circles, monthly KinfolkAI pool) with no advance warning. The first time a member knows a limit exists is when they are blocked from doing something.

**Impact:** The upgrade moment feels punitive rather than aspirational. "You've been blocked" is a worse upgrade trigger than "You're getting the most out of your free membership — here's what unlocks next."

**Required decision:** Should capability limits be disclosed proactively? How should the upgrade moment be framed?

---

**S-004 — Moderation Queue Is Invisible**

New members' posts that mention businesses are held in a moderation queue (30 days + 5 posts threshold). Members don't know this exists. Their posts appear to submit successfully but may not appear in the feed immediately.

**Impact:** Confusing experience. Members may post again, thinking the first post failed. Or they may abandon the community feed, thinking it is broken.

**Required decision:** Should the moderation queue be disclosed to new members? Should they receive feedback when a post is in review?

---

### EXPERIENCE (UX-level gaps)

**E-001 — No Welcome Moment After Account Creation**

After completing profile setup, the member lands directly on the home screen. No welcome message, no orientation, no "here's what you can do" introduction.

**Impact:** High friction for new members. Discovery is accidental.

---

**E-002 — Identity Preferences Have No Visible Effect**

Members select their business support preferences during onboarding (identity.tsx). These preferences feed into business search and KinfolkAI results. But members are never told:
- That their selections are being used
- How to change their selections later
- What the selections affect

**Impact:** The identity screen feels like a survey, not a personalization step. Members may not take it seriously or may skip it.

---

**E-003 — Notification Preferences Not Introduced**

8 granular notification categories exist. Quiet hours are enabled by default (10pm–8am). None of this is introduced during onboarding or profile setup. Members discover notification settings only if they go looking for them in the settings screen.

**Impact:** Members either receive notifications they don't want or miss notifications they would want. Many members will never know quiet hours are configured.

---

**E-004 — Heritage Connection to Member Identity Not Visible**

Members who select Diaspora heritage during onboarding have no visible connection between that selection and the heritage sites they see. The platform knows about their heritage but doesn't demonstrate it.

---

**E-005 — Profile Completion Has No Incentive**

Profile setup is a 4-step flow. Members can skip steps. There is no indication of what a complete profile unlocks, what it means to the community, or why it matters.

---

### LAUNCH-CRITICAL (Must be resolved before public launch)

**LC-001 — Capability Limits Must Be Disclosed at Signup**

Before a member creates a free account, they should know what a free account includes. This is also a standard App Store expectation for freemium apps. The join screen ("Create Account — It's Free") mentions no limits.

**Required:** Free tier capability disclosure on the join or signup screen. Must be resolved before launch.

---

**LC-002 — Moderation Queue Must Have Member Feedback**

Members must know when a post is in review. Submitting a post that disappears without explanation is a broken experience. The platform needs a disclosure pattern (e.g., "Your post is being reviewed — this is normal for new members and takes less than 24 hours").

**Required:** Post submission feedback for moderated content. Must be resolved before launch.

---

## Missing Capabilities

The following capabilities exist in documentation or schema but are not yet exposed in the product UI:

| Capability | Schema Ready? | API Ready? | UI Ready? |
|-----------|--------------|-----------|----------|
| Trust level display | Yes | Partial | No |
| Reputation score display | Yes | Partial | No |
| Contribution history | Yes (counts) | Partial | No |
| Progress toward next level | Yes | No | No |
| Notification preferences intro | Yes | Yes | Not in onboarding |
| Free tier capability disclosure | N/A | N/A | No |
| Moderation queue feedback | Partial | Partial | No |
| Identity preference effects visible | Yes | Yes | No |

---

## Founder Decisions Required

| ID | Question | Priority |
|----|---------|---------|
| FD-001 | Should "Community Member" become an explicit identity moment in registration? | Launch-critical |
| FD-002 | Should the progression system (Trust Levels 1–4) be surfaced to members? | Pre-launch |
| FD-003 | Should capability limits be disclosed proactively at signup? | Launch-critical |
| FD-004 | Should moderation queue be disclosed to new members? | Launch-critical |
| FD-005 | What does the "Contributor" milestone recognition look and feel like? | Pre-launch |
| FD-006 | Should identity preference effects be made visible to members? | Pre-launch |
| FD-007 | Should notification preferences be introduced during onboarding? | Pre-launch |

---

## Architecture Recommendations (For Future Architecture Review — Not for Implementation)

The following are observations for Phase 2 (Architecture) of this audit's lifecycle. No action required now.

1. **The trust/reputation system is complete infrastructure waiting for a UI.** The database and API layer is ready. The primary gap is the product experience layer.

2. **A "Member Passport" concept** — a screen or card that shows a member's trust level, contribution count, reputation score, and next milestone — would require minimal backend work but significant product design.

3. **Onboarding flow needs a 6th screen** — a post-account-creation welcome moment that establishes "Community Member" as an identity and introduces what the member can do, contribute, and become.

4. **The progression levels defined in PLATFORM_WORKFLOW.md** (Guest → Community Member → Contributor → Trusted Contributor → Cultural Ambassador → Mentor → Community Leader) map to the existing `trustLevel` field (1–4) with Ambassador and above requiring new fields. The mapping is:
   - Guest = no account
   - Community Member = trustLevel 1 (individual)
   - Contributor = trustLevel 1 + active (5+ posts, reviews)
   - Trusted Contributor = trustLevel 3 (high reputation)
   - Cultural Ambassador = trustLevel 4 (manually granted)
   - Mentor/Community Leader = FSR-003, not yet built

---

*Audit conducted by: Replit Agent (read-only — no code changes made)*
*Date: July 26, 2026*
