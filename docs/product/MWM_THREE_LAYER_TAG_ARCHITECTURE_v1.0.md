# Mapping With Melanin™ — Three-Layer Tag Architecture
**Document type:** Routing reference and rendering rules  
**Version:** 1.0  
**Governs:** MWM_ENDORSEMENT_TAG_SYSTEM.md v1.0 and MWM_THE_REAL_Professional_Trust_System.md v1.0  
**Source:** MWM_Three_Layer_Tag_Architecture_1786167282404.pdf

---

## 1. Why Three Layers

A single flat list of tags cannot serve both a soul food restaurant and a family law attorney. The architecture separates community knowledge into three layers, each answering a different question:

| Layer | Question | Example tag | What it is not |
|---|---|---|---|
| THE VIBE | What kind of visit is this? | Date Night, Hood Classic, Cookout Approved | Not a quality judgment |
| THE REAL | Can I trust this person with something that matters? | Believed Me, Fought For Me, No Predatory Terms | Not atmosphere, not politeness |
| ONE-TAP ENDORSEMENTS | Was this good? | Grandma Approved, Portions With Love, Fair Price | Not a rating, not a review |

**Governing insight:** Layers 1 and 2 are mutually exclusive. Layer 3 is universal. Nobody has ever needed both Vibe and Real answers about the same business.

---

## 2. Complete Routing Table — All 22 Categories

| # | Category | Layer | Layer tag count | Endorsements |
|---|---|---|---|---|
| 1 | Food & Drink | The Vibe | 8 | Yes |
| 2 | Beauty & Personal Care | **none** | — | Yes |
| 3 | Health & Wellness | The Real (subcategory split) | 19 | Yes |
| 4 | Shopping & Retail | **none** | — | Yes |
| 5 | Travel & Hospitality | The Vibe | 8 | Yes |
| 6 | Arts, Culture & Entertainment | The Vibe | 8 | Yes |
| 7 | Professional Services | The Real | 15 | Yes |
| 8 | Home & Property Services | The Real | 14 | Yes |
| 9 | Automotive & Transportation | The Real | 14 | Yes |
| 10 | Events & Celebrations | The Vibe (venues only) | 8 | Yes |
| 11 | Education & Learning | **none** | — | Yes |
| 12 | Children & Family | The Vibe | 8 | Yes |
| 13 | Community & Nonprofit | **none** | — | Yes |
| 14 | Faith & Spirituality | The Vibe (restrained set) | 6 | Yes |
| 15 | Media & Creative Services | **none** | — | Yes |
| 16 | Sports & Recreation | The Vibe | 6 | Yes |
| 17 | Pets & Animal Services | The Real | 13 | Yes |
| 18 | Technology & Digital Services | The Real | 14 | Yes |
| 19 | Financial & Business Services | The Real | 15 | Yes |
| 20 | Legal & Government Services | The Real | 17 | Yes |
| 21 | Agriculture & Specialty Producers | The Vibe (farmers markets only) | 6 | Yes |
| 22 | Other Services | The Real | 13 | Yes |

**Summary:** 9 categories → THE REAL | 8 categories → THE VIBE | 5 categories → neither | All 22 → Endorsements

### 2.1 Health & Wellness Subcategory Exception

| Subcategory | Layer | Reasoning |
|---|---|---|
| Primary Care & Medical Practices | Real | Clinical trust |
| Dental | Real | Clinical trust |
| Mental Wellness & Therapy | Real | Clinical trust |
| Physical Therapy | Real | Clinical trust |
| Chiropractic | Real | Clinical trust |
| Nutrition & Dietitians | Real | Clinical trust |
| Wellness Centers | Real | Clinical trust |
| Doula & Birth Services | Real | Highest-stakes trust in the app |
| Holistic Wellness | Real | Clinical trust |
| Pharmacies | Real | Clinical trust |
| Home Health & Caregiving | Real | Clinical trust, in the home |
| Fitness & Gyms | Vibe | The question is what the room feels like |
| Personal Trainers | Vibe | Experience-driven |
| Yoga & Pilates | Vibe | Experience-driven |

> **Note:** The 3 fitness subcategories still carry `health_no_judgment_body` ("No Judgment About My Body") from Layer 3 — routing must never accidentally suppress it.

---

## 3. Business Profile Composition

### 3.1 Experience business (e.g. soul food restaurant)
- Endorsements LEAD (first question is whether the food is good)
- The Vibe sits BELOW in outlined chips, COLLAPSED by default

