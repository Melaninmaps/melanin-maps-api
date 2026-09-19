# Houston Museums, Public Art, Galleries, Heritage, and Learning Directory Research

**Result.** This research-only package identifies **38 verified Houston candidates** and **6 held leads** for Mapping with Melanin’s museums, public art, galleries, heritage sites, cultural centers, maker spaces, and age-appropriate art or learning activity category. Candidates are public-facing physical destinations with a source-supported numbered Houston address and an opened official destination, public-service, or official-institution page. The source mix prioritizes official nonprofit, municipal, library, university, cultural, and Museum District pages. A cultural designation is supplied only where the opened source explicitly states it; it is not an inferred ownership or demographic claim.

The candidate file intentionally includes a mix of large museums, neighborhood art sites, public and university culture, municipal makerspace services, and community organizations. It includes only records where the current source was sufficient to identify a distinct Houston destination. Time-sensitive programming, schedules, admission, age terms, transportation, accessibility, and availability should be checked with the listed destination before use.

## Files and counts

| File | Count | Purpose |
|---|---:|---|
| `candidates-museums-public-art.jsonl` | 38 | Address-supported Houston candidates with an opened official public, customer-facing, or institutional destination source. |
| `held-museums-public-art.jsonl` | 6 | Leads excluded for suspended or unverifiable official destinations, relocation uncertainty, an explicit closure, or stale/conflicting operating status. |

## Candidate coverage

The largest concentration is a **museum, gallery, and art-center discovery set**. It includes Contemporary Arts Museum Houston, The Menil Collection, Houston Center for Photography, Lawndale Art Center, Houston Center for Contemporary Craft, the Museum of Fine Arts, Houston, Holocaust Museum Houston, Czech Center Museum Houston, The Jung Center, Moody Center for the Arts, Rothko Chapel, Blaffer Art Museum, Houston Museum of African American Culture, Asia Society Texas Center, The Health Museum, Houston Museum of Natural Science, and DiverseWorks. The official pages substantiate their separate visitor destinations and distinct public functions, such as collections, exhibitions, galleries, tours, programs, or public art. [1] [2] [3] [4] [5] [7] [8] [9] [10] [11] [12] [13] [14] [21] [24] [26] [32] [33]

A separate **making and age-appropriate learning group** consists of TXRX Labs, the Children’s Museum Houston Chevron Maker Annex, Glassell School of Art, Houston Public Library TECHLink Dixon, Art League Houston, and MECA. Their official materials identify makerspace equipment, workshops, children’s and teen art education, adult classes, or youth-and-family arts work. The Maker Annex is included with an explicit availability caveat because its current exhibit navigation marks it temporarily closed. [6] [7] [18] [19] [25] [27]

The **public art, outdoor culture, and heritage group** contains Beer Can House, Smither Park, Sawyer Yards, The Heritage Society, Miller Outdoor Theatre, Discovery Green, Emancipation Park, Project Row Houses, and Memoria/Memory. These are not duplicates of the museums: each represents a distinct visit type, including an outdoor mosaic park, folk-art house, creative campus, historic-house complex, outdoor performance venue, downtown public-art park, historic municipal park, community art site, or time-bounded public mural. [15] [16] [17] [20] [21] [34] [35] [22] [31]

The set also preserves source-attributed cultural context without making unsupported identity claims. Official materials directly support African American or African diaspora cultural missions for HMAAC, Project Row Houses, Community Artists’ Collective, the Gregory School center, S.H.A.P.E., and The Ensemble Theatre; Hispanic cultural purpose for the Institute of Hispanic Culture of Houston; American Latino arts development for held ALMAAHH; Asian arts and culture for Asia Society Texas; and an East-West cultural bridge for Chinese Community Center. The record-level `ownershipDesignations` and `ownershipEvidence` fields use this limited, literal evidence rather than assumptions from a venue’s name, neighborhood, or imagery. [21] [22] [23] [28] [29] [30] [36] [37] [38] [39]

## Within-category dedupe checks

A deterministic validation pass confirmed that all JSONL records have exactly the requested 23 fields in the requested order, consecutive `sourceRow` values, permitted `targetKind` values, Houston/Texas/US scope values, and no duplicate normalized **name-and-address** pairs. Manual function and operator checks were also applied to overlapping destinations.

