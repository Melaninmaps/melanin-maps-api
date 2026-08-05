# Mapping With Melanin — Integrity, Accountability & Partnership Framework
**Product Specification Document v1.0**

---

## 1. Executive Summary

Mapping With Melanin (MWM) is a community-powered platform designed to help minorities find trusted businesses, stay safe, and connect with their community. This document outlines the comprehensive product specification for the platform's Integrity, Accountability, and Partnership Framework. It details the mechanisms for business classification, safety reporting, legal protections, partnership pipelines, diaspora contributions, and AI personalization, ensuring a safe, equitable, and legally sound environment for all users and listed businesses.

---

## 2. Business Classification Tiers

### Tier 1: Minority-Owned Businesses (PRIMARY)
- **Visibility:** Always shown first in search results and recommendations.
- **Features:** Full profile access, community reviews, and Kinfolk AI recommendations.
- **Opportunities:** Eligible for flash deals, creator partnerships, and demand intelligence insights.
- **Identification:** Ownership badge prominently displayed.
- **Engagement:** Actively invited and supported by the platform.

### Tier 2: Allied Businesses (PASSIVE)
Critical distinction: non-minority-owned businesses verified as safe by the community (e.g., "Hyatt Wisconsin — Community Verified Safe Space").

- **Visibility Constraints:** NEVER promoted above a minority-owned alternative in the same category.
- **Onboarding:** NEVER contacted or alerted when first added to the platform. They remain PASSIVE entries until accumulating sufficient community engagement data.
- **Partnership Pathway:** Only AFTER sufficient tracking data (500+ click-throughs from MWM) do they receive a partnership opportunity link. The pitch comes TO THEM based on demonstrated value.
- **Accountability:** Subject to immediate deprioritization if discrimination is reported. Can lose their listing entirely if community trust erodes.
- **Identification:** Distinct "Community Verified" badge, contrasting with the ownership badge.

---

## 3. Safety Reporting & Reporter Protection

### Report Type A: Community Safety Concerns (Visitor/Customer Experience)
Transient relationship — reporter visited once and left.

**Examples:** "I was followed in the parking lot" / "Staff used a racial slur" / "They refused to serve us"

| Attribute | Type A — Safety Concern |
|---|---|
| Reporter relationship to business | Transient (customer/visitor) |
| Reporter retaliation risk | Low |
| Aggregation threshold | 2 independent reports within 60 days |
| Time delay before action | 7 days |
| Visibility to community | Affects public-facing trust score |
| What community sees | "Community safety concern reported" on listing |
| Purpose | Protect the NEXT person who might visit |
| Graduated response speed | Faster — safety is urgent |

### Report Type B: Unfair Labor & Workplace Practices (Employee Experience)
Ongoing, daily relationship — extreme retaliation risk.

**Examples:** "They pay below minimum wage" / "Hostile work environment for Black employees" / "Retaliation against employees who speak up"

| Attribute | Type B — Labor/Workplace Report |
|---|---|
| Reporter relationship to business | Ongoing (employee/applicant) |
| Reporter retaliation risk | EXTREME (they return daily, can be fired) |
| Aggregation threshold | 3+ independent reports over 90+ days |
| Time delay before action | 30-60 days minimum |
| Visibility to community | Does NOT affect public-facing trust score initially |
| What community sees | Private warning to members considering employment only |
| Purpose | Warn potential employees WITHOUT endangering current ones |
| Graduated response speed | Slow and deliberate — reporter safety is paramount |

### Separation of Scores
Businesses maintain TWO independent trust dimensions:
1. **Visitor Safety Score** — informed by Type A reports. Visible to all community members browsing/searching. Affects search ranking and recommendations.
2. **Employer Trust Score** — informed by Type B reports. Visible ONLY to community members actively searching for jobs or asking Kinfolk AI about working somewhere. Does NOT affect visibility as a place to visit/shop.

### Protection Mechanisms (both types, stricter thresholds for Type B)

1. **Anonymous Aggregation Threshold:** No action on a single report. Type A: 2 reports / 60 days. Type B: 3+ reports / 90+ days.
2. **Time-Delayed Visibility:** Type A: 7-day delay. Type B: 30-60 day delay.
3. **Geographic Fuzzing:** Type B concerns aggregated at brand/chain level until threshold met. Type A can be location-specific once threshold met.
4. **No Individual Attribution:** Platform NEVER reveals how many reports exist, who reported, when filed, or any metadata.
5. **Reporter Identity Separation:** Reports stored with one-way hash of reporter ID. Even database administrators cannot easily correlate.
6. **Retaliation Detection:** If a user's account is flagged shortly after they filed a safety report, system flags for admin review.
7. **Team Size Protection (Type B only):** Businesses with fewer than 10 employees require 5+ reports before action.

### Report Submission Flow
First question: "How did you experience this?"
- "I visited or shopped here" → Type A
- "I work here or applied for a job here" → Type B

Type B reporters see additional reassurance: *"Your report is protected by our maximum-security protocol. It will never be visible until multiple independent community members share similar experiences over an extended period. Your identity is cryptographically separated from your report."*

---

## 4. Legal Protection Framework