### 3.2 Professional business (e.g. OBGYN)
- THE REAL LEADS (first question is whether she will be believed)
- Endorsements sit BELOW
- **Private-report footer is MANDATORY on every professional profile**

### 3.3 Neither-layer business (e.g. bookstore)
- One section only: WHAT STANDS OUT (endorsements)
- This is correct and complete for 5 of the 22 categories

---

## 4. Rules Table

| # | Rule | Vibe | Real | Endorsements |
|---|---|---|---|---|
| 1 | Earned by community tap, never self-assigned | Yes | Yes | Yes |
| 2 | **10-tap public display threshold** | Yes | Yes | Yes |
| 3 | One user, one tap, per tag, per business | Yes | Yes | Yes |
| 4 | Candidate set driven by category, never user identity | Yes | Yes | Yes |
| 5 | Praise-only; no negative or corrective tag exists | Yes | Yes | Yes |
| 6 | Cultural variants resolve from saved language preference only | Yes | Yes | Yes |
| 7 | Renders on every category | No (8) | No (9) | Yes (22) |
| 8 | Mutually exclusive with the other layer section | Yes | Yes | N/A |
| 9 | Position on profile | Below endorsements | Above endorsements | Middle |
| 10 | Chip style | Outlined | Filled with accent border | Filled |
| 11 | Collapsed by default | Yes | No | No |
| 12 | Display string | `{count} said {label}` | `{count} said: {label}` | `{count} said {label}` |
| 13 | Localized section header | Not yet | Yes, 11 communities | Not yet |
| 14 | Ordering signal | sort_weight | trust_weight then count | count then sort_weight |
| 15 | Elevated anti-gaming controls on flagged tags | No | Yes, is_high_stakes (14 tags) | Safety tags only |
| 16 | Private-report footer required in panel | No | Yes | No |
| 17 | Never derived from police, arrest, or census income data | Yes | Yes | Yes |
| 18 | Owner may view counts but never edit | Yes | Yes | Yes |
| 19 | Accumulates on live_unclaimed pins before any owner claims | Yes | Yes | Yes |

### 4.1 Three Absolute Rules (never tradeable)

1. **The One-Way Mirror Rule** — The only input to cultural variant resolution is `users.community_language`, set by the user in Settings. Never device locale as ethnicity, never name, never photo, never neighborhood, never browsing history, never a model inference.

2. **Praise-only** — No layer contains a negative tag, a downvote, or a warning label. Negative experience routes to the private feedback and safety report flow.

3. **No criminalizing data** — Safety and welcome language is community-reported lived experience only. Never computed from or joined against police, arrest, traffic-stop, crime, or census income data.

### 4.2 Values Rules
- Community entrepreneurs always list for free — tag eligibility can never depend on a paid tier
- Non-minority-owned businesses are never promoted above minority-owned alternatives — tag counts alone must never override ownership-designation ordering in search or map results

---

## 5. Implementation Quick Reference

| Need | Source of truth |
|---|---|
| Which layer does this business render? | `tag_layer_routing`, resolved subcategory-first then category, defaulting to none |
| What are the candidate tags? | `endorsement_tags` filtered by category_ids and subcategory_keys only |
| What label does this user see? | `endorsement_tag_variants` keyed on `users.community_language`, falling back to default |
| What does the section header say? | `section_header_variants` for `section_key='the_real'` |
| Has this tag gone public? | `business_endorsement_counts.count >= 10` |
| Which tags need tighter fraud controls? | `endorsement_tags.is_high_stakes = TRUE` (14 tags) |
| What order do Real tags appear in? | `trust_weight DESC`, then `count DESC` |

> **VIBE_ENABLED_CATEGORIES constant is deleted.** Two sources of truth for layer routing is a guaranteed future bug.

---

## 6. System Totals (after both specs ship)

| Metric | Value |
|---|---|
| Main categories | 22 |
| Total tags in endorsement_tags | 435 (340 existing, 39 reclassified in place, 95 new Real tags added) |
| Endorsement tags (Layer 3) | 272 |
| Vibe tags (Layer 1) | 29 |
| Real tags (Layer 2) | 134 |
| Adaptive tag families | 16 (10 existing, 6 new) |
| Communities with label variants | 11 plus secondary renderings |
| Display threshold | **10 taps, all layers** |
