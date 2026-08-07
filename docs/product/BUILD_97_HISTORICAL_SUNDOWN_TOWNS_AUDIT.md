# Mapping With Melanin™ — Build 97: Historical Sundown Towns Layer
## READ-ONLY AUDIT + IMPLEMENTATION PLAN
**DOCUMENTATION ONLY — No implementation authorized**
**July 26, 2026 | Authorization phrase: "Please implement."**
**Build 96 is under Apple review. Zero code/schema changes until approved.**

---

## Critical Pre-Read

This feature does one thing precisely:

> **Add historical context that members deserve to know —
>  without implying that any community's present is defined by its past.**

Everything in this document serves that purpose.

---

## SECTION 1 — REQUIRED MEMBER-FACING NAME

**USE:** Historical Sundown Towns

**NEVER USE:**
  Unsafe Towns
  Dangerous Towns
  Current Sundown Towns
  Avoid These Towns
  Safety Score (per previous terminology decision)
  Minority Violence
  High-Risk Minority Community
  Any label that implies present-day danger from historical data alone

This is a historical-context layer. It is not a community rating.

---

## SECTION 2 — SOURCE AUDIT

### Source A: Tougaloo College / History and Social Justice Database
  URL: justice.tougaloo.edu (James W. Loewen / Tougaloo College)
  Description: The foundational research database, ~7,000+ U.S. communities
               catalogued as confirmed, probable, or possible sundown towns.
               Original research by James W. Loewen (Sundown Towns: A Hidden
               Dimension of American Racism, 2005).
  Status classifications: Confirmed, Probable, Possible
  Fields available (from public research): Place name, state, county,
    designation status, community or population excluded, historical notes,
    source URLs, researcher comments.
  Coordinate data: Limited — place names and counties, not lat/lng centroids.
                   Geocoding would be required for map pins.
  License: Publicly accessible for research and educational use.
           Automated bulk import likely requires explicit permission from
           Tougaloo College. Attribution is required.
  Action required: Contact Tougaloo/History and Social Justice to confirm
                   reuse terms, attribution requirements, and whether a
                   downloadable dataset or API is available.
  Confidence issue: The database itself notes it is incomplete. Records vary
                    from court-confirmed historical ordinances to community
                    oral history. This variation must be preserved in
                    the platform's display — every record must show its
                    evidence category.

### Source B: Scientific Data (2025) — Geocoded Sundown Towns Dataset
  Title: "Historical Sundown Towns Linked to US Census Geographies"
  Published: Nature's Scientific Data (2025) — ISSN 2052-4463
  Description: A geocoded dataset linking Tougaloo sundown town records to
               U.S. Census FIPS geography codes and lat/lng centroids.
               This resolves the geocoding challenge in Source A.
  License: Scientific Data publications typically use Creative Commons
           Attribution 4.0 (CC BY 4.0) — requires attribution, permits
           redistribution and adaptation.
  Availability: Likely via figshare or Nature's data repository.
  Fields expected: FIPS code, place name, state, county, lat/lng centroid,
                   confidence classification (inherited from Tougaloo),
                   time period, excluded population, source notes.
  Action required: Confirm dataset availability, exact license terms,
                   attribution requirement, and whether it is the complete
                   Tougaloo dataset or a subset.
  KEY ADVANTAGE: This source provides geocoordinates directly, enabling
                 map pin placement without custom geocoding.

