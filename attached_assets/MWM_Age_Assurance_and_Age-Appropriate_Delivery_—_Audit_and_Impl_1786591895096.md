# MWM Age Assurance and Age-Appropriate Delivery — Audit and Implementation Requirements

**Audit result:** The current live website does **not** collect an age, date of birth, age band, parent/guardian state, or reliable age-assurance signal during registration or in Profile. The authenticated Profile page has content/alert settings but no age control. The database contains content-side `audience_rating` fields and one server-side `MINOR_CONTENT_BLOCKED` path, but there is no member-age data to enforce a consistent decision. Therefore, **MWM cannot currently deliver content by age with any reliability.**

> A content label without an age-assured audience policy is only metadata. It is not an age-appropriate delivery system.

This implementation is a product and engineering specification, not legal advice. Because MWM is a social/community platform that may be used by young people, qualified privacy counsel must review the final age, parental-consent, data-retention, and jurisdiction policy before release. The plan uses data minimization and privacy-by-default principles reflected in official child-privacy guidance. [1] [2] [3]

---

## 1. Product decision for MWM launch

### 1.1 Launch rule

MWM should launch the social/Kinfolk experience as **13+ only**. Do not implement an under-13 member account path until MWM has a separately designed, counsel-reviewed verifiable parent/guardian consent process, child-specific privacy notice, support flow, and moderation operations.

| Member status | Account behavior | Reason |
| --- | --- | --- |
| Under 13 | Do not create/continue a standard account. Show a neutral message that the current member experience is for ages 13+. | Do not collect social/community data from a child through an adult feature set without a dedicated compliance design. |
| Age not confirmed | Permit only an age-neutral onboarding state; do not deliver mature/sensitive community media, followers/community discovery, adult social recommendations, or targeted current-events/safety material. | A missing age is not evidence of adulthood. |
| 13–15 | Age-appropriate knowledge mode, high privacy defaults, restricted social discovery, no mature content, no public detail sharing by default. | Young-teen safety and developmental appropriateness. |
| 16–17 | Teen mode, still excludes 18+ mature content and limits high-risk social/contact features. | Protective but less restrictive than younger-teen mode. |
| 18+ | Adult standard mode; content still follows safety, source, and community rules. | Adults do not need child-mode restrictions, but harmful/graphic content remains governed. |

### 1.2 What “age-specific” means

Age-aware delivery means **presentation and exposure controls**, not hidden profiling or different factual truth. A 13-year-old and a PhD should receive the same core factual answer if both ask about a topic, but the younger member may receive simpler language, a non-graphic overview, additional definitions, and more protective links while the adult can elect a deeper source/timeline treatment.

It must never mean that Kinfolk diagnoses, stereotypes, infantilizes, or automatically uses slang. Tone, regional language, AAVE, and profanity remain explicit member choices and are separate from age assurance.

---

## 2. Additive data model

Do **not** add date of birth to the general `users` table, session payload, Kinfolk prompt, community posts, analytics events, or public profile. Create a narrowly scoped age-assurance table and derive a minimal audience band for normal authorization.

Create `artifacts/api-server/src/lib/migrations/20260813_age_assurance.sql`, register it in `startup-migrations.ts`, and run it first on a disposable database.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_age_assurance (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Store a derived band for ordinary policy decisions. This is the only age
  -- field most routes may read.
  age_band TEXT NOT NULL DEFAULT 'unknown'
    CHECK (age_band IN ('unknown', 'under_13', '13_15', '16_17', '18_plus')),

  -- Cryptographically protected date only if counsel approves a DOB-based
  -- assurance model. Never expose to APIs, prompts, exports, or analytics.
  birth_date_ciphertext BYTEA,
  birth_date_key_version TEXT,

  assurance_method TEXT NOT NULL DEFAULT 'unconfirmed'
    CHECK (assurance_method IN ('unconfirmed', 'self_attested_band', 'self_attested_dob', 'parental_consent', 'verified_provider')),
  assured_at TIMESTAMPTZ,
  next_recheck_at TIMESTAMPTZ,
  policy_version TEXT NOT NULL,

  -- Never place guardian email/name in this table. A future under-13 product
  -- would use a separately encrypted, counsel-reviewed consent service.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_audience_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'library_topic_version', 'knowledge_article', 'happening_story',
    'community_post', 'community_media', 'kinfolk_response', 'event', 'business_media'
  )),
  resource_id UUID NOT NULL,
  minimum_age_band TEXT NOT NULL DEFAULT '13_15'
    CHECK (minimum_age_band IN ('13_15', '16_17', '18_plus')),
  sensitivity_tags TEXT[] NOT NULL DEFAULT '{}',
  graphic_level TEXT NOT NULL DEFAULT 'none'
    CHECK (graphic_level IN ('none', 'limited', 'graphic')),
  requires_context_screen BOOLEAN NOT NULL DEFAULT false,
  policy_reason TEXT,
  assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_type, resource_id)
);

