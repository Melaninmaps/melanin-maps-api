# Delaware Houses of Worship — Evidence Report

**Research pass:** 17-delaware-houses-of-worship
**Scope:** Publicly listed Black, Latino, diaspora, and community-serving houses of worship in Delaware. Records are classified as `cultural_place` and preserve public evidence. This is research expansion, not a claim that any listing is currently live.

## Results

Seven candidates were retained. All are physical houses of worship and were assigned `cultural_place`; none met a regulated-service classification. The candidate file is JSONL with sequential `sourceRow` values 1–7.

| Candidate | City | Published evidence | Classification |
|---|---|---|---|
| Bethel African Methodist Episcopal Church-Wilmington | Wilmington | First-party site publishes AME identity, address, phone, worship and Greater Wilmington community-ministry language. | cultural_place |
| HEIM Church | Dover | First-party site publishes Dover location, in-person/online Sunday service, prayer and ride-request links. Public search result identifies the ministry as Haitian Evangelical International Ministries. | cultural_place |
| New Calvary Baptist Church | Wilmington | First-party site publishes address, phone, worship, Bible study and ministry-school information. | cultural_place |
| Rawdah Islamic Center of Delaware | Newark | First-party site publishes address, phone, Sunday School, Eid and community events. | cultural_place |
| St. Paul U.A.M.E. Church | Wilmington | First-party site publishes U.A.M.E. identity, 1887 Wilmington founding history, address, phone and worship schedule. | cultural_place |
| Georgetown Spanish Church | Georgetown | Official Adventist-hosted site publishes Spanish-language church identity, address, Bible study and worship times. | cultural_place |
| Iglesia de Dios de la Profecia | Georgetown | Delaware Hispanic Commission government directory publishes exact address; official-facing COGOP Georgetown Facebook page was found. | cultural_place |

## Sources searched and consulted

The search began with public faith and community directories and then followed first-party links where available. The following source pages were accessed and used as evidence:

1. [Bethel AME Church official site](https://bethelwilmington.org/) — address, phone, AME identity, worship and community-ministry language.
2. [HEIM Church official site](https://heimchurch.org/) — Dover address, Sunday worship, online worship, prayer and ride-request links.
3. [New Calvary Baptist Church official site](https://www.newcalvaryde.org/) — Wilmington address, phone, worship, Bible study and ministry-school links.
4. [Rawdah Islamic Center of Delaware official site](https://www.rawdahislamiccenterofdelaware.com/) — Newark address, phone, Sunday School and community events.
5. [St. Paul U.A.M.E. Church official site](https://stpauluame.org/) — address, phone, U.A.M.E. identity, church history and worship schedule.
6. [Georgetown Spanish Church official Adventist site](https://georgetownspanishde.adventistchurch.org/) — Spanish-language identity, address and worship/Bible-study schedule.
7. [Delaware Hispanic Commission location page for Iglesia de Dios de la Profecia](https://hispanic.delaware.gov/locations/iglesia-de-dios-de-la-profecia/) — government-published name and address.
8. [COGOP Georgetown Facebook page](https://www.facebook.com/COGOPGEORGETOWN/) — public official-facing social destination and corroborating address snippet.
9. [Black-Churches Wilmington directory](https://www.black-churches.com/cities/wilmington-delaware) — directory evidence for St. Paul UAME and Mother UAME, including addresses, phones and official-site links.
10. [Islamic Society of Delaware](https://isdonline.org/) — public directory-style community context, worship/community language and links to Delaware masjids; its primary published Masjid Ibrahim address is in Lincoln University, Pennsylvania, so it was not imported as a Delaware physical listing.
11. [Pennsylvania-Delaware Episcopal Church directory](https://www.pen-del.org/churches?district=Delaware) and [Delaware historic houses of worship](https://archives.delaware.gov/historic-houses-of-worship/) — broad discovery sources, not used alone to import a candidate without an accessible official customer-facing destination.

## Exclusions and non-imports

Mother UAME Church appeared in the Black-Churches directory with 701 E 5th St, Wilmington, and a website link, but it was not imported because accessible current reporting indicates the historic church was devastated by a 2026 fire and the research policy requires caution rather than treating a directory record as a live customer-facing listing. The Black-Churches directory itself states that address/contact data are gathered from Google Maps; it was used for discovery and corroboration, not as the sole official destination.

Islamic Society of Delaware was not imported because the accessible first-party page’s primary map and visiting address are **3334 Newark Road, Lincoln University, PA 19352**, outside Delaware. The page references Delaware Masjid Ibrahim but does not provide an accessible Delaware street address in the fetched content.

Generic Google, Apple Maps, Yelp, MapQuest, FaithStreet, and directory-home pages were not used as official customer destinations. They were treated as discovery or corroboration only. No database or API was called.

## Gaps and source limitations

The search found strong first-party evidence for Wilmington, Dover, Newark and Georgetown, but coverage is not exhaustive for every Delaware county or every diaspora tradition. Several official pages did not publish phone numbers or direct social URLs; those fields remain `null` rather than being inferred. HEIM’s Haitian identity was visible in the public search result and site title context, while the fetched page itself primarily presents the church name, location and worship links. The Georgetown Spanish page is official Adventist-hosted and Spanish-language, but no phone was published in the fetched page. Iglesia de Dios de la Profecia has a government directory record and a Facebook destination, but no phone or standalone website was accessible in this pass.

Ownership and identity were not inferred from names, neighborhoods, surnames or language alone. `ownershipDesignations` arrays are empty throughout because the retained pages do not make a formal ownership claim suitable for that field. Ethnic, racial or diaspora relevance is recorded only where the public source explicitly identifies it (AME/U.A.M.E., Haitian ministry context, Spanish church, or Hispanic Commission location listing).

## File outputs

- Candidate JSONL: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-tri-state-expansion-pass-2/source-passes/17-delaware-houses-of-worship-candidates.jsonl`
- This report: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-tri-state-expansion-pass-2/source-reports/17-delaware-houses-of-worship-report.md`