### Defamation Mitigation Strategy
1. **Platform vs. Publisher Distinction (Section 230):** MWM is a platform for community-reported experiences, NOT making editorial judgments.
2. **Terms of Service Requirements:** All businesses agree to community feedback visibility. Disclaimer: *"Trust scores reflect aggregated community experiences and do not represent the views of Mapping With Melanin, Inc."*
3. **No Defamatory Language:** Never use "discriminates," "racist," or "unsafe" as platform-generated labels. Use neutral language: "Community trust score: Low" or "Community concerns reported." Allow business right of reply.
4. **Graduated Response System:**
   - Level 1: No visible change (collecting data)
   - Level 2: Subtle deprioritization in search (not visible to business)
   - Level 3: "Community concerns noted" badge (business notified, can respond)
   - Level 4: Removed from recommendations but still searchable
   - Level 5: Delisted (severe/verified cases only, human review required)
5. **Human Review Gate:** No business publicly flagged or delisted without admin review. Automated systems only handle Levels 1-2. Levels 3-5 require founder/admin approval.
6. **Documentation Trail:** Every trust score change logged with aggregated reason.

---

## 5. Partnership Pipeline (for Allied Businesses)

| Stage | Name | Description | Criteria |
|---|---|---|---|
| Stage 1 | Community Addition (Day 0) | Added by community; business NOT contacted | 3+ independent nominations |
| Stage 2 | Data Accumulation (Days 1-90) | Tracking views, clicks, saves, mentions | N/A (data gathering) |
| Stage 3 | Partnership Threshold Reached | System flags for admin review | 500+ click-throughs OR 100+ saves OR 50+ direction requests |
| Stage 4 | Outreach (Admin-initiated) | MWM sends pitch based on proven value | Admin approval required |
| Stage 5 | Active Partner | Analytics dashboard access, can respond to feedback | Paid partnership fee; must maintain community trust |

> **Note:** Active partners are STILL NEVER promoted above minority-owned alternatives.

---

## 6. Diaspora International Business Contributions

### Contribution Flow
1. **Identification:** Member identifies as diaspora during onboarding.
2. **Prompt:** In-app prompt encourages adding safe spaces in specific countries.
3. **Data Capture:** Business name, location, relationship type, safety context, cultural context.
4. **Trust Weighting:**
   - "I own this" → Highest trust (verified via claim flow)
   - "Family owns this" → High trust
   - "I've visited" → Medium trust
   - "Community recommended" → Requires 2+ independent confirmations
5. **Privacy:** Safety tags (e.g., LGBTQIA+) may only be visible to users who self-identify similarly in regions where such labels pose risks. Contributors can remain anonymous.

---

## 7. Onboarding → Kinfolk AI Pipeline

1. **Immediate Storage:** Onboarding data stored server-side immediately.
2. **Profile Creation:** Creates initial Kinfolk AI profile from stated preferences.
3. **Day One Personalization:** Kinfolk uses profile to personalize recommendations immediately.
4. **Continuous Refinement:** Behavioral signals (searches, saves, reviews) confirm and refine preferences over time.

---

## 8. Accountability Without Surveillance

- **Location Data:** Used only when explicitly granted and for stated purposes.
- **Search History:** Feeds recommendations; users can view and delete their history.
- **AI Transparency:** Kinfolk AI explains reasoning behind recommendations.
- **User Control:** Users can correct Kinfolk's assumptions.
- **Value Exchange:** All data collection permission-based with clear value proposition.

---

## 9. Implementation Priority

### Phase 1 (Pre-tour, website only)
- [x] Add "ambassador" as a valid previewChoice in the waitlist ✅ **DONE (Aug 5, 2026)**
- [ ] Develop the partnership tracking dashboard (admin view of external-clicks analytics)

### Phase 2 (Post-Apple-approval)
- [ ] Implement Allied Business tier distinction in the business model
- [ ] Connect deprioritization logic to safety reports
- [ ] Implement anonymous aggregation threshold system
- [ ] Ensure onboarding data flows to server-side storage and Kinfolk profile creation

### Phase 3 (Post-tour)
- [ ] Automate partnership outreach (threshold-based notifications)
- [ ] Implement diaspora international business contribution flow
- [ ] Develop Kinfolk confirmation prompts
- [ ] Implement legal framework (ToS updates, business response system)

---

## 10. Developer Guidelines (Replit Integration)

### Partnership Tracking Dashboard
The existing `/external-clicks` endpoint captures: `institutionName`, `institutionType`, `institutionUrl`, `referenceType`, `referenceId`, `source`, `isSafetyRelated`, `city`, `state`, `userId`.

- **Action:** Build admin dashboard aggregating this data.
- **Query Logic:** Group by `referenceId` (business ID) where `institutionType` is 'Allied'. Sum occurrences to track progress toward Stage 3 thresholds (500+ click-throughs).

### Safety Reporting & Deprioritization
Existing endpoints: `/reports`, `/reports/proximity-warnings`, `/incidents`, `/safety-tips`, `/safety-context`.

- **Action:** Modify reporting logic to store reporter IDs as a one-way hash.
- **Aggregation Logic:** Background job checking 3+ independent reports within 30-day window before updating business aggregated trust score.
- **Visibility Delay:** Add `visible_after` timestamp to aggregated trust score updates (14-30 days after threshold met).

### Onboarding to Kinfolk AI
- **Action:** Ensure onboarding flow makes API call to store data against user profile upon completion (not just local AsyncStorage).
- **Kinfolk Integration:** Kinfolk AI service must query user profile data to initialize context.

### API Schema (Conceptual)
```json
{
  "businessId": "uuid",
  "name": "string",
  "tier": "Minority-Owned | Allied",
  "trustScore": {
    "level": 1,
    "lastUpdated": "timestamp",
    "visibleAfter": "timestamp"
  },
  "engagementMetrics": {
    "clicks": "number",
    "saves": "number",
    "directionRequests": "number"
  }
}
```
