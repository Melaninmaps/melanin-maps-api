# Mapping With Melanin™ — What’s Happening Safety Monitoring Addendum

**Status:** Mandatory addition to `MWM_Whats_Happening_Kinfolk_Library_Intelligence_Package.md`.

**Purpose:** Ensure that a credible member-submitted or independently sourced link about civil unrest, violence, disaster, public-health danger, evacuation, infrastructure disruption, or serious travel risk becomes a governed **geographic safety-monitoring candidate** rather than ordinary news content.

> **Safety principle:** Mapping With Melanin may help members discover, understand, and prepare for a credible disruption. It must never impersonate an emergency authority, delay official emergency action, amplify a single unverified report, reveal a member’s location or safety choices, or issue a high-severity alert based only on a user-submitted link.

Official alert systems remain primary. FEMA describes Wireless Emergency Alerts as messages from authorized public alerting authorities and advises following the action identified in the alert; MWM must always direct a member to the named official/local authority and emergency services when immediate danger is present. [1] The U.S. Department of State and CDC travel notices are examples of authoritative sources for international safety and travel-health context. [2] [3]

---

## 1. Required safety-monitoring trigger taxonomy

Add `safety_monitoring` as a first-class What’s Happening outcome. A submitted link or Kinfolk research result must be classified against this taxonomy before it can appear in the ordinary current-events feed.

| Safety class | Examples | Immediate behavior |
| --- | --- | --- |
| `civil_unrest` | Protests becoming violent, curfews, clashes, mass disorder, civil disturbance | Create monitored candidate with precise geography and time window. |
| `armed_conflict_or_terrorism` | Armed conflict, credible active-attack/public threat, terrorism advisory | Restricted safety review; official-source requirement. |
| `violent_incident` | Active violent incident, mass-casualty event, credible neighborhood safety disruption | Do not speculate or identify uncharged private people; prefer official/local authority source. |
| `natural_disaster_or_severe_weather` | Hurricane, flood, wildfire, earthquake, severe weather, evacuation | Link authoritative emergency/weather source and practical official action. |
| `public_health_disruption` | Outbreak, health-service disruption, contaminated water, environmental danger | Official public-health source required; no personalized medical advice. |
| `transport_or_infrastructure_disruption` | Airport closure, transit shutdown, prolonged power/water outage, road closure affecting safety | Link official transport, utility, or local-government source. |
| `travel_advisory` | Destination-specific security/health advisory, border disruption, evacuation order | Link the authoritative advisory; do not create legal advice. |
| `evacuation_or_shelter` | Mandatory evacuation, shelter-in-place, safe shelter information | Official emergency authority only for urgent delivery. |

A member-submitted link may start a candidate in any class, but **never makes a safety case active by itself**.

---

## 2. Required case states and escalation rules

Use a separate safety lifecycle. Never label a current-events topic “safety alert” until its source and geographic scope satisfy the appropriate gate.

| State | Entry criterion | Who can see it | Permitted copy |
| --- | --- | --- | --- |
| `candidate_received` | Link safely accepted from member/worker. | Contributor and curator only. | “Source review pending.” |
| `source_checked` | Link is technically valid and classified. | Contributor and curator only unless non-sensitive culture/current-event rules apply. | “Source checked; safety context under review.” |
| `needs_corroboration` | No qualifying official source, conflicting claims, or unclear geography/time. | Curator only. | No member delivery. |
| `active_monitoring` | Qualified evidence validates a geographically bounded current disruption. | Explicit safety followers and relevant direct-search users, subject to delivery controls. | “Safety update · Details may change · Check official sources.” |
| `official_imminent` | Active Tier A official alert contains immediate protective action for a defined area. | Explicit geographic safety followers; direct-search users. | “Official safety information · Follow local authority instructions.” |
| `resolved_or_archived` | Official source indicates resolution/expiration or review window lapses. | Members can view source history; no new delivery. | “Update archived · Check official sources for current conditions.” |
| `held_or_rejected` | Source is unverified, unsafe, stale, misleading, duplicate, or lacks a safely bounded geography. | Contributor receives generic status; curator sees reason. | “This link is not available for safety recommendation.” |

### 2.1 Activation standard

A safety case can become `active_monitoring` only when one of these conditions holds:

