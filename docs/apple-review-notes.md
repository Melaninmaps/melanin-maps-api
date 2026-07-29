# App Review Notes — Mapping With Melanin™
## Submission for Guideline 5.1.1(v) Review

---

### What This App Is

Mapping With Melanin™ is a **private membership community** — a trust network where members of and allies to historically marginalized communities share the cultural intelligence, safety awareness, and lived experiences that keep each other safe, seen, and connected.

This app is structurally comparable to other App Store-approved membership networks: Nextdoor (verified neighborhood network), Fishbowl (verified professional network), and Raya (curated membership community). Like those apps, the gate is not cosmetic — the content **cannot exist independent of membership**.

---

### Why Membership Before Access Is Core Functionality

Every surface in this app is member-generated, member-dependent, or member-protective:

| Surface | Why it requires membership |
|---|---|
| Community Feed | Posts, responses, and community updates are authored by named members with trust badges. Anonymous access would expose member-attributed content to surveillance and targeting. |
| Safety Reports & Officer Watch | Members report discrimination incidents and officer interactions from lived experience. These are not public data — they are community intelligence entrusted specifically to other members. |
| Business Intelligence | Businesses appear through member vouches, member reviews, community verification, and Ambassador endorsements. There is no raw directory: every business is presented through the community's relationship to it. |
| KinfolkAI | A cultural AI companion with member-controlled memory, personalized by trust level, city, and community context. Responses are shaped by the member's identity and history — they do not exist in a member-independent form. |
| Circles & Meet-up Verification | Member-created circles with safety check-in and arrival confirmation tools. These tools protect members meeting in person and require identity verification to be meaningful. |
| Events | All visible events are created or endorsed by community members. Platform-seeded events without member attribution are not surfaced. |
| Cultural Heritage Journeys | Guided by Community Ambassadors with member reflections and visit check-ins layered over historical records. |

**Anonymous access would expose information that members contributed under an explicit agreement that it stays within the community.** This is not a restriction of convenience — it is the platform's primary safety function.

---

### The Community Agreement

Every new member completes the Community Agreement before accessing the app:

> We protect one another.
> We honor the stories shared here.
> We never use this community to surveil, harass, or target another person.
> We contribute honestly.
> Membership is trust.

Agreement acceptance is recorded server-side in a `member_agreements` table with: user ID, agreement version, timestamp, and platform. Agreement acceptance is required for account creation and will be re-required when the agreement materially changes.

---

### Membership Is Open to Everyone

Membership is **free** and **open to anyone** who accepts the Community Agreement and conduct standards. There is no identity-based admission criterion. The gate is values and conduct — not identity.

---

### Demo Account

A fully populated demo account is provided with App Review credentials. The account includes:

- Completed Community Agreement acceptance (server-recorded)
- Active community feed with member posts and trust badges
- Member reviews on multiple businesses
- A saved Circle with members
- Saved places and business bookmarks
- RSVP to upcoming events
- KinfolkAI conversation history
- Community Verified and member-vouched businesses
- Safety Hub with community-contributed context
- No empty screens, no setup prompts blocking review

**Demo credentials are included in the App Review Information field of this submission.**

---

### Account Deletion

Account deletion is available in-app at: **Profile → Settings → Account → Delete Account**. Deletion immediately revokes the session, anonymizes all community contributions per the privacy policy, and removes identifying data within 30 days.

---

### Guideline 5.1.1(v) — Significant Account-Based Features

The specific provision states that apps may require login when they contain "significant account-based features." Every feature in this app is account-based in that provision's sense:

- Every read is personalized: responses are shaped by the member's trust level, city, Circles, and consent settings. No two members receive identical API responses.
- Every write is member-attributed: posts, reviews, safety reports, and vouches carry the member's trust badge and standing.
- The content literally does not exist in a member-independent form — there is no public catalog, no anonymous feed, and no browsable directory.

We welcome a call or screen recording session with any reviewer who would like a demonstration. We can walk through the Community Agreement ceremony, the member-shaped business intelligence screen, a safety report's lifecycle, and Meet-up Verification — showing at each step why membership is structural, not cosmetic.

---

### Contact for Review Questions

Available for App Review video appointment at any time. Please use the Resolution Center to schedule.

---

*This document is maintained at `docs/apple-review-notes.md` in the project repository.*
