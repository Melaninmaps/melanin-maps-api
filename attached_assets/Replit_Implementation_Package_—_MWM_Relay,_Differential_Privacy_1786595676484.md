# Replit Implementation Package — MWM Relay, Differential Privacy Edge Cases, and Population-Scaled Kinfolk Library Learning

**Status:** Implementation specification. This package extends the existing Library Growth Engine and deferred partnership design. It does not activate automatic business/creator outreach, publish new Library topics, or send alerts until the required tests and founder-approved release gate pass.

---

## 1. MWM consent-gated creator–business relay

### 1.1 Required sequence

A creator and a minority-owned business may communicate only after four decisions:

1. The creator opts into creator introductions and publishes their own campaign categories and public geography scope.
2. The claimed, self-designated/verified minority-owned business opts into partnership opportunities.
3. The creator reviews a category-level candidate and accepts it.
4. The business reviews the same candidate and accepts it.

No candidate may be built from inferred culture, private search history, followers, Circles, exact location, age band, health/safety interests, profile photo, name, or hidden demographic data. The initial introduction is an in-app MWM relay, not an email/DM or a reveal of private contact details.

### 1.2 Additive migration

**New migration:** `artifacts/api-server/src/lib/migrations/20260813_mwm_creator_business_relay_v1.sql`

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS creator_business_match_candidates (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  match_basis JSONB NOT NULL,
  -- Example: {"categories":["brunch","food"],"geography":"Philadelphia metro"}
  -- Never include names of members, searches, followers, or precise location.
  status VARCHAR(24) NOT NULL DEFAULT 'creator_review'
    CHECK (status IN ('creator_review','business_review','mutual_opt_in','introduced','declined','expired')),
  creator_decided_at TIMESTAMPTZ,
  business_decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creator_user_id, business_id, status)
);

