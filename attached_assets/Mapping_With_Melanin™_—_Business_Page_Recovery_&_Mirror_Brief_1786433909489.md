# Mapping With Melanin™ — Business Page Recovery & Mirror Brief
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Priority:** CRITICAL — Do not proceed with any business page work until this brief is read and followed exactly.

---

## The Directive

The closest the business page has ever come to the founder's vision was the build that was live on **July 11, 2026 at approximately 2:00 AM EST**. Screenshots from that exact build have been provided as reference (see attached images: `IMG_7081.jpg` and `Screenshot2026-07-11at2.08.29AM.jpg`).

Your instruction is to:
1. **Find that build** in the Git history.
2. **Read it — do not touch it.**
3. **Mirror its front-end component structure and back-end data connections** into the current codebase, building out the missing functionality (community scoring, vibe tags, safety stats, media upload) so that everything works end-to-end.

---

## Step 1 — Find the July 11 Build (Read-Only)

Run the following Git command to locate the commit(s) closest to July 11, 2026 at 2:00 AM EST:

```bash
git log --after="2026-07-10T23:00:00-05:00" --before="2026-07-11T04:00:00-05:00" --format="%H %ai %s"
```

If the repository uses a deployment platform (Railway, Vercel, Render), also check the deployment history for a build deployed in that window.

**Do not checkout or modify the main branch to do this.** Use a read-only inspection:

```bash
git show <commit-hash>:src/components/BusinessDetail.tsx
# or wherever the business page component lives
git show <commit-hash>:src/pages/businesses/[id].tsx
```

Extract and save the component code to a temporary reference file. Do not merge, cherry-pick, or apply it yet.

---

## Step 2 — Document What Existed in That Build

Before writing a single line of new code, document the following from the July 11 build:

- The exact component structure of the business detail page (every section, every card, every button)
- The data fields being read from the database (what columns, what tables, what API endpoints)
- The scoring logic (how the 98/100 Confidence Score was calculated)
- The community stats display (Would Return Alone %, Safety Rating, Recommend %)
- The vibe/Community Says tag system (how tags were stored, how they were displayed)
- The ownership badge system (Black-Owned, Verified, Community Trusted, Welcoming Environment)
- The bottom action bar (Call, Check In, Review)

Write this documentation before touching anything. This is your blueprint.

---

## Step 3 — Mirror the UI Into the Current Build

Using the July 11 component as a read-only reference, rebuild the business detail page component in the current codebase to match it exactly. This is a **mirror**, not a merge. You are not cherry-picking old code into new code. You are reading the old design and implementing it cleanly in the current architecture.

The visual elements that must be present, in order from top to bottom, are:

1. **Full-bleed hero image** with back arrow, share icon, and bookmark icon overlaid.
2. **Business name** (large, bold, white text on dark background).
3. **Category + Verified badge + Price tier** on one line.
4. **Confidence Score** — circular gauge, top right, showing score out of 100 with confidence label (e.g., "98 / 100 High Confidence"). This score is community-derived, not manually assigned.
5. **Ownership tags** — pill-shaped buttons with fist emoji (e.g., "Black-Owned", "Black Owned"). Multiple tags allowed.
6. **Ownership disclaimer text** — small body text explaining the 51% ownership definition and the difference between self-identified and Verified status.
7. **Status badges** — "Community Trusted" (shield icon, blue text) and "Welcoming Environment" (green heart, green text). These are earned through community scoring, not self-assigned.
8. **"Put Your People On" rating** — crown emoji, label, aggregate score and review count (e.g., "4.9 (634)").
9. **Community Safety Stats card** — dark card with shield icon header "Community Safety Stats" and three columns:
   - Would Return Alone (percentage)
   - Safety Rating (out of 5)
   - Recommend (percentage)
10. **"Rate Your Safety Experience" CTA card** — tappable row with shield icon, title, subtitle, and right chevron.
11. **"Community Says" card** — heart icon, "Community Says" label, "+ Add Yours" button, and user-submitted vibe tags displayed as pill badges (e.g., "1 said 'Date Night Approved'").
12. **Sticky bottom action bar** — three equal-width buttons: Call (phone icon, gold text), Check In (checkmark icon, green background), Review (star icon, gold background).
13. **Floating KinfolkAI widget** — pill bubble overlapping the bottom content area.

---

## Step 4 — Build the Missing Back-End Functionality

The July 11 build had the UI. What it may have lacked is the full back-end wiring for community contributions. The following must be built or confirmed working:

### Community Safety Scoring
Users must be able to submit safety ratings from the "Rate Your Safety Experience" card. Each submission must record:
- `would_return_alone` (boolean)
- `safety_rating` (1–5)
- `would_recommend` (boolean)
- `user_id` and `business_id`
- `submitted_at` timestamp

The displayed percentages and ratings on the business page must be live aggregates calculated from this table, not static values.

### Vibe / Community Says Tags
Users must be able to submit a vibe tag via the "+ Add Yours" button. The tag system must:
- Allow users to select from a predefined list of vibe tags (e.g., "Date Night Approved", "Auntie Energy", "Great Bedside Manner", "Family-Friendly", "Solo-Friendly", "Loud & Lively", "Quiet & Cozy") OR write a short custom caption.
- Display the count of users who selected each tag (e.g., "12 said 'Date Night Approved'").
- Feed these tags into the KinfolkAI demand signal and recommendation engine.

### Confidence Score Calculation
The 98/100 Confidence Score is a composite metric. It must be calculated from:
- Verification status (self-identified vs. documented)
- Community safety stats aggregate
- "Put Your People On" rating
- Number of community contributions (check-ins, reviews, vibe tags)
- Recency of activity

The formula can be tuned, but the score must be dynamic and update as community data changes.

### Media Upload
Users must be able to upload photos to the business page via the "Show the Vibe" feature. Uploads must be stored in the platform's existing S3/file storage. Business owners must be able to upload photos and add social media URLs (Instagram, TikTok, Facebook) from their business dashboard.

---

## Step 5 — Verify Before Deploying

Before deploying any changes to production, verify the following:

1. The map still loads and plots all existing businesses correctly.
2. The authentication flow (login, session, logout) is completely unchanged.
3. The Safety Hub reporting flows are unchanged.
4. The Library is unchanged.
5. At least three existing business pages render correctly with the new component.
6. Community safety rating submission works end-to-end (submit → stored in DB → aggregate updates on page).
7. Vibe tag submission works end-to-end.

Do not deploy until all seven checks pass.

---

## What You Must Not Do

- Do not merge the July 11 build into the current main branch.
- Do not alter the authentication system, the map, the Safety Hub, or the Library while doing this work.
- Do not redesign or "improve" the July 11 UI. Mirror it. The founder has confirmed this is the closest the platform has come to the vision. Your job is to make it work, not to make it different.

---

## The Standard

The business page is the heart of this platform. Every other feature — the Library, the flywheel, the demand signal engine, the Circles, the Trusted Safety Share — ultimately connects back to the business page. If the business page is wrong, everything built on top of it is wrong. Get this right first.
