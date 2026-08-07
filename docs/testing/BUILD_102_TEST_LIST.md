# Mapping With Melanin — TestFlight Test List
## Build 102 · Version 1.1.5 · August 2026

> **Purpose:** This build fixes the Apple Sign-In and email login failures that caused Apple's rejection.
> Both auth methods are now working. Please work through every section and note your device + iOS version.

---

## Before You Start

- Download **Build 102** from TestFlight (look for "Mapping With Melanin" — v1.1.5)
- Use a **real account** (not a demo) — you will need an Apple ID or an email to sign up/sign in
- If you have an existing account from a previous build, use it — we want to test sign-in, not just sign-up
- Note your device model and iOS version at the top of your feedback

---

## SECTION 1 — Authentication ⚠️ HIGHEST PRIORITY

> This is the reason for the Apple rejection. Every tester must complete this section.

### 1-A · Sign In With Apple (iOS only)
- [ ] Tap **"Sign in with Apple"** on the login screen
- [ ] Complete Face ID / Touch ID
- [ ] **Expected:** App navigates to home tabs within 3–5 seconds. No spinning, no error.
- [ ] If you see "Something went wrong" or a blank screen, note the exact message and report it immediately.

### 1-B · Email Sign In (existing account)
- [ ] Enter your email and password and tap **Sign In**
- [ ] **Expected:** App navigates to home tabs. No "Could not connect" message.
- [ ] Sign out (Profile → Settings → Sign Out), then sign back in again
- [ ] **Expected:** Same result both times — consistent, no errors

### 1-C · New Account Registration
- [ ] Tap **Create Account**, enter a new email, create a password
- [ ] **Expected:** App navigates to the **Profile Setup** screen (4 steps). No error banner.
- [ ] If you see "Could not connect to server" after entering valid info, that is a bug — report it.

### 1-D · Session Persistence
- [ ] Sign in, then fully close the app (swipe away from app switcher)
- [ ] Re-open the app
- [ ] **Expected:** You are still signed in. You go directly to the home tabs.

### 1-E · Wrong Password (negative test)
- [ ] Try signing in with a wrong password
- [ ] **Expected:** Error message displayed. App stays on the login screen. You are NOT navigated away.

---

## SECTION 2 — Map Tab

### 2-A · Map Loads
- [ ] Tap the **Map** tab
- [ ] **Expected:** Map tiles render (not a white/blank screen). Business pins appear as gold dots.
- [ ] If the map is white or pins are missing, note which device and iOS version.

### 2-B · Business Pins
- [ ] Tap any gold pin on the map
- [ ] **Expected:** Business name and category appear in a card at the bottom
- [ ] Tap the card → **Expected:** Full business detail page opens

### 2-C · Cultural Sites
- [ ] Look for teal/blue pins on the map — these are cultural landmarks
- [ ] Tap one
- [ ] **Expected:** A card appears with the site name and a **"Directions"** button
- [ ] Tap Directions → **Expected:** Native Maps app opens with the location

### 2-D · Tab Refresh
- [ ] Navigate away from the Map tab (go to Community, then come back)
- [ ] **Expected:** Cultural site pins are still visible and correct (they reload fresh on every visit)

---

## SECTION 3 — Discover Tab (Business Search)

### 3-A · Browse Businesses
- [ ] Tap the **Discover** (home) tab
- [ ] **Expected:** A list of businesses loads — each card shows name, category, and at most 2 short caption chips (e.g. "Cozy vibe", "Black-owned")
- [ ] Scroll through at least 10 listings — no crashes

### 3-B · Search
- [ ] Tap the search bar and type a category (e.g. "restaurant" or "barber")
- [ ] **Expected:** Results filter. Results are relevant.

### 3-C · Business Detail Page
- [ ] Tap any business to open its detail page
- [ ] **Expected:** Name, address, hours, description all load. Page does not crash.
- [ ] If the business has an intro video, it should appear at the top
- [ ] If the business has reviews, they should be listed below
- [ ] Look for an **Endorse**, **Vibe**, or **Hidden Gem** button — tap it and confirm it registers

### 3-D · Write a Review
- [ ] On a business detail page, tap **Leave a Review** (or the star rating area)
- [ ] Write a short review and submit
- [ ] **Expected:** Review appears on the page. No crash.

