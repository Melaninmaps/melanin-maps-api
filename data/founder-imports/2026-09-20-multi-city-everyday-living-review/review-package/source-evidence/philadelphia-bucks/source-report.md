# Philadelphia, PA and Bucks County Everyday-Life Research Report

**Research-only inventory.** This source-backed sweep contains **38 candidate records** and **5 held records**. It does not create, edit, geocode, pin, publish, suppress, or connect any directory record. The JSONL files contain **no coordinates**.

## Scope and coverage

This inventory covers Philadelphia plus source-supported Bucks County destinations in Doylestown, New Hope, Perkasie, Langhorne, and Bristol. It supplies candidate routes for everyday dining, health and behavioral-health access, dental care, legal and financial support, employment and reentry support, beauty and fitness, arts and museums, children and teens, household needs, food assistance, car repair/towing, rail travel to New York City, and Bucks County day trips.

The food selection includes Black diaspora-centered and Hispanic/Latin options without inferring identities. Directly source-attributed designations are restricted to Amina, La Llorona, and So Fresh So Green Cafe. The corresponding official pages also establish physical customer destinations. Hispanic options include Mexican, Cuban, Latin American, and Caribbean cuisine in Philadelphia and Bucks County. Official menus provide a documented range of price points where presented: El Guajillo lists sides from $2.99, tacos from $15.25, and larger dishes at higher listed prices; AAMP, Bucks County Children’s Museum, and other destinations likewise carry only source-stated price information in their candidate notes.

| Coverage area | Candidate count | Examples of source-supported destinations |
|---|---:|---|
| Food and drink | 10 | Amina, Honeysuckle, Booker’s, 48th Street Grille, La Canasta, Mixto, La Llorona, Las Frida’s, El Guajillo, So Fresh So Green |
| Health, dental, mental and behavioral health | 7 | Philadelphia FIGHT, PHMC Health Center on Cedar, Penn Dental Medicine, CBH, Bucks County BH/DP, Family Service Association |
| Legal and financial support | 4 | Philadelphia Legal Assistance, LASP, Clarifi, City Financial Empowerment Center |
| Practical and difficult-day support | 2 | Share Food, Family Service food pantry |
| Beauty and fitness | 4 | I Am Natural Hair Studio, Philadelphia Barber Co., Phila Hair & Nail Spa, City Fitness |
| Arts, youth, travel, household, mobility and day trips | 11 | AAMP, Philadelphia Dance Academy, PBG, Amtrak 30th Street Station, Reading Terminal Market, ReStore, Mr. Kitt’s, Bucks County Children’s Museum, Mercer Museum, Central Bucks Gymnastics, New Hope Railroad |

The candidate file’s field-level evidence identifies the active customer destination and the specific current service, accessibility, age, hours, fee, or route statement only where the page explicitly supplied it. **Doctors, dentists, counselors, and legal-service destinations are routed as `regulated_review`** rather than treated as verified clinical or legal listings.

## Evidence and discovery sources

Candidate discovery started with established tourism, municipal, and government sources and then moved to the respective official customer pages. Visit Philadelphia supplied discovery and directly attributed Black- or Latino-owned guide context for the few records where an ownership designation appears. Visit Bucks County supplied a comparable source-attributed Black-owned-business guide. City, county, and agency pages supplied public-access and difficult-day-resource discovery. The official destination page is the `sourceUrl` for every candidate, while the supporting discovery URL is retained in the relevant ownership-evidence note when applicable.

The official destination source set includes Amina, Honeysuckle, Booker’s, 48th Street Grille, La Canasta, Mixto, La Llorona, Las Frida’s, El Guajillo, So Fresh So Green, Philadelphia FIGHT, PHMC, Penn Dental Medicine, Philadelphia DBHIDS/CBH, Bucks County BH/DP, Family Service Association, Philadelphia Legal Assistance, LASP, Clarifi, the City Financial Empowerment Center page, Share Food, City Fitness, Amtrak, Reading Terminal Market, Habitat Philadelphia, Mr. Kitt’s, AAMP, Philadelphia Dance Academy, PBG, Bucks County Children’s Museum, Mercer Museum, Central Bucks Gymnastics, and New Hope Railroad. Every one was read before its record was added.

### Travel and family context

