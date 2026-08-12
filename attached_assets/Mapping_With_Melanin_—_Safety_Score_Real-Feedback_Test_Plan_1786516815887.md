# Mapping With Melanin — Safety Score Real-Feedback Test Plan

## Objective

Prove that every public Community Safety Stats value is calculated only from real, eligible member feedback and that the page remains intentionally empty when there is no publishable data.

This plan must be run in a non-production test environment first, then repeated using isolated `is_load_test = true` accounts in production only after an owner-approved window. Load-test rows must never enter public aggregates.

## Test data rules

Create test businesses and test members that are clearly isolated. Do not use live customer responses, real businesses’ actual safety records, or fabricated public-looking scores.

| Test fixture | Purpose |
|---|---|
| Business A | No safety responses; validates honest empty state |
| Business B | 1–4 eligible safety responses; validates privacy threshold remains empty |
| Business C | 5 eligible responses; validates first publishable aggregate |
| Business D | Mixed eligible, withdrawn, pending, removed, and load-test responses; validates exclusions |
| Member 1–6 | Distinct authenticated test members |

## Aggregate policy under test

Only responses meeting every condition below are eligible:

```text
status = active
is_load_test = false
business is active and public
member account is eligible
```

The public panel is published only when there are at least **five distinct eligible members** for that business. Below five, every public numeric metric remains `null`/hidden and the member-facing empty state remains visible.

## Calculation assertions

| Metric | Calculation | Example at threshold |
|---|---|---|
| Voice count | Count of eligible active responses | 5 |
| Safety rating | Mean `safety_rating`, rounded to one decimal | `(5+4+4+3+5)/5 = 4.2` |
| Would return alone | `yes / (yes + no + not_sure)`; exclude `prefer_not_to_say` | 3 yes / 4 eligible answers = 75% |
| Recommend | `yes / (yes + no + not_sure)`; exclude `prefer_not_to_say` | 4 yes / 5 eligible answers = 80% |

## Test cases

### A. Empty state

1. Open Business A as an authenticated member.
2. Confirm the business detail API returns:

```json
{
  "publicSafety": {
    "voiceCount": 0,
    "safetyRating": null,
    "wouldReturnAlonePct": null,
    "recommendPct": null,
    "isPublished": false
  }
}
```

3. Confirm the business page shows:

```text
Community safety ratings will appear here once members share their experiences.
```

4. Confirm it does **not** show a rating, percentage, voice count, “Verified,” or “Welcoming Environment” badge based on no data.

**Pass:** no fabricated aggregate appears.

### B. Below-threshold privacy state

1. Submit valid active safety experiences from Members 1–4 for Business B.
2. Hard refresh after each submission.
3. Confirm the signed-in member can see their own saved response in edit mode.
4. Confirm the public API still returns `isPublished: false` and all public numeric fields `null`.
5. Confirm a different member cannot infer individual answers from the page.

**Pass:** individual data persists privately; public metrics remain empty below five distinct eligible responses.

### C. First public aggregate at threshold

Submit the following active responses for Business C:

| Member | Rating | Return alone | Recommend | Welcomed |
|---|---:|---|---|---|
| 1 | 5 | yes | yes | yes |
| 2 | 4 | yes | yes | yes |
| 3 | 4 | no | yes | mixed |
| 4 | 3 | not_sure | yes | yes |
| 5 | 5 | yes | yes | yes |

Expected result:

```json
{
  "voiceCount": 5,
  "safetyRating": 4.2,
  "wouldReturnAlonePct": 75,
  "recommendPct": 100,
  "isPublished": true
}
```

Verify each result through:

1. direct business detail API response;
2. SQL aggregate query;
3. member-facing business page after a hard refresh.

**Pass:** all three surfaces agree.

### D. Update and withdrawal

1. Member 3 changes rating from 4 to 2 and `wouldReturnAlone` from `no` to `yes`.
2. Confirm only one record exists for Member 3 and Business C.
3. Confirm public aggregate recalculates accurately after the update.
4. Member 4 withdraws their response.
5. Confirm their row is `withdrawn`, excluded from aggregate, and public metrics return to empty because eligible distinct count drops from 5 to 4.

**Pass:** updates do not duplicate rows; withdrawal updates both private state and public visibility correctly.

### E. Exclusion and moderation cases

For Business D, create:

- three active eligible responses;
- one `pending_review` response;
- one `removed` response;
- one `withdrawn` response;
- five `is_load_test = true` responses.

Confirm only the three active non-load-test responses are considered. The public panel remains empty below threshold.

**Pass:** none of the pending, removed, withdrawn, or load-test rows affect `voiceCount`, rating, return-alone percentage, recommendation percentage, or badge state.

### F. Privacy tests

1. Member A submits an optional private note.
2. Member B opens the same business page and business API.
3. Confirm Member B cannot see Member A’s private note, raw answer, ID, email, or response timestamp.
4. Confirm the business owner cannot access individual answers through normal business detail APIs.
5. Confirm no raw safety answer appears in a URL, browser history, public analytics event, Circle, group, or Kinfolk context.

**Pass:** only aggregate results become public at threshold.

### G. Failure handling

1. Simulate an API 500 or offline request on submit.
2. Confirm the form shows an error and does not display a successful safety score update.
3. Reload and confirm no unsaved local-only answer is treated as persisted.
4. Restore API service and submit again; confirm one saved record and correct aggregate.

**Pass:** no false success, duplicate insert, or stale optimistic score.

## SQL verification query

```sql
WITH eligible AS (
  SELECT *
  FROM business_safety_experiences
  WHERE business_id = $1
    AND status = 'active'
    AND is_load_test = FALSE
)
SELECT
  COUNT(*) AS voice_count,
  COUNT(DISTINCT member_id) AS distinct_member_count,
  CASE WHEN COUNT(DISTINCT member_id) >= 5
    THEN ROUND(AVG(safety_rating)::numeric, 1)
    ELSE NULL
  END AS public_safety_rating,
  CASE WHEN COUNT(DISTINCT member_id) >= 5 THEN ROUND(
    100.0 * COUNT(*) FILTER (WHERE would_return_alone = 'yes')
      / NULLIF(COUNT(*) FILTER (
        WHERE would_return_alone IN ('yes', 'no', 'not_sure')
      ), 0), 0
  ) ELSE NULL END AS public_return_alone_pct,
  CASE WHEN COUNT(DISTINCT member_id) >= 5 THEN ROUND(
    100.0 * COUNT(*) FILTER (WHERE would_recommend = 'yes')
      / NULLIF(COUNT(*) FILTER (
        WHERE would_recommend IN ('yes', 'no', 'not_sure')
      ), 0), 0
  ) ELSE NULL END AS public_recommend_pct
FROM eligible;
```

## Required browser assertions

| Control | Assertion |
|---|---|
| Rate button | `data-testid="business-rate-safety"`; opens form |
| Form submit | Shows confirmation only after server success |
| Empty panel | No numeric safety metric below threshold |
| Published panel | Values match API and SQL aggregate |
| Hard refresh | Member’s own response and public aggregate reload correctly |
| Withdraw control | Removes member response and recomputes aggregate |
| Privacy | No individual response/note rendered outside the member’s private edit state |

## Completion evidence

Replit must provide test data IDs, API responses, SQL output, a browser recording/screenshots for empty, below-threshold, published, update, and withdrawal states, plus the deployment SHA. Manus independently repeats the browser assertions before the safety flow is marked complete.
