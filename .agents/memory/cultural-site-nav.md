---
name: Cultural site nav — safePublicUrl
description: How map.tsx handles cultural site external links and internal navigation. Fixed Aug 12 2026.
---

## The rule
External cultural site URLs must pass `safePublicUrl()` before being rendered as clickable links. Internal MWM site detail pages must use `<Link href="/sites/:id">` (wouter router-native), NOT string concatenation with `BASE`.

**Why:** Raw `site.externalUrl` string concatenation in the info window allowed XSS-style injection of `javascript:` or `data:` URLs. Raw `${BASE}sites/${site.id}` was not router-native and broke client-side navigation.

**How to apply:**
- `safePublicUrl(url)` — validates URL parses correctly with protocol http: or https:; returns null otherwise
- Info window (HTML string): `safePublicUrl(site.externalUrl)` used inline in template; fallback to empty string
- Sidebar card (JSX): `safePublicUrl(site.externalUrl) && <a href={safePublicUrl(site.externalUrl)!}>` and `<Link href="/sites/${site.id}">`
- Label split: external → "Official website ↗" | internal → "Learn more on MWM →"

## Location in codebase
`artifacts/web/src/pages/map.tsx` — `safePublicUrl` helper defined just after `const BASE = ...` line. Both the info window (around line 645) and the sidebar card (around line 1302) were updated.
