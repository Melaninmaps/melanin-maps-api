# Replit Implementation Guide — Differentially Private Business Impact Rollups and Consent-Gated Creator Matching

**Status:** Design and code specification. Do not expose business impact reports or creator partnership matches until every migration, suppression test, authorization test, and privacy review gate below passes.

> **Important correction:** A minimum threshold and rounding alone are not differential privacy. This design uses fixed, closed windows; contribution bounding; a minimum distinct-member threshold; a reporting delay; persisted Laplace noise; rounding; suppression; and no raw-count API access. Do not label any dashboard “differentially private” unless all of these controls are deployed together.

---

## 1. Privacy contract

A business may learn a broad, delayed community outcome such as **“About 35 members saved this business last week.”** A business, creator, publisher, or MWM staff member without explicit privileged access may never learn who those members are, exactly when they acted, which profile/circle/follower network they belong to, their private query, age band, health/legal/safety interest, exact travel plan, home location, booking status, or whether a single person caused a metric to change.

| Control | Required implementation |
| --- | --- |
| Unit of protection | One privacy-protected member within one closed 7-day report window. |
| Contribution bound | At most one contribution per member, business, metric, safe demand term, and closed window. |
| Minimum threshold | `k = 10` distinct members; lower groups are suppressed, not rounded upward. |
| Release delay | Report appears at least 24 hours after a fixed window closes. |
| Noise | Add one persisted Laplace noise draw per released metric/window with `epsilon = 0.75`; never redraw it on page refresh. |
| Rounding | Clamp at zero and round final display count to the nearest 5. |
| Windows | Use fixed, non-overlapping Monday–Sunday UTC windows. Never expose overlapping rolling windows. |
| Sensitive demand | Never aggregate suppressed/high-consequence query classes. |
| Load tests | Always excluded before aggregation. |

### Required language

Use **“About 35 members saved your business last week”**, not “34 people saved your business.” Use **“About 55 opened your official website”**, not “55 booked.” An outbound click is not a visit, reservation, purchase, or stay. A voluntary member self-report may support an aggregate **“About N members marked a visit”** label, but it still does not prove a booking.

---

## 2. Correct event fingerprinting and contribution bounding

The earlier daily fingerprint pattern is insufficient for a 7-day distinct-member report: the same member could be counted seven times. Replace it with a fingerprint derived from the **fixed report window**, not the event day.

### 2.1 Event writer change

**File:** `artifacts/api-server/src/analytics/business-impact.ts`

```ts
import crypto from 'node:crypto';

const IMPACT_SECRET = process.env.BUSINESS_IMPACT_HMAC_SECRET!;

export function impactWindowStart(value = new Date()): string {
  // Monday 00:00:00 UTC. All analytics workers must use this function.
  const d = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const day = d.getUTCDay(); // Sunday=0
  const delta = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function windowFingerprint(userId: string, windowStart: string): string {
  return crypto
    .createHmac('sha256', IMPACT_SECRET)
    .update(`business-impact:v1:${windowStart}:${userId}`)
    .digest('hex');
}

export async function recordImpact(input: {
  businessId: string;
  userId: string;
  eventType: 'saved' | 'official_website_opened' | 'public_profile_viewed' | 'voluntary_visit_marked' | 'demand_signal';
  safeDemandKey?: string;
  sourceSurface: 'directory' | 'map' | 'kinfolk' | 'library' | 'community' | 'business_page' | 'saved_list';
  isLoadTest: boolean;
}) {
  if (input.isLoadTest) return;
  const windowStart = impactWindowStart();
  const fingerprint = windowFingerprint(input.userId, windowStart);

  await pool.query(
    `INSERT INTO business_impact_events
      (business_id, event_type, report_window_start, member_window_fingerprint,
       safe_demand_key, source_surface, is_load_test)
     VALUES ($1, $2, $3::date, $4, $5, $6, false)
     ON CONFLICT (business_id, event_type, report_window_start,
                  member_window_fingerprint, safe_demand_key) DO NOTHING`,
    [
      input.businessId,
      input.eventType,
      windowStart,
      fingerprint,
      input.safeDemandKey ?? '',
      input.sourceSurface,
    ],
  );
}
```