CREATE TABLE IF NOT EXISTS mwm_relay_threads (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_candidate_id VARCHAR(100) NOT NULL UNIQUE
    REFERENCES creator_business_match_candidates(id) ON DELETE CASCADE,
  creator_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_owner_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','creator_paused','business_paused','closed','reported')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mwm_relay_messages (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id VARCHAR(100) NOT NULL REFERENCES mwm_relay_threads(id) ON DELETE CASCADE,
  sender_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,
  key_version VARCHAR(32) NOT NULL,
  -- Metadata is limited to delivery/moderation state; do not store extracted PII.
  status VARCHAR(24) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','reported','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mwm_relay_messages_thread_created_idx
  ON mwm_relay_messages(thread_id, created_at);

CREATE TABLE IF NOT EXISTS mwm_relay_contact_release_consents (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id VARCHAR(100) NOT NULL REFERENCES mwm_relay_threads(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(thread_id, user_id)
);
```

### 1.3 Exact relay route behavior

**New router:** `artifacts/api-server/src/routes/creator-business-relay.ts`

```ts
router.post('/creator-matches/:matchId/decision', requireAuth, async (req, res) => {
  const decision = z.object({ decision: z.enum(['accept', 'decline']) }).parse(req.body);
  const candidate = await loadMatchForDecision(req.params.matchId, req.user.id);
  if (!candidate) return res.status(404).json({ error: 'MATCH_NOT_FOUND' });

  if (candidate.creatorUserId === req.user.id) {
    await decideCreator(candidate.id, decision.decision);
    if (decision.decision === 'decline') return res.json({ status: 'declined' });
    return res.json({ status: 'business_review' });
  }

  if (!(await isApprovedBusinessOwner(candidate.businessId, req.user.id))) {
    return res.status(403).json({ error: 'OWNER_REQUIRED' });
  }
  if (candidate.status !== 'business_review') return res.status(409).json({ error: 'CREATOR_CONSENT_REQUIRED' });

  await db.transaction(async (tx) => {
    await decideBusiness(tx, candidate.id, decision.decision);
    if (decision.decision !== 'accept') return;
    await tx.insert(mwmRelayThreads).values({
      matchCandidateId: candidate.id,
      creatorUserId: candidate.creatorUserId,
      businessId: candidate.businessId,
      businessOwnerUserId: req.user.id,
    });
    await markCandidateIntroduced(tx, candidate.id);
  });
  return res.json({ status: decision.decision === 'accept' ? 'introduced' : 'declined' });
});

router.post('/relay/threads/:threadId/messages', requireAuth, async (req, res) => {
  const body = z.object({ body: z.string().trim().min(1).max(2000) }).parse(req.body);
  const thread = await loadRelayThread(req.params.threadId);
  if (!thread || !isParticipant(thread, req.user.id)) return res.status(403).json({ error: 'THREAD_ACCESS_DENIED' });
  if (thread.status !== 'active') return res.status(409).json({ error: 'THREAD_NOT_ACTIVE' });
  await assertRateLimit(`relay:${req.user.id}`, { max: 12, windowSeconds: 3600 });

  const moderation = await moderateRelayMessage(body.body);
  if (moderation.block) return res.status(400).json({ error: 'MESSAGE_POLICY_BLOCKED' });
  // No attachments, phone/email extraction, or automatic external contact in v1.
  await insertEncryptedRelayMessage({
    threadId: thread.id,
    senderUserId: req.user.id,
    ciphertext: await encryptAtRest(body.body),
  });
  return res.status(201).json({ ok: true });
});
```

### 1.4 Required relay privacy behavior

The creator sees only the business’s public business name, public business description, public campaign category, and the category-level match basis after mutual consent. The business sees only the creator’s public creator profile and self-selected campaign categories after mutual consent. Neither sees personal email, phone, private social account, search history, member/follower list, age band, travel plan, health/safety interest, or raw business impact metrics.

The `mwm_relay_contact_release_consents` table is used only when both sides separately elect to exchange a public contact method in a later release. One consent is never sufficient. Message content must use encryption at rest with an environment-managed key/KMS; plaintext must never be included in application logs, analytics, Kinfolk prompts, business dashboards, or creator metrics.

---

## 2. k=10 and Laplace noise edge case

### 2.1 The rule below threshold

If a weekly metric has **9 or fewer distinct privacy-protected members**, it is suppressed. The worker must not add noise, round, or publish the value. It must not say “about 10,” show a zero, create a partnership candidate, or allow the business to query a smaller time/geography filter.

```sql
CASE
  WHEN raw_distinct_count < 10 THEN 'suppressed'
  ELSE 'released'
END AS release_state,
CASE
  WHEN raw_distinct_count < 10 THEN NULL
  ELSE ROUND(GREATEST(0, raw_distinct_count + stored_laplace_noise) / 5.0) * 5
END AS displayed_count
```

Noise must never help a count below threshold cross the threshold. The threshold decision uses the internal bounded exact distinct count; noise is added only **after** eligibility. This prevents a business from learning that a count was 9 rather than 1 by watching noisy releases.

### 2.2 Just above threshold

If the true count is 10, the stored Laplace draw can make the displayed count round to 5, 10, 15, or a nearby multiple of five. That is expected; the UI says **About N**, not an exact count. Clamp negative noisy values to zero. Do not redraw the noise on refresh. The same business/metric/window must return the same stored display count to every authorized view.

| True bounded weekly count | Rule | Display example |
| --- | --- | --- |
| 0–9 | Suppress; no noise; no candidate | “Not enough aggregate activity yet.” |
| 10 | Release after 24 hours; apply stored noise; round | “About 10 members saved this business.” |
| 34 | Release after 24 hours; apply stored noise; round | “About 35 members saved this business.” |
| 340 | Release after 24 hours; apply stored noise; round | “About 340 members saved this business.” |

Do not create overlapping 7-day/14-day/30-day reports from the same event population for the same business, metric, demand, or geography. Use non-overlapping fixed windows or a privacy budget ledger before releasing a second view.

---

## 3. Population-scaled Kinfolk Library learning

### 3.1 Founder requirement

Kinfolk should notice that repeated community information needs matter differently depending on the relevant population. Seven distinct people seeking a subject in a small Willow Grove scope can justify a local Library candidate. In Philadelphia, the same count is a weak signal; a few hundred or several thousand people are stronger evidence of a city-level need. No founder should need to manually create a topic every time a real pattern emerges.

The system creates **governed candidates and evidence drafts**, not instant public facts. Kinfolk can answer a single legitimate question with validated web/Library evidence today; repeated demand determines whether MWM should build or branch durable Library structure.

### 3.2 Additive migration to existing Library Growth Engine

**New migration:** `artifacts/api-server/src/lib/migrations/20260813_scaled_library_growth_v2.sql`

```sql
-- Existing candidates use a global canonical_subject_key unique constraint.
-- Remove it because the same subject may be important at different scopes.
DROP INDEX IF EXISTS library_growth_candidates_canonical_subject_key_key;
DROP INDEX IF EXISTS library_growth_candidates_canonical_subject_key_unique;

ALTER TABLE library_growth_signals
  ADD COLUMN IF NOT EXISTS geography_scope_type VARCHAR(24) NOT NULL DEFAULT 'global'
    CHECK (geography_scope_type IN ('global','country','state','metro','city','neighborhood')),
  ADD COLUMN IF NOT EXISTS geography_scope_key VARCHAR(160) NOT NULL DEFAULT 'global';

ALTER TABLE library_growth_candidates
  ADD COLUMN IF NOT EXISTS geography_scope_type VARCHAR(24) NOT NULL DEFAULT 'global'
    CHECK (geography_scope_type IN ('global','country','state','metro','city','neighborhood')),
  ADD COLUMN IF NOT EXISTS geography_scope_key VARCHAR(160) NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS active_population_baseline INTEGER,
  ADD COLUMN IF NOT EXISTS threshold_count INTEGER,
  ADD COLUMN IF NOT EXISTS observed_share NUMERIC(8,6),
  ADD COLUMN IF NOT EXISTS importance_tier VARCHAR(24) NOT NULL DEFAULT 'standard'
    CHECK (importance_tier IN ('watch','standard','strong','urgent_review')),
  ADD COLUMN IF NOT EXISTS evidence_draft_status VARCHAR(24) NOT NULL DEFAULT 'not_started'
    CHECK (evidence_draft_status IN ('not_started','queued','draft_ready','held','published'));

CREATE UNIQUE INDEX IF NOT EXISTS library_growth_candidates_scoped_subject_unique
  ON library_growth_candidates(
    canonical_subject_key,
    COALESCE(parent_topic_id, ''),
    geography_scope_type,
    geography_scope_key
  );

-- Updated periodically from eligible active members who explicitly choose a
-- home/saved place or make a city-scoped public search. Never use GPS history.
CREATE TABLE IF NOT EXISTS library_growth_population_baselines (
  scope_type VARCHAR(24) NOT NULL
    CHECK (scope_type IN ('global','country','state','metro','city','neighborhood')),
  scope_key VARCHAR(160) NOT NULL,
  active_member_count INTEGER NOT NULL CHECK (active_member_count >= 0),
  measured_window_start TIMESTAMPTZ NOT NULL,
  measured_window_end TIMESTAMPTZ NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(scope_type, scope_key, measured_window_start, measured_window_end)
);
```

### 3.3 Threshold calculation

**New file:** `artifacts/api-server/src/library/growth-thresholds.ts`

```ts
export type GrowthScope = 'global' | 'country' | 'state' | 'metro' | 'city' | 'neighborhood';

export function libraryGrowthThreshold(scope: GrowthScope, activePopulation: number): number {
  // A local community still needs at least 7 independent people before durable
  // topic growth; big geographies scale at 1.5% of active relevant population.
  if (scope === 'city' || scope === 'neighborhood' || scope === 'metro') {
    return Math.max(7, Math.ceil(activePopulation * 0.015));
  }
  if (scope === 'state' || scope === 'country') {
    return Math.max(20, Math.ceil(activePopulation * 0.008));
  }
  return Math.max(30, Math.ceil(activePopulation * 0.003));
}

export function importanceTier(distinctUsers: number, activePopulation: number): 'watch' | 'standard' | 'strong' | 'urgent_review' {
  const share = activePopulation > 0 ? distinctUsers / activePopulation : 0;
  if (share >= 0.10 || distinctUsers >= 3400) return 'urgent_review';
  if (share >= 0.03 || distinctUsers >= 340) return 'strong';
  if (share >= 0.015) return 'standard';
  return 'watch';
}
```

Examples:

| Scope | Active relevant population | Signals | Threshold / result |
| --- | ---:| ---:| --- |
| Willow Grove neighborhood | 300 | 7 | `max(7, ceil(4.5)) = 7`; local standard candidate, evidence draft may begin. |
| Philadelphia city | 22,700 | 7 | Threshold is 341; watch only, no durable public topic. |
| Philadelphia city | 22,700 | 340 | Essentially threshold; standard/strong review candidate after source policy passes. |
| Philadelphia city | 22,700 | 3,400 | Urgent-review scale; curator sees a high-priority evidence/demand pattern, still not auto-published. |

The user’s raw search is never stored. `canonical_subject_key`, scope key, rotating one-way fingerprint, source surface, eligibility status, and sensitivity tier are sufficient.

### 3.4 Automatic but governed workflow

```ts
async function processGrowthWindow() {
  const aggregates = await aggregateEligibleSignalsBySubjectAndScope({ days: 30 });
  for (const row of aggregates) {
    const population = await loadPopulationBaseline(row.scopeType, row.scopeKey);
    const threshold = libraryGrowthThreshold(row.scopeType, population.activeMemberCount);
    const tier = importanceTier(row.distinctUsers, population.activeMemberCount);

    await upsertGrowthCandidate({ ...row, population, threshold, tier });
    if (row.distinctUsers < threshold) continue;

    // Candidate becomes reviewable and Kinfolk queues an evidence draft, not a
    // public topic. Source policy decides whether auto-draft is allowed.
    await queueEvidenceDraft({ candidate: row, policy: chooseEvidencePolicy(row) });
  }
}
```

A low-risk culture/history/general candidate can queue a validated evidence draft. Current affairs, health, law, finance, safety, hate/harassment-adjacent, and sensitive subjects remain `held` for the existing curator workflow. A candidate becomes an active Library topic only through the existing materialization/publish safeguards and required evidence sources.

---

## 4. Community standards and inclusive history

### 4.1 Educational history is allowed and important

The Library and Kinfolk must not avoid painful history. For the Holocaust, the system should state accurately that the Holocaust was the Nazi persecution and murder of six million Jews, while also offering source-grounded branches on the Nazi regime’s persecution of Roma and Sinti people, disabled people, Black people in Germany, LGBTQ people, Jehovah’s Witnesses, political opponents, and others. The historical explanation must distinguish different forms and scales of persecution rather than flattening them into a single vague narrative. Authoritative Holocaust education sources are required for this domain.[1] [2]

### 4.2 Safety classifier rule

```ts
function growthSafetyDecision(input: { canonicalSubject: string; intent: string; targetType?: string }) {
  if (input.intent === 'historical_education' || input.intent === 'anti_hate_context') {
    return { eligible: true, policy: 'history_authoritative', moderation: 'standard' };
  }
  if (input.intent === 'targeted_harassment' || input.intent === 'slur_attack' || input.targetType === 'protected_person') {
    return { eligible: false, policy: 'blocked', moderation: 'community_standards' };
  }
  return classifyGrowthSensitivity(input);
}
```

A person may search the Holocaust, Jewish history, disability history, Black history, Roma history, or any other history. The answer is evidence-led and culturally inclusive. The system must not create a Library growth signal from a slur used to attack a person or group, nor treat a hateful insult as a legitimate topic proposal. It may provide a short boundary and redirect to respectful historical or educational material when appropriate.

### 4.3 Source fixture

The Holocaust fixture must use the U.S. Holocaust Memorial Museum’s materials on targeted groups and its documented article on Nazi persecution of Black people in Germany.[1] [2]

---

## 5. Required tests and production proof

1. A creator cannot view or create a match without explicit creator opt-in.
2. A non-owner cannot decide on behalf of a business; all relay participants require `403` checks.
3. Creator decline reveals nothing to the business; business decline reveals nothing new to the creator.
4. A relay thread opens only after mutual acceptance; messages are encrypted and excluded from logs/Kinfolk context.
5. Contact release requires two independent consents; attachments and automated email/DM are absent in v1.
6. A weekly count of 9 is suppressed; no noise or outreach candidate exists.
7. A weekly count of 10 is released only after the fixed window closes and the 24-hour delay, with stored noise and rounded count.
8. Refreshing an impact page returns identical displayed count/noise for that report window.
9. A member cannot be counted more than once per business/metric/demand/window.
10. Willow Grove 7-of-300 creates a governed local candidate; Philadelphia 7-of-22,700 remains watch-only; Philadelphia 340 and 3,400 follow the configured tiers.
11. Load-test signals are excluded from growth and impact workers.
12. Historical Holocaust searches are answerable and can seed an evidence-draft candidate; targeted hate attack text cannot.
13. No raw query, exact location, demographic, age, Circle/follow information, or individual engagement is visible to creators/businesses.

## References

[1]: https://encyclopedia.ushmm.org/content/en/article/what-groups-of-people-did-the-nazis-target "United States Holocaust Memorial Museum — What Groups of People did the Nazis Target?"

[2]: https://encyclopedia.ushmm.org/content/en/article/afro-germans-during-the-holocaust "United States Holocaust Memorial Museum — The Nazi Persecution of Black People in Germany"
