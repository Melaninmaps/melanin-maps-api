# URGENT: Inclusive Language Audit — Full Regression Fix

**Status:** FIX IN BUILD 103 (alongside other fixes)  
**Added:** August 5, 2026

---

## The Problem

Despite having an inclusive-language.md memory file that clearly states the rules, the codebase still has 192 instances of "Black-owned" used as a generic default across web (53), API (47), and mobile (92). Many of these are in generic contexts where the business has NOT been verified as Black-owned and the user has NOT filtered for Black-owned specifically.

This is a recurring regression. The founder has flagged this on approximately 50% of builds. It must be fixed permanently this time with a regression test.

---

## The Rule (Already in Memory — Enforce It)

| Context | Correct Language |
|---|---|
| Business verified as Black-owned by the owner | "Black-owned" ✅ |
| User explicitly filtered for Black-owned | "Black-owned" ✅ |
| Discussing specifically Black history or culture (Parrish Street, Farish Street, etc.) | "Black-owned" ✅ |
| Generic discovery prompts, platform defaults, search copy | "minority-owned" or "community businesses" |
| Generic platform audience descriptors | "minorities" or "the melanated diaspora" |
| Waitlist form, onboarding, marketing copy | "minority-owned" or "community business" |
| Kinfolk recommendations (no verified identity) | "minority-owned" or "community" |
| Business dashboard generic copy | "minority-owned" or "community-verified" |

---

## CRITICAL FIXES (User-Facing — Fix First)

### 1. Waitlist / Home Page
**File:** `artifacts/web/src/pages/home.tsx`

| Line | Current | Replace With |
|---|---|---|
| 584 | "I own or operate a Black-owned business" | "I own or operate a minority-owned business" |
| 748 | "Discover Black-owned businesses, travel with confidence..." | "Discover minority-owned businesses, travel with confidence..." |
| 758 | "Community-verified Black-owned businesses, restaurants, hotels..." | "Community-verified minority-owned businesses, restaurants, hotels..." |
| 1067 | "Being able to find Black-owned restaurants, hotels, and shops..." | "Being able to find minority-owned restaurants, hotels, and shops..." |
| 1077 | "they wanted to support verified Black-owned businesses" | "they wanted to support verified minority-owned businesses" |
| 1171 | "Know a Black-owned business that should be on the map?" | "Know a minority-owned business that should be on the map?" |

### 2. Waitlist Page
**File:** `artifacts/web/src/pages/waitlist.tsx`

| Line | Current | Replace With |
|---|---|---|
| 10 | "2,400+ Businesses — Verified Black-owned businesses across 48 states" | "2,400+ Businesses — Verified minority-owned businesses across 48 states" |
| 239 | "Get listed as a Black-owned business" | "Get listed as a minority-owned business" |

### 3. Businesses Page
**File:** `artifacts/web/src/pages/businesses.tsx`

| Line | Current | Replace With |
|---|---|---|
| 100 | "Connect with verified Black-owned businesses..." | "Connect with verified minority-owned businesses..." |
| 196 | "All Black-owned businesses are welcome" | "All minority-owned businesses are welcome" |
| 213 | "Join the network of trusted Black-owned businesses today" | "Join the network of trusted minority-owned businesses today" |

### 4. Contact Page
**File:** `artifacts/web/src/pages/contact.tsx`

| Line | Current | Replace With |
|---|---|---|
| 103 | "Get your Black-owned business listed..." | "Get your minority-owned business listed..." |

### 5. Discover Page
**File:** `artifacts/web/src/pages/discover.tsx`

| Line | Current | Replace With |
|---|---|---|
| 273 | "Find the best Black-owned businesses..." | "Find the best minority-owned businesses..." |
| 414 | "We're adding new Black-owned businesses every day" | "We're adding new minority-owned businesses every day" |
| 431 | "Explore other Black-owned businesses" | "Explore other minority-owned businesses" |
| 593 | "Help build the most comprehensive guide to Black-owned businesses" | "Help build the most comprehensive guide to minority-owned businesses" |