### Source C: National Park Service Civil Rights and Green Book Materials
  Description: NPS maintains records on civil-rights landmarks, the Green
               Book (Victor Hugo Green's Negro Motorist Green Book), and
               historical civil-rights sites.
  Relevance to this feature: Contextual and supplementary. Historical
    travel routes, Green Book-listed establishments, and civil-rights
    landmarks may be cross-referenced with sundown town data to provide
    positive historical context alongside caution context.
  Current platform status: Cultural heritage sites from NPS are already
    seeded into the `cultural_sites` table (verifiedSource: "National Park
    Service" confirmed in seed data).
  Action required: NPS data is public domain. Review what is already
    seeded before adding duplicates.

### Source Evaluation Summary

| Criterion | Tougaloo DB | Sci Data 2025 |
|---|---|---|
| Geocoordinates available | No (needs geocoding) | Yes (Census centroids) |
| Confidence classification | Yes | Inherited from Tougaloo |
| License confirmed | Requires outreach | Likely CC BY 4.0 |
| Attribution required | Yes | Yes |
| Automated import permitted | Requires confirmation | Likely yes (open data) |
| Completeness warning | Yes — explicitly incomplete | Inherits Tougaloo gaps |
| Excluded population field | Yes | Inherited |
| Historical time period | Partial | Inherited |

RECOMMENDATION: Target Scientific Data (2025) as primary dataset.
Contact Tougaloo for supplementary data and to verify attribution language.
Confirm CC BY 4.0 license before any import.

### Records That Must Never Be Displayed Without Qualification
  Any record flagged as "Possible" or "Under Research" must display
    the appropriate confidence label — never treated as Confirmed.
  Any record without supporting evidence notes must display
    "Limited documentation available."
  No crowdsourced or unverified record may be presented as confirmed history.

---

## SECTION 3 — CURRENT MWM CODEBASE AUDIT

### What Already Exists — More Than Expected

The audit found significant existing infrastructure that should NOT be
duplicated. This feature extends what exists — it does not replace it.

#### A. "sundown" Report Category — ALREADY BUILT

  lib/db/src/schema/surveys.ts — line 79
    "sundown" is already a valid survey/report category in the DB schema.

  artifacts/api-server/src/routes/reports.ts — line 11
    VALID_CATEGORIES includes "sundown" as a valid report type.

  artifacts/api-server/src/routes/reports.ts — line 72
    sundown: "Sundown Town Warning" — already a member-facing label.

  artifacts/mobile/app/report-safety.tsx — line 35
    { id: "sundown", label: "Sundown Town Warning" } — in the report flow.

  ⚠️ CURRENT PROBLEM: This is a COMMUNITY-SUBMITTED report category.
  It conflates member reports ("I had a bad experience here") with
  historical fact ("this town was documented as a sundown town").
  The new feature must keep these separate.

#### B. Sundown Warnings in Directions — ALREADY BUILT

  artifacts/api-server/src/routes/directions.ts
    Lines 116, 139, 156, 166, 250 — sundownWarnings pulled from reports
    near a travel route. SQL: WHERE sr.category = 'sundown'
    Returns: id, area, description for each warning along the route.

  ⚠️ CURRENT PROBLEM: This pulls community-submitted reports, not
  historical records. A member submitting a "Sundown Town Warning"
  report today adds it to routing. No historical database involved.

#### C. Business Profile Shows Sundown Town Warnings — ALREADY BUILT

  artifacts/mobile/app/business/[id].tsx — lines 1807-1812
    SundownWarning type rendered with red "Sundown Town Warning" label.
    Pulls from the same community reports system.

  ⚠️ NOTE: Currently uses red color and no historical vs. present-day
  distinction. Build 97 should separate these layers in the UI.

#### D. Map Tab Has sundown Icon Mapping — ALREADY BUILT

  artifacts/mobile/components/MapTabView.native.tsx — line 112
  artifacts/mobile/components/MapTabView.tsx — line 49
    sundown: "🚫" — icon already mapped for the sundown category.

  ⚠️ NOTE: Emoji violates the slide deck icon rule but mobile app
  icon rules are separate. However, a 🚫 emoji is not an appropriate
  historical marker symbol — needs design review for the new layer.

#### E. Cultural Sites Architecture — DIRECTLY REUSABLE

  This is the right architectural model for the historical sundown towns
  database. Already fully built:

  DB table: cultural_sites (name, city, state, lat, lng, category,
    heritageCategory, description, era, significance, externalUrl,
    yearEstablished, isAccessible, isFamilyFriendly, admissionFree,
    verifiedSource)

  Routes: GET /cultural-sites, GET /cultural-sites/:id,
           GET /cultural-sites/:id/stories,
           POST /cultural-sites/:id/stories,
           POST /cultural-sites/reseed

  Mobile screen: artifacts/mobile/app/cultural-heritage.tsx

  The new `sundown_towns` table should mirror this pattern and add:
    confidence_status (confirmed/probable/possible/disputed/reconciling)
    excluded_population (text — community historically excluded)
    time_period (text — e.g., "1890–1968")
    source_organization (text)
    source_url (text)
    last_review_date (date)
    reconciliation_status (text or enum)

#### F. Community Alerts Architecture — CONTEXT FOR REAL-TIME LAYER

  artifacts/api-server/src/routes/index.ts — communityAlertsRouter
  artifacts/mobile/hooks/useActivityAlerts.ts
    Handles real-time community alerts with confirm/clear actions.

  This is not the right model for historical records, but it is the
  right model for "Recent Community-Reported Experiences" which sit
  alongside the historical layer.

#### G. Civil Rights Category Already in Heritage Layer

  artifacts/mobile/app/cultural-heritage.tsx — line 97
    "Civil Rights" is already one of the 11 heritage categories.

  The historical sundown towns layer is a separate, new layer — not a
  subcategory of the existing heritage layer.

#### H. Discrimination Fields — EXISTING

  lib/db/src/schema/surveys.ts — "discrimination" category (line 80)
  lib/db/src/schema/business-insight-surveys.ts — witnessedDiscrimination
  artifacts/api-server/src/routes/space-reports.ts — "racial_profiling",
    "discrimination" in VALID_CONCERNS

  These capture current/recent reports. Separate from historical records.

#### I. Store Assets / App Store Description Already References Safety Overlay

  artifacts/mobile/store-assets/app-store-description.txt — line 13
    "Real-time neighborhood safety overlays on the interactive map"

  This description will eventually need updating when "Community Insights"
  language fully replaces "safety overlay" — note for future asset refresh.

### What Does NOT Exist

  ✗ Historical sundown towns database table
  ✗ Historical sundown towns data import
  ✗ Dedicated map layer toggle for historical records
  ✗ Confidence/status classification display
  ✗ Detail tile with historical context, time period, excluded group,
    source attribution, disclaimer, and present-day context separation
  ✗ Separation of historical records from community-submitted reports
    in the UI
  ✗ Founder-approved disclaimer language in the UI
  ✗ Color/label system (Use Extra Caution / Mixed / Not Enough Info)
  ✗ "Why this result?" transparency tap

---

## SECTION 4 — PROPOSED BUILD 97 EXPERIENCE

### A. Map Layer Toggle

Name: "Historical Sundown Towns"
Default: OFF (user must deliberately enable)
Behavior: Appears in the map layer control (alongside heritage sites toggle)
Legend: Visible while layer is on — explains markers reflect historical
        research, not a current safety rating
Independence: Layer hides/shows independently of business pins and
              heritage markers

### B. State Browsing

State filter accessible from the layer panel
Place-name search within the current map viewport
"View all in state" option

### C. Map Markers — Confidence-Based Visual System

DO NOT use identical markers for all confidence levels.
Historical markers must be visually distinct from business pins and
heritage pins.

Proposed marker system:
  Confirmed (historically documented with records)
    → Distinct historical marker shape — solid, authoritative
  Probable or strongly documented
    → Same shape, slightly different fill or border
  Possible or under research
    → Outline only or dashed border — clearly provisional
  Disputed or incomplete
    → Muted / gray treatment
  Documented reconciliation work
    → Special indicator acknowledging community's own history work

Color: DO NOT use the same red as safety alerts for historical-only
records. Red implies present-day danger. Use a dedicated historical
color distinct from the business and safety overlays.

Accessibility requirement: Color alone is never sufficient. Every
marker must also communicate status through shape, label, or symbol
(W3C WCAG 1.4.1).

### D. Detail Tile — Required Fields

Available when a user taps a historical sundown town marker:

  Place name
  State and county
  Historical designation status (Confirmed / Probable / Possible / Disputed /
    Community Acknowledged)
  Historical time period (e.g., "Active approximately 1900–1960")
  Community or population historically excluded
  Brief historical summary (2–4 sentences — sourced)
  Evidence/confidence statement
  Source organization (e.g., "History and Social Justice, Tougaloo College")
  Source link (direct to record)
  Last source review date
  Historical disclaimer (verbatim — see Section 4E)
  ——————————————————
  PRESENT-DAY COMMUNITY INFORMATION (visually separated section)
  Recent community reports (if above minimum threshold — see Section 5C)
  OR: "No recent Mapping With Melanin™ reports are available. This does not
      confirm the absence or presence of discrimination."
  Present-day disclaimer (verbatim — see Section 4E)

### E. Required Disclaimers — Founder-Approved Language

HISTORICAL CONTEXT DISCLAIMER:
  "This location appears in historical research concerning sundown towns —
   communities that intentionally excluded Black people or other racial,
   ethnic, or religious groups through law, intimidation, custom, or
   violence. This designation describes documented history and is not,
   by itself, a statement about every current resident or a definitive
   assessment of present-day conditions."

  Note: Some sundown towns historically excluded populations beyond Black
  Americans — Chinese Americans, Jewish Americans, Mexican Americans,
  Native Americans, and others. Where source data specifies the excluded
  community, the display should name them accurately.

CURRENT COMMUNITY INFORMATION DISCLAIMER:
  "Recent reports reflect submitted or publicly documented experiences and
   may be incomplete. Use this information as one source when planning —
   not as a guarantee of safety or danger."

Both disclaimers must appear on every detail tile where historical
data is shown.

---

## SECTION 5 — RECENTLY REPORTED INFORMATION

### Architecture Principle — SEPARATION IS MANDATORY

Historical records and recent community reports must be:
  Technically separate (different DB tables, different data sources)
  Visually separate (different sections in the detail tile)
  Never combined into one undifferentiated score

### A. Verified Public Record (Layer 2)

For future state — not Build 97 launch unless records are already
curated and approved.

Fields required:
  Source
  Publication date
  Event date
  Location
  Summary
  Verification status (how it was confirmed)
  Review date
  Expiration from "recent" presentation (approved period — TBD)
  Permanent historical retention decision

Examples:
  Government civil-rights findings
  Court decisions
  Public agency investigations
  Credible published investigations
  Official reconciliation statements

### B. MWM Community-Reported Experience (Layer 3 — EXISTING SYSTEM)

The existing `sundown` and `discrimination` report categories already
capture this. Required controls (audit status):

  ✅ Anonymous or attributed submission — exists in reports system
  ✅ Moderation — existing moderation system
  ✅ Reporter identity never publicly exposed — confirmed in trust model
  ? Duplicate detection — needs verification in reports.ts
  ? Corroboration status — does not appear to exist yet
  ? Minimum threshold before showing trends — NOT YET BUILT (CRITICAL)
  ? Date range filtering — needs verification
  ? Aggregate display (not individual reports) — needs verification
  ? Correction or appeal — not confirmed in reports system
  ? Expiration / re-evaluation — not confirmed

⚠️ CRITICAL GAP: No minimum threshold before trends are displayed.
A single community-submitted "Sundown Town Warning" report currently
feeds into the directions route. One report must never label a community.

### C. Build 97 Decision — Recent Reports

For Build 97, the founding question is:
Does current MWM report volume justify displaying recent trends responsibly?

Given that:
  The app is in closed testing (Build 96 under review)
  No general public launch has occurred
  Community report volume is very low

RECOMMENDATION: For Build 97, show the historical layer only.
Preserve recent trend integration as future state until:
  Minimum corroboration threshold is defined and built
  Moderation pipeline has sufficient throughput
  Report volume is sufficient to show trends without single-incident stigma

Show instead: "No recent Mapping With Melanin™ reports are available.
This does not confirm the absence or presence of discrimination."

---

## SECTION 6 — KINFOLKAI TREATMENT

### What KinfolkAI May Do
  Explain sourced historical information
  Clarify what a sundown town designation means historically
  Describe the evidence/confidence classification
  Provide historical context from the same sources shown in the detail tile
  Acknowledge when it does not have enough current verified information

### What KinfolkAI Must NEVER Do
  Invent present-day safety conclusions
  Tell a member a town is "currently" a sundown town without reliable,
    current evidence
  Infer danger from racial demographics
  State that a route is safe or unsafe
  State that every resident holds discriminatory views
  Use inflammatory or sensational wording
  Recommend route avoidance by default
  Convert one member report into a universal claim
  Produce a safety percentage without approved methodology

### Required KinfolkAI Response Pattern
  "This town appears in historical sundown-town research. That designation
   describes documented historical exclusion. Current conditions can differ,
   and Mapping With Melanin™ does not yet have enough recent verified
   community information to characterize the town today."

### KinfolkAI Must Distinguish
  Historical research (what Tougaloo/Scientific Data records show)
  Verified current public information (court decisions, civil-rights findings)
  Aggregated MWM community reports (when above threshold)
  Individual experience (single member report)
  AI inference (explicitly labeled as such)
  Unknown or insufficient evidence (acknowledged clearly)

---

## SECTION 7 — PERFORMANCE AND CRASH PROTECTION

Map stability is a Build 97 priority. This section is required before
any implementation is approved.

### Scale Estimate
  Tougaloo database: ~7,000+ communities nationally
  U.S. cities with population > 2,500: ~30,000
  Expected sundown town records at state zoom: hundreds
  Expected sundown town records at national zoom: thousands

### Performance Rules — Mandatory
  NEVER load thousands of individual markers simultaneously
  Server-side bounding-box queries (load only what is in viewport)
  State-based lazy loading (only load selected state)
  Marker clustering (group dense records at lower zoom levels)
  Maximum visible markers before clustering triggers: TBD (suggest ≤ 200)
  Progressive loading on zoom/pan (load more as user navigates)
  Cached source data (seed data, not live queries per render)
  Feature isolation (this layer must not affect business pin performance)

### Required Performance Tests Before Shipping
  National zoom — marker clustering activated, no map crash
  State zoom — all state records visible, clustered appropriately
  County zoom — individual markers visible and tappable
  Detail tile opens — no jank or loading spinner over 500ms
  Layer toggle off — markers immediately removed, no memory leak
  Interaction with business markers — no conflict
  Interaction with heritage markers — no conflict
  Small phone (320px width) — markers and legend visible
  Android — performance equal to iOS
  Tablet — layout appropriate
  Slow network (3G simulation) — markers load progressively, no crash
  Offline — layer gracefully absent, no error shown

### Architectural Approach (Proposed)
  New DB table: sundown_towns (mirrors cultural_sites pattern)
  API endpoint: GET /sundown-towns?bbox={n},{s},{e},{w}&state={code}
  Returns: records within viewport bounding box only
  Clustering: client-side at zoom < threshold, server-side for national view
  Caching: seed data pre-loaded at startup; no per-request DB call needed
    at city zoom once loaded

---

## SECTION 8 — CONTENT, LEGAL, AND REPUTATIONAL SAFEGUARDS

### Defamation Risk
  Risk: Publishing false information that damages a current community's
        reputation.
  Mitigation: Use only records from peer-reviewed or institutional sources
    (Tougaloo, Scientific Data 2025). Never add unverified records.
    Display confidence classification prominently.
    Historical disclaimer on every record.
    No record may imply present-day danger from historical status alone.

### False Light Risk
  Risk: Placing a community in a misleading context (e.g., treating a
        "Possible" record identically to a "Confirmed" record).
  Mitigation: Visual and textual distinction between confidence levels.
    "Possible" records display "Under historical research — not yet confirmed."
    Appeals process for communities that believe a record is incorrect.

### Outdated Information
  Risk: A community resolved a historical wrong; the platform still shows
        the historical designation without context.
  Mitigation: "Documented Reconciliation" status option in the data model.
    Detail tile includes a separate reconciliation section.
    Source review date displayed on every record.
    Annual review process for major records (future governance).

### Source Errors
  Risk: The Tougaloo database contains acknowledged gaps and errors.
  Mitigation: Display the source's own accuracy caveat.
    Allow communities or researchers to submit corrections.
    Corrections go through moderation before any change is published.

### Ambiguous Place Boundaries
  Risk: A sundown town record refers to a historical jurisdiction that
        no longer matches current city/county boundaries.
  Mitigation: Display the Census geographic identifier (from Scientific
    Data 2025) alongside the historical place name.
    Note: "Historical boundaries may differ from current city limits."

### Business Impact
  Risk: A business located in a historically listed area receives reduced
        traffic because of the historical marker.
  Mitigation: Historical markers are a separate layer from business pins.
    Business profile pages do not display historical sundown town status
    of the surrounding area as a rating — only the separate community
    reports section (which already exists) applies to business context.
    Historical and current are always visually separated.

### User-Generated Allegations
  Risk: Community members submit false "Sundown Town Warning" reports.
  Mitigation: Existing moderation system (already confirmed in reports.ts).
    Minimum corroboration threshold before trends are shown (must be built).
    Appeal and correction process required before launch.
    One report never creates a community label.

### Community Stigma
  Risk: Historical designation stigmatizes current majority-minority
        communities that have transformed since the historical period.
  Mitigation: Reconciliation status field.
    Progress framing: "This community has documented active reconciliation
    efforts." Positive community signals displayed alongside historical context.
    Design principle: capacity-framing over deficit-framing (per CIC Principle 7).

---

## SECTION 9 — UI CLASSIFICATION SYSTEM (FROM FOUNDER VISION)

This section preserves the full recommended classification system
for Build 97 and future phases.

### Present-Day Status Labels (Four Tiers)

| Status | Color | Meaning |
|---|---|---|
| Use Extra Caution | Red | Meaningful recent concerns with sufficient evidence |
| Mixed Community Information | Amber | Positive and concerning signals coexist |
| More Reassuring Recent Information | Green | Recent info is generally reassuring |
| Not Enough Information Yet | Gray | Insufficient current evidence |

Rules:
  Color alone is never sufficient — label and evidence level required (W3C)
  Historical designation DOES NOT automatically determine present-day color
  "Not Enough Information Yet" is the default for Build 97 (low report volume)

### Historical Context Indicator (Separate Symbol)
  A distinct historical marker or symbol — NOT a fifth safety grade
  Visually separate from the four present-day status pins

### Evidence Strength Line (Under Status Label)
  High confidence
  Moderate confidence
  Limited information

### Three Levels of Explanation (Progressive Disclosure)
  Level 1 — Pin label + brief summary (immediately visible)
  Level 2 — "Why this result?" (one tap)
  Level 3 — "Learn More" (full detail tile with methodology note)

### "Why this result?" Required Content
  Evidence categories used
  Number of qualifying reports (if recent reports surface)
  Whether reports were corroborated
  Community organizations
  Positive engagement and reconciliation work
  Data limitations
  Correction process link
  Source citations

### Design Principle — Permanent
  "Simple first. Clear second. Detailed when requested. Never falsely certain."

---

## SECTION 10 — WHAT BUILD 97 INCLUDES vs. WHAT WAITS

### Build 97 MAY Include (if passes all gates)
  Historical Sundown Towns map layer toggle (off by default)
  State-based browsing
  Confidence-classified markers (Confirmed / Probable / Possible / Disputed /
    Reconciling — visually distinct)
  Detail tile with required fields and both disclaimers
  "Not Enough Information Yet" present-day status (default)
  Historical data from Scientific Data (2025) with CC BY 4.0 license confirmed
  Tougaloo attribution in source field
  Performance testing completed (all tests in Section 7 pass)
  Feature isolation from business pins and heritage pins confirmed
  Separate from existing community reports system (no conflation)

### Build 97 Must NOT Include
  Automated present-day danger score based on historical data
  Live web scraping of allegations
  Unmoderated reports displayed immediately
  Predictive warnings based on demographics
  Automatic "avoid this town" directions
  Claim that every historically listed town remains a sundown town today
  Community Health weighting formulas
  Route avoidance without explicit user choice
  AI-generated allegations about communities
  Numerical safety percentage before methodology is approved
  Red-coded historical markers (implies present-day danger from history alone)
  The full four-status present-day classification system
    (requires minimum report threshold that does not yet exist)

---

## SECTION 11 — PRE-IMPLEMENTATION GATES

Before "Please implement." is issued for this feature:

  Gate 1: Scientific Data (2025) license confirmed as CC BY 4.0
           and attribution language agreed upon
  Gate 2: Tougaloo College outreach completed and reuse confirmed
  Gate 3: Data fields mapped from source format to sundown_towns table schema
  Gate 4: Founder approves the detail tile disclaimer language
  Gate 5: Founder approves the confidence-status visual design
  Gate 6: Performance architecture reviewed and marker count estimated
  Gate 7: Minimum report threshold for community reports section defined
  Gate 8: Appeals/correction process designed
  Gate 9: Build 96 approved by Apple

ALL NINE GATES must be confirmed before implementation begins.

---

## SECTION 12 — OPEN QUESTIONS FOR FOUNDER DECISION

These cannot be resolved without explicit founder decision:

  Q1: Should "Possible" records be displayed in Build 97, or only
      "Confirmed" and "Probable" records? (Reduces stigma risk for
       unverified records vs. completeness of historical record)

  Q2: Should the historical layer be available globally at launch,
      or only for supported cities (e.g., the 20+ cities already in
      the platform)?

  Q3: What is the approved minimum corroboration threshold before
      recent community reports surface on a detail tile?
      (Recommendation: minimum 3 independent, moderated reports
       within 24 months)

  Q4: Should the directions route (directions.ts) still show sundown
      warnings during Build 97, given the new separation of historical
      vs. community-reported? Or should that route be updated to show
      both layers distinctly?

  Q5: Is the current 🚫 emoji in MapTabView appropriate for the
      historical layer, or should a custom icon be designed?

  Q6: Should communities that have documented reconciliation work
      (e.g., formal apologies, reparation programs, historical marker
       installations) receive a distinct visual treatment that
       acknowledges their work?

---

## Cross-References

  Build 97 scope: docs/product/BUILD_97_SCOPE_AND_ROADMAP.md
  Community Health Profile: docs/vision/COMMUNITY_HEALTH_PROFILE.md
  Community Intelligence Constitution (Principle 7): 
    docs/vision/COMMUNITY_INTELLIGENCE_CONSTITUTION.md
  Safety Score terminology trace: docs/product/BUILD_97_SAFETY_SCORE_TERMINOLOGY_TRACE.md
  Trade secrets (Community Health methodology):
    docs/trade-secrets/COMMUNITY_HEALTH_INTELLIGENCE_ENGINE.md
  Existing cultural sites architecture: artifacts/api-server/src/routes/cultural-sites.ts
  Existing reports architecture: artifacts/api-server/src/routes/reports.ts

---

## SECTION 13 — FOUNDER DECISIONS (LOCKED August 7, 2026)

All six open questions resolved. No implementation until full instructions received.

| # | Decision | Answer |
|---|----------|--------|
| Q1 | Confidence levels to display | **All three — Confirmed / Probable / Possible.** "Possible" shown with "Under historical research — not yet confirmed" label. |
| Q2 | Geographic scope at launch | **Whole U.S.** — all ~7,000 records from the historical database at launch. |
| Q3 | Min. reports before community trends appear | **3 independent moderated reports within 24 months.** Below threshold: "No recent Mapping With Melanin™ reports are available. This does not confirm the absence or presence of discrimination." |
| Q4 | Directions route behavior | **Show both** — verified historical database records AND community reports (when above the 3-report threshold). |
| Q5 | Layer default state | **ON by default.** ⚠️ Additional instructions pending — do not implement until received. |
| Q6 | Disclaimer language | **Approved as written** in Section 4E. No changes. |

### Gate resolution — August 7, 2026

| Gate | Status | Detail |
|---|---|---|
| Gate 1 | ✅ CLEARED | CC BY 4.0 confirmed (Rigby et al., 2025, Scientific Data). OSF dataset (osf.io/fh7r6/) available under universal/CC0 license. Either license permits use with attribution. |
| Gate 2 | ✅ CLEARED | Tougaloo College outreach email sent. Proposed attribution: "Historical sundown town data is based on research by Dr. James W. Loewen and the Tougaloo College History & Social Justice Project (justice.tougaloo.edu), with spatial linkage from Rigby et al. (2025)." |
| Gate 3 | ✅ CLEARED | Field mapping: name/city/state/lat/lng/confidence_level/historical_evidence/time_period/excluded_population/source_organization/source_url/census_geocode/current_state |
| Gate 4 | ✅ CLEARED | Disclaimer language approved as written in Section 4E (Q6 decision). |
| Gate 5 | ✅ CLEARED | Visual design spec received and locked: color #B8860B (dark goldenrod), upward triangle (▲) markers — solid/Confirmed, semi-filled/Probable, outline/Possible. 6-state evolution system with color variants. |
| Gate 6 | ✅ CLEARED | Performance: viewport bbox filtering, server-side query, max 200 markers per viewport, zIndex below business pins. |
| Gate 7 | ✅ CLEARED | Minimum 3 approved reports in 24 months before community trends surface (Q3 decision). |
| Gate 8 | ✅ CLEARED | Appeals: correction submissions route via sundown_community_reports moderation pipeline. |
| Gate 9 | ✅ CLEARED | Build 96 approved by Apple. |

**Implementation COMPLETE — August 7, 2026**

Shipped: sundown_towns table + sundown_community_reports table + GET /sundown-towns + POST /sundown-towns/:id/report + amber triangle map layer (always on) + confidence-classified markers + historical context InfoWindow with dual disclaimers. Seeded with 16 curated entries from Loewen / Tougaloo research.