1. **One current Tier A authoritative source** identifies an actionable risk in a defined geography and time window; or
2. **Two independent Tier B original-reporting sources** materially corroborate the same event, the geography is clear, and a curator approves the case; or
3. **One Tier A travel/public-health authority plus one Tier B contextual source** supports a travel/public-health context case.

A safety case can become `official_imminent` only from an active Tier A authorized emergency authority source that identifies immediate action. The MWM card must reproduce only short, attributable public safety guidance; it cannot rewrite an evacuation order, invent a threat level, or claim official authority.

### 2.2 Never auto-escalate from these inputs

- A single member-submitted article, post, video, photo, or social-media thread.
- Anonymous tips or crowd claims.
- A source with a broken, redirected-to-unrelated, paywalled-without-preview, stale, or content-mismatched URL.
- A source that does not state a location/time window clearly enough to avoid over-alerting.
- Rumor, allegation, speculation, or content with identifying allegations about private people.

---

## 3. Geographic safety monitoring is explicit and private

### 3.1 Followed geography, not covert tracking

A member can explicitly choose a country, region, city, neighborhood, saved trip destination, or family safety location to follow. The product must explain that this saves a **safety-monitoring preference**, not continuous real-time location tracking.

| Preference | Default | Meaning |
| --- | --- | --- |
| `followed_safety_geographies` | Empty | Member-selected areas for in-app safety updates. |
| `allow_in_app_safety_updates` | `false` | Allows safety cards inside What’s Happening/Kinfolk for followed areas. |
| `allow_sensitive_safety_updates` | `false` | Allows sensitive current-event cards when source/age gates pass. |
| `allow_external_safety_notifications` | `false` and **not implemented in this release** | Future separate approval; no push/email/text delivery now. |
| `guardian_or_circle_safety_sharing` | Not implemented here | Separate consent-based family feature; never infer relationships. |

The system may use an explicit current trip destination or saved place only if the member selected it for safety monitoring. It must never infer a member is located in an area from an article read, browsing session, IP address, business search, or a Circle member’s location.

### 3.2 Geospatial precision

Safety cases must store a bounded geography, source, and confidence:

```ts
type SafetyGeography = {
  level: 'country' | 'region' | 'city' | 'neighborhood' | 'radius';
  canonicalName: string;
  countryCode?: string;
  boundaryRef?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  sourceBasis: 'official' | 'curator_confirmed';
};
```

If a source only says “the region” or “parts of the city,” deliver at that broader scope. Do not falsely pinpoint an incident to a street, hotel, home, business, or member location.

---

## 4. Age, sensitivity, and delivery controls

### 4.1 Delivery order

Safety relevance outranks entertainment and ordinary preference ranking, but only **after** a member’s explicit safety geography and content-delivery consent are satisfied.

1. Member directly asks about a current safety condition in a named place.
2. Member explicitly follows the affected geography and opted into in-app safety updates.
3. Member has an active explicit trip/safety destination that overlaps the safety geography and opted in.
4. No proactive delivery; the topic remains discoverable by search and What’s Happening browse.

No current-event safety result is ranked using inferred ethnicity, race, politics, religion, health, family status, or search history.

### 4.2 Minors and sensitive delivery

For minors, members with sensitive updates disabled, or accounts without age/consent information:

- Display a neutral, source-linked **Safety update** card only when the direct search or explicit geography follow makes it relevant.
- Suppress graphic imagery, graphic descriptions, violent videos, alleged perpetrator information, victim speculation, and sensational language.
- Provide only official action resources where available: local authority, emergency service, embassy/consulate, public health, or emergency management page.
- Do not send proactive external notifications in this release.
- If the source indicates immediate danger, lead with “If you may be in immediate danger, contact local emergency services and follow local authority instructions.”

### 4.3 Required labels

| Case status | Required public label |
| --- | --- |
| `active_monitoring` | **Safety update · Details may change · Sources linked** |
| `official_imminent` | **Official safety information · Follow local authority instructions** |
| `travel_advisory` | **Travel safety information · Check the official advisory before acting** |
| `public_health_disruption` | **Public-health update · General information, not medical advice** |
| `needs_corroboration`/`held` | Not broadly displayed. Contributor receives a generic review status only. |

