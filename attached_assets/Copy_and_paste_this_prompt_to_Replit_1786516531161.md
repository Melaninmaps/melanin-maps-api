# Copy and paste this prompt to Replit

```text
OWNER-APPROVED P0 — REAL COMMUNITY BUSINESS PAGE RECOVERY

## The decision

Do not redesign the business page. Do not replace the approved layout. The screenshots already show the intended structure:

- ownership and verification badges;
- Put Your People On;
- Community Safety Stats;
- Rate Your Safety Experience;
- Overview / Reviews / Location & Contact;
- photos;
- Community Vibes;
- Community Says;
- contact information;
- claim-business pathway.

The problem is **capability and truthfulness**, not the basic visual structure.

The richer-looking seeded example must not remain richer because it contains unsupported numbers such as “312 voices,” “97% would return alone,” “4.9 safety rating,” “98% recommend,” or pre-filled community labels that cannot be traced to real approved member feedback.

A real business page must grow deeper only when real community members add real feedback. Preserve the approved design and wire it to a genuine, auditable data model.

## Absolute no-touch boundary

Touch only:

1. business-feedback data model and aggregates;
2. business-detail feedback API routes;
3. the existing Community Vibes, Community Says, safety-feedback, and aggregate rendering on `/businesses/:id`;
4. map-pin-to-business integrity validation;
5. narrowly related migration/seed-cleanup/test files.

Do NOT touch login, auth, sessions, subscriptions, Kinfolk prompts/models/capacity work, Library, map rendering design, Safety Hub, Circles, community, marketplace, mobile layouts, or any unrelated page/component.

Do NOT add fabricated reviews, ratings, safety scores, voice counts, photos, testimonials, or community tags to make a page look complete.

## The exact user experience required

### Community Vibes

The selectable chips already shown on the business page—such as `Locals Know`, `Auntie Energy`, `Hood Classic`, `Soft Life`, `Neighborhood Love`, `History Lives Here`, `Sunday Best`, and `Take Somebody From Out of Town`—must be real feedback controls.

When an authenticated member selects `Auntie Energy` on a specific business:

1. the selected chip becomes visibly selected immediately;
2. its real aggregate count updates immediately;
3. the selection persists in the database for that member and business;
4. a hard refresh restores that member’s selected state and the same real count;
5. selecting it again predictably removes/toggles the member’s selection and updates the count;
6. no other business or member selection changes.

### Community Says

The selected caption options—such as `Sent the Group Chat`, `Cooks Like Home`, `Worth the Drive`, `Portions With Love`, `Grandma Approved`, and `Seasoned Right`—must use the same real member feedback mechanism.

When selected, the page must update immediately and persist after hard refresh. If no real approved community member has selected a caption, show:

```text
Be the first to add a community caption for this business.
```

Do not show a count like `12 said ...` unless there are exactly 12 valid approved records behind it.

### Safety feedback — this button must work

`Rate Your Safety Experience` is not a decorative row. It must open a short, private, accessible member flow titled:

```text
Tell us about your experience
```

The flow must collect real structured answers for the specific business, with an optional written note. At a minimum, it must ask:

1. **How safe did you feel here?** — 1–5 scale, with clear plain-language anchors.
2. **Would you return here alone?** — Yes / No / Not sure / Prefer not to say.
3. **Would you recommend this place to someone in your community?** — Yes / No / Not sure / Prefer not to say.
4. **Did you feel welcomed and respected?** — Yes / No / Mixed / Prefer not to say.
5. **Anything community members should know?** — optional private-to-moderation note; never publicly displayed automatically.

On submit, the member must see a clear confirmation that their experience was recorded. The system then stores the response against the canonical business ID, allows the member to edit or withdraw their own answer later, and uses only approved, non-test, non-deleted responses to calculate public safety aggregates.

The public Community Safety Stats panel must update from those real answers only:

- **Would return alone** = percentage of eligible active responses answering Yes;
- **Safety rating** = average of eligible active 1–5 ratings, rounded only for display;
- **Recommend** = percentage of eligible active responses answering Yes;
- **Voice count** = count of eligible active feedback records used by the displayed metric.

Until a publishable threshold is met, do not imply precision. Show the honest empty/early-community state instead:

```text
Community safety ratings will appear here once members share their experiences.
```

Do not display a seeded `4.9`, `97%`, `98%`, or `312 voices` value in production unless every number is reproducible from real approved feedback records. Do not leak a member’s private note, sensitive answer, or identity to businesses, circles, community feeds, or other members.

## Required source of truth

Create or use one normalized, authenticated, idempotent feedback model. Do not store presentation counts as the source of truth on `businesses`.

A supported design may use fields equivalent to:

```sql
business_community_feedback
---------------------------
id
business_id          -- canonical public business ID
member_id            -- authenticated member ID
kind                 -- 'vibe' | 'caption' | 'safety'
key                  -- canonical key, e.g. 'auntie_energy'
value                -- optional value for safety/recommendation input
status               -- 'active' | 'pending_review' | 'removed'
created_at
updated_at
UNIQUE (business_id, member_id, kind, key)
```

Use the existing database and schema conventions where possible. Do not create a parallel demo feedback system.

Rules:

1. A member can create or toggle only their own feedback.
2. `business_id` must reference an existing active public business.
3. Only `active`/approved feedback participates in member-facing aggregates.
4. Deleted, moderation-removed, test, demo, and legacy placeholder data must never participate in public aggregates.
5. One member cannot inflate a count by submitting the same tag repeatedly.
6. Rate-limit feedback writes and preserve moderation/audit fields.

## Required API contract

Implement a single authenticated idempotent endpoint, or extend the existing equivalent route without breaking it:

```text
PUT /api/businesses/:businessId/community-feedback
```

Request example:

```json
{
  "kind": "vibe",
  "key": "auntie_energy",
  "selected": true
}
```

Response must include only real authoritative data:

```json
{
  "memberSelection": {
    "kind": "vibe",
    "key": "auntie_energy",
    "selected": true
  },
  "aggregates": {
    "vibeCounts": { "auntie_energy": 1 },
    "captionCounts": {},
    "safety": {
      "voiceCount": 0,
      "wouldReturnAlone": null,
      "rating": null,
      "recommendationRate": null
    }
  },
  "updatedAt": "ISO-8601"
}
```

The business detail read endpoint must return:

- canonical business identity and provenance/status;
- the member’s own existing selections only for that signed-in member;
- real aggregate counts;
- only displayable/approved reviews/captions;
- honest null/empty values where no feedback exists.

## Placeholder and fake-data cleanup

This is mandatory.

1. Audit every public business for contradictions such as:
   - `rating` or `review_count` present while `reviews` is empty;
   - safety/recommendation aggregate present with zero source feedback;
   - Community Says/Vibes count without corresponding active feedback;
   - demo/default/legacy seed value presented as community fact;
   - unverified business description, ownership, coordinates, or hours displayed as verified.
2. Do not delete genuine community feedback.
3. Suppress/quarantine unsupported aggregates and placeholder feedback from public responses immediately.
4. Preserve an internal reversible audit record identifying every suppressed legacy row/value and why.
5. A real business with no feedback must look intentionally new—not falsely popular.

The currently observed bad state is unacceptable:

```json
{
  "rating": "5.0",
  "reviewCount": 1,
  "reviews": [],
  "vibes": []
}
```

The API must return either the real review/vibe evidence backing those counts or no public aggregate at all.

## Pin and business identity integrity

Every public pin must resolve to a real business detail record.

Required checks:

1. Pin uses canonical `business.id`; never use display name as the identity.
2. Pin coordinates match the exact business returned by `/api/businesses/:id`.
3. A public mapped business needs valid canonical ID, active public/listing-safe status, valid latitude/longitude, city, and state.
4. A removed, demo, reference-only, invalid-coordinate, or duplicate business cannot create a public pin.
5. Clicking a pin opens the matching `/businesses/:id` page or focused detail panel—never a blank, mismatched, or fake page.
6. Create a report for all public pins: pin business ID, business name, listing status, provenance/status, latitude/longitude, detail API status, and match result.

## Client requirements

1. Keep the current approved business-page look and section order.
2. Add `aria-pressed` and stable `data-testid` attributes to every selectable Vibe/Community Says control.
3. Use optimistic UI only if it reconciles to the API response. Roll back visibly if the write fails.
4. Load the signed-in member’s prior selections on page open.
5. Hard refresh must show the same selected state and the same aggregate values.
6. If feedback is disabled/not eligible for a business, do not leave a dead chip; show an honest explanation or hide the control.
7. Do not change the business page into a generic Yelp-style card. Maintain the Community Vibes, Community Says, safety, and culturally meaningful structure shown in the approved images.

## Exact release gates

Do not call this complete until all of the following pass in a fresh authenticated browser session:

1. A real map pin opens the matching canonical business page.
2. Clicking `Rate Your Safety Experience` opens the `Tell us about your experience` flow; it is not a dead button.
3. Member submits a valid safety response; API persists it, member sees confirmation, and the member can return to edit/withdraw it.
4. Only eligible approved responses affect safety score, return-alone percentage, recommendation percentage, and voice count; a fresh hard refresh shows the same truthful aggregate.
5. Member selects `Auntie Energy`; UI selects, API returns success, aggregate increments only once.
6. Hard refresh restores `Auntie Energy` selection and count.
7. Member toggles it off; UI/API/aggregate update correctly.
8. Repeat for one Community Says caption.
9. A business with no approved feedback shows no fake rating, review count, safety score, voice count, or quote.
10. A business with approved feedback shows only values traceable to active source records.
11. Pin integrity report has no public invalid/duplicate/mismatched pins, or every exception is suppressed before member visibility.
12. Login, map design, Library, Kinfolk, Safety Hub, business ownership claims, and other pages do not regress.

## Required evidence back to the owner and Manus

Return:

1. Exact files changed and schema migration(s).
2. Placeholder/legacy aggregate audit report: count, IDs, disposition, and rationale.
3. Public pin integrity report.
4. API before/after payloads for one real business with no feedback and one test-isolated business with genuine feedback.
5. A logged-in browser recording/screenshots showing select → persist → hard refresh → toggle for both a Vibe and Community Says tag.
6. SQL/query evidence that public aggregates are computed from active approved feedback records only.
7. Test results and new deployment SHA.

Start with the data integrity audit and real feedback write/read path. Do not add new visual design or fake seed data.
```