### 6. Business Detail Page
**File:** `artifacts/web/src/pages/business-detail.tsx`

| Line | Current | Replace With |
|---|---|---|
| 197 | "Discover Black-owned businesses on Mapping With Melanin™" | "Discover minority-owned businesses on Mapping With Melanin™" |
| 481 | "verified network of Black-owned enterprises" | "verified network of minority-owned enterprises" |

### 7. Cities Page
**File:** `artifacts/web/src/pages/cities.tsx`

| Line | Current | Replace With |
|---|---|---|
| 23 | "largest concentrations of Black-owned businesses" | "largest concentrations of minority-owned businesses" |
| 101 | "Curated guides to the best Black-owned businesses" | "Curated guides to the best minority-owned businesses" |

### 8. Mobile — Business Dashboard
**File:** `artifacts/mobile/app/business-dashboard.tsx`

| Line | Current | Replace With |
|---|---|---|
| 666 | "List your Black-owned business to access your dashboard" | "List your minority-owned business to access your dashboard" |
| 1642 | "Black-owned providers sourced right from the Mapping With Melanin™ platform" | "minority-owned providers sourced right from the Mapping With Melanin™ platform" |
| 1754 | "Only verified Black-owned businesses can sell directly" | "Only verified minority-owned businesses can sell directly" |
| 1985 | "MWM-verified Black-owned businesses" | "MWM-verified minority-owned businesses" |

### 9. Mobile — Business Insight (Add Business Flow)
**File:** `artifacts/mobile/app/business-insight.tsx`

| Line | Current | Replace With |
|---|---|---|
| 294 | "Add a Black-owned business to the Mapping With Melanin™ directory" | "Add a minority-owned business to the Mapping With Melanin™ directory" |
| 373 | "Is this a Black-owned business?" | "Is this a minority-owned business?" |
| 376 | "Yes — Black-owned" | "Yes — minority-owned" |
| 377 | "No — non-Black-owned 🏢" | "No — not minority-owned 🏢" |

### 10. Mobile & Web — Affiliate Pages
**Files:** `artifacts/web/src/pages/affiliate.tsx` + `artifacts/mobile/app/affiliate.tsx`

| File:Line | Current | Replace With |
|---|---|---|
| web:15 | "Curated collection of Black-owned boutique properties" | "Curated collection of minority-owned boutique properties" |
| web:35 | "Black-owned rideshare network" | "Minority-owned rideshare network" |
| web:72 | "Exclusive discounts from Black-owned and community-friendly travel partners" | "Exclusive discounts from minority-owned and community-friendly travel partners" |
| mobile:41 | "curated to put you near Black-owned businesses" | "curated to put you near minority-owned businesses" |
| mobile:117 | "Stay in Black-owned properties" | "Stay in minority-owned properties" |

---

## API / KINFOLK FIXES (Backend — Affects AI Recommendations)

### 11. Kinfolk Cross-Sell Prompts
**File:** `artifacts/api-server/src/routes/kinfolk.ts` (lines 825–833)

| Line | Current | Replace With |
|---|---|---|
| 825 | "Get custom tees from a Black-owned print shop" | "Get custom tees from a community print shop" |
| 826 | "Black-owned artists and home decor shops" | "Minority-owned artists and home decor shops" |
| 827 | "Black-Owned Cooking Class / Meal Kit" + "A Black-owned cooking class" | "Community Cooking Class / Meal Kit" + "A community cooking class" |
| 828 | "Black-owned hair and beauty brands" | "Community hair and beauty brands" |
| 829 | "Black-Owned Catering / Event Florals" + "Black-owned catering and florals" | "Community Catering / Event Florals" + "minority-owned catering and florals" |
| 830 | "Black-Owned Athletic Wear / Meal Prep" + "Black-owned athletic wear" | "Community Athletic Wear / Meal Prep" + "minority-owned athletic wear" |
| 831 | "Black-Owned Credit Union / Financial Services" + "Black-owned credit unions" | "Community Credit Union / Financial Services" + "minority-owned credit unions" |
| 832 | "Black-Owned Marketing / Print Services" + "Brand it Black" + "Black-owned marketing" | "Community Marketing / Print Services" + "Brand it right" + "minority-owned marketing" |
| 833 | "Black-Owned Children's Books / Clothing" + "Black-owned children's brands" | "Community Children's Books / Clothing" + "minority-owned children's brands" |