CREATE TABLE IF NOT EXISTS age_delivery_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  decision TEXT NOT NULL CHECK (decision IN ('allowed', 'adapted', 'context_screen', 'blocked')),
  audience_band_at_decision TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS age_delivery_audit_events_user_created_idx
  ON age_delivery_audit_events(user_id, created_at DESC);
```

### Data minimization rules

1. If self-attested **age band** is sufficient for the first release, do not request date of birth.
2. If legal/compliance review requires a birthday for a relevant jurisdiction, collect it in a separate encrypted flow, derive/recompute the band server-side, and never expose the birthday beyond that service.
3. Never send actual age, date of birth, age-assurance method, or parent/guardian data to OpenAI, a vector store, a search vendor, community posts, business dashboards, or Kinfolk conversation history.
4. Kinfolk receives only `audienceBand: "13_15" | "16_17" | "18_plus" | "unknown"` plus `isAgeAssured: boolean`.
5. `unknown` is always treated more protectively than `18_plus`.

---

## 3. Enrollment and Profile UX

### 3.1 Where to ask

Add an **Age & Content Preferences** step immediately after initial account creation and before Community posting, Circles, public profile visibility, mature current-events delivery, or full Kinfolk personalization. Do not add it to a business search box or silently infer it.

**Screen copy:**

> **Help us show content in an age-appropriate way**
>
> Mapping With Melanin uses your age range to choose how much detail and which community media we show. We do not show your age on your profile and we do not share it with businesses or other members.
>
> Select one: `13–15` · `16–17` · `18+`
>
> This choice can be updated in Privacy & Content Settings. If you are under 13, this member experience is not available yet.

Require an attestation checkbox: **“I confirm that this age range is accurate.”** Record only the selected band and policy version for the launch release.

### 3.2 Existing members/testers

Do not auto-assign current accounts to adult. Existing members receive an age-assurance banner at the next authenticated session. Until confirmed, retain access to basic account support and age-neutral map/business search, but put the account in `unknown` mode for controlled social/media/current-event surfaces.

A tester can still test an adult feature only after choosing `18+`; this must be visible in the test log. No developer may bypass the band via an API parameter.

### 3.3 Profile settings

Add a profile card:

```text
Age & Content Preferences
Age range: 16–17                 [Change]
Content detail: Standard         [Brief | Standard | Detailed]
Mature community media: Not available for this age range
Sensitive topic context screens: On
```

Do not show a date of birth, parent/guardian detail, or age to other members.

---

## 4. Central server policy engine

Create `artifacts/api-server/src/lib/audience-policy.ts`. Every route that returns Library content, community posts/media, Happen Now stories, Kinfolk response content, video/GIFs, event details, and business community media must call this central function before serializing output.

```ts
export type AgeBand = 'unknown' | 'under_13' | '13_15' | '16_17' | '18_plus';
export type AudienceDecision = 'allowed' | 'adapted' | 'context_screen' | 'blocked';

const rank: Record<AgeBand, number> = {
  unknown: 0,
  under_13: -1,
  '13_15': 1,
  '16_17': 2,
  '18_plus': 3,
};

export type AudiencePolicy = {
  minimumAgeBand: Exclude<AgeBand, 'unknown' | 'under_13'>;
  sensitivityTags: string[];
  graphicLevel: 'none' | 'limited' | 'graphic';
  requiresContextScreen: boolean;
};

