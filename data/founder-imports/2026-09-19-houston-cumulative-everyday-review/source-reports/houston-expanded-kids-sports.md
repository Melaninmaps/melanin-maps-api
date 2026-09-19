# Houston Kids, Sports & Family Activities — Research Report

**Research-only deliverable.** This wave identifies discovery candidates for Mapping with Melanin in Houston and clearly Houston-metro locations. It makes **no production database or API write, publication, map pin, geocode, deployment, native build, authentication, user, session, waitlist, or payment change**. It does not assess eligibility, current availability, quality, safety, price, language, licensure, or accessibility beyond literal source text preserved in the JSONL notes.

## Result

This category yields **27 candidate records** and **8 held records**. Every candidate has an opened official customer-facing destination and a source-supported numbered address. The records span municipal youth sports, YMCA and nonprofit resources, private swim/martial arts/dance locations, soccer leagues, outdoor play, adaptive activity, museums, and library resources. The candidate file contains 14 `community_resource`, 7 `physical_business`, and 6 `cultural_place` records.

| Coverage area | Candidate rows | Examples of source-supported discovery terms |
|---|---:|---|
| Youth sports and leagues | 1, 2, 3, 4, 5, 6, 12, 13 | basketball; soccer; baseball; golf; youth sports |
| Swimming and aquatics | 3, 4, 5, 7, 8 | swim lessons; aquatics; indoor pool; swimming pool |
| Dance and martial arts | 9, 10, 11, 15 | children’s dance; ballet; martial arts; youth arts |
| Outdoor play and adaptive recreation | 19, 20, 21, 22, 23, 27 | nature play; playground; adaptive sports; family park |
| Cultural and learning activities | 16, 17, 18, 24, 25, 26 | children’s museum; wildlife; science; library; performing arts |

The records intentionally preserve only explicit ownership or organizational designations. **Nonprofit** appears only where an opened official source states it (YMCA of Greater Houston, Young Audiences of Houston, Children’s Museum Houston, Houston Arboretum & Nature Center, Discovery Green Conservancy, and GFI Academy in held). **Municipal** appears only for City of Houston services. No racial, ethnic, language, diaspora, ownership, or other demographic identity was inferred from a name, neighborhood, imagery, or source type.

## File contract and source handling

`candidates-kids-sports.jsonl` has exactly 23 fields in the requested order. `sourceRow` is consecutive from 1 through 27. `held-kids-sports.jsonl` uses the same schema and holds incomplete or conflicting leads instead of forcing them into the candidate set. Fields without literal source support use JSON `null`.

Candidate URLs are direct official destinations, while `sourceUrl` identifies the opened official page used to substantiate each record. A candidate may cite a City, nonprofit, or official company page directly; no search-result snippet is used as record evidence. Third-party search pages were used only to find potential official sources, and none is represented as a source URL in the candidate or held output.

## Within-category deduplication

A validation script checked the finalized candidate set for duplicate normalized `(name, address)` pairs, consecutive source rows, exact field order, required candidate addresses, HTTPS source URLs, and semicolon-separated service search terms. The result is **27 unique name/address pairs**. The following close calls were retained as distinct only because the official destinations support distinct physical places or delivery points:

- **Houston Parks and Recreation Department — Youth Sports & Recreation** is the municipal department record, while **H-Town Soccer Academy — Alief Park** is a specific soccer delivery location.
- **Brenda and John Duncan YMCA**, **Houston Texans YMCA**, and **J.E. & L.E. Mabee Adaptive Sports Complex** are separate locations with distinct addresses and offerings.
- **Houston Arboretum**, **Levy Park**, **Discovery Green**, **Barbara Fish Daniel Nature Play Area**, and **Hermann Park** are different physical outdoor destinations rather than repeated references to one park system.
- **Houston Zoo**, **Children’s Museum Houston**, **The Health Museum**, **Miller Outdoor Theatre**, **Houston Public Library**, and **Space Center Houston** are distinct cultural or learning places.

## Held leads and limitations