| Potential overlap | Check performed | Outcome |
|---|---|---|
| Museum District art institutions | Compared official name, address, and visitor role for CAMH, MFAH, Glassell School, HCCC, Lawndale, HCP, Menil, Rothko, Czech Center, Holocaust Museum, Asia Society, and HMAAC. | No duplicate records. Glassell is retained separately because its official page identifies a distinct art-school destination and age-specific instructional programs rather than merely a museum gallery. |
| African American heritage and community culture | Compared HMAAC, Project Row Houses, Community Artists’ Collective, Gregory School, S.H.A.P.E., and The Ensemble Theatre by address and source-described function. | No duplicates. They respectively serve museum, art-site/community-gallery, gallery, municipal research center, community center, and theatre roles. |
| Orange Show properties | Compared Beer Can House, Smither Park, and Orange Show Monument using the Orange Show’s official visitor page. | Beer Can House and Smither Park are distinct active visitor sites and appear as candidates. Orange Show Monument is held because the same official source says it is currently closed for restoration. |
| Children’s making options | Compared Children’s Museum Maker Annex, Glassell, TECHLink Dixon, TXRX Labs, Art League Houston, and MECA using official program language and physical sites. | No duplicates. The records distinguish a children’s museum exhibit, art school, municipal makerspace, nonprofit makerspace, gallery/school, and multicultural youth/family arts organization. |
| Public-art parks and outdoor culture | Compared Discovery Green, Emancipation Park, Smither Park, Miller Outdoor Theatre, Sawyer Yards, Project Row Houses, and the CAMH-listed mural. | No duplicate operator/address pair. The mural is a distinct, explicitly time-bounded installation, while the others are parks, venue, campus, or multi-site cultural destination. |
| Historic facilities with changed status | Compared Talento Bilingüe de Houston with MECA, and The Printing Museum with its official relocation notice. | Both are held. MECA’s official history says TBH is no longer active and MECA operates the facility; the Printing Museum’s official page documents closure of its prior facility before a Midtown move without a verified current visitor address. [27] [40] |

## Opened sources and URLs

All pages below were opened and read. Search-result snippets were used only to discover leads, not as final evidence.

1. Houston Museum District — Institutions index: https://houmuse.org/institutions/
2. Contemporary Arts Museum Houston — Plan Your Visit: https://camh.org/visit/
3. Contemporary Arts Museum Houston — Home: https://camh.org/
4. The Menil Collection — Plan Your Visit: https://www.menil.org/visit
5. The Menil Collection — Contact: https://www.menil.org/contact
6. Houston Center for Photography — Visit Us: https://www.hcponline.org/visit
7. Lawndale Art Center — Visit: https://lawndaleartcenter.org/visit
8. Houston Center for Contemporary Craft — Visit: https://crafthouston.org/visit/
9. Houston Center for Contemporary Craft — Contact: https://crafthouston.org/contact/
10. TXRX Labs — Home: https://www.txrxlabs.org/
11. Children’s Museum Houston — Maker Annex: https://www.cmhouston.org/exhibits/maker-annex
12. Museum of Fine Arts, Houston — Plan Your Visit: https://www.mfah.org/visit
13. Museum of Fine Arts, Houston — Glassell School of Art: https://www.mfah.org/learn/glassell-school-art
14. Houston Museum District — Museum of Fine Arts, Houston: https://houmuse.org/institution/the-museum-of-fine-arts-houston/
15. Holocaust Museum Houston — Visit: https://hmh.org/visit/
16. Czech Center Museum Houston — Visit: https://czechcenter.org/visit/
17. The Jung Center — Home: https://www.junghouston.org/
18. Moody Center for the Arts — Visit: https://moody.rice.edu/visit
19. Rothko Chapel — Visit: https://rothkochapel.org/visit
20. Blaffer Art Museum — Home: https://blafferartmuseum.org/
21. Orange Show Center for Visionary Art — Visit: https://www.orangeshow.org/visit
22. Art League Houston — Home: https://www.artleaguehouston.org/
23. Sawyer Yards — Home: https://www.sawyeryards.com/
24. Houston Public Library — TECHLink: https://houstonlibrary.org/techlink
25. Houston Public Library — All Locations: https://houstonlibrary.org/all-locations
26. The Heritage Society — Visitors’ Information: https://www.heritagesociety.org/visitors-information
27. Miller Outdoor Theatre — Location: https://www.milleroutdoortheatre.com/location/
28. Miller Outdoor Theatre — Performances: https://www.milleroutdoortheatre.com/performances/
29. Houston Museum of African American Culture — Home: https://hmaac.org/
30. Project Row Houses — Visit: https://projectrowhouses.org/visit/
31. Community Artists’ Collective — Home: https://www.thecollective.org/
32. Houston Public Library — African American History Research Center at the Gregory School: https://houstonlibrary.org/aahrc
33. Asia Society Texas — Plan Your Visit: https://asiasociety.org/texas/plan-your-visit
34. MECA — Home: https://www.meca-houston.org/
35. MECA — History: https://www.meca-houston.org/meca-history.html
36. Institute of Hispanic Culture of Houston — Home: https://ihch.org/
37. Chinese Community Center — Home: https://ccchouston.org/
38. The Health Museum — Visit: https://thehealthmuseum.org/visit/
39. Houston Museum of Natural Science — Visit: https://www.hmns.org/visit/
40. Discovery Green — Home: https://www.discoverygreen.com/
41. Emancipation Park Conservancy — Contact: https://epconservancy.org/contact/
42. Emancipation Park Conservancy — Recreation Center: https://epconservancy.org/recreation-center/
43. S.H.A.P.E. Community Center — Home: https://shape.org/
44. The Ensemble Theatre — Home: https://www.ensemblehouston.com/
45. Contemporary Arts Museum Houston — Memoria/Memory: https://camh.org/event/around-houston-memoria-memory-east-end-mural/
46. DiverseWorks — Home: https://www.diverseworks.org/
47. Houston Arts Alliance — Public Art: https://www.houstonartsalliance.com/public-art
48. City of Houston Civic Art Collection map: https://houcityart.org/map
49. ALMAAHH — Home: https://www.almaahh.org/
50. Buffalo Soldiers National Museum — Official home: https://buffalosoldiermuseum.com/
51. Art Car Museum — Official home: https://www.artcarmuseum.com/
52. The Printing Museum — Home: https://printingmuseum.org/

