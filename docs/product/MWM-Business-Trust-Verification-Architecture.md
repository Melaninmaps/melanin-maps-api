# MAPPING WITH MELANIN™
## BUSINESS TRUST & VERIFICATION ARCHITECTURE

**STATUS:** Founder-approved specification. Architectural decisions locked.  
**GATE:** Audit current `verified`, `listing_status`, and `safetyRating` DB fields before any schema changes. Existence/ownership/visit/confidence/safety must remain SEPARATE database concepts — never collapsed into one field.

---

## CORE PRINCIPLE

> **Mapping with Melanin™ distinguishes business existence, business verification, community experience, and community safety confidence. These are not interchangeable.**
>
> A verified business is not automatically a safe business. A positive member report does not constitute a safety certification. Community confidence develops through multiple independent experiences and other reliable evidence over time.
>
> Where community evidence is limited, Mapping with Melanin™ will clearly communicate that limitation rather than characterize a business or location as safe or unsafe.
>
> Safety information reflects reported experiences and available information and cannot guarantee how another individual will be treated or what conditions they will encounter.

---

## LAYERED TRUST MODEL

| Status | What It Actually Means | What the User Sees |
|---|---|---|
| **Listed** | We have evidence the business/place exists | Listed — Not Yet Community Verified |
| **Business Verified** | Business identity/existence has been independently confirmed | Business Verified ✓ |
| **Community Visited** | At least one verified member reports actually visiting | Community Visit Confirmed |
| **Community Trusted** | Enough independent, credible member experiences exist to calculate meaningful trust/safety information | Community Trusted |
| **Safety Concern** | Credible reports indicate a potential concern | Community Safety Concern |

**Business Verified must not mean Safe.** It only means we have enough evidence to believe this is a real operating business.

---

## INTERNATIONAL BUSINESS VERIFICATION

For a business found on Instagram, TikTok, Facebook, etc.: allow it to be added, but initially classify as **Listed / Unverified**.

Verify existence using multiple signals rather than one source:
- official website/domain
- active social account with meaningful history
- physical address
- mapping/location data
- local business registry where available
- tourism-board or chamber listings
- recent customer activity
- phone/contact information
- booking platform presence
- eventual owner verification

Not every signal is required. Enough independent signals must establish **existence** — while being clear this is not a safety certification.

---

## COMMUNITY EXPERIENCE DISPLAY

Never turn a single community visit into a green "Safe" badge.

Display instead:

**Community Experience**
- 1 verified visit
- Positive experience reported
- Limited community data

As additional independent reports accumulate, confidence increases.

**Weight the evidence, not merely the member's status.** A longtime member should not be able to single-handedly certify a location.

### Confidence considers:
- confirmed visit/check-in
- account trust/history
- recency
- number of independent reporters
- consistency between reports
- whether reports contain corroborating information
- whether reports come from unrelated accounts

**Do not publish the underlying mathematical "trust score" as though safety can be reduced to 87/100.** Internally, use confidence scoring. Externally, translate it into understandable language.

---

## "KNOW BEFORE YOU GO" INDICATOR

Instead of trying to certify the world, give users a layered community-insight indicator:

| Indicator | Meaning |
|---|---|
| **Strong Community Insight** | Plenty of recent community evidence |
| **Growing Community Insight** | Some verified experiences; still building confidence |
| **Limited Community Insight** | We know the place exists, but don't yet have enough community experience |
| **Community Concern Reported** | Credible concerns have been reported. Tap to understand what was reported |
| **Official / Elevated Safety Advisory** | Relevant credible external safety information exists |

The last category is fundamentally different from user reviews. If a government, recognized human-rights organization, reputable news organization, tourism authority, or other credible source documents something significant, the platform should not wait for five members to experience it themselves.

---

## IDENTITY-AWARE REPORTING

**"Safe" isn't universal.**

A Black American woman, gay Latino man, Muslim woman wearing hijab, transgender traveler, disabled traveler, Afro-Latina traveler, or interracial couple can have very different experiences at the exact same establishment.

Reports should optionally capture:

> "Is there anything about your experience that may be especially helpful to another traveler?"

People can voluntarily select relevant context without being required to disclose identity.

Eventually the platform can say:
> **Limited community evidence**
>
> 6 verified community visits have been reported. Experiences have been mostly positive, but we don't yet have enough information to characterize this location broadly.

---

## KINFOLK EVIDENCE-LEVEL LANGUAGE

When a user asks Kinfolk to find a business with zero verified community experiences, Kinfolk can recommend its **existence** but must communicate the evidence level:

> "I found this option nearby. The business appears to be operating, but Mapping with Melanin doesn't yet have enough verified community experiences to speak confidently about what your experience may be like. Want me to also show you options with stronger community feedback?"

**Not:** "This restaurant is safe."  
**Not:** ⚠️ "WARNING: We cannot guarantee your safety." (creates false danger signal for any unreviewed international business)

---

## ARCHITECTURAL REQUIREMENT (PERMANENT)

> **Preserve existence verification, ownership/business verification, visit verification, community confidence, and safety evidence as separate database concepts.**

Combining them into one `verified=true` field now would create a major architectural problem later.

**Required separate fields/tables:**
- `listing_status` — existence evidence state (Listed / Business Verified / Community Visited / Community Trusted / Safety Concern)
- `verified` — business identity/existence independently confirmed (BOOLEAN — already exists, meaning must be scoped)
- `visit_count` — number of confirmed community visits (separate from reviews)
- `community_confidence_level` — computed: Limited / Growing / Strong / Concern
- `safety_concern_active` — credible concern reported (BOOLEAN, separate from community confidence)
- `official_advisory_active` — external authoritative safety advisory exists (BOOLEAN)
- `safety_rating` — internal numerical confidence score (not exposed raw to users — already exists as safetyRating)

**Do not collapse any of these into a single field.**

---

## CONNECTION TO COMMUNITY GOVERNANCE SPEC

This architecture is part of the Community Governance & Moderation Specification (`docs/product/MWM-Community-Governance-Moderation-Spec-v1.0.md`).

The layered trust model connects directly to:
- Sundown town historical layer (separate from community safety reports)
- Safety reports (separate from business verification)
- THE REAL / community endorsement tags (separate from safety evidence)
- Culture & Roots diaspora expansion: community verification can travel with the community without pretending community knowledge is universal or complete
