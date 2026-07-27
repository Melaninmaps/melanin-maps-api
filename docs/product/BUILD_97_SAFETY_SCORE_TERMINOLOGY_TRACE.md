# Build 97 — "Safety Score" Terminology Trace
## READ-ONLY AUDIT — NO IMPLEMENTATION
**July 26, 2026 | Brainstorming only**
**Authorization phrase: "Please implement."**

---

## Decision Recorded

For Build 97, remove all MEMBER-FACING references to "Safety Score."
Replace with: **"Community Insights"** (temporary label).

The underlying data model is FROZEN:
  DB columns (safetyScore, safety_score) are NOT changed in Build 97
  API field names that are internal (not member-visible) are NOT changed
  Only member-facing copy and display labels change

"Community Insights" is the temporary label.
It naturally evolves into "Community Health Profile" in a future phase
without requiring another major terminology change.

---

## Why "Community Insights"

  Hints that multiple factors contribute
  Is not reductive (does not imply crime or danger)
  Does not position the platform as judging a community
  Naturally evolves toward the full Community Health Profile model
  Is immediately understandable to a first-time member

---

## Complete Trace — Every Location Found

### PRIORITY A — MEMBER-FACING COPY (change in Build 97)

These are seen by members. Language change required.

**artifacts/mockup-sandbox/src/components/mockups/surveys/GeneralSurvey.tsx**
  Line 215: "Your experience has been added to the community safety score.
             Every report helps our community travel smarter and live
             with confidence."
  → MEMBER-FACING: replace "community safety score" with "Community Insights"
  → Suggested: "Your experience has been added to Community Insights.
                Every report helps our community travel smarter and live
                with confidence."

  Line 237: "Context helps surface more accurate safety scores"
  → MEMBER-FACING: replace with "Context helps build a more complete
                   community picture."

**artifacts/api-server/src/lib/email.ts**
  Line 499: "Check community safety scores for neighborhoods"
  → EMAIL COPY (member-facing): replace with "Explore Community Insights
    for neighborhoods"

  Line 569: "Complete neighborhood safety scores"
  → EMAIL COPY (member-facing): replace with "Complete Community Insights"

  Line 642: "Complete neighborhood safety scores"
  → EMAIL COPY (member-facing): replace with "Complete Community Insights"

---

### PRIORITY B — ADMIN AND INTERNAL COPY (lower priority, document now)

Not member-facing but should be updated for internal consistency.

**artifacts/api-server/web-static/screenshots.html**
  Line 455: ctx.fillText('Community Safety Score', 60, 1640)
  → Screenshot asset, not live UI — note for future asset refresh

  Line 890: "Community safety score is 92 too 🙌"
  → Demo message in screenshot asset — note for future asset refresh

**artifacts/api-server/src/routes/privacy.ts**
  Line 19: "neighborhood safety scores and business-level safety ratings"
  → PRIVACY POLICY COPY: update to "Community Insights and community
    information" in a future privacy policy revision

  Line 46: "Aggregated, anonymized data (safety scores, statistics)"
  → PRIVACY POLICY: update to "Aggregated, anonymized community data"

  Line 273: "neighborhood safety scores"
  → PRIVACY POLICY HTML: update to "Community Insights"

**artifacts/api-server/src/routes/admin.ts**
  Line 417: "city safety scores" in topic seeding
  → ADMIN INTERNAL: update topic description to "city community insights"
    in a future admin data refresh

---

### PRIORITY C — INTERNAL API AND DB FIELDS (DO NOT CHANGE IN BUILD 97)

These are internal field names. The data model is frozen.
Note for future architecture phase only.

**lib/db/src/schema/** (DB columns)
  safetyScore — on neighborhoodSurveysTable
  safety_score — raw SQL field
  → DO NOT RENAME. Data model freeze in effect until founder approval.
  → These are internal identifiers, not member-visible strings.

**artifacts/api-server/src/routes/moderation.ts**
  Line 30: safetyScore (DB field reference)
  Line 63: `Safety score: ${s.safetyScore}/100` — admin moderation panel
  Line 64: severity logic using safetyScore
  → ADMIN PANEL only — not member-facing; note for future label update

**artifacts/api-server/src/routes/safety-heatmap.ts**
  Line 57: `AVG(safety_score)` — raw SQL
  → INTERNAL API COMPUTATION — not a label; do not change variable name

**artifacts/api-server/src/routes/surveys.ts**
  Line 88: `safetyScore: scores.safety` — survey response field
  → INTERNAL API FIELD — not member-visible label; do not change

**artifacts/api-server/src/routes/smart-pathways.ts**
  Lines 54, 55, 72, 113, 268-270: safetyScore as internal variable
  → INTERNAL API LOGIC — not member-visible labels; do not change

---

### PRIORITY D — HISTORICAL ASSETS (do not touch)

These are in attached_assets/ and are historical planning documents,
not live code.
  attached_assets/Pasted-*.txt — multiple files
  attached_assets/MWM_Audit_Register_v0.1_*.csv
  These are preserved records. No action needed.

---

## Stereotype and Framing Audit — Existing Implementations

The following existing language risks oversimplifying communities:

1. **Moderation panel severity logic** (moderation.ts line 64)
   `severity: s.safetyScore < 40 ? "high" : s.safetyScore < 70 ? "medium" : "low"`
   → A single survey can influence severity label. Future fix: require
     minimum corroboration before surfacing severity. (Not Build 97.)

2. **Survey completion message** (GeneralSurvey.tsx line 215)
   "Every report helps our community travel smarter and live with confidence."
   → Good framing. Keep the intent; update the "safety score" noun only.

3. **Email copy** (email.ts lines 499, 569, 642)
   Positions "safety scores" as a core app value proposition in onboarding
   emails. → Language update aligns to Community Insights framing.
   No other changes needed.

4. **Screenshot asset** (screenshots.html line 455)
   "Community Safety Score" displayed as a prominent UI element.
   → Static asset. Flag for refresh when Community Health Profile UI is
     designed in a future phase.

---

## Build 97 — What Changes vs. What Waits

| Location | Change in Build 97? | Note |
|---|---|---|
| GeneralSurvey.tsx lines 215, 237 | YES | Member-facing copy |
| email.ts lines 499, 569, 642 | YES | Member-facing email copy |
| privacy.ts lines 19, 46, 273 | Optional (lower priority) | Privacy policy |
| admin.ts line 417 | NO | Admin internal |
| screenshots.html | NO | Static asset |
| moderation.ts | NO | Admin panel + data model |
| safety-heatmap.ts | NO | Internal SQL |
| surveys.ts | NO | Internal API field |
| smart-pathways.ts | NO | Internal API field |
| DB columns (safetyScore, safety_score) | NO — FROZEN | Data model |

---

## Community Insights — Working Definition for Build 97

Member-facing description (suggested):
  "Community Insights reflects experiences voluntarily shared by members
   and publicly available community information. It is designed to help
   you understand resources, belonging, and community activity — not to
   rank or judge where people live."

This description aligns to the official disclaimer from the Community
Health Profile vision and can be surfaced in the app wherever the
current "safety score" explanation appears.

---

## Related Documents

  docs/vision/COMMUNITY_HEALTH_PROFILE.md — full future-state model
  docs/trade-secrets/COMMUNITY_HEALTH_INTELLIGENCE_ENGINE.md — internal methodology
  docs/product/BUILD_97_SCOPE_AND_ROADMAP.md — full Build 97 scope
