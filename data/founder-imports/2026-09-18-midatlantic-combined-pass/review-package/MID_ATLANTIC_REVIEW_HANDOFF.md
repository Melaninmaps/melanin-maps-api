# Mid-Atlantic Source-Backed Directory Review Package

**Status:** **REVIEW ONLY — NOT PUBLISHED.** This package has not written to a production database, created a public map pin, changed a user, or supplied a live Kinfolk recommendation. It is a protected input for reviewer staging and approval.

## What this package contains

The package consolidates completed source passes for **Washington, DC and close-in Maryland/Virginia suburbs; Baltimore and nearby Maryland locations; and Greater Richmond/Hampton Roads/Petersburg, Virginia**. Its 215 candidates originate from 256 collected source rows. The consolidation removed or held 41 records that were exact normalized duplicates or structurally incomplete before the review manifest was assembled. No candidate was invented, and chamber membership was not treated as proof of any owner identity.

| Review route | Candidates | Publication treatment |
| --- | ---: | --- |
| Physical commercial business | 156 | May be considered for public directory and map-pin publication only after reviewer reconciliation, approval, and server-side geocode validation. |
| Online-only business | 8 | May be searchable after approval but must never receive an invented street address, directions, or map pin. |
| Regulated-review lead | 23 | Requires the applicable authority, licensing, or higher-risk service review before any publication decision. |
| Community resource | 12 | Remains outside the commercial business and map-pin route. |
| Cultural place | 15 | Remains outside the commercial business and map-pin route. |
| Manual review | 1 | Requires manual classification before it can proceed. |
| **Total review candidates** | **215** | **Not public.** |

## Destination verification

The current manifest contains 220 unique customer destinations. Automated HTTP checks recorded 178 reachable destinations, 27 non-success responses requiring review, 12 network errors, and 3 timeouts. The 174 candidates whose selected destinations were reachable are marked `pending_review`. The other 41 are `needs_research` and must not be promoted until a reviewer confirms an appropriate public customer destination.

> A timeout, network error, or non-success HTTP response is a **review signal**, not a determination that a business has closed.

The exact review manifest is `mid-atlantic-combined-review-only-candidates.jsonl`. Its SHA-256 is **`d83797abce353a731de5afef1272b82a78f70a503478cd0410063ee2b9705eb6`**. Do not edit it after review begins. Any change requires rebuilding the manifest and rechecking destinations.

## Evidence boundary

Every retained record has a public source URL and a customer-facing HTTP(S) destination. Physical records have numbered street addresses. The source reports preserve the published basis for each collection pass, including the Maryland Hispanic Chamber corporate directory, DC Chamber and Virginia Black Chamber pages, and Virginia Hispanic Chamber member pages. The source reports do not infer ownership, language, hours, accessibility, insurance, license status, current availability, or quality where a public source does not expressly support it.[1] [2] [3] [4]

## Required protected review sequence

First, stage the unchanged manifest through the existing protected local review route and verify the checksum. Second, reconcile candidates against existing records so an existing listing is enriched rather than silently duplicated. Third, resolve the `needs_research`, collision, regulated, community, cultural, and manual-review queues using their applicable policies. Fourth, approve only supported physical commercial candidates and validate a controlled geocode before publishing any map pin. Fifth, approve eligible online-only candidates as searchable services only, with no map behavior. Finally, validate public `/api/businesses` search, business-detail pages, map-pin click-through, customer links, and authenticated Kinfolk local retrieval after publication.

This package cannot and does not bypass those protections. No user, authentication, password, tester, session, access, waitlist, billing, or payment record is included or modified.

## References

[1]: https://maryland-hispanic-chamber-of-commerce.org/membership-directory/corporate "Maryland Hispanic Chamber of Commerce corporate membership directory"
[2]: https://members.dcchamber.org/ "DC Chamber member directory"
[3]: https://members.vablackbusinessdirectory.org/ "Virginia Black Chamber business directory"
[4]: https://www.vahcc.com/member-directory "Virginia Hispanic Chamber member directory"
