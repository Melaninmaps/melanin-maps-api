# Houston Family, Child Care, and Youth Enrichment Research

**Research slice:** Houston, Texas. **Prepared:** September 19, 2026. **Outcome:** 18 candidate records and 3 held records were assembled for research review. The candidate set prioritizes practical child care, after-school, youth enrichment, public-family activities, parks, museums, and arts options that could be relevant to children around ages 10–12 while retaining several broader family and early-childhood resources. The stated parent and child context was used only to select these categories; no personal characteristics, household circumstances, preferences, affordability assumptions, accessibility claims, safety claims, or quality judgments were inferred.

## Candidate coverage

| Category | Candidate count | Included record types |
| --- | ---: | --- |
| Family-friendly activities | 5 | Four cultural places and one physical visitor destination |
| Parks and recreation | 2 | Public/nonprofit park and municipal community-center resource |
| Youth enrichment | 5 | Library, arts education, soccer, academic, and online finder resources |
| After-school programs | 4 | Community and school-linked arts/creative providers |
| Child care | 1 | Regulated-review early-childhood provider |
| **Total** | **18** | **4 cultural places; 2 physical businesses; 10 community resources; 1 regulated review; 1 online-only record** |

The candidates file includes the following organizations and destinations: Children’s Museum Houston; The Health Museum; Holocaust Museum Houston; Houston Zoo; Houston Botanic Garden; Discovery Green; Houston Public Library Central Library; Glassell School of Art; Alief Community Center; H-Town Soccer Academy Legacy Program at Alief Park; SHAPE Community Center; Workshop Houston; Young Audiences of Houston; MECA; Houston Area Urban League Education and Youth Development; LNESC Houston; YMCA Children’s Academy at Texas Medical Center; and the Out 2 Learn Program Finder.

For records where an explicit community designation was stated by the organization, it is captured narrowly as an organizational/service designation rather than an inference about ownership. SHAPE identifies a mission centered on people of African descent, the Houston Area Urban League explicitly names Black people and other marginalized communities in its mission, and LNESC Houston identifies its roots in the Latino east end community. No designation was added where an attribution was not explicit.[11] [15] [16]

## Source review and destination verification

Multiple public sources and official customer-facing pages were opened and read. Houston Museum District records were paired with official museum or zoo pages; the Downtown Houston district listing was paired with Discovery Green’s visitor page; City of Houston pages were paired with the applicable public facility or program pages; and United Way’s Out 2 Learn network context was paired with each provider’s official destination. State child-care regulation information was opened for the regulated-review workflow, but an individual Texas Search Child Care result was not retrieved.

The following opened pages form the source trail for this package:

1. Houston Museum District pages for Children’s Museum Houston, The Health Museum, Holocaust Museum Houston, and Houston Zoo.[1] [2] [3] [4]
2. Official pages for Children’s Museum Houston, The Health Museum programs, Holocaust Museum Houston visits, Houston Zoo visits and kids/families, Houston Botanic Garden education, and Glassell School of Art.[5] [6] [7] [8] [9] [10] [17]
3. Downtown Houston and Discovery Green pages for the park’s address, amenities, visitor information, group visits, and family-and-children events.[12] [13]
4. City of Houston Parks and Recreation pages for youth recreation, the southwest and northwest community-center listings, and the Mayor’s Office after-school/support-program pages.[14] [18] [19] [20] [21]
5. Official pages for SHAPE, Workshop Houston, Young Audiences of Houston, MECA, Houston Area Urban League, LNESC Houston, Houston Public Library, and YMCA of Greater Houston, together with United Way’s Out 2 Learn network page.[11] [15] [16] [22] [23] [24] [25] [26] [27]
6. Texas Health and Human Services Child Care Regulation information and the Buffalo Soldiers National Museum official closure page.[28] [29]

## Held records and limitations

Three leads are separated into `held-family-childcare.jsonl`. Buffalo Soldiers National Museum is held because its official site reports a temporary closure for renovation while also retaining a “closed until Summer 2026” statement that is stale or conflicting with the September 2026 research date.[29] The City’s generic A.S.A.P. record is held because its page retains a 2023 procurement reference and does not identify current family enrollment sites.[14] The generic HPARD After-School Enrichment Program is held because the City describes the current age range and services but requires a current location flyer or registration check to confirm an individual active site.[14]