## Held-record rationale and limitations

**Buffalo Soldiers National Museum** was held because both opened official URLs returned an account-suspended page, preventing verification of a current visitor destination. **ALMAAHH** was held because its official site documents an organization building a permanent arts-and-culture district and running activations before permanent doors open, but does not identify an eligible current numbered visitor destination. **Orange Show Monument** was held because the official visitor page explicitly says it is closed for ongoing preservation and restoration. **Art Car Museum** was held because current official customer-facing destination information was not verified. **The Printing Museum** was held because its opened official page describes closure of the prior West Clay facility for a Midtown move but does not give a current public numbered visitor address. **Talento Bilingüe de Houston** was held because MECA’s official history says TBH is no longer active and that MECA operates the site. [27] [40] [41] [42] [49] [50] [51] [52]

This package does **not** infer ownership, demographic identity, language, price, hours, accessibility, availability, quality, licensure, services, or safety from a name, location, imagery, or source category. Any designation in the candidate data is narrowly based on explicit text in the opened source. The research did not add coordinates. Some official pages are dynamic and may change; in particular, public installations, maker-space workshops, youth programming, gallery exhibits, and museum hours are subject to change. The `notes` fields flag known risks, including the Maker Annex’s temporarily-closed label, Project Row Houses’ restricted private areas, S.H.A.P.E.’s restoration campaign, the HMNS hall-closure notice, and Memoria/Memory’s listed end date.

## Research-only operational statement

**This work is research only. No production database/API write, publication, map pin, geocode, deployment, native build, authentication, user, session, waitlist, or payment change occurred.**

## References

