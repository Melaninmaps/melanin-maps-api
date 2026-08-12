---
name: Library link health pattern
description: How knowledge_sources link transport state flows from DB to the Library UI. Implemented Aug 12 2026.
---

## The rule
The Library UI MUST NOT render a clickable "View source ↗" link for any source where `link_state === "unavailable"`. Instead show: "Source link unavailable while this reference is reviewed".

**Why:** A real member was directed to a 404 ACS breast cancer URL during the Aug 2026 audit. Dead links erode trust and could cause harm if a member is relying on the information.

**How to apply:**
- `knowledge_sources.link_status` (DB column) → mapped by `fetchSources()` to `link_state` on the API response
- Mapping: `active` → `available`, `redirected` → `redirected`, `unchecked`/NULL → `not_checked`, anything else → `unavailable`
- `library.tsx` `KGSource.link_state` is optional (old API responses lack it) — missing defaults to `not_checked` (conservative: show the link)
- Curator workflow (Option A, release 1): admin sets `link_status = 'needs_review'` manually; `ensureLibraryLinkHealth` guard idempotently flags known-stale URLs on boot

## DB columns added to knowledge_sources (Aug 12 2026)
- `link_status` varchar(30) DEFAULT 'unchecked'
- `last_checked_at` timestamptz
- `last_http_status` integer
- `last_final_url` text
- `last_check_error` text
- `link_reviewed_by` varchar(255)
- `link_reviewed_at` timestamptz
- `replaced_source_url` text

## ACS breast cancer URL (known stale Aug 2026)
`ensureLibraryLinkHealth` guard: idempotent UPDATE sets `link_status = 'needs_review'` where source_url LIKE `%cancer.org%breast-cancer%` and current link_status is NULL or 'unchecked'. Does NOT overwrite a curator's decision if they have already updated the status.
