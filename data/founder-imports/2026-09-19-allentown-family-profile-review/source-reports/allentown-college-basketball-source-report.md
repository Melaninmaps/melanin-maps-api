# Allentown–Lehigh Valley College Access and Basketball Slice

**Research date:** 2026-09-19
**Scope:** Allentown, Bethlehem, Easton, and clearly Lehigh Valley-serving records only.
**Result:** **13 candidate records** and **6 held records**.

## Result and use boundary

This research slice identifies public, nonprofit, educational, and athletic resources that may be relevant to **college access, tutoring, financial-aid education, basketball, public courts, camps, leagues, athletic organizations, and youth-to-college transition** in the Allentown–Lehigh Valley area. The stated profile was used only to prioritize these resource categories. The research does **not** infer identity, health status, income, household circumstances, language, price, quality, licensing, accessibility, safety, or preferences beyond the stated context.

Every candidate uses an opened official or municipal customer-facing source. Where an official page explicitly supplied a demographic program designation, the JSONL preserves that language as a designation and its direct evidence; it does not infer demographic ownership. All candidate targets are routed as `community_resource`, consistent with their public, nonprofit, educational, or support-service character. No coordinates were collected.

## Candidate coverage

The candidate file covers one active college-readiness program, one tutoring-and-college-transition center, three financial-aid education destinations, one youth academic/career-and-sports provider, four basketball programs or athletic organizations, one municipal referral directory, and two verified basketball courts.

Community Action Lehigh Valley’s Generation Next describes college admission, trade-school visits, mentoring, SAT preparation, FAFSA assistance, networking, and scholarships for its currently stated Easton Area School District high-school population.[1] The Caring Place describes tutoring, mentoring for ages 13–18, SAT and college information, and college tours that include financial-aid information.[3] LCCC documents FAFSA help at its Allentown Donley Center, while its opened location page verifies tutoring and college-transition support.[7] [19] Penn State Lehigh Valley’s official events page lists a FAFSA Completion Workshop for prospective students and families in November 2026; the date should be rechecked before use.[6] Northampton Community College states that its Financial Aid Team helps students understand available aid and FAFSA-related next steps.[8]

For basketball and broader youth development, the Boys & Girls Club of Allentown lists academic and career-development activities alongside a youth sports league that includes basketball for ages 6–18.[24] East Side Youth Center provides a dedicated basketball registration and contact destination.[4] JCC of the Lehigh Valley lists youth league, camp, clinic, and open-gym options, with exact schedule and eligibility left for direct confirmation.[25] Team Pennsylvania’s opened Lehigh Valley page describes **girls** AAU teams in grades 4–11 at the Allentown location; the record intentionally does not extend the source to boys’ programming.[26] Lehigh Valley Steel describes a Bethlehem-based AAU nonprofit focused on athletic and academic skills for student-athletes.[14] The City’s A-YOUTH page is retained as a municipal referral directory rather than represented as a single registration program.[10] Stevens Park and Cedar Beach have official, numbered-location basketball-court records.[11] [31]

## Within-category deduplication checks

A deterministic check was run across the final JSONL. Within each file, no two records share the same normalized **category plus name**, and no two records with an address share the same normalized **category plus physical address**. The three financial-aid records name distinct institutions and locations. The basketball-program and athletic-organization records are separate providers, not repeated city directory listings. The two basketball-court records are distinct, source-verified locations. The City A-YOUTH item remains a directory/referral resource and is not duplicated as an individual member program.

## Held records and limitations

The held file deliberately separates six leads that should not be promoted without another verification pass. Moravian’s explicitly named Black and Latino Male College Readiness Program is supported by an official **2023** announcement but lacks a current program destination and numbered address.[17] SCBL’s official page describes a current Lehigh Valley youth league, but it lacks a physical address and exposes a placeholder telephone number.[15] HDYA appears in the City directory, but its own current customer-facing destination and numbered address were not opened and verified.[10] The City’s King of the Court page is an archived 2024 event, not a current registration.[13] Lehigh Men’s Basketball Camps currently shows no purchasable item despite publishing a Bethlehem address.[29] Finally, Allentown School District College and Career Services has a useful official service description, but the opened page does not publish a numbered address or phone and the separately opened contact URLs did not extract usable contact content.[27] [18] [28]