[1]: https://camh.org/visit/ "Contemporary Arts Museum Houston — Plan Your Visit"
[2]: https://www.menil.org/visit "The Menil Collection — Plan Your Visit"
[3]: https://www.hcponline.org/visit "Houston Center for Photography — Visit Us"
[4]: https://lawndaleartcenter.org/visit "Lawndale Art Center — Visit"
[5]: https://crafthouston.org/visit/ "Houston Center for Contemporary Craft — Visit"
[6]: https://www.txrxlabs.org/ "TXRX Labs — Houston's Non-Profit Makerspace"
[7]: https://www.cmhouston.org/exhibits/maker-annex "Children's Museum Houston — Maker Annex"
[8]: https://www.mfah.org/learn/glassell-school-art "Museum of Fine Arts, Houston — Glassell School of Art"
[9]: https://houmuse.org/institution/the-museum-of-fine-arts-houston/ "Houston Museum District — The Museum of Fine Arts, Houston"
[10]: https://hmh.org/visit/ "Holocaust Museum Houston — Visit"
[11]: https://czechcenter.org/visit/ "Czech Center Museum Houston — Visit"
[12]: https://www.junghouston.org/ "The Jung Center — Home"
[13]: https://moody.rice.edu/visit "Moody Center for the Arts — Visit"
[14]: https://rothkochapel.org/visit "Rothko Chapel — Visit"
[15]: https://blafferartmuseum.org/ "Blaffer Art Museum — Home"
[16]: https://www.orangeshow.org/visit "Orange Show Center for Visionary Art — Visit"
[17]: https://www.artleaguehouston.org/ "Art League Houston — Home"
[18]: https://www.sawyeryards.com/ "Sawyer Yards — Home"
[19]: https://houstonlibrary.org/all-locations "Houston Public Library — All Locations"
[20]: https://www.heritagesociety.org/visitors-information "The Heritage Society — Visitors’ Information"
[21]: https://hmaac.org/ "Houston Museum of African American Culture — Home"
[22]: https://projectrowhouses.org/visit/ "Project Row Houses — Visit"
[23]: https://www.thecollective.org/ "Community Artists’ Collective — Home"
[24]: https://houstonlibrary.org/aahrc "Houston Public Library — African American History Research Center at the Gregory School"
[25]: https://www.meca-houston.org/meca-history.html "MECA — History"
[26]: https://ihch.org/ "Institute of Hispanic Culture of Houston — Home"
[27]: https://ccchouston.org/ "Chinese Community Center — Home"
[28]: https://thehealthmuseum.org/visit/ "The Health Museum — Visit"
[29]: https://www.hmns.org/visit/ "Houston Museum of Natural Science — Visit"
[30]: https://www.discoverygreen.com/ "Discovery Green — Home"
[31]: https://camh.org/event/around-houston-memoria-memory-east-end-mural/ "Contemporary Arts Museum Houston — Memoria/Memory"
[32]: https://www.diverseworks.org/ "DiverseWorks — Home"
[33]: https://asiasociety.org/texas/plan-your-visit "Asia Society Texas — Plan Your Visit"
[34]: https://www.milleroutdoortheatre.com/location/ "Miller Outdoor Theatre — Location"
[35]: https://epconservancy.org/contact/ "Emancipation Park Conservancy — Contact"
[36]: https://shape.org/ "S.H.A.P.E. Community Center — Home"
[37]: https://www.ensemblehouston.com/ "The Ensemble Theatre — Home"
[38]: https://www.houstonartsalliance.com/public-art "Houston Arts Alliance — Public Art"
[39]: https://houstonlibrary.org/techlink "Houston Public Library — TECHLink"
[40]: https://www.meca-houston.org/meca-history.html "MECA — Talento Bilingüe facility history"
[41]: https://www.almaahh.org/ "ALMAAHH — Home"
[42]: https://buffalosoldiermuseum.com/ "Buffalo Soldiers National Museum — Official home"
[43]: https://www.artcarmuseum.com/ "Art Car Museum — Official home"
[44]: https://printingmuseum.org/ "The Printing Museum — Home"
[45]: https://www.orangeshow.org/visit "Orange Show Center for Visionary Art — Orange Show Monument status"
[46]: https://www.houstonartsalliance.com/public-art "Houston Arts Alliance — Civic Art Collection"
[47]: https://houcityart.org/map "City of Houston Civic Art Collection — Map"
[48]: https://www.milleroutdoortheatre.com/performances/ "Miller Outdoor Theatre — Performances"
[49]: https://www.almaahh.org/ "ALMAAHH — Building Houston's American Latino Arts and Culture Institution"
[50]: https://buffalosoldiermuseum.com/ "Buffalo Soldiers National Museum — Suspended Official Site"
[51]: https://www.artcarmuseum.com/ "Art Car Museum — Official Site"
[52]: https://printingmuseum.org/ "The Printing Museum — Official Site"