Never use a red “emergency alert” badge or a siren-like UI that could be confused with government Wireless Emergency Alerts unless MWM later gains an approved authorized alerting integration. MWM is not an emergency-alert authority.

---

## 5. Additive data model

Add these tables and fields to the `whats_happening_intelligence_v1` migration package. Do not alter user locations, Circle data, business data, or existing emergency/safety tables.

```sql
CREATE TYPE safety_case_status AS ENUM (
  'candidate_received', 'source_checked', 'needs_corroboration',
  'active_monitoring', 'official_imminent', 'resolved_or_archived', 'held_or_rejected'
);
CREATE TYPE safety_case_class AS ENUM (
  'civil_unrest', 'armed_conflict_or_terrorism', 'violent_incident',
  'natural_disaster_or_severe_weather', 'public_health_disruption',
  'transport_or_infrastructure_disruption', 'travel_advisory', 'evacuation_or_shelter'
);
CREATE TYPE safety_source_basis AS ENUM ('official', 'independent_reporting', 'member_candidate');

CREATE TABLE safety_monitoring_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  happening_topic_id uuid REFERENCES happening_topics(id) ON DELETE SET NULL,
  case_class safety_case_class NOT NULL,
  status safety_case_status NOT NULL DEFAULT 'candidate_received',
  severity varchar(16) NOT NULL CHECK (severity IN ('info', 'elevated', 'urgent')),
  canonical_title text NOT NULL,
  geography jsonb NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  official_action_text varchar(360),
  official_action_source_id uuid REFERENCES happening_sources(id),
  confidence_reason jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_curator_review boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE safety_case_sources (
  case_id uuid NOT NULL REFERENCES safety_monitoring_cases(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES happening_sources(id) ON DELETE CASCADE,
  source_basis safety_source_basis NOT NULL,
  relationship_type varchar(32) NOT NULL
    CHECK (relationship_type IN ('primary', 'corroborating', 'official_action', 'contradicting')),
  PRIMARY KEY (case_id, source_id)
);

CREATE TABLE safety_monitoring_preferences (
  user_id varchar PRIMARY KEY,
  followed_geographies jsonb NOT NULL DEFAULT '[]'::jsonb,
  allow_in_app_safety_updates boolean NOT NULL DEFAULT false,
  allow_sensitive_safety_updates boolean NOT NULL DEFAULT false,
  allow_external_safety_notifications boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE safety_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES safety_monitoring_cases(id) ON DELETE CASCADE,
  recipient_fingerprint text NOT NULL,
  delivery_surface varchar(24) NOT NULL CHECK (delivery_surface IN ('in_app', 'digest')),
  delivery_reason varchar(32) NOT NULL
    CHECK (delivery_reason IN ('direct_search', 'followed_geography', 'explicit_trip_destination')),
  delivered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, recipient_fingerprint, delivery_surface)
);
```

`recipient_fingerprint` must use the existing rotating, one-way HMAC pattern from the Library Growth Engine. Do not store a raw member ID in delivery-event analytics. The preference record is an account setting and must be protected by the member’s own authorization boundary.

---

## 6. Worker and Kinfolk integration requirements

### 6.1 Safety classifier

After What’s Happening source extraction, call a deterministic safety classifier before standard clustering.

```ts
const safetyCandidate = await classifySafetyCandidate({
  sourceTier,
  sourceStatus,
  structuredFacts,
  canonicalGeography,
  temporalScope,
});

if (safetyCandidate.isSafetyRelevant) {
  await createOrUpdateSafetyMonitoringCase(safetyCandidate);
  return; // Do not place in ordinary recommendation/delivery path first.
}
```

The classifier can use structured LLM extraction only to propose fields; a deterministic validator and source gate must decide state transition. It must reject:

- undefined geography;
- vague time window;
- no source/held source;
- unsupported allegations;
- request to identify private individuals;
- source text that conflicts materially with verified official sources.

### 6.2 Kinfolk response guard

When a member asks about an active safety case, Kinfolk may answer only from `SafetyCaseContext`:

