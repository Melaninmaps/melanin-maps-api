# Library Evidence Link Integrity Repair

**Priority:** P0 trust and launch-quality repair for the Library evidence layer.  
**Scope:** Library evidence sources and their `View Source` links only. **Do not modify business external links, business detail pages, Map, Kinfolk behavior, authentication, Safety Hub, community feedback, or mobile in this repair.**

## Verified production finding

The Library page renders active `knowledge_sources.source_url` values directly as an external `<a>` link. It has no current-link status, no validation guard, and no practical fallback when a publisher moves or removes content.

The live **Breast Cancer** Book returns three active sources. The American Cancer Society record is active with `last_verified = null` and points to:

```text
https://www.cancer.org/cancer/breast-cancer/understanding-a-breast-cancer-diagnosis/breast-cancer-in-african-american-women.html
```

A member following this source reaches the American Cancer Society “page not found” experience shown in the founder’s screenshot. The other two sampled sources—the CDC and NCI links—redirect or load successfully. This proves the immediate failure is a **stale Library evidence URL**, not the working business-link system.

> A Library source must never remain publicly presented as an active source link when its external destination is known to be unavailable. A publisher’s 404 is not an MWM routing failure, but MWM must detect it, preserve the citation record, and stop directing members to it until a curator repairs it.

---

# 1. Root cause

| Layer | Current behavior | Defect |
| --- | --- | --- |
| Data | `knowledge_sources` stores `source_url`, `status`, and `last_verified`; observed live records have `last_verified = null`. | No durable link-health state is being written. |
| API | `GET /api/knowledge/graph/:topicId?surface=library` returns all sources with `status='active'`. | A source is active even if its external URL is stale, missing, or invalid. |
| Web UI | `library.tsx` renders `View Source` whenever `source_url` is non-null. | No status-aware rendering; a member is sent to an external 404. |
| Seeding | Seeded URLs are inserted as facts without a post-seed live verification record. | Content can become stale after publisher migrations. |

---

# 2. Immediate corrective action: repair the known Breast Cancer source

Replit must **not** guess a replacement URL.

1. Set the American Cancer Society Breast Cancer source record to `needs_review` immediately, retaining its title, claim, authority tier, and original URL for audit history.
2. Hide its external `View Source` action from the member-facing Library until a curator validates an updated canonical ACS page that substantively supports the existing claim.
3. Search the official American Cancer Society site for a current replacement. A curator must verify that the replacement actually supports the statement about Black women’s breast-cancer mortality and the relevant clinical context.
4. On approval, update the canonical URL, set the record back to `active`, and record the old/new URL, reviewer, timestamp, and verification result.
5. If no equivalent current page is available, keep the source citation in review/retired history and attach a separate authoritative replacement rather than silently linking the generic ACS homepage.

The Breast Cancer Book must retain at least one active authoritative source after the record is held. The live CDC and NCI sources currently satisfy that minimum.

---

# 3. Surgical schema and API changes

## 3.1 Additive source-health fields

Add the following fields to `knowledge_sources` through one idempotent startup migration. Do not delete existing citation history.

| Field | Type | Purpose |
| --- | --- | --- |
| `link_status` | enum/string | `unchecked`, `active`, `redirected`, `needs_review`, `retired`, `blocked_by_publisher`, `invalid_url` |
| `last_checked_at` | timestamp | Last deterministic external-link check. |
| `last_http_status` | integer nullable | Final HTTP status when available. |
| `last_final_url` | text nullable | Final destination after allowed redirects. |
| `last_check_error` | text nullable | Sanitized failure class; never store page/body content. |
| `link_reviewed_by` | user ID nullable | Curator/admin that accepted a replacement. |
| `link_reviewed_at` | timestamp nullable | Manual review time. |
| `replaced_source_url` | text nullable | Previous public URL for audit history when a link is repaired. |

Retain existing `status` for evidence lifecycle and use `link_status` for transport/destination health. Do not overload `status` to mean both evidence approval and URL availability.

## 3.2 API contract

Update Library graph source serialization to return a safe client-ready link state:

```ts
type LibrarySourceLinkState =
  | "available"
  | "redirected"
  | "unavailable"
  | "not_checked";

interface LibraryEvidenceSource {
  id: string;
  source_name: string;
  source_url: string | null;          // canonical source URL; never fabricate
  link_state: LibrarySourceLinkState;
  link_checked_at: string | null;
  claim: string | null;
  authority_tier: string;
  confidence: string | null;
  status: string;                     // evidence lifecycle state
}
```

Member-facing graph behavior:

| Source condition | API `link_state` | UI action |
| --- | --- | --- |
| Active source, URL checked 2xx | `available` | Render **View source ↗**. |
| Active source, redirect accepted and final page reviewed/allowed | `redirected` | Render **View source ↗** and retain canonical final URL. |
| 404/410, malformed URL, stale source, or curator hold | `unavailable` | Show source title/claim but **no clickable external link**. |
| Publisher blocks automation or source not checked | `not_checked` | Show source title; do not claim validation. Optional neutral text: **Link is being checked.** |

Do not expose low-level HTTP errors, internal reviewer notes, source-replacement history, or hidden URLs to ordinary members.

---

# 4. Required Library web repair

**File scope:** `artifacts/web/src/pages/library.tsx` and only the Library graph type/component paths necessary to support the updated API contract.

Replace the current rule:

```tsx
{src.source_url && <a href={src.source_url}>View Source</a>}
```

with status-aware behavior:

```tsx
const canOpenSource =
  Boolean(src.source_url) &&
  (src.link_state === "available" || src.link_state === "redirected");

{canOpenSource ? (
  <a
    href={src.source_url!}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Open source: ${src.source_name}`}
  >
    <Eye /> View source ↗
  </a>
) : (
  <p className="text-xs text-[#3A1F0E]/45 mt-1.5">
    Source link unavailable while this reference is reviewed.
  </p>
)}
```

Requirements:

1. External Library citations open in a new tab; no MWM internal route is used for a publisher URL.
2. A missing/stale URL must never produce a blank MWM page, a disabled-but-clickable link, or an invented replacement.
3. The source name, authority tier, and saved claim remain visible when a link is unavailable, unless the evidence record itself is retired.
4. Preserve `rel="noopener noreferrer"`.
5. Do not change working Business `Official website` / `Learn more` link components.

---

# 5. URL validation and repair workflow

## 5.1 On create, edit, or seed

Before a source becomes publicly clickable:

1. Parse with `new URL()` and allow only `https:` and `http:`.
2. Reject `javascript:`, `data:`, `file:`, embedded credentials, malformed hostnames, and internal MWM URLs unless intentionally configured as an MWM resource.
3. Perform an asynchronous health check with a descriptive MWM User-Agent, redirect limit of five, a short timeout, and per-host rate restraint.
4. Treat final `200–299` as `active`; retain the final URL only after it remains consistent with the cited source/claim.
5. Treat `301–308` as `redirected`, requiring canonical final URL review before mutating the citation URL.
6. Treat `404` and `410` as `needs_review`; hide clickability immediately.
7. Treat `401`, `403`, `406`, robots restriction, CAPTCHA, or publisher bot blocking as `not_checked` / `blocked_by_publisher`—not automatically as a broken source. A human browser check determines whether the link should remain active.
8. Preserve original URL, check result, and timestamp for curator review.

## 5.2 Full existing-catalog sweep

Run one controlled, resumable link-health sweep of the existing active Library evidence catalog.

- Request at most **one concurrent request per publisher host** and use an overall low concurrency cap.
- Cache results per canonical URL so the same URL is not checked repeatedly.
- Do not use the public Nominatim service, scrape behind logins, bypass publisher controls, or perform automated website interaction beyond deterministic link health checks.
- Create a curator queue for `needs_review`, `invalid_url`, and publisher-blocked records.
- Do not change source text or substitute a URL automatically based on search results.

## 5.3 Ongoing validation options — founder choice after the immediate repair

| Option | How it works | Tradeoffs | Cost / setup |
| --- | --- | --- | --- |
| **A. Curator-triggered validation** | Validate when a source is added/edited and provide an admin **Recheck link** action; run a one-time catalog sweep now. | Lowest external-request volume; stale links can persist until reviewed again. | Lowest complexity. |
| **B. Periodic Library source health checks** | A deterministic scheduled job rechecks sources on a controlled rotation, writes health state, and presents the curator queue. | Catches publisher migrations earlier; needs durable job monitoring and publisher-friendly throttling. | More setup and maintenance. |

Do not automatically send owner/business outreach under either option. The decision concerns Library publisher links only.

---

# 6. Curator/admin surfaces

Add an admin-only **Library Link Health** view or extend the existing Library Growth curator panel with:

| Field | Purpose |
| --- | --- |
| Source title and topic | Identify affected citation. |
| Authority tier and claim | Preserve evidence context during review. |
| Current and prior URL | Repair safely. |
| Link status, last HTTP status, last check time | Explain why a source is not clickable. |
| Failure class | `404`, `410`, invalid URL, publisher-blocked, timeout, or manual hold. |
| Replace URL action | Requires curator-entered URL and verification note. |
| Retire action | Requires reason; retains audit trail. |
| Recheck action | Deterministic and rate limited. |

All actions require administrator/curator authorization. Ordinary members must not edit authoritative source URLs.

---

# 7. Required tests and production proof

## Automated tests

1. `200` source renders a new-tab **View source** link.
2. Redirected source renders only after final destination is accepted.
3. `404`/`410` source returns `unavailable` and renders no anchor.
4. Malformed/prohibited scheme is rejected on seed/source edit.
5. `403`/`406` becomes `not_checked` or `blocked_by_publisher`, not silently marked valid.
6. Existing source title, claim, tier, and confidence remain visible when external link is unavailable.
7. Business external-link components are untouched; their regression test passes.
8. No non-admin can view or mutate Library link-health review details.

## Mandatory production proof package

1. `/api/version` response proving current bundle identity and `stale_bundle=false`.
2. Before/after row for the known ACS Breast Cancer source, including safe redaction of internal reviewer data.
3. Authenticated Breast Cancer Library screenshot: no clickable stale ACS link while held, live CDC/NCI sources still render.
4. Exact API response for `GET /api/knowledge/graph/book_h_breast_cancer?surface=library` showing the new link states.
5. Catalog summary: total active sources, available, redirected, unavailable/needs review, not checked/blocked, and zero-source topics.
6. One representative verified source from each major category cluster: health, legal, financial, travel, country/geography, culture, and community.
7. Working business outbound-link regression evidence.

## Definition of done

Library sources surface in the member interface when they exist, but a member is never sent to a known stale/invalid external destination. Evidence provenance and claims remain visible during review. Replit supplies catalog-level link-health evidence and a curator path to repair publisher changes without touching business links or fabricating sources.
