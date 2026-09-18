# Philadelphia Houses of Worship — Deep-Dive Evidence Report

**Pass:** 16 — Philadelphia-area houses of worship deepening pass 3
**Scope:** Additional public Philadelphia-area Black, Latino, diaspora, and community-serving houses of worship not already covered in the supplied prior passes. All records are classified as `cultural_place`; none are businesses or regulated services.

## Results

The candidate file contains **4 records**, all in Philadelphia, Pennsylvania: Center City Mosque; St. William's Haitian Community; Masjid Al-Falah Philadelphia; and Philadelphia Hispanic II Seventh-day Adventist Church. The set adds Muslim, Haitian/Kreyol, Indonesian diaspora, and Spanish-language worship coverage. Prior-pass overlap was checked against the existing Philadelphia/Pennsylvania and Mid-Atlantic worship candidate files; the four names below were not present there.

| Candidate | Classification | Evidence basis |
|---|---|---|
| Center City Mosque | `cultural_place` | First-party site publishes 1328 Walnut Street, phone, Friday prayer, Ramadan/Eid programming, community-service projects, and social links. |
| St. William's Haitian Community | `cultural_place` | First-party Haitian ministry page explicitly identifies the Haitian community, Kreyol Mass, prayer, retreats, and fellowship; parish contact page supplies 6200 Rising Sun Avenue and phone. |
| Masjid Al-Falah Philadelphia | `cultural_place` | Community masjid directory lists address, phone, prayer times, and linked official website; official Instagram identifies the Indonesian Community of Greater Philadelphia. Listing is unclaimed and requires recheck. |
| Philadelphia Hispanic II Seventh-day Adventist Church | `cultural_place` | Official Adventist Directory lists address, Spanish language, worship schedule, pastor, and official church website. |

## Sources consulted

1. [Center City Mosque — Special Programs](https://centercitymosque.org/events/special-programs) — first-party page describing the mosque project, Muslim worship, Ramadan/Eid and community-service programming; contact block publishes **1328 Walnut St, Philadelphia, PA 19107**, **267-817-4433**, and official Instagram/TikTok links.
2. [Church of St. William — Haitian Community](https://churchofstwilliam.com/haitian-ministry) — first-party ministry page identifying St. William's Haitian Community, Kreyol Sunday Mass, prayer, retreats, fellowship, and Haitian community website.
3. [Church of St. William — Contact Us](https://churchofstwilliam.com/contact-us) — first-party parish page publishing **6200 Rising Sun Avenue, Philadelphia, PA 19111** and **215-745-1389**, and identifying the resident Haitian chaplain.
4. [The Masjid App — Masjid Al-Falah Philadelphia](https://themasjidapp.org/en-us/masjid-al-falah-philadelphia) — community-maintained listing publishing **1603 S 17th St, Philadelphia, PA 19145**, **267-770-3254**, linked official website, and prayer-time details.
5. [Masjid Al-Falah Philadelphia official Instagram](https://www.instagram.com/alfalahphilly/) — surfaced account identifies itself as the **Masjid Al-Falah Indonesian Community of Greater Philadelphia**.
6. [Adventist Directory — Philadelphia Hispanic II Seventh-day Adventist Church](https://www.adventistdirectory.org/viewEntity.aspx?EntityID=15956) — official denominational directory publishing **101 W Tioga St, Philadelphia, PA 19140-4641**, Spanish language, worship schedule, pastor, and linked official website.

## Evidence and classification notes

The records are physical worship sites or worship ministries and therefore use `cultural_place`, as requested. No commercial business classification was used. No ownership or identity was inferred from a name alone: Center City Mosque has no ownership designation; the Haitian, Indonesian, and Hispanic/Spanish designations are tied to explicit wording on the cited ministry, social, or denominational pages. The Haitian record is a ministry within St. William Church, not a claim that it is a separately incorporated parish. The Masjid Al-Falah diaspora designation is supported by the surfaced official Instagram account but remains a recheck item because the directory page itself is marked **Unclaimed / Maintained by the community**.

Phone is `null` for Philadelphia Hispanic II because the cited official directory entry does not publish a phone number. Social fields are left `null` where no customer-facing official account was verified from the cited evidence. No hours, accessibility, licensing, insurance, ownership, or current availability were inferred beyond published page statements.

## Accessibility limits, exclusions, and caveats

Search results and directories were used for discovery, but generic Google/Mapquest pages, Yelp pages, directory home pages, and shared directory social accounts were not used as customer destinations. The prior candidate files were checked for name overlap, and previously covered Philadelphia worship organizations were excluded. Masjid Al-Falah was retained as a cautious research candidate because its community listing provides a street address, phone, official-site link, and prayer details, but its unclaimed status means current operations and destination details must be directly reverified. The Adventist Directory's linked Facebook field is a generic `facebook.com/` value and was not copied as a social destination. Current service times, address accuracy, website availability, and ministry status should be rechecked before publication. This pass is not a complete census of Philadelphia's Black, Latino, Muslim, Haitian, Indonesian, or other diaspora congregations.

## Output

Candidate JSONL: `data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/source-passes/16-phila-houses-worship-deep-candidates.jsonl`
Evidence report: `data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/source-reports/16-phila-houses-worship-deep-report.md`

All source URLs are preserved exactly in the candidate records and report above.
