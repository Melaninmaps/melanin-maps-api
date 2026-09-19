# Houston Nursing, Professional-Life, and Everyday Self-Care Directory Research

**Prepared by Manus AI · September 19, 2026**

## Result

This research wave produced **18 candidate records** and **9 held records** for Houston. The selected records concentrate on nursing associations and continuing education, nursing-workforce support, health-professional community resources, scrub retailers, and practical self-care destinations. The set includes two explicitly Black/Hispanic nursing-association leads only where their organizational designation is stated by an opened official chapter or national-association source. It does not infer ownership, demographic identity, language, costs, current availability, accessibility, safety, licensure, or service quality.

| Output | Count | File |
|---|---:|---|
| Candidate records | 18 | `candidates-nursing-life.jsonl` |
| Held records | 9 | `held-nursing-life.jsonl` |
| Total distinct leads reviewed | 27 | Both JSONL files |

## Candidate coverage

| Category | Candidate count | Included examples |
|---|---:|---|
| Nursing associations and professional development | 2 | Black Nurses Association of Greater Houston; Association for Nursing Professional Development–Houston Affiliate |
| Continuing education and workforce support | 4 | Houston Nursing Education Foundation; Cizik CPD; Houston Methodist CNE; Wesley Community Center |
| Health-professional and public-support resources | 5 | The TMC Library; Houston Health Department; United Way Community Resource Center; Houston Public Library; Houston Parks and Recreation Department |
| Practical self-care and cultural places | 5 | Hermann Park; Discovery Green; Rothko Chapel; The Menil Collection; Mental Health America of Greater Houston |
| Scrubs and uniform retailers | 2 | Scrubs & Beyond; Scrubs to The Rescue |

The candidate JSONL retains source-backed service search terms, direct official destinations, source URLs, and source-attributed organizational designations. Houston Health Department is deliberately assigned `regulated_review` because its official site includes clinical-service and health-center information. The remaining candidates are not presented as licensed providers.

## Source and destination verification

Every candidate has an opened official customer-facing website in its `website` field. Where a source-backed directory or public-agency page was especially useful, it appears in `sourceUrl`; the official customer-facing destination is retained separately. For example, the NBNA official chapter directory verifies the Greater Houston chapter and its mailing contact, while the local chapter’s own site is the destination. [1] [2] The National Association of Hispanic Nurses official directory similarly verifies NAHN Houston, but the lack of a supported numbered address required that lead to be held. [11] [12]

Professional-development evidence is especially strong for ANPD–Houston, Cizik School of Nursing, and Houston Methodist. ANPD–Houston identifies itself as the local organization of the Association for Nursing Professional Development and gives a Houston mailing address. [3] [39] Cizik describes nursing courses and webinars, while Houston Methodist describes regularly scheduled series, live courses, workshops, and online enduring activities. [45] [4] HNEF directly describes its scholarship role for Houston-area nursing students. [18] [31]

For daily-life support, the selected public, nonprofit, and cultural places have official visitor or service pages that supply a numbered Houston address. The TMC Library identifies itself as an independent not-for-profit library serving the Texas Medical Center. [41] The City health department supplies public-health navigation and a community-resource hub, and it is retained as `regulated_review` because of its clinical information. [8] [35] Public-facing recreation and cultural resources are represented by city parks, Hermann Park, Discovery Green, Rothko Chapel, and the Menil Collection. [24] [46] [42] [10] [49]

## Within-category deduplication checks

A manual entity-level check was applied before writing the JSONL files. The following similar records were kept because they are materially different destinations or organizations rather than duplicate records:

- **Black Nurses Association of Greater Houston** and **ANPD–Houston** are different professional associations with different missions and official destinations.
- **HNEF**, **Cizik CPD**, **Houston Methodist CNE**, and **Wesley Community Center** address distinct needs: scholarships, continuing professional development, hospital-based CNE, and career-entry/support services.
- **The TMC Library** and **Houston Public Library Central** are separate library systems with separate services and physical destinations.
- **Houston Parks and Recreation Department**, **Hermann Park**, and **Discovery Green** are distinct municipal/park resources. The first is a department resource record; the other two are specific park destinations.
- **Scrubs & Beyond** and **Scrubs to The Rescue** are separate retailers at separately verified numbered addresses.

No normalized candidate name duplicates were retained. No candidate shares the same `website` URL or the same physical address with another candidate. Related but incomplete leads were excluded from candidates instead of being used to pad a category.

## Held leads and limitations

The held file contains **nine** leads with useful but insufficient evidence for a candidate record. NAHN Houston, HANP, NBNPA, HONL, and Houston ENA have opened official association sources and direct destinations but lack a source-supported numbered Houston organization address. [11] [13] [14] [15] [16] [17] [40] Houston Botanic Garden is held because its opened official pages conflict on visitor address/ZIP details. [20] [36] Uniform Destination, Houston Uniform & Apparel, and The Uniform Superstore remain held because the opened official material did not provide a sufficiently supported numbered Houston retail address; Houston Uniform & Apparel also did not specifically establish a medical-scrub retail offering. [27] [44] [28]