```ts
type SafetyCaseContext = {
  caseId: string;
  caseClass: string;
  status: 'active_monitoring' | 'official_imminent';
  title: string;
  geography: SafetyGeography;
  sourceLinks: Array<{ publisher: string; url: string; tier: 'A' | 'B' }>;
  officialActionText?: string;
  lastUpdatedAt: string;
  sensitivity: 'public_interest' | 'sensitive';
};
```

Required prompt instruction:

```text
State only source-labeled facts in SAFETY_CASE_CONTEXT.
Lead with official protective action only if provided by an authoritative source.
Say details may change when status is active_monitoring.
Never claim to know the member's location. Do not mention a saved/followed geography unless the response requires a transparent delivery explanation.
Do not provide tactical, violent, illegal, medical, legal, or evacuation advice beyond attributable official guidance.
If immediate danger is possible, advise contacting local emergency services and following local authority instructions.
```

### 6.3 No external notification in this release

The only delivery surfaces in this release are `in_app` and optional `digest`, both requiring explicit opt-in. `allow_external_safety_notifications` must remain false and unused until a separate release covers user consent, iOS/Android notification behavior, delivery reliability, language accessibility, legal review, and official-alert integration boundaries.

---

## 7. Required test suite

Add tests to `artifacts/api-server/src/whats-happening/__tests__/safety-monitoring-release-gate.spec.ts`.

| ID | Scenario | Required pass condition |
| --- | --- | --- |
| SM-01 | Member submits one link claiming unrest in a city | Case remains `candidate_received`/`needs_corroboration`; no broad delivery. |
| SM-02 | Official local emergency-management source identifies an evacuation action and specific geography | `official_imminent`; official action and source shown only to direct search/explicit safety followers. |
| SM-03 | Two independent reputable reports corroborate civil unrest but no official action | `active_monitoring` only after curator approval; “details may change” label. |
| SM-04 | Source has unclear city/country or time | Held; no delivery. |
| SM-05 | Article names an uncharged private person | Held/restricted; no public summary identifies the person. |
| SM-06 | State Department travel advisory | Travel case with official link and non-legal safety language. |
| SM-07 | CDC travel-health notice | Public-health case with general-information disclaimer; no personal medical advice. |
| SM-08 | Member follows affected geography and opted into in-app updates | One in-app safety card with reason `followed_geography`; no external notification. |
| SM-09 | Member does not follow geography | No proactive delivery; direct search can find source-labeled case. |
| SM-10 | Minor/sensitive updates disabled | No proactive sensitive card; direct result is neutral, source-linked, and age-appropriate only when permitted. |
| SM-11 | Load-test account produces/link-submits a case | No public case, delivery event, growth signal, or notification. |
| SM-12 | Case resolution/official expiration | Case archives; delivery stops; source history remains visible. |
| SM-13 | Ordinary member calls safety moderation endpoint | HTTP 403. |
| SM-14 | Source changes to 404 after active case | Case is held/updated; stale source not displayed as active safety guidance. |
| SM-15 | Current case is linked to stable Library safety/civic topic | Link renders both directions; current case does not publish/alter Library evidence. |

---

## 8. Production proof and independent acceptance

Replit must supply:

1. Deployment SHA, bundle identity, matching hashes, and `stale_bundle: false`.
2. Additive migration output only.
3. SM-01 through SM-15 test results.
4. Authenticated proof for a safe mock/fixture of each: official evacuation, corroborated unrest, travel advisory, and health notice. Do not use a real active tragedy as a test fixture.
5. Proof of the member preference boundary: explicit geography follow receives one in-app card; an otherwise similar non-follower receives none.
6. Proof that no push/email/text/DM/Circle/business notification was generated.
7. Curator authorization proof: tester gets 403; authorized curator can approve/hold/archive with rationale.
8. Proof that stale/unsupported safety source links are held and not sent through Kinfolk.

**Independent acceptance standard:** The feature passes only when a credible disruption can be monitored by geography and connected to relevant Library context, while a single unverified link cannot frighten or mislead members, no member’s location is inferred, and MWM clearly defers to official emergency authorities.

## References

[1]: https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system/public/wireless-emergency-alerts "FEMA — Wireless Emergency Alerts"

[2]: https://travel.state.gov/en/international-travel/travel-advisories.html "U.S. Department of State — Travel Advisories"

[3]: https://wwwnc.cdc.gov/travel/notices "CDC — Travel Health Notices"