---

## SECTION 4 — KinfolkAI

### 4-A · Open KinfolkAI
- [ ] Look for the gold **Kinfolk** button (bottom-right floating button on the map, or AI Chat tab)
- [ ] Tap it
- [ ] **Expected:** A chat interface opens

### 4-B · Basic Conversation
- [ ] Type: "What are some great Black-owned restaurants in Philadelphia?"
- [ ] **Expected:** KinfolkAI responds with relevant suggestions within 5–10 seconds
- [ ] Ask a follow-up: "Which ones are good for a date night?"
- [ ] **Expected:** KinfolkAI remembers context and responds

### 4-C · Voice (if available on your tier)
- [ ] Look for a **"Listen"** or speaker icon on a KinfolkAI response
- [ ] Tap it — **Expected:** Response is read aloud in KinfolkAI's voice

---

## SECTION 5 — Community Tab

### 5-A · Feed Loads
- [ ] Tap the **Community** tab
- [ ] **Expected:** Posts load. Each post shows author name, content, and interaction buttons.

### 5-B · Post Interactions
- [ ] Tap the heart/reaction button on any post
- [ ] **Expected:** Reaction registers (count updates or icon changes)

### 5-C · Create a Post
- [ ] Tap the compose button (pencil icon or "+")
- [ ] Type a short post and submit
- [ ] **Expected:** Your post appears in the feed

---

## SECTION 6 — Profile & Settings

### 6-A · Profile Page Loads
- [ ] Tap the **Profile** tab
- [ ] **Expected:** Your name, photo (if set), and membership status all display correctly

### 6-B · Edit Profile
- [ ] Tap **Edit Profile**
- [ ] Change your display name or bio and save
- [ ] **Expected:** Changes saved. Profile reflects the update when you return.

### 6-C · Settings
- [ ] Tap **Settings** (gear icon or from profile menu)
- [ ] **Expected:** Settings screen opens, all options visible (Notifications, Privacy, Account, etc.)

### 6-D · Account Deletion (ONLY if you want to test this — you will lose your account)
- [ ] Settings → **Delete Account**
- [ ] **Expected:** A confirmation dialog appears with a clear warning
- [ ] If you confirm: account is deleted, you are signed out, Apple Sign-In is revoked (you can re-link the app in iOS Settings → Password & Security if needed)
- [ ] If there's a server error during deletion: **Expected:** You see an error message. You are NOT silently logged out.

---

## SECTION 7 — Safety Hub

### 7-A · Safety Hub Opens
- [ ] Look for the **Safety** section (on the map tab or in the navigation)
- [ ] **Expected:** Safety Hub screen loads without crashing

### 7-B · Report Functionality
- [ ] Find the option to submit a community safety note or report
- [ ] Fill in a test entry (clearly labeled "TEST" in the notes)
- [ ] **Expected:** Submission completes without error

---

## SECTION 8 — Membership (if applicable)

### 8-A · Membership Page
- [ ] Profile → **Membership** or tap any locked feature
- [ ] **Expected:** Membership tiers display correctly (free vs Navigator vs Trailblazer)

### 8-B · Feature Gates
- [ ] On the free plan, try to access a paid KinfolkAI feature (deep city history, etc.)
- [ ] **Expected:** Upgrade prompt appears — not a crash

---

## Reporting Bugs

For each bug, please include:
1. **Device & iOS version** (e.g. iPhone 14 Pro, iOS 17.5)
2. **Section & step number** (e.g. "Section 1-A")
3. **What you expected** vs. **what actually happened**
4. **Screenshot or screen recording** if possible
5. **Did it happen every time, or only once?**

Send reports to: [your feedback channel / email]

---

## Critical Bugs (Report Immediately)

If you see any of the following, stop and report right away:

- ❌ Apple Sign-In fails or spins indefinitely (Section 1-A)
- ❌ Email login shows "Could not connect" after entering correct credentials (Section 1-B)
- ❌ App crashes on launch (never gets past the splash screen)
- ❌ Map tab is a completely white/blank screen (Section 2-A)
- ❌ Cannot submit a review or post (data not saving)

---

*Mapping With Melanin — Internal TestFlight · Build 102 · v1.1.5 · August 2026*