export function resolveAudienceDecision(args: {
  memberBand: AgeBand;
  policy: AudiencePolicy;
  domain: 'library' | 'kinfolk' | 'community' | 'safety' | 'event' | 'business_media';
}): AudienceDecision {
  const { memberBand, policy, domain } = args;
  if (memberBand === 'under_13') return 'blocked';
  if (rank[memberBand] < rank[policy.minimumAgeBand]) return 'blocked';

  // Graphic content is not delivered proactively to minors, even where its
  // general topic remains educationally available in a non-graphic form.
  if (memberBand !== '18_plus' && policy.graphicLevel === 'graphic') return 'blocked';
  if (memberBand !== '18_plus' && policy.graphicLevel === 'limited') return 'context_screen';

  // “Adapted” controls readability/detail, not factual evidence or safety.
  if (memberBand === '13_15' && (domain === 'library' || domain === 'kinfolk')) return 'adapted';
  if (policy.requiresContextScreen) return 'context_screen';
  return 'allowed';
}
```

### Mandatory route placement

| Surface | Required server-side enforcement |
| --- | --- |
| `knowledge-graph.ts` / new adaptive Library content route | Filter/transform the answer blocks and source/media output by audience decision before return. |
| `routes/kinfolk.ts` | Pass derived audience band into the response composer; block topic/media handoffs that the member may not receive. |
| `routes/community.ts` | Enforce policy on feed queries and create-post/media submissions; do not rely on frontend hiding. |
| Happening Now / safety-monitoring routes | Do not push disruptive/sensitive updates into minor feeds; give a non-graphic context screen only when directly requested and policy allows. |
| Event/business community media routes | Apply minimum band and visibility rule before returning member media. |
| GIF/video provider routes | Enforce provider rating plus MWM audience decision before searching or embedding. |

---

## 5. Content policy matrix

| Content type | 13–15 | 16–17 | 18+ | Notes |
| --- | --- | --- | --- | --- |
| General Library topics, HBCU history, culture, basic travel | Allowed; plain-language default | Allowed | Allowed | Show more still works, with age-appropriate wording. |
| Public health education such as diabetes or Black maternal mortality | Allowed; factual, non-graphic, source-backed, emergency override | Allowed | Allowed | Health safety notice remains at every depth. |
| Sudan/unrest/current conflict | Non-graphic summary only if directly requested or followed; no proactive disturbing feed | Context screen and non-graphic summary | Full policy-allowed version | No gore/graphic video in any default feed. |
| Religion/culture such as Muslim/Christmas | Allowed; respectful, non-stereotyping explanation | Allowed | Allowed | No age gate merely because content is religious. |
| Relationships/interracial couples | Allowed as general respectful education | Allowed | Allowed | No adult/sexual detail for minors. |
| Community videos/GIFs | Safe-rated only, no graphic media, high privacy default | Safe/teen-rated only | Policy-rated | Member audience setting does not override platform protections for minors. |
| Mature social topics/events | Block or context-screen based on policy | Context-screen/limited | Allowed if compliant | Requires exact product policy and moderation rules. |
| Emergency instructions | Allowed and prioritized if directly relevant | Allowed and prioritized | Allowed and prioritized | Safety action overrides depth preference. |

**Do not use age gates to hide ordinary history, civil rights, religion, or culturally relevant education.** Adjust presentation and graphic detail instead. Age-specific delivery is not censorship and must not erase difficult but educational material.

---

## 6. Kinfolk behavior by age band

Kinfolk’s core rules remain identical: source hierarchy, no guess, privacy, currentness, and high-consequence safeguards apply to everyone. Only delivery changes.

```ts
export function buildAudienceDeliveryInstruction(band: AgeBand): string {
  switch (band) {
    case '13_15':
      return 'Use clear, respectful, age-appropriate language. Do not use graphic details, adult sexual detail, or mature community media. Explain unfamiliar terms. Keep required safety guidance visible. Never talk down to the member.';
    case '16_17':
      return 'Use respectful teen-appropriate language. Provide nuance and sources but avoid adult-only or graphic material. Keep required safety guidance visible.';
    case '18_plus':
      return 'Use the member-selected delivery depth and the domain evidence policy.';
    default:
      return 'Use the most protective, age-neutral delivery. Do not expose mature or sensitive community media. Offer an age-assurance prompt before personalized social delivery.';
  }
}
```

### Examples

| Prompt | 13–15 behavior | 18+ behavior |
| --- | --- | --- |
| “Tell me about the war in Sudan.” | Non-graphic, dated overview; humanitarian/official sources; explain terms; offer more detail. | Same factual base with deeper timeline, sources, and policy-allowed context. |
| “Why don’t Muslims celebrate Christmas?” | Respectful explanation of diversity and mainstream practice; no stereotypes. | Same factual explanation; deeper theological/historical sources on Show more. |
| “How do interracial couples deal with life?” | Respectful general themes, communication/support, and a suggestion to talk with a trusted adult if a minor needs personal help. | Same evidence-backed themes plus deeper relationship/community context on Show more. |
| “I’m pregnant and have chest pain.” | Safety response immediately; tell the member to seek urgent help. | Same safety response immediately. |

---

## 7. Content authoring and moderation workflow

1. Any Library topic/version, Happen Now story, community post/media, event, or business media with a non-default audience policy must be tagged server-side by an authorized curator/moderator or a deterministic classifier followed by review.
2. An AI classifier may propose `sensitivity_tags` and `graphic_level`; it may not publish an 18+ or safety label without review.
3. Member-uploaded video/GIF/article links must default to the most restrictive safe audience state until checks are complete.
4. If a member appeals a label, retain the original moderation record and create a review task; do not silently remove history.
5. A community post is not allowed to become a Library evidence source merely because it has a teen/adult label.

Suggested `sensitivity_tags`: `graphic_violence`, `war_conflict`, `self_harm`, `medical_detail`, `sexual_content`, `substance_use`, `hate_or_harassment`, `legal_crime`, `political_conflict`, `religious_discussion`.

---

## 8. Tests required before release

### Data and authorization

1. No member date of birth exists in `users`, session JSON, Kinfolk prompt, community API response, analytics payload, or business dashboard.
2. An `unknown` existing tester cannot retrieve mature community media until age band is explicitly confirmed.
3. A 13–15 member cannot bypass restrictions by changing a client request body, query parameter, local storage, or direct API call.
4. An adult member does not see a minor member’s age band or assurance data.

### Delivery

5. Black Maternal Mortality `Show less` retains source attribution and urgent-care boundary.
6. Sudan yields a non-graphic/minor-safe summary, while source freshness and uncertainty remain visible.
7. Muslim/Christmas and interracial-relationship knowledge content stays available to teens, with no stereotyped language.
8. A teen cannot receive a graphic community video through the feed, hashtag page, business community media, or Kinfolk handoff.
9. `Show more` expands evidence/depth but does not alter age policy.
10. Kinfolk with `unknown` age uses protective delivery and asks for age assurance only at an appropriate account/settings boundary—not in the middle of a sensitive conversation.

### Operational

11. Under-13 registration is stopped before normal social-profile creation.
12. Existing account age migration does not auto-classify people as adult.
13. Content-policy assignment, changes, and blocks have an audit record.
14. The 1 → 5 → 15 → 30 canary shows no new 429/503/auth regression.
15. `/api/version` returns matching bundle hashes and `stale_bundle:false`.

---

## 9. Exact implementation order

1. Fix the stale deployment identity and shared-IP rate limiter. Do not add age work to an unverified release.
2. Add the age-assurance and content-policy migration in a feature branch.
3. Add onboarding/Profile age-band UX; do not collect DOB in v1 unless counsel requires it.
4. Implement `audience-policy.ts` and server-side enforcement first.
5. Wire Library, Kinfolk, Community, Happen Now, media/GIF, business media, and event APIs through the central policy.
6. Add authoring/moderation policy assignment and audit records.
7. Add depth/tone adaptation in Kinfolk and Library.
8. Run unit, API abuse, browser, accessibility, privacy, and capacity tests.
9. Provide Manus with the deployment SHA, migration output, redacted tester matrices for 13–15/16–17/18+/unknown, direct API denial proof, no-DOB-prompt proof, and the 30-session canary output.
10. Obtain privacy-counsel review before enabling any under-13 account/parental-consent path or widening content categories.

## References

[1]: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa "FTC — Children’s Online Privacy Protection Rule"
[2]: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions "FTC — COPPA Frequently Asked Questions"
[3]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "ICO — Age Appropriate Design Code"
[4]: https://www.unicef.org/press-releases/age-restrictions-alone-wont-keep-children-safe-online "UNICEF — Age restrictions and broader online protection"
