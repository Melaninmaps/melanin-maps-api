---
name: Ownership badge architecture
description: How business ownership designations flow from DB through API to UI. Which component is canonical vs legacy. What stays Black-owned vs what uses inclusive copy.
---

# Ownership Badge Architecture

## Data Layer
- `businesses.black_owned` — boolean column (legacy, still in DB and used as backward-compat bridge)
- `businesses.ownership_designations` — jsonb string[] (canonical, new system)
- Bridge in `useBusinesses.ts` (line 38-40): if `blackOwned === true`, prepends `"black-owned"` to `ownershipDesignations` array

## Canonical Component: `OwnershipBadges.tsx`
- `OwnershipBadge` (single) — used on cards (first badge only, space-limited)
- `OwnershipBadges` (multi) — used on business profile (shows all designations)
- Takes `designations: string[]` + `verifiedDesignations: string[]`
- 10 badge types: black-owned, minority-owned, women-owned, veteran-owned, lgbtq-owned, disability-owned, indigenous-owned, immigrant-owned (shows as "Melanated Diaspora Owned"), d9-affiliated, non-minority-owned

## Legacy Component: `BlackOwnedBadge.tsx`
- Shows only "Black-Owned", ignores all other designation types
- Was used in `BusinessCard.tsx` (both horizontal and vertical layouts) — **replaced with OwnershipBadge**
- Was redundantly used in `business/[id].tsx` alongside `OwnershipBadges` — **removed**
- Component file kept but should not be used in new code

## BusinessCard Badge Logic (post-migration)
```
non-minority-owned designation → NonMinorityBadge
ownershipDesignations[0] exists → OwnershipBadge (first designation, sm size, with verified state)
nothing → null
```
Vertical and horizontal card layouts use the same logic with `vBadgeOverlay`/`hBadgeOverlay` styles.

## Language Rules Applied
| Context | Use |
|---|---|
| Filter chips where user explicitly chose "Black-Owned" | "Black-Owned" ✅ |
| Business verified as Black-owned (verify-business.tsx) | "Black-Owned" ✅ |
| Owner self-designating (list-business.tsx) | "Black-Owned" ✅ |
| Generic discovery prompts, section headers, CTAs | "minority-owned" / "Community" |
| Section subtitle for verified community favorites | "Verified · Community Owned" |
| Business listing CTA | "Own a Community Business?" |
| UpgradeModal free tier copy | "minority-owned businesses" |
| Web map legend | "Community Business" |
| Web welcome onboarding | "Minority-Owned Businesses" |
| Web home recommendation action | "Recommend Community Businesses" |
| Web discover expansion heading | "Other Community Businesses" |
| KinfolkAI suggestion cards (type has no ownership field) | no badge shown |

**Why:** The platform serves the melanated diaspora broadly. "Black-owned" is precise and celebrated when earned or chosen — it should never be the default label for all businesses on a generic screen.

## What Changed in the Migration
- `BusinessCard.tsx`: removed `BlackOwnedBadge` import, now uses `OwnershipBadge` from `OwnershipBadges.tsx`
- `business/[id].tsx`: removed `BlackOwnedBadge` import and usage (OwnershipBadges already shows it)
- `index.tsx` communityFaves filter: was `.filter(b => b.blackOwned && b.verified)` → now `((b.ownershipDesignations?.length ?? 0) > 0 || b.blackOwned) && b.verified`
- `community.tsx` KinfolkAI suggest modal: hardcoded "Black-Owned" badge removed (type has no ownership field)