The `safeDemandKey` must be a controlled taxonomy key generated only after the central sensitivity classifier permits it. It is never a raw question or free-text member search.

---

## 3. Exact SQL migration and rollup queries

**New migration:** `artifacts/api-server/src/lib/migrations/20260813_business_impact_dp_rollups_v2.sql`

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add fixed report-window support to the event table created in v1.
ALTER TABLE business_impact_events
  ADD COLUMN IF NOT EXISTS report_window_start DATE;

-- Backfill only if the table existed before this patch. Production worker will
-- regenerate/roll forward only future reports; do not fabricate historic reports.
UPDATE business_impact_events
SET report_window_start = (date_trunc('week', occurred_at AT TIME ZONE 'UTC')::date)
WHERE report_window_start IS NULL;

ALTER TABLE business_impact_events
  ALTER COLUMN report_window_start SET NOT NULL;

-- Replace any daily dedup index from a prior implementation.
DROP INDEX IF EXISTS business_impact_events_daily_dedup;
CREATE UNIQUE INDEX IF NOT EXISTS business_impact_events_window_dedup
  ON business_impact_events(
    business_id,
    event_type,
    report_window_start,
    member_window_fingerprint,
    safe_demand_key
  );

-- Internal-only fields are deliberately separate from display fields.
ALTER TABLE business_impact_rollups
  ADD COLUMN IF NOT EXISTS raw_distinct_count_internal INTEGER,
  ADD COLUMN IF NOT EXISTS privacy_epsilon NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS noise_value NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS release_state VARCHAR(24) NOT NULL DEFAULT 'suppressed'
    CHECK (release_state IN ('suppressed', 'delayed', 'released', 'held')),
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suppression_reason VARCHAR(80);

-- No API role may select raw_distinct_count_internal, noise_value,
-- member_window_fingerprint, or individual business_impact_events rows.
REVOKE ALL ON TABLE business_impact_events FROM PUBLIC;
REVOKE ALL ON TABLE business_impact_rollups FROM PUBLIC;

-- A single Laplace draw must be stored at release time and never redrawn.
CREATE OR REPLACE FUNCTION mwm_laplace_noise(p_epsilon DOUBLE PRECISION)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  u DOUBLE PRECISION;
BEGIN
  IF p_epsilon <= 0 THEN RAISE EXCEPTION 'epsilon must be positive'; END IF;
  -- Bound u away from ±0.5 to avoid ln(0).
  u := LEAST(0.499999999, GREATEST(-0.499999999, random() - 0.5));
  RETURN -sign(u) * ln(1 - 2 * abs(u)) / p_epsilon;
END;
$$;

