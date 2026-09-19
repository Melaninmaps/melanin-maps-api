# Philadelphia Family & Everyday Services — Sixth-Depth Source Report

**Research date:** 2026-09-19
**Scope:** Philadelphia, Pennsylvania only. This is a **protected review-only intake**, not a production import, publication list, or map-pin dataset. Records are deliberately conservative: information is limited to published source detail and all viable records are `pending_review`; incomplete retained review leads are `needs_research`.

## Corpus deduplication

Before candidate assembly, the required legacy corpus scope was recursively enumerated and parsed: `/home/ubuntu/directory-research-wave-2026-09-18/philadelphia`, `/home/ubuntu/directory-research-wave-2026-09-18/philadelphia-deep-pass`, every `/home/ubuntu/directory-research-wave-2026-09-18/philly-city-*-depth` directory, and every `/home/ubuntu/directory-research-wave-2026-09-18/pa-suburbs-*-depth` directory. The scope contained **19 JSONL files and 320 rows**. Since files use more than one schema generation, the check read both current fields (`city`, `state`, `website`, social fields) and legacy equivalents (`city_or_null`, `state_or_null`, `customer_destination_url`, `source_evidence_url`).

The exact dedupe test was: (1) lowercase each string, remove all non-alphanumeric characters, then compare `normalized(name)|normalized(city)|normalized(state)` against the prior registry; and (2) normalize each official website, Instagram, Facebook, TikTok, social-source, legacy customer destination, and legacy source-evidence URL the same way, then reject a match to any prior destination. This yielded **278 prior normalized name/city/state keys** and **558 prior normalized destination keys**. The 20 new records (18 candidates and 2 held) were then checked by the same two tests against the prior registry and internally; **0 prior name/city/state matches, 0 prior destination matches, 0 internal name/city/state matches, and 0 internal destination matches** were found. No known rows were replayed.

## Source evidence ledger

| Source URL | Retrieval / verification notes | Retained | Held |
|---|---|---:|---:|
| [https://www.phila.gov/departments/office-of-children-and-families/](https://www.phila.gov/departments/office-of-children-and-families/) | Official municipal page read; retained 1 resource. | 1 | 0 |
| [https://www.phila.gov/programs/out-of-school-time-ost/](https://www.phila.gov/programs/out-of-school-time-ost/) | Official municipal page read; retained 1 resource. | 1 | 0 |
| [https://www.phila.gov/programs/playitsafephl/for-kids/](https://www.phila.gov/programs/playitsafephl/for-kids/) | Official municipal navigation page read; held for lack of dedicated numbered address. | 0 | 1 |
| [https://dbhids.org/services/children-and-youth-services/](https://dbhids.org/services/children-and-youth-services/) | Official City department service page read; retained 1 routed resource. | 1 | 0 |
| [https://www.phillylovesfamilies.com/philly-families-can](https://www.phillylovesfamilies.com/philly-families-can) | Official intake/referral page read; retained 1 resource. | 1 | 0 |
| [https://pysc.org/](https://pysc.org/) | Official organization page read; retained 1 youth-sports resource. | 1 | 0 |
| [https://www.childrensvillagephila.org/](https://www.childrensvillagephila.org/) | Official organization page read; retained 1 regulated-review candidate. | 1 | 0 |
| [https://www.legendsinlocs.com/](https://www.legendsinlocs.com/) | Official business/booking page read; retained 1 business. | 1 | 0 |
| [https://fleisher.org/take-a-class/saturday-young-artist-program/](https://fleisher.org/take-a-class/saturday-young-artist-program/) | Official program page read; retained 1 community resource. | 1 | 0 |
| [https://asianartsinitiative.org/education](https://asianartsinitiative.org/education) | Official education page read; retained 1 community resource. | 1 | 0 |
| [https://www.pafa.org/education/center-for-art-education/youth-and-family](https://www.pafa.org/education/center-for-art-education/youth-and-family) | Official cultural-institution page read; retained 1 cultural-place candidate. | 1 | 0 |
| [https://www.waynesgarageinc.net/contact](https://www.waynesgarageinc.net/contact) | Official contact page read with official service page; retained 1 business. | 1 | 0 |
| [https://www.habitatphiladelphia.org/home-repair/](https://www.habitatphiladelphia.org/home-repair/) | Official program page read; retained 1 community resource. | 1 | 0 |
| [https://www.gpca-phila.org/](https://www.gpca-phila.org/) | Official organization page and official contact page read; retained 1 community resource. | 1 | 0 |
| [https://www.phila.gov/programs/financial-empowerment-centers/](https://www.phila.gov/programs/financial-empowerment-centers/) | Official municipal program page read; retained 1 community resource. | 1 | 0 |
| [https://www.phila.gov/departments/office-of-community-empowerment-and-opportunity/](https://www.phila.gov/departments/office-of-community-empowerment-and-opportunity/) | Official municipal office page read; retained 1 community resource. | 1 | 0 |
| [https://jeffersonhealthplans.com/community-engagement/cwc-west-philadelphia.html](https://jeffersonhealthplans.com/community-engagement/cwc-west-philadelphia.html) | Official organization program page read; retained 1 community resource. | 1 | 0 |
| [https://amritayogawellness.com/](https://amritayogawellness.com/) | Official business/booking page read; retained 1 business. | 1 | 0 |
| [https://middlechildphilly.com/](https://middlechildphilly.com/) | Official business ordering page read; retained 1 business. | 1 | 0 |
| [https://www.maggianosauto.com/contact](https://www.maggianosauto.com/contact) | Official business contact page read; held because rendered source lacked address/phone. | 0 | 1 |

## Category coverage

| Category | Candidate count | Included review routing |
|---|---:|---|
| Childcare and early education | 1 | regulated_review |
| Youth activities, arts, and enrichment | 5 | community_resource / cultural_place |
| Youth sports | 1 | community_resource |
| Mental-health/community navigation | 3 | community_resource |
| Natural-hair and loc care | 1 | business |
| Wellness | 2 | community_resource / business |
| Family-dining-adjacent everyday dining | 1 | business |
| Household repair | 1 | community_resource |
| Vehicle repair | 1 | business |
| Financial/professional services | 2 | community_resource |
| Family/community organizations | 1 | community_resource |

The assortment includes sources that explicitly describe free or low-cost offerings, a named welcome package or tiered fee, and ordinary commercial customer destinations; no generalized price claims were introduced.

## Known limitations

Official pages sometimes use broad service descriptions, change schedules or eligibility, or provide multiple sites. These records do not guarantee availability, qualification, price, operating status, safety, accessibility, language capacity, licensure, healthcare outcomes, or program capacity. Childcare is purposely routed to `regulated_review`; public health/behavioral-health, municipal, nonprofit, and cultural resources are routed rather than treated as ordinary businesses. The record for Maggiano’s Auto Repairs is held because the extracted official contact page did not expose a street-number address and phone. The PlayItSafePHL navigation page is held because it does not publish a dedicated numbered program address. City resource pages and outreach programs with no direct storefront were not assigned invented addresses or map pins.

## Output totals

- **Candidates:** 18
- **Held candidates:** 2
- **Verified source URLs in ledger:** 20
- **Status discipline:** all candidate records are `pending_review`; all held records are `needs_research`.