Several sources state organization-level descriptions rather than a legal ownership status. Accordingly, `ownershipDesignations` is `null` unless the source literally makes a designation, such as “not-for-profit,” “501(c)(3),” “public-private partnership,” a municipal department, or a named chapter affiliation. A mailing address is labeled as such in the BNAGH notes; it is not represented as a storefront. Event venues were not repurposed as association addresses. Retail hours, inventory, price, and availability may change and were not represented as stable claims.

## Research-only boundary

This work is **research-only**. It performed **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**. It creates only the requested local JSONL research outputs and this local report.

## Opened source register

The following URLs were opened during this research pass. Items marked “candidate/held evidence” were used directly in the JSONL or to validate/hold a lead; supporting official pages were opened for address, designation, contact, or destination verification.

| Ref. | Opened URL | Use |
|---:|---|---|
| [1] | https://nbna.org/chapters/black-nurses-association-of-greater-houston/ | Candidate/held evidence |
| [2] | https://bnagh.org/ | Official destination |
| [3] | https://anpdh.nursingnetwork.com/ | Candidate evidence and destination |
| [4] | https://www.houstonmethodist.org/education/nursing/nursing-continuing-education/ | Candidate evidence and destination |
| [5] | https://locations.scrubsandbeyond.com/tx/houston/houston | Candidate evidence and destination |
| [6] | https://scrubstotherescue.com/ | Candidate evidence and destination |
| [7] | https://houstonlibrary.org/ | Supporting official service page |
| [8] | https://www.houstonhealth.org/ | Candidate evidence and destination |
| [9] | https://www.hermannpark.org/ | Supporting official destination |
| [10] | https://rothkochapel.org/ | Candidate evidence and destination |
| [11] | https://nahn.memberclicks.net/texas | Held evidence |
| [12] | https://nahnhouston.click/ | Held official destination |
| [13] | https://texasnp.org/affiliates/ | Held evidence |
| [14] | https://hanp.enpnetwork.com/ | Held official destination |
| [15] | https://nbnpa.enpnetwork.com/ | Held evidence and destination |
| [16] | https://tonl.org/group/HONL | Held evidence and destination |
| [17] | https://www.houstonena.org/ | Held official destination |
| [18] | https://hnef.org/ | Candidate evidence and destination |
| [19] | https://www.wrksolutions.com/news/no-experience-no-problem-short-term-training-programs-open-doors-to-houston-healthcare-careers | Candidate workforce evidence |
| [20] | https://hbg.org/ | Held official destination |
| [21] | https://wesleyhousehouston.org/ | Candidate official destination |
| [22] | https://unitedwayhouston.org/for-nonprofits/community-resource-center/ | Candidate evidence and destination |
| [23] | https://houstonlibrary.org/all-locations | Candidate evidence |
| [24] | https://www.houstontx.gov/parks/contact.html | Candidate evidence and destination |
| [25] | https://hermannpark.org/visit/ | Supporting official visitor page |
| [26] | https://www.houstonmethodist.org/contact-us/ | Supporting official address page |
| [27] | https://www.tanger.com/houston/stores/uniform-destination/10611 | Held evidence |
| [28] | https://theuniformsuperstore.com/ | Held evidence and destination |
| [29] | https://nursing.uth.edu/financial/scholarships-internal | Supporting nursing-workforce page |
| [30] | https://mhahouston.org/ | Candidate evidence and destination |
| [31] | https://hnef.org/contact-us/ | Supporting official address page |
| [32] | https://nursing.uth.edu/contact-us | Supporting official address page |
| [33] | https://wesleyhousehouston.org/contact/ | Supporting official address page |
| [34] | https://unitedwayhouston.org/contact/ | Supporting official address page |
| [35] | https://www.houstonhealth.org/contact-us | Supporting official address page |
| [36] | https://hbg.org/about/ | Held conflict check |
| [37] | https://rothkochapel.org/learn/about | Supporting official mission page |
| [38] | https://bnagh.org/contact-us | Supporting official contact page |
| [39] | https://anpdh.nursingnetwork.com/contact | Supporting official address page |
| [40] | https://www.houstonena.org/who-we-are | Held designation check |
| [41] | https://library.tmc.edu/about/ | Candidate evidence and destination |
| [42] | https://www.discoverygreen.com/about/ | Candidate evidence and destination |
| [43] | https://www.discoverygreen.com/directions/ | Supporting official visitor page |
| [44] | https://www.houstonuniform.com/ | Held evidence and destination |
| [45] | https://nursing.uth.edu/continuing-professional-development/ | Candidate evidence and destination |
| [46] | https://hermannpark.org/hours/ | Candidate evidence and destination |
| [47] | https://hermannpark.org/about/about-the-conservancy/ | Supporting designation page |
| [48] | https://bnagh.nursingnetwork.com/ | Supporting association page |
| [49] | https://www.menil.org/visit | Candidate evidence and destination |
| [50] | https://hermannpark.org/contact-us/ | Supporting official contact page |
| [51] | https://www.houstonuniform.com/contact.html | Opened, but page extraction returned no content |