### 12. Kinfolk System Prompt
**File:** `artifacts/api-server/src/routes/kinfolk.ts`

| Line | Current | Replace With |
|---|---|---|
| 1113 | "Only recommend real Black-owned or culturally significant spots" | "Only recommend real minority-owned or culturally significant spots" |
| 2303 | "Every single business you name must be minority-owned or Black-owned" | "Every single business you name must be minority-owned or community-verified" |
| 2335 | "Find me a Black-owned realtor" | "Find me a minority-owned realtor" |

### 13. Post-Nudge (Social Media Manager)
**File:** `artifacts/api-server/src/routes/post-nudge.ts`

| Line | Current | Replace With |
|---|---|---|
| 286 | "a Black-owned ${business.category} business" | "a minority-owned ${business.category} business" (OR use business's actual verified ownership type from DB) |

### 14. Journeys
**File:** `artifacts/api-server/src/routes/journeys.ts`

| Line | Current | Replace With |
|---|---|---|
| 20 | "Connect with Black-owned real estate agents" | "Connect with minority-owned real estate agents" |
| 38 | "Black-owned baby boutiques and shops" | "Minority-owned baby boutiques and shops" |
| 222 | "real, verified Black-owned and minority-owned businesses" | "real, verified minority-owned businesses" |
| 224 | "always name a minority-owned or Black-owned business" | "always name a minority-owned business" |
| 489 | "Find Black-owned ${category} nearby" | "Find minority-owned ${category} nearby" |

---

## EXCEPTIONS — Do NOT Change These

The following use "Black-owned" correctly (historical, verified, or cultural context):

- `kinfolk.ts` line 170: "Parrish Street — 'Black Wall Street of Durham'" (historical reference)
- `kinfolk.ts` line 441: "Farish Street...Black-owned businesses" (historical reference)
- `kinfolk.ts` line 460: "Parrish Street...Black-owned banks" (historical reference)
- `city-spotlight.tsx` line 19: Atlanta description mentioning "Black-owned businesses" alongside "Black millionaires" and "HBCUs" (city-specific cultural context)
- `explore.tsx` ownership tags: "black-owned" as a filter ID (category tag, not generic copy)
- Any instance where a SPECIFIC VERIFIED business is described using its actual ownership type

---

## REGRESSION PREVENTION

After fixing all instances, implement ONE of these:

### Option B (Pre-commit hook — recommended for this repo):
```bash
# .husky/pre-commit or similar
BLACKOWNED_COUNT=$(grep -rn "Black-owned" artifacts/web/src artifacts/mobile/app artifacts/api-server/src --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "dist/" | wc -l)
if [ "$BLACKOWNED_COUNT" -gt 10 ]; then
  echo "⚠️  Found $BLACKOWNED_COUNT generic 'Black-owned' instances. Check inclusive-language.md rules."
  exit 1
fi
```

### Option C (Memory enforcement — add to inclusive-language.md):
```
## ENFORCEMENT (Aug 5, 2026 — Founder escalation)
This rule has regressed on 50%+ of builds. Any PR or commit that introduces "Black-owned"
in generic copy (not inside a conditional checking verified ownership) must be rejected.
Threshold: no more than 10 instances total in artifacts/ (all remaining are historical/contextual).
```

---

## Verification Required

After fixing, provide:

1. `grep -rn "Black-owned" artifacts/ | grep -v node_modules | grep -v dist/ | grep -v .git/ | wc -l` — should be ≤10 (only historical/contextual uses)
2. Screenshot of waitlist form showing corrected toggle text
3. Screenshot of business insight "Add a business" flow showing corrected language
4. Confirmation of which regression prevention method was implemented
5. List of remaining "Black-owned" instances with justification for why each stays