The City scope permits these Bethlehem, Easton-serving, and Center Valley records because their opened official pages explicitly identify a Lehigh Valley location or service context. This was research only; availability, age/grade eligibility, fees, schedules, registration, capacity, and access conditions may change and should be confirmed on the linked destination. A municipal facility showing a reservation status was not interpreted as a general public-access schedule.

## Opened source inventory

The following public pages were opened and read rather than being used only as search snippets. “Candidate” means the source supports a candidate record; “held” means it informed a held lead; “verification” means it verified a location or was evaluated without becoming a record.

| # | Opened source | Role/outcome |
|---:|---|---|
| 1 | [Community Action LV — Generation Next][1] | Candidate |
| 2 | [Community Action LV — Contact][2] | Address/phone verification |
| 3 | [The Caring Place — Our Programs][3] | Candidate |
| 4 | [East Side Youth Center — Basketball][4] | Candidate |
| 5 | [Allentown School District — 21st Century Learning Centers][5] | Evaluated; school-cohort service, not separately listed |
| 6 | [Penn State Lehigh Valley — Admissions Events][6] | Candidate |
| 7 | [LCCC — Apply for Financial Aid (FAFSA)][7] | Candidate |
| 8 | [Northampton Community College — Financial Aid][8] | Candidate |
| 9 | [Summer at Lehigh — Athletic Camps][9] | Evaluated with camp destination |
| 10 | [City of Allentown — Athletic Programming][10] | Candidate and HDYA held lead |
| 11 | [Allentown Parknership — Stevens Park Court][11] | Candidate |
| 12 | [City of Allentown MyRec — Facilities][12] | Court-location verification |
| 13 | [City of Allentown — King of the Court 2024][13] | Held archived lead |
| 14 | [Lehigh Valley Steel Basketball Club][14] | Candidate |
| 15 | [Select Competition Basketball League][15] | Held incomplete lead |
| 16 | [City of Allentown — Recreational Programming][16] | Evaluated; some dated/TBD programs |
| 17 | [Moravian University — 2023 college-readiness announcement][17] | Held stale lead |
| 18 | [Allentown School District — Contact Us][18] | Verification attempt; no usable extracted contact content |
| 19 | [LCCC Allentown at the Donley Center][19] | Candidate location and service verification |
| 20 | [City of Allentown Parks & Recreation — Contact][20] | Candidate municipal-office verification |
| 21 | [Lehigh Sports Camps][21] | Camp contact/address verification |
| 22 | [Lehigh University Contact][22] | Extraction failed; no record based on it |
| 23 | [Allentown School District — Home][23] | Verification context only |
| 24 | [Boys & Girls Club of Allentown — Programs][24] | Candidate |
| 25 | [JCC of the Lehigh Valley — Basketball][25] | Candidate |
| 26 | [Team Pennsylvania Hoops — Lehigh Valley][26] | Candidate |
| 27 | [Allentown School District — College and Career Services][27] | Held address-unverified lead |
| 28 | [Allentown School District — Contact][28] | Verification attempt; no usable extracted contact content |
| 29 | [Lehigh Men’s Basketball Camps][29] | Held inactive lead |
| 30 | [Team Pennsylvania Hoops — Home][30] | Evaluated; main office is outside permitted city scope |
| 31 | [City of Allentown — Cedar Beach Basketball 1][31] | Candidate |

## Research-only operational statement

This was a **research-only** activity. No production database or API write occurred. No pin, geocode, deployment, authentication change, user or session change, payment action, or waitlist change was performed.

## Files