This package is **research only**, not an endorsement, quality assessment, or availability promise. Admission, prices, schedules, eligibility, capacity, language availability, transportation, licensing status, accessibility, and safety were not inferred. The recipient should verify current operating status, registration, program fit, fees, age eligibility, and accommodations directly with each provider. Young Audiences of Houston, LNESC, and some other organizations may deliver services at schools or partner sites rather than at the listed office; their notes preserve that distinction. YMCA is intentionally routed as `regulated_review`: its official page says its early-care programs are licensed, while Texas HHS describes the state regulatory system; a specific facility’s current license/inspection result still requires review in Texas Search Child Care.[26] [28]

## Within-category deduplication checks

A manual name and address check was applied within each category after normalizing punctuation, common street abbreviations, and casing. No duplicate organization names or duplicate offering records remain within a category. `Alief Community Center` and `H-Town Soccer Academy Legacy Program — Alief Park Fields` share the source-supported 11903 Bellaire Boulevard address but were retained deliberately because they are separate municipal offerings in different categories: one is a facility/resource record and the other is an age-specific soccer program. The generic HPARD multi-site A.E.P. was held instead of duplicating individual location records. The Katy secondary site shown on Workshop Houston’s official page was excluded because it is outside the requested Houston-only city scope.

## Research-only change-control statement

**No production database/API write, pin, geocode, deployment, authentication change, user change, session change, payment change, or waitlist change was performed.** The work consisted solely of public-web research and creation of the three local research artifacts named below.

## Artifact paths

- Candidates: `/home/ubuntu/directory-research-wave-2026-09-19/houston-family-profile/candidates-family-childcare.jsonl`
- Held leads: `/home/ubuntu/directory-research-wave-2026-09-19/houston-family-profile/held-family-childcare.jsonl`
- Report: `/home/ubuntu/directory-research-wave-2026-09-19/houston-family-profile/report-family-childcare.md`

## References

[1]: https://houmuse.org/institution/childrens-museum-houston/ "Houston Museum District: Children’s Museum Houston"
[2]: https://houmuse.org/institution/the-health-museum/ "Houston Museum District: The Health Museum"
[3]: https://houmuse.org/institution/holocaust-museum-houston/ "Houston Museum District: Holocaust Museum Houston"
[4]: https://houmuse.org/institution/houston-zoo/ "Houston Museum District: Houston Zoo"
[5]: https://www.cmhouston.org/ "Children’s Museum Houston official website"
[6]: https://thehealthmuseum.org/programs/ "The Health Museum programs"
[7]: https://hmh.org/visit/ "Holocaust Museum Houston visit information"
[8]: https://www.houstonzoo.org/plan-your-visit/ "Houston Zoo plan your visit"
[9]: https://www.houstonzoo.org/make-memories/kids-families/ "Houston Zoo kids and families programs"
[10]: https://hbg.org/learn/ "Houston Botanic Garden education and programs"
[11]: https://shape.org/asep "SHAPE Community Center After School Enrichment Program"
[12]: https://downtownhouston.org/go/discovery-green "Downtown Houston: Discovery Green"
[13]: https://www.discoverygreen.com/visit/ "Discovery Green plan your visit"
[14]: https://www.houstontx.gov/parks/youthsports-recreation.html "City of Houston Parks and Recreation youth sports and recreation"
[15]: https://www.haul.org/youth-and-family/ "Houston Area Urban League education and youth development"
[16]: https://www.lnesc.org/centers/houston/ "LNESC Houston center"
[17]: https://www.mfah.org/learn/glassell-school-art "Glassell School of Art"
[18]: https://www.houstontx.gov/parks/communitycenters/southwest.html "City of Houston southwest community centers"
[19]: https://www.houstontx.gov/parks/communitycenters/northwest.html "City of Houston northwest community centers"
[20]: https://www.houstontx.gov/education/youthprograms/supportprograms.html "City of Houston youth support programs"
[21]: https://www.houstontx.gov/education/youthprograms/afterschool.html "City of Houston youth after-school resources"
[22]: https://workshophouston.com/ "Workshop Houston official website"
[23]: https://www.yahouston.org/after-school-programs "Young Audiences of Houston after-school programs"
[24]: https://www.meca-houston.org/ "MECA official website"
[25]: https://unitedwayhouston.org/what-we-do/youth-success/out2learn/ "United Way of Greater Houston: Out 2 Learn"
[26]: https://ymcahouston.org/programs/childcare-and-camps/early-care "YMCA of Greater Houston early care"
[27]: https://houstonlibrary.org/kids "Houston Public Library kids services"
[28]: https://www.hhs.texas.gov/providers/child-care-regulation "Texas HHS Child Care Regulation"
[29]: https://buffalosoldiersmuseum.org/ "Buffalo Soldiers National Museum official website"