The held file contains eight records so uncertain leads remain available without weakening candidate quality. City of Houston Adaptive Sports and Recreation has a source-internal West Gray address conflict. Frame Dance, GFI Academy, and Soccer Shots Houston have opened official program pages but no numbered physical address on those pages. Houston Dynamo/Dash program pages describe multi-site offerings but do not name a single numbered delivery location. The Houston Rockets Skills Camp page currently names Alvin and Stafford sites rather than a stable Houston candidate. The City pool-system page is held as a broad system lead because it lists many sites and states that it currently has no swim-lessons provider.

Program schedules, registration status, age bands, sites, fees, and physical access can change. Users should follow the official destination for current details. This research does not claim that any offering is open, available, inclusive, affordable, regulated, licensed, safe, or suitable for a particular child beyond the literal source-supported terms in the output.

## Opened source log

The following official and primary-destination URLs were opened during this wave. Two attempted pages are retained in the log to make extraction limitations visible; they were not relied upon for factual candidate fields.

| # | Opened source | Use in this wave |
|---:|---|---|
| 1 | [City of Houston — Youth Sports & Recreation](https://www.houstontx.gov/parks/youthsports-recreation.html) | Candidates 1–2 |
| 2 | [City of Houston — Adaptive Sports and Recreation](https://www.houstontx.gov/parks/adaptivesports-recreation.html) | Held 1; source contains conflicting 1485/1475 West Gray addresses |
| 3 | [YMCA of Greater Houston — Locations](https://ymcahouston.org/) | Opened for location discovery |
| 4 | [Houston Public Library — Youth](https://houstonlibrary.org/youth) | Opened; extraction failed; not relied upon |
| 5 | [Houston Zoo — Plan Your Visit](https://www.houstonzoo.org/plan-your-visit/) | Candidate 16 |
| 6 | [Children’s Museum Houston — /visit](https://www.cmhouston.org/visit) | Opened redirect; not relied upon |
| 7 | [Houston Arboretum & Nature Center](https://houstonarboretum.org/) | Candidate 19 |
| 8 | [Discovery Green — Visit](https://www.discoverygreen.com/visit/) | Candidate 20 |
| 9 | [Children’s Museum Houston — Directions and Parking](https://www.cmhouston.org/visiting/directions-and-parking) | Candidate 17 |
| 10 | [Houston Public Library — Kids](https://houstonlibrary.org/kids) | Candidate 25 |
| 11 | [Space Center Houston — Contact](https://spacecenter.org/contact/) | Candidate 26 |
| 12 | [Levy Park — Visit](https://www.levyparkhouston.org/visit/) | Candidate 21 |
| 13 | [Buffalo Bayou Partnership — Buffalo Bayou Park](https://buffalobayou.org/location/buffalo-bayou-park/) | Candidate 22 |
| 14 | [Hermann Park Conservancy — Hours & Directions](https://hermannpark.org/hours/) | Candidate 23 |
| 15 | [City of Houston — Youth Sports (legacy URL)](https://www.houstontx.gov/parks/youthsports.html) | Opened comparison source; current page preferred |
| 16 | [YMCA of Greater Houston — Youth Sports](https://ymcahouston.org/programs/sports) | Supports YMCA youth-sports terms |
| 17 | [Tiger-Rock Martial Arts — Houston](https://www.tigerrockmartialarts.com/locations/houston) | Candidate 9 |
| 18 | [Young Audiences of Houston](https://www.yahouston.org/) | Candidate 15 |
| 19 | [Houston Met Dance](https://www.metdance.org/) | Candidate 10 |
| 20 | [Houston Ballet — Academy](https://www.houstonballet.org/about/academy/) | Supports candidate 11 |
| 21 | [Emler Swim School — Meyerland](https://emlerswimschool.com/locations/texas/houston-meyerland/) | Candidate 7 |
| 22 | [Houston Swim Club](https://www.houstonswimclub.com/) | Supports candidate 8 age terms |
| 23 | [City of Houston — Swimming Pools](https://www.houstontx.gov/parks/swimming.html) | Held 8 |
| 24 | [City of Houston — N. Wayside Sports & Recreation Center](https://www.houstontx.gov/parks/northwayside.html) | Candidate 3 |
| 25 | [Community Family Centers](https://www.communityfamilycenters.org/) | Candidate 14 |
| 26 | [Frame Dance — Young Dancer Program](https://www.framedance.org/young-dancer-program/) | Held 2 |
| 27 | [Houston Rockets Youth Skills Camp](https://www.nba.com/rockets/junior-rockets/skills-development-camp) | Held 7 |
| 28 | [i9 Sports — Houston Youth Sports Leagues](https://www.i9sports.com/houston-youth-sports-leagues) | Discovery/supporting source |
| 29 | [City of Houston — Houston Public Library venue page](https://www.houstontx.gov/events/library.html) | Candidate 25 address/municipal support |
| 30 | [Houston Swim Club — Sharpstown](https://www.houstonswimclub.com/sharpstown) | Candidate 8 |
| 31 | [i9 Sports — Southwest Houston/Stafford League Office 552](https://www.i9sports.com/franchises/southwest-houston-stafford-tx/552) | Supports candidate 12 |
| 32 | [First Tee — Greater Houston](https://firstteegreaterhouston.org/) | Candidate 13 |
| 33 | [YMCA of Greater Houston — Houston Texans YMCA](https://ymcahouston.org/locations/houston-texans-ymca) | Candidate 5 |
| 34 | [YMCA of Greater Houston — Brenda and John Duncan YMCA](https://ymcahouston.org/locations/brenda-and-john-duncan-ymca) | Candidate 4 |
| 35 | [YMCA of Greater Houston — About](https://ymcahouston.org/mission) | Nonprofit designation for candidates 4–6 |
| 36 | [Houston Zoo — About](https://www.houstonzoo.org/about/) | Opened corroboration for candidate 16 |
| 37 | [i9 Sports — The Gardens](https://www.i9sports.com/venues/southwest-houston-the-gardens-youth-sports-programs/11611) | Candidate 12 |
| 38 | [Discovery Green — About](https://www.discoverygreen.com/about/) | Nonprofit designation for candidate 20 |
| 39 | [Houston Ballet — Academy Programs](https://www.houstonballet.org/about/academy/academy-programs/) | Candidate 11 |
| 40 | [Houston Ballet — Contact Us](https://www.houstonballet.org/about/contact-us/) | Candidate 11 address/phone |
| 41 | [We Rock the Spectrum — Bellaire](https://werockthespectrumbellaire.com/) | Candidate 27 |
| 42 | [The Health Museum — Visit](https://thehealthmuseum.org/visit/) | Candidate 18 |
| 43 | [Miller Outdoor Theatre — Location](https://www.milleroutdoortheatre.com/location/) | Candidate 24 |
| 44 | [GFI Academy — Central Houston](https://gfiacademy.com/pages/spring-branch) | Held 3 |
| 45 | [Soccer Shots Houston](https://www.soccershots.com/houston/) | Held 4 |
| 46 | [YMCA of Greater Houston — Adaptive Programs](https://ymcahouston.org/programs/community/adaptive-programs) | Candidate 6 |
| 47 | [Houston Dynamo FC — Youth Development](https://www.houstondynamofc.com/charities/youthdevelopment) | Held 6 |
| 48 | [Houston Dynamo FC — Youth Programs](https://www.houstondynamofc.com/youthprograms/) | Held 5 |

## References

[1]: https://www.houstontx.gov/parks/youthsports-recreation.html "City of Houston — Youth Sports & Recreation"
[2]: https://www.houstontx.gov/parks/adaptivesports-recreation.html "City of Houston — Adaptive Sports and Recreation"
[3]: https://ymcahouston.org/ "YMCA of Greater Houston — Locations"
[4]: https://houstonlibrary.org/youth "Houston Public Library — Youth"
[5]: https://www.houstonzoo.org/plan-your-visit/ "Houston Zoo — Plan Your Visit"
[6]: https://www.cmhouston.org/visit "Children’s Museum Houston — /visit"
[7]: https://houstonarboretum.org/ "Houston Arboretum & Nature Center"
[8]: https://www.discoverygreen.com/visit/ "Discovery Green — Visit"
[9]: https://www.cmhouston.org/visiting/directions-and-parking "Children’s Museum Houston — Directions and Parking"
[10]: https://houstonlibrary.org/kids "Houston Public Library — Kids"
[11]: https://spacecenter.org/contact/ "Space Center Houston — Contact"
[12]: https://www.levyparkhouston.org/visit/ "Levy Park — Visit"
[13]: https://buffalobayou.org/location/buffalo-bayou-park/ "Buffalo Bayou Partnership — Buffalo Bayou Park"
[14]: https://hermannpark.org/hours/ "Hermann Park Conservancy — Hours & Directions"
[15]: https://www.houstontx.gov/parks/youthsports.html "City of Houston — Youth Sports (legacy URL)"
[16]: https://ymcahouston.org/programs/sports "YMCA of Greater Houston — Youth Sports"
[17]: https://www.tigerrockmartialarts.com/locations/houston "Tiger-Rock Martial Arts — Houston"
[18]: https://www.yahouston.org/ "Young Audiences of Houston"
[19]: https://www.metdance.org/ "Houston Met Dance"
[20]: https://www.houstonballet.org/about/academy/ "Houston Ballet — Academy"
[21]: https://emlerswimschool.com/locations/texas/houston-meyerland/ "Emler Swim School — Meyerland"
[22]: https://www.houstonswimclub.com/ "Houston Swim Club"
[23]: https://www.houstontx.gov/parks/swimming.html "City of Houston — Swimming Pools"
[24]: https://www.houstontx.gov/parks/northwayside.html "City of Houston — N. Wayside Sports & Recreation Center"
[25]: https://www.communityfamilycenters.org/ "Community Family Centers"
[26]: https://www.framedance.org/young-dancer-program/ "Frame Dance — Young Dancer Program"
[27]: https://www.nba.com/rockets/junior-rockets/skills-development-camp "Houston Rockets Youth Skills Camp"
[28]: https://www.i9sports.com/houston-youth-sports-leagues "i9 Sports — Houston Youth Sports Leagues"
[29]: https://www.houstontx.gov/events/library.html "City of Houston — Houston Public Library venue page"
[30]: https://www.houstonswimclub.com/sharpstown "Houston Swim Club — Sharpstown"
[31]: https://www.i9sports.com/franchises/southwest-houston-stafford-tx/552 "i9 Sports — Southwest Houston/Stafford League Office 552"
[32]: https://firstteegreaterhouston.org/ "First Tee — Greater Houston"
[33]: https://ymcahouston.org/locations/houston-texans-ymca "YMCA of Greater Houston — Houston Texans YMCA"
[34]: https://ymcahouston.org/locations/brenda-and-john-duncan-ymca "YMCA of Greater Houston — Brenda and John Duncan YMCA"
[35]: https://ymcahouston.org/mission "YMCA of Greater Houston — About"
[36]: https://www.houstonzoo.org/about/ "Houston Zoo — About"
[37]: https://www.i9sports.com/venues/southwest-houston-the-gardens-youth-sports-programs/11611 "i9 Sports — The Gardens"
[38]: https://www.discoverygreen.com/about/ "Discovery Green — About"
[39]: https://www.houstonballet.org/about/academy/academy-programs/ "Houston Ballet — Academy Programs"
[40]: https://www.houstonballet.org/about/contact-us/ "Houston Ballet — Contact Us"
[41]: https://werockthespectrumbellaire.com/ "We Rock the Spectrum — Bellaire"
[42]: https://thehealthmuseum.org/visit/ "The Health Museum — Visit"
[43]: https://www.milleroutdoortheatre.com/location/ "Miller Outdoor Theatre — Location"
[44]: https://gfiacademy.com/pages/spring-branch "GFI Academy — Central Houston"
[45]: https://www.soccershots.com/houston/ "Soccer Shots Houston"
[46]: https://ymcahouston.org/programs/community/adaptive-programs "YMCA of Greater Houston — Adaptive Programs"
[47]: https://www.houstondynamofc.com/charities/youthdevelopment "Houston Dynamo FC — Youth Development"
[48]: https://www.houstondynamofc.com/youthprograms/ "Houston Dynamo FC — Youth Programs"
