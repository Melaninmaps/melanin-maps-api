---
name: Canonical vibe + tag lists — source of truth location
description: Where the real lists live; business-detail.tsx now imports from @workspace/db VIBES_BY_CATEGORY (131 vibes), never hardcoded.
---

# Canonical Vibe + Tag Lists

## Sources (all in `lib/db/src/constants/`)

| List | File | Count | Export |
|------|------|-------|--------|
| Community Vibes | `vibe-labels.ts` | 131 | `VIBES_BY_CATEGORY` (by category), `ALL_VIBE_LABELS` (flat) |
| Endorsement Tags (What The Community Said) | `endorsement-tags.ts` | 340 | `ENDORSEMENT_TAGS` |
| THE REAL (professional trust signals) | `the-real-tags.ts` | 151 | `THE_REAL_TAGS` |
| Cultural Endorsement variants | `endorsement-tag-variants.ts` | — | — |

All are exported from `@workspace/db` package index.

## business-detail.tsx pattern
```typescript
import { VIBES_BY_CATEGORY } from "@workspace/db";
const toVibeId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const vibesForCategory = VIBES_BY_CATEGORY[category]?.map(v => ({ id: toVibeId(v.label), label: v.label, helperText: v.helperText }))
  ?? FALLBACK_VIBES.map(...);
```
`helperText` is shown as the `title` tooltip on each chip (e.g. "Hood Classic" → "Been here forever, still hits").

## HBCU siteMatchesFilter fix
- heritageCategory values in DB are MIXED CASE: 74 have `'HBCU'`, 14 have `'hbcu'`
- Fix: `hc.toUpperCase() === "HBCU"` — now catches 88 HBCUs (was 74)
- The remaining ~12 short of 100 are in total DB beyond limit or have other categorization

**Why:** The web artifact was using 7 hardcoded vibe IDs that didn't match the master taxonomy. ALL vibe chips must derive from the 131-entry canonical master.
