---
name: Mobile Parity Rules — permanent native app contract
description: 8 non-negotiable rules for the Expo React Native app; acceptance checklist; reference files from the parity package.
---

## 8 Mandatory Parity Rules

1. **Local search is server-authoritative.** Default 5 miles, at most 2 results. Both list cards and map pins come from the same response. Never inject national/global results or auto-expand to a farther city.
2. **Location is member-initiated and foreground-only.** Show clear states: locating, success, denied permission, disabled service, manual city/neighborhood fallback. Never request background location.
3. **Use the same seeded Living Library foundations, topic icons, Kinfolk research-memory policy, Community Vibes evidence, and canonical cultural-site records as the website.** Not a second copy of that logic.
4. **Kinfolk applies the diaspora-first retrieval lens, preserves `KINFOLK_BUSY` questions for retry, and never infers identity from search terms.** Sensitive context is optional; someone-else context stays temporary unless explicitly saved.
5. **Native voice recording uses `expo-audio`; the member controls stop.** Show capture/transcription stage errors, not generic length errors.
6. **Canonical web cultural-site URLs must open the same native record through Universal Links and Android App Links.** Use stable IDs; readable slugs can be corrected.
7. **Use polished subject-specific gold-outline icons, not colorful or cartoon emoji.** The feather is a brand-level mark, not a universal topic icon.
8. **Text entered into all native inputs must be visibly readable.** Do not inherit dark-surface colors into light input fields.

## Native Acceptance Checklist (must pass before every production build)

| Test | Required result |
|---|---|
| Charlotte + `bookstore` | Exactly 2 local bookstores appear as both cards and pins. Philadelphia/Boston/Raleigh must NOT appear. |
| Member selects wider radius | App asks only AFTER local results are insufficient; never expands silently. |
| Location permission denied | Visible manual city/neighborhood option; no stalled control. |
| Living Library fresh install | Foundation topics readable and nonblank; Housing, Education, and Trades present. |
| Kinfolk + `heart disease` | Research plan begins with `Black women heart disease`, without writing identity to member memory. |
| Kinfolk voice | Member can start and stop; permission/empty-recording/upload/transcription failures show specific messages. |
| Cultural-site web URL | Opens native content when app installed; opens website otherwise. |
| Queue saturation | `KINFOLK_BUSY` keeps the typed question for retry. |

## Reference files from the parity package (awaiting "Please implement.")

- `app/index.tsx` — `<Redirect href="/discover" />` root redirect (simple, can apply immediately)
- `app/cultural-sites/[id].tsx` — canonical UUID record fetcher via `mwmApi.culturalSite(id)` → opens `mappingwithmelanin.com/cultural-sites/<id>/<slug>` via `Linking.openURL`
- `eas.json` — 3-channel config (development/preview/production all pointing at `https://api.melaninmaps.com`); **NOTE: current eas.json at artifacts/mobile/eas.json has NO channel field on production profile** — the reference eas.json adds `"channel": "production"` to production, which would change OTA behavior; review carefully before applying.

## API routes required for mobile (all must exist on Railway)

```
GET  /api/map/local-business-search?query=&latitude=&longitude=&radiusMiles=&limit=2
POST /api/location/resolve
GET  /api/library/topics
GET  /api/cultural-sites/:id
POST /api/kinfolk/chat
POST /api/kinfolk/voice
```

**Why:** The native app is a client of the same API, not a second source of truth. Any deviation from these rules (emoji icons, global fallback results, inherited dark input colors, fake length errors on voice) undermines the brand and the product promise.

**How to apply:** Every new mobile screen, component, or flow must be checked against all 8 rules before merging. The acceptance checklist runs before every preview build promotion to production.