- `candidates-college-basketball.jsonl` contains 13 source-backed candidate records.
- `held-college-basketball.jsonl` contains 6 incomplete, stale, archived, inactive, or destination-unverified leads.

## References

[1]: https://www.communityactionlv.org/generationnext "Community Action Lehigh Valley — Generation Next"
[2]: https://www.communityactionlv.org/contact "Community Action Lehigh Valley — Contact"
[3]: https://www.thecaringplace.org/our-programs.html "The Caring Place Youth Development Center — Our Programs"
[4]: https://esycallentown.com/basketball/ "East Side Youth Center — Basketball"
[5]: https://www.allentownsd.org/families-and-students/21st-century "Allentown School District — 21st Century Community Learning Centers"
[6]: https://lehighvalley.psu.edu/admission/admissions-events "Penn State Lehigh Valley — Admissions Events"
[7]: https://www.lccc.edu/paying-for-college/financial-aid/apply-for-financial-aid-fafsa/ "Lehigh Carbon Community College — Apply for Financial Aid (FAFSA)"
[8]: https://www.northampton.edu/cost-and-financial-aid/financial-aid/ "Northampton Community College — Financial Aid"
[9]: https://summer.lehigh.edu/athletic-camps "Summer at Lehigh — Athletic Camps"
[10]: https://www.allentownpa.gov/en-us/Government/Departments/Parks-Recreation/Recreation/Athletic-Programming "City of Allentown — Athletic Programming"
[11]: https://allentownparknership.org/project/stevens-park-new-full-court-basketball-court/ "Allentown Parknership — Stevens Park New Full-Court Basketball Court"
[12]: https://allentownpa.myrec.com/info/facilities/default.aspx "City of Allentown Parks & Recreation — Facilities"
[13]: https://www.allentownpa.gov/Events-Meetings/Event-Archive/Archive/king-of-the-court_10-1-24_129685 "City of Allentown — King of the Court 2024"
[14]: https://lvsteelbasketball.com/ "Lehigh Valley Steel Basketball Club — Home"
[15]: https://scblhoops.org/ "Select Competition Basketball League — Home"
[16]: https://www.allentownpa.gov/en-us/Government/Departments/Parks-Recreation/Recreation/Recreational-Programming "City of Allentown — Recreational Programming"
[17]: https://news.moravian.edu/2023/06/14/college-readiness-program/ "Moravian University — Black and Latino Male College Readiness Program announcement"
[18]: https://www.allentownsd.org/contact-us "Allentown School District — Contact Us"
[19]: https://www.lccc.edu/about/campuses/lccc-allentown/ "Lehigh Carbon Community College — LCCC Allentown at the Donley Center"
[20]: https://allentownpa.myrec.com/info/contact/default.aspx "City of Allentown Parks & Recreation — Contact"
[21]: https://lehighsportscamps.com/ "Lehigh Sports Camps"
[22]: https://www.lehigh.edu/about/contact.html "Lehigh University — Contact"
[23]: https://www.allentownsd.org/ "Allentown School District — Home"
[24]: https://www.bgcallentown.org/programs/ "Boys & Girls Club of Allentown — Programs"
[25]: https://lvjcc.org/recreation/basketball/ "JCC of the Lehigh Valley — Basketball"
[26]: https://www.teampahoops.com/program-locations/lehigh-valley/ "Team Pennsylvania Hoops — Lehigh Valley"
[27]: http://www.allentownsd.org/offices/special-projects/college-and-career-services "Allentown School District — College and Career Services"
[28]: https://www.allentownsd.org/contact "Allentown School District — Contact"
[29]: https://lehighmensbasketballcamps.totalcamps.com/ "Lehigh Men’s Basketball Camps"
[30]: https://www.teampahoops.com/ "Team Pennsylvania Hoops — Home"
[31]: https://allentownpa.myrec.com/info/facilities/area_info.aspx?FacilityID=14717&AreaID=14722 "City of Allentown Parks & Recreation — Cedar Beach Basketball 1"