-- Create aggregates only for a closed 7-day window that ended >=24h ago.
-- This query must run in a privileged scheduled worker, never in a member HTTP request.
WITH windows AS (
  SELECT
    e.business_id,
    e.event_type,
    NULLIF(e.safe_demand_key, '') AS safe_demand_key,
    e.report_window_start AS window_start,
    (e.report_window_start + INTERVAL '7 days') AS window_end,
    COUNT(DISTINCT e.member_window_fingerprint)::INTEGER AS raw_distinct_count
  FROM business_impact_events e
  WHERE e.is_load_test = FALSE
    AND e.report_window_start < (date_trunc('week', now() AT TIME ZONE 'UTC')::date)
    AND (e.report_window_start + INTERVAL '8 days') <= now()
    AND (
      e.event_type <> 'demand_signal'
      OR e.safe_demand_key IN (
        SELECT key FROM approved_public_demand_terms WHERE status = 'active'
      )
    )
  GROUP BY e.business_id, e.event_type, NULLIF(e.safe_demand_key, ''), e.report_window_start
), noise AS (
  SELECT w.*, mwm_laplace_noise(0.75) AS laplace_noise
  FROM windows w
), released AS (
  SELECT
    business_id,
    CASE event_type
      WHEN 'saved' THEN 'distinct_saves'
      WHEN 'official_website_opened' THEN 'official_website_opens'
      WHEN 'public_profile_viewed' THEN 'public_profile_views'
      WHEN 'voluntary_visit_marked' THEN 'voluntary_visits'
      WHEN 'demand_signal' THEN 'safe_demand'
    END AS metric_type,
    safe_demand_key,
    window_start,
    window_end,
    raw_distinct_count,
    laplace_noise,
    CASE WHEN raw_distinct_count >= 10 THEN TRUE ELSE FALSE END AS threshold_met
  FROM noise
)
INSERT INTO business_impact_rollups (
  id, business_id, metric_type, safe_demand_key, window_start, window_end,
  true_distinct_count, raw_distinct_count_internal, displayed_count,
  privacy_threshold_met, delayed_until, privacy_epsilon, noise_value,
  release_state, released_at, suppression_reason, generated_at
)
SELECT
  gen_random_uuid()::text,
  business_id,
  metric_type,
  safe_demand_key,
  window_start,
  window_end,
  raw_distinct_count,
  raw_distinct_count,
  CASE
    WHEN threshold_met THEN (ROUND(GREATEST(0, raw_distinct_count + laplace_noise) / 5.0) * 5)::INTEGER
    ELSE NULL
  END,
  threshold_met,
  window_end + INTERVAL '24 hours',
  0.75,
  CASE WHEN threshold_met THEN laplace_noise ELSE NULL END,
  CASE WHEN threshold_met THEN 'released' ELSE 'suppressed' END,
  CASE WHEN threshold_met THEN now() ELSE NULL END,
  CASE WHEN threshold_met THEN NULL ELSE 'k_anonymity_below_10' END,
  now()
FROM released
ON CONFLICT (business_id, metric_type, COALESCE(safe_demand_key, ''), window_start, window_end)
DO NOTHING;
```

### 3.1 Safe dashboard query

**Only this view may be used by business-owner/admin dashboard routes.**

```sql
CREATE OR REPLACE VIEW business_impact_dashboard_safe AS
SELECT
  r.business_id,
  r.metric_type,
  r.safe_demand_key,
  r.window_start,
  r.window_end,
  r.displayed_count,
  r.released_at
FROM business_impact_rollups r
WHERE r.release_state = 'released'
  AND r.privacy_threshold_met = TRUE
  AND r.delayed_until <= now()
  AND r.displayed_count IS NOT NULL;