Amtrak’s official station page establishes William H. Gray III 30th Street Station as a staffed Philadelphia station and lists New York among top destinations. It also identifies Acela and Northeast Regional service as downtown-to-downtown options in the Northeast Corridor. This is travel context rather than an assurance of schedules, fares, seat availability, or accessibility at a particular train time; users must verify a trip in Amtrak’s booking system. Bucks County Children’s Museum, Philadelphia Dance Academy, Philadelphia Boys and Girls Gymnastics, Central Bucks Gymnastics, and New Hope Railroad have age or family language published by their own sites and are included only to the extent stated in candidate notes.

### Difficult-day and everyday support context

The strongest immediate-need evidence is public rather than commercial. CBH’s official City-linked page describes 24/7 non-emergency behavioral-health service access and points to 988 for crisis support. Share Food and Family Service provide official food-access routes. Philadelphia Legal Assistance and LASP describe civil-legal access, while Clarifi and the City Financial Empowerment Center document financial, credit, and housing counseling. These records are access leads, not eligibility determinations; candidates preserve source-stated limits such as residency, income, appointment, or insurance conditions.

## Holds, limitations, and overlap risk

Five plausible leads were deliberately held rather than converted into candidates. Amá’s official site was inaccessible behind a security/cookie interstitial, El Vez’s official page did not expose a numbered street address in reviewed text, World Cafe Live’s rebranded official page did not expose a numbered address, White Seal’s official page was likewise inaccessible through the extractor, and Fonthill Castle’s official page uses a crossroads location instead of a numbered address. Search snippets, third-party listings, and map links were not substituted for official location evidence.

Several destinations can surface from more than one discovery path, creating **overlap risk** in later city research: Amina and La Llorona appear both through official pages and Visit Philadelphia guides; So Fresh So Green appears through its official site and Visit Bucks County’s guide; Bucks County Children’s Museum, Mercer Museum, and New Hope Railroad appear in official tourism discovery as well as on their own sites. Source-row identifiers and full numbered addresses are supplied to aid later duplicate reconciliation. No existing candidate file was present in the assigned Philadelphia-Bucks folder during this task, so there was no local-file overlap to reconcile.

Currentness has limits. Hours, menus, prices, admission policies, temporary closures, insurance, program eligibility, train schedules, and event availability can change. AAMP’s own page announced a temporary closure for exhibition changeover when reviewed. Food price statements are intentionally limited to prices visible on official pages at review and are not price recommendations. No ownership, language access, licensing, age suitability, or service quality is inferred beyond the precise source-supported wording preserved in the records.

## Reconciliation

`candidates.jsonl` contains **38** JSON records. `held-candidates.jsonl` contains **5** JSON records. Every record has the exact contract-required 23 fields in contract order, uses a `multi-city-philadelphia-bucks-` source-row prefix, and has no latitude, longitude, coordinates, or fabricated map-pin record. Physical candidates have numbered street addresses. The work remains **research only** and is outside the production-directory publication route.

## References

[1]: https://www.visitphilly.com/articles/philadelphia/black-owned-restaurants-to-seek-out-in-philadelphia/ "Visit Philadelphia: Black-Owned Restaurants to Try in Philadelphia"
[2]: https://www.visitphilly.com/articles/philadelphia/latino-owned-restaurants-in-philadelphia/ "Visit Philadelphia: Latino-Owned Restaurants to Check Out in Philadelphia"
[3]: https://www.visitbuckscounty.com/blog/stories/post/black-owned-businesses-in-bucks-county/ "Visit Bucks County: Black Owned Businesses in Bucks County"
[4]: https://www.phila.gov/services/payments-assistance-taxes/financial-services-for-residents/get-free-financial-counseling/ "City of Philadelphia: Get Free Financial Counseling"
[5]: https://dbhids.org/about/organization/division-of-community-behavioral-health/ "Philadelphia DBHIDS: Division of Community Behavioral Health"
[6]: https://buckscounty.gov/315/Behavioral-Health "Bucks County: Behavioral Health/Developmental Programs"
[7]: https://www.amtrak.com/stations/phl "Amtrak: William H. Gray III 30th Street Station"
[8]: https://www.phila.gov/food/ "City of Philadelphia: Food and Meal Finder"
