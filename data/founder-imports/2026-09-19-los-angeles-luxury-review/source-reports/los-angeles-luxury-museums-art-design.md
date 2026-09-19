# Los Angeles County Cultural Places: Museums, Art, Design, Heritage, and Performance

**Research date:** 2026-09-19
**Geographic scope:** Los Angeles, California, with only locations supported as within Los Angeles County.
**Directory category:** Museums, galleries, public art, architecture/design centers, heritage places, performance arts, and cultural events.

## Scope and method

This research pass identifies **29 distinct cultural-place candidates** and **5 held leads**. The category was selected because cultural venues, exhibitions, architecture, public programs, and live-performance spaces can be useful discovery options; this does not characterize, rank, or infer anything about any requester or venue. All candidates use the permitted `cultural_place` target kind and have a source-supported numbered street address. No coordinates were collected.

The core discovery source was the official [Discover Los Angeles museum guide](https://www.discoverlosangeles.com/things-to-do/the-guide-to-museums-free-for-all-in-los-angeles), supplemented by the official City of Los Angeles Department of Cultural Affairs (DCA) cultural-centers directory and its venue pages. Each candidate was opened at a first-party visitor/destination page. For City DCA venues, the official DCA venue page is both the public directory source and the first-party public destination. The County Auditor-Controller’s [incorporated-cities list](https://auditor.lacounty.gov/incorporated-areas-cities/) was opened to confirm that **Culver City, Downey, and Glendale** are among cities served by Los Angeles County; those municipalities therefore remain in scope.

## Output summary

| Output | Count | Treatment |
|---|---:|---|
| `candidates-museums-art-design.jsonl` | 29 | Distinct, address-supported cultural places with an opened official destination |
| `held-museums-art-design.jsonl` | 5 | Leads excluded from candidates because verification failed, an official address conflicted, or the official page states the venue is closed for renovation |
| Target kinds in candidates | 29 `cultural_place` | No regulated, online-only, or community-resource records were appropriate for this cultural-places category |

### Candidate coverage

| Coverage area | Candidate examples |
|---|---|
| Museums and collections | Academy Museum, Autry, The Broad, CAAM, Craft Contemporary, Forest Lawn Museum, Getty Center, Hammer, LACMA, LA Plaza, MOCA, Skirball, The Wende |
| Science and heritage interpretation | Columbia Memorial Space Center; Hollyhock House; Watts Towers Arts Center Campus |
| Municipal galleries and art/design learning | LAMAG; Barnsdall Arts Center; Henry P. Rio Bridge Gallery; William Grant Still Arts Center; William Reagh–LA Photography Center |
| Theatre, performance, and multidisciplinary cultural venues | LATC; Center for the Arts Eagle Rock; Barnsdall Gallery Theatre; Lankershim Arts Center; McGroarty Arts Center; Nate Holden Performing Arts Center; Taxco Theatre |

The candidate file preserves two physically separate, first-party-confirmed MOCA venues as separate records: **MOCA Grand Avenue** at 250 South Grand Avenue and **The Geffen Contemporary at MOCA** at 152 N Central Avenue. This is not a duplicate; the official MOCA visitor page treats them as separate physical locations. The Geffen record notes the official page’s temporary gallery-closure status rather than representing it as currently open for normal gallery visitation.

## Opened sources and URLs

The following pages were opened and read. “Official destination” denotes a first-party visitor, venue, or municipal venue page; it is not an endorsement or a current-availability guarantee.

| # | Opened URL | Source / role | Result used |
|---:|---|---|---|
| 1 | [Discover Los Angeles museum guide](https://www.discoverlosangeles.com/things-to-do/the-guide-to-museums-free-for-all-in-los-angeles) | Official tourism guide | Primary discovery source for Academy, Autry, Broad, CAAM, Columbia, Craft, Forest Lawn, Getty, Hammer, ICA LA, La Brea, LACMA, LA Plaza, MOCA, Skirball, and Wende leads |
| 2 | [Los Angeles County Libraries & Museums](https://lacounty.gov/residents/things-to-do/libraries-and-museums/) | County public source | Confirms the County oversees the Museum of Art and Natural History Museum; supports the LACMA County designation recorded in the candidate file |
| 3 | [DCA Arts and Cultural Centers index](https://culture.lacity.gov/cultural-centers) | City municipal directory | Discovery index for City DCA cultural centers, historic sites, galleries, and theatres |
| 4 | [County incorporated areas / cities](https://auditor.lacounty.gov/incorporated-areas-cities/) | County government source | Confirms Culver City, Downey, and Glendale in the County’s city list |
| 5 | [Academy Museum — Plan Your Visit](https://www.academymuseum.org/visit) | Official destination | Confirms address, visitor details, admissions, screenings, and phone |
| 6 | [Autry — Visit](https://theautry.org/visit) | Official destination | Confirms address, museum access, tours, and program information |
| 7 | [The Broad — Visit](https://www.thebroad.org/visit) | Official destination | Confirms address, admission, tours, and official social links |
| 8 | [CAAM — Visit](https://caamuseum.org/visit/) | Official destination | Confirms address, hours, free admission, and official social links |
| 9 | [Columbia Memorial Space Center — Visit](https://www.columbiaspacescience.org/visit) | Official destination | Confirms Downey address, operating details, and official Instagram |
| 10 | [Craft Contemporary — Visit](https://www.craftcontemporary.org/visit) | Official destination | Confirms address, visitor details, exhibitions, and programs |
| 11 | [Forest Lawn Museum](https://forestlawn.com/exhibits-and-events/museum/) | Official destination | Confirms Glendale address, hours, exhibitions, and official Instagram |
| 12 | [Getty Center — Visit](https://www.getty.edu/visit/center/) | Official destination | Confirms address, art/design/garden visitor information, admissions, and social links |
| 13 | [Hammer Museum — Visit](https://hammer.ucla.edu/visit) | Official destination | Confirms address, visitor details, programming, and social links |
| 14 | [LACMA — Visit](https://www.lacma.org/visit) | Official destination | Confirms address, museum hours, visitor details, dining, and social links |
| 15 | [LA Plaza — Visit](https://lapca.org/visit/) | Official destination | Confirms address, current public-facing museum description, hours, and social links |
| 16 | [MOCA — Plan Your Visit](https://www.moca.org/visit) | Official destination | Confirms the distinct Grand Avenue and Geffen addresses, visitor information, performance space, temporary Geffen gallery status, and social links |
| 17 | [Skirball — Visit](https://www.skirball.org/visit) | Official destination | Confirms address, exhibitions, public programs, visitor information, and social links |
| 18 | [The Wende — Visit](https://www.wendemuseum.org/visit) | Official destination | Confirms Culver City address, exhibitions, public programs, and tours |
| 19 | [Hollyhock House](https://culture.lacity.gov/cultural-centers/hollyhock-house) | Official City DCA venue page | Confirms address, public tours, City operation, and the stated heritage designations |
| 20 | [Los Angeles Municipal Art Gallery](https://culture.lacity.gov/cultural-centers/los-angeles-municipal-art-gallery-lamag) | Official City DCA venue page | Confirms address, public gallery details, and social links |
| 21 | [Watts Towers Arts Center Campus](https://culture.lacity.gov/cultural-centers/watts-towers-campus) | Official City DCA venue page | Confirms address, tours, galleries, festivals, and stated heritage designations |
| 22 | [Los Angeles Theatre Center](https://culture.lacity.gov/cultural-centers/los-angeles-theatre-center-latc) | Official City DCA venue page | Confirms address, operator statement, programming, and Facebook |
| 23 | [Barnsdall Arts Center](https://culture.lacity.gov/cultural-centers/barnsdall-arts-center) | Official City DCA venue page | Confirms address, art/design classes, and social links |
| 24 | [William Grant Still Arts Center](https://culture.lacity.gov/cultural-centers/william-grant-still-arts-center) | Official City DCA venue page | Confirms address, gallery/programming details, City-facility statement, and social links |
| 25 | [Center for the Arts Eagle Rock](https://culture.lacity.gov/cultural-centers/center-for-the-arts-eagle-rock) | Official City DCA venue page | Confirms address, arts events/programming, and Facebook |
| 26 | [Barnsdall Gallery Theatre](https://culture.lacity.gov/cultural-centers/barnsdall-gallery-theatre) | Official City DCA venue page | Confirms address, appointment-only note, performance scope, City ownership/operation, and social links |
| 27 | [Henry P. Rio Bridge Gallery at City Hall](https://culture.lacity.gov/cultural-centers/bridge-gallery-city-hall) | Official City DCA venue page | Confirms address, weekday hours, and public exhibition purpose |
| 28 | [Lankershim Arts Center](https://culture.lacity.gov/cultural-centers/lankershim-arts-center) | Official City DCA venue page | Confirms address, public performance/cultural events, City operation, stated HCM designation, and social links |
| 29 | [McGroarty Arts Center](https://culture.lacity.gov/cultural-centers/mcgroarty-arts-center) | Official City DCA venue page | Confirms address, public arts instruction/events, partner-operator statement, and social links |
| 30 | [Nate Holden Performing Arts Center](https://culture.lacity.gov/cultural-centers/nate-holden-performing-arts-center) | Official City DCA venue page | Confirms address, facility/operator statement, venue purpose, and Facebook |
| 31 | [Taxco Theatre](https://culture.lacity.gov/cultural-centers/taxco) | Official City DCA venue page | Confirms address, post-renovation public reopening, performance scope, and social links |
| 32 | [William Reagh–LA Photography Center](https://culture.lacity.gov/cultural-centers/william-reagh-la-photography-center) | Official City DCA venue page | Confirms address, partner-operator statement, and community photography-laboratory description |
| 33 | [Fowler Museum — Visit](https://fowler.ucla.edu/visit) | Official destination, held lead | Opened but presented a security/cookie interstitial rather than accessible visitor content |
| 34 | [ICA LA — Visit](https://www.theicala.org/en/visit) | Official destination, held lead | Opened; it contains conflicting ZIP values for the same street address |
| 35 | [La Brea Tar Pits — Visit](https://tarpits.org/visit) | Official destination, held lead | Opened but redirected/rendered as a Natural History Museum ticket page rather than a verifiable Tar Pits visitor page |
| 36 | [NHM La Brea Tar Pits fallback](https://nhm.org/plan-your-visit/la-brea-tar-pits) | Official fallback, held lead | Opened but failed to load required page content |
| 37 | [Vision Theatre Performing Arts Center](https://culture.lacity.gov/cultural-centers/vision-theatre) | Official City DCA venue page, held lead | Opened; page says closed for renovations |
| 38 | [Warner Grand Theatre](https://culture.lacity.gov/cultural-centers/warner-grand-theatre) | Official City DCA venue page, held lead | Opened; page says closed for renovation |

## Duplicate and quality checks

A final JSONL validation found **29 candidate lines** and **5 held lines**. Both files parse as JSONL; every candidate and held object has exactly the prescribed 23 fields in the required order; candidate `sourceRow` values run consecutively from 1 through 29 and held `sourceRow` values from 1 through 5. All candidate target kinds are permitted values, every candidate `cultural_place` record has a non-null numbered address, and an exact normalized-name duplicate check returned no matches. A manual within-category review additionally separated venues that share a campus or brand but have distinct first-party identities and physical purposes, such as Hollyhock House, LAMAG, Barnsdall Arts Center, and Barnsdall Gallery Theatre at Barnsdall Park, and the two MOCA locations.

## Source-attribution rules applied

The files record only neutral, source-supported descriptive discovery terms. **No ownership, LGBTQ+, heritage, nonprofit, professional, luxury, safety, access, or quality claim was inferred.** `ownershipDesignations` is null unless an opened first-party or county page expressly states an operator, public-facility relationship, or recognized designation. Examples include the County’s stated oversight of the Museum of Art; City DCA facility/operation statements; the explicit Hollyhock House and Watts Towers designations; and the LA Plaza page’s displayed Smithsonian Affiliate logo. Such statements are paired with an `ownershipEvidence` field that names the supporting source.

Social URLs were recorded only when present on the opened official venue page. In particular, the William Reagh–LA Photography Center page’s generic Facebook URL is retained as published and its record notes that its current usefulness should be evaluated before outreach. Phone values are recorded only when shown on the opened official destination; otherwise they are JSON `null`.

## Held leads and limitations

The held file is intentionally not a candidate list. **Fowler Museum at UCLA** is held because its official visitor page could not be substantively read beyond a security/cookie prompt. **ICA LA** is held because its official visitor page contains conflicting ZIP codes (90021 and 90012) for 1717 E 7th Street, so no single unambiguous address is placed in candidates. **La Brea Tar Pits Museum** is held because the tourism source did not show a numbered address and the official visitor path either rendered the wrong museum’s ticket page or failed to load on the official fallback. **Vision Theatre** and **Warner Grand Theatre** are held because their official City pages state they are closed for renovations. **Madrid Theatre** was reviewed but not added to held because it was discovered only in the later City-directory expansion and already explicitly says it is closed for renovations with anticipated public opening in 2027; it should be considered only after a fresh opening check, not treated as a current candidate.

Venue hours, installations, public programming, performances, construction, admissions, and access conditions change. Use the record’s `website` and `sourceUrl` to reconfirm before a visit. This is a research directory pass, not a recommendation, booking tool, eligibility screen, or assessment of venue suitability.

> **Research-only; no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change.**