REVOKE ALL ON business_impact_dashboard_safe FROM PUBLIC;
```

The application’s `toSafeMetricCopy` must select only these fields. It must not join the event table. A claimed business owner sees only their own business ID after `requireBusinessOwnerOrAdmin`; an ordinary member receives `403`.

### 3.2 Suppression rules

- Do not render “0” for a suppressed group; render nothing or **“Not enough aggregate activity yet.”**
- Do not expose multiple overlapping date ranges, hourly views, city breakouts, source-surface breakouts, age bands, or combinations that could be differenced to isolate one person.
- Do not allow a business to filter by demographic, culture, neighborhood, travel status, Circle, follower graph, or private preference.
- Do not mix a demand metric with a tiny geographic slice. Public demand is aggregated only at preapproved geography granularity and only after the same threshold/delay rule.

---

## 4. Creator matching: no leakage by design

### 4.1 Separate consent is mandatory

A creator may never be matched because Kinfolk inferred their culture, audience, neighborhood, age, income, medical interests, or political beliefs from posts, follows, profile image, name, language, or private activity. The creator must opt in to a **Creator Partnership Profile** and select public campaign categories themselves.

A business must be an approved claimed minority-owned business or a founder-approved campaign, and must opt in to a Creator Partnership Brief. Neither party can see the other until both have chosen to review a match.

**Future table only; do not deploy it in the current release:**

```sql
CREATE TABLE creator_partnership_profiles (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  public_campaign_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  public_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  public_geography_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  minimum_campaign_type VARCHAR(32),
  allow_business_introductions BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE creator_business_match_candidates (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  match_basis JSONB NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'creator_review', 'business_review', 'mutual_opt_in', 'introduced', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### 4.2 What the creator matching worker may use

| Allowed input | Prohibited input |
| --- | --- |
| Creator’s explicit campaign categories, public languages, chosen geography scope, `allow_business_introductions`, and business owner’s self-described offerings/campaign category | Member search history, saved places, private follows, Circle membership, exact location, age band, health/legal/safety data, inferred ethnicity, profile photo, name, or hidden demographic labels |
| Thresholded public campaign-interest trend such as “public brunch content has strong eligible interest” | “34 people want you to post to these 34 members” |
| Human-approved business campaign brief | Automated creator contact or exposure of a business owner’s personal contact data |

### 4.3 Matching algorithm

```ts
function eligibleCreatorBusinessMatch(c: CreatorProfile, b: ClaimedBusiness): MatchCandidate | null {
  if (!c.optIn || !c.allowBusinessIntroductions) return null;
  if (!b.partnershipOptIn || !b.isVerifiedSelfDesignatedMinorityOwned) return null;
  const overlappingCategories = intersect(c.publicCampaignCategories, b.ownerDeclaredCampaignCategories);
  const geographyOverlap = intersects(c.publicGeographyScope, b.publicCampaignGeographyScope);
  if (overlappingCategories.length === 0 || !geographyOverlap) return null;

  return {
    // Show category-level basis only, e.g. { categories: ['brunch', 'food'], geography: 'Philadelphia metro' }.
    // Do not include other users or private behavioral evidence.
    matchBasis: { categories: overlappingCategories, geography: b.publicCampaignGeographyScope },
    status: 'creator_review',
  };
}
```

Creator review comes first. If the creator declines, the business never learns that the creator existed. If the creator accepts, the business sees only a public creator profile card and decides whether to request an introduction. A connection is made only after **mutual** approval. The initial message uses an MWM relay; it does not reveal personal email/phone/social account unless both sides explicitly share it.

### 4.4 Kinfolk guardrail

Kinfolk may say: **“A local business has opted into a brunch-content partnership opportunity. Would you like to review a category-level brief?”** It must never say: **“Your followers like brunch, so this is perfect for you,”** unless the creator explicitly selected a public brunch category in the creator profile. It may never tell a business that a creator’s supporters, followers, or specific demographic searched for a product.

---

## 5. Required tests and proof

1. Nine distinct fixed-window fingerprints create a suppressed rollup; no display metric exists.
2. Ten distinct fingerprints after a closed window and 24-hour delay create one released rounded metric.
3. Refreshing the dashboard does not alter `noise_value` or `displayed_count`.
4. Overlapping-window, hourly, source-surface, demographic, age, Circle, and follower filters are unavailable.
5. Load-test traffic creates no event, rollup, candidate, alert, or invitation.
6. A raw sensitive query cannot become `safe_demand_key`.
7. `official_website_opened` is not labeled a booking/visit.
8. Non-owner receives `403` from safe impact dashboard; owner receives only safe view fields.
9. Author without demographic metadata remains source-valid; no inferred data is stored.
10. Public author/outlet self-description is stored only with its source evidence URL.
11. Creator without explicit opt-in cannot produce a candidate.
12. Minority-owned business without claim/partnership opt-in cannot produce a creator candidate.
13. Business cannot see creator identity before creator review; creator cannot see business owner contact before mutual opt-in.
14. No automated contact is sent in the current release.
15. A separate privacy/security review signs off before any public impact dashboard or creator introduction is enabled.