## References

[1]: https://nbna.org/chapters/black-nurses-association-of-greater-houston/ "National Black Nurses Association chapter directory: Black Nurses Association of Greater Houston"
[2]: https://bnagh.org/ "Black Nurses Association of Greater Houston official website"
[3]: https://anpdh.nursingnetwork.com/ "Association for Nursing Professional Development–Houston Affiliate"
[4]: https://www.houstonmethodist.org/education/nursing/nursing-continuing-education/ "Houston Methodist Continuing Nursing Education"
[5]: https://locations.scrubsandbeyond.com/tx/houston/houston "Scrubs & Beyond Houston store"
[6]: https://scrubstotherescue.com/ "Scrubs to The Rescue official website"
[7]: https://houstonlibrary.org/ "Houston Public Library official website"
[8]: https://www.houstonhealth.org/ "Houston Health Department official website"
[9]: https://www.hermannpark.org/ "Hermann Park Conservancy official website"
[10]: https://rothkochapel.org/ "Rothko Chapel official website"
[11]: https://nahn.memberclicks.net/texas "National Association of Hispanic Nurses Texas chapters"
[12]: https://nahnhouston.click/ "NAHN Houston Chapter official website"
[13]: https://texasnp.org/affiliates/ "Texas Nurse Practitioners affiliates"
[14]: https://hanp.enpnetwork.com/ "Houston Area Nurse Practitioners official website"
[15]: https://nbnpa.enpnetwork.com/ "National Black Nurse Practitioner Association official website"
[16]: https://tonl.org/group/HONL "Houston Organization for Nursing Leadership chapter page"
[17]: https://www.houstonena.org/ "Houston Emergency Nurses Association official website"
[18]: https://hnef.org/ "Houston Nursing Education Foundation official website"
[19]: https://www.wrksolutions.com/news/no-experience-no-problem-short-term-training-programs-open-doors-to-houston-healthcare-careers "Workforce Solutions: Houston healthcare career training"
[20]: https://hbg.org/ "Houston Botanic Garden official website"
[21]: https://wesleyhousehouston.org/ "Wesley Community Center official website"
[22]: https://unitedwayhouston.org/for-nonprofits/community-resource-center/ "United Way of Greater Houston Community Resource Center"
[23]: https://houstonlibrary.org/all-locations "Houston Public Library locations"
[24]: https://www.houstontx.gov/parks/contact.html "Houston Parks and Recreation Department contact page"
[25]: https://hermannpark.org/visit/ "Hermann Park visitor information"
[26]: https://www.houstonmethodist.org/contact-us/ "Houston Methodist contact page"
[27]: https://www.tanger.com/houston/stores/uniform-destination/10611 "Tanger Houston Uniform Destination listing"
[28]: https://theuniformsuperstore.com/ "The Uniform Superstore official website"
[29]: https://nursing.uth.edu/financial/scholarships-internal "Cizik School of Nursing scholarships"
[30]: https://mhahouston.org/ "Mental Health America of Greater Houston official website"
[31]: https://hnef.org/contact-us/ "Houston Nursing Education Foundation contact page"
[32]: https://nursing.uth.edu/contact-us "Cizik School of Nursing contact page"
[33]: https://wesleyhousehouston.org/contact/ "Wesley Community Center contact page"
[34]: https://unitedwayhouston.org/contact/ "United Way of Greater Houston contact page"
[35]: https://www.houstonhealth.org/contact-us "Houston Health Department contact page"
[36]: https://hbg.org/about/ "Houston Botanic Garden About the Garden"
[37]: https://rothkochapel.org/learn/about "Rothko Chapel About"
[38]: https://bnagh.org/contact-us "Black Nurses Association of Greater Houston contact page"
[39]: https://anpdh.nursingnetwork.com/contact "ANPD–Houston contact page"
[40]: https://www.houstonena.org/who-we-are "Houston Emergency Nurses Association Who We Are"
[41]: https://library.tmc.edu/about/ "About The TMC Library"
[42]: https://www.discoverygreen.com/about/ "Discovery Green Conservancy About"
[43]: https://www.discoverygreen.com/directions/ "Discovery Green directions and visitor information"
[44]: https://www.houstonuniform.com/ "Houston Uniform & Apparel Company official website"
[45]: https://nursing.uth.edu/continuing-professional-development/ "Cizik School of Nursing Continuing Professional Development"
[46]: https://hermannpark.org/hours/ "Hermann Park hours and directions"
[47]: https://hermannpark.org/about/about-the-conservancy/ "Hermann Park Conservancy About"
[48]: https://bnagh.nursingnetwork.com/ "Black Nurses Association of Greater Houston Nursing Network page"
[49]: https://www.menil.org/visit "The Menil Collection visitor information"
[50]: https://hermannpark.org/contact-us/ "Hermann Park Conservancy contact page"
[51]: https://www.houstonuniform.com/contact.html "Houston Uniform & Apparel Company contact page"
