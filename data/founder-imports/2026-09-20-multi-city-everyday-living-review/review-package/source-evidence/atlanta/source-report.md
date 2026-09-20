# Atlanta, GA — Everyday-Life Research Source Report

**Research status:** Research only. This inventory has not been connected to a database, published as a listing, geocoded, mapped, pinned, or otherwise used to alter a directory. Both JSONL files contain **no coordinates**.

## Count reconciliation

| File | Records | Scope |
|---|---:|---|
| `candidates.jsonl` | 44 | Source-backed candidates with a numbered address and reviewed current official customer destination |
| `held-candidates.jsonl` | 7 | Plausible leads deliberately withheld for incomplete, ambiguous, future, renamed, or location-specific evidence |
| Total reviewed inventory rows | 51 | Candidate and held rows only; no generated or inferred records |

All rows use the required 23-field schema and field order. Candidate `sourceRow` identifiers begin with `multi-city-atlanta-`; held identifiers retain the same required city prefix. No ownership, language, price, licensing, accessibility, age, or service attribute was inferred beyond the specific official-page evidence recorded in `notes`.

## Coverage completed

The count in each row is a **coverage count**, not an additive partition: a destination may credibly serve more than one area (for example, a children’s museum is both a family activity and a cultural destination). The count reconciliation above is the controlling total.

| Everyday-life area | Coverage count | Evidence approach and examples |
|---|---:|---|
| Black/soul food and Hispanic/Latin food | 6 | Official ordering or restaurant pages were read for Busy Bee, Southern Queenz, Paschal’s, La Fiesta, Patria Mezcalería, and AltaToro. Southern Queenz is the only food row carrying a **Black-owned** designation because its own site expressly uses that wording. La Fiesta carries only its directly stated family-owned designation. Latin/Mexican cuisine is described from each restaurant’s own wording; no owner ethnicity was inferred. |
| Primary, dental, public, and behavioral health | 5 | Official HEALing, Mercy Care, Fulton County Board of Health, and Fulton County pages support locations and stated services. These entries are all `regulated_review` because care is regulated. |
| Fitness and wellness | 2 | Official HOTWORX and City of Atlanta Wellness Center pages were reviewed. The City center is explicitly restricted to active City employees with a City ID. |
| Beauty, natural hair, barbering, nails | 3 | Official LUV YOUR HAIR STUDIO, Hammer & Nails, and Morningside Nail Bar pages support addresses and stated services. |
| Youth/family, ballet, tumbling, and municipal sports | 5 | Official Atlanta Ballet Centre, YMCA, Intown Tumbling, Children’s Museum, and City of Atlanta pages support youth offerings. YMCA and City sports have administrative addresses; their notes flag that specific program sites should be confirmed. |
| Museums, arts, music, nightlife | 8 | Official APEX, Trap Music Museum, High, Eddie’s Attic, Center Stage, Fox, Alliance, and Children’s Museum pages were read. Eddie’s Attic is a nearby Decatur destination specifically identified as such. |
| Travel/day-trip orientation | 1 | The official Discover Atlanta page supports the Centennial Olympic Park visitor-information center. |
| Groceries, laundry, home goods, household support | 6 | Official Municipal Market, Azalea, Martinizing, Atomic, Atlanta Habitat ReStore, and Critical Home Repair pages support these records. |
| Auto sales, repair, towing/mobility | 3 | Official Atlanta Car Care, A Tow, and Jim Ellis directory pages support current service paths and locations. |
| Legal, financial, jobs/education, difficult-day support | 6 | Official Atlanta Legal Aid, MMI, WorkSource, Atlanta Community Food Bank, Grocery Spot, and Kate’s Club pages were reviewed. Legal and financial counseling are routed to `regulated_review`; food and grief resources are not presented as clinical care. |

## Evidence and source method

Discovery used multiple credible institutional, cultural, tourism, government, and program sources, then each accepted candidate was checked on a current official customer destination. Discovery sources were not treated as final evidence. Examples of discovery paths include [Discover Atlanta’s Black-owned restaurant guide](https://discoveratlanta.com/stories/eat/atlantas-favorite-black-owned-restaurants/), [Discover Atlanta’s live-music guide](https://discoveratlanta.com/things-to-do/nightlife/live-music/), [Atlanta Latin Restaurant Week](https://latinrestaurantweeks.com/lrw-campaigns/category/atl-lrw/), [City of Atlanta youth athletics](https://www.atlantaga.gov/government/departments/department-parks-recreation/office-of-recreation/athletics-youth-adult/youth-5-17), [Fulton County Board of Health locations](https://fultoncountyboh.com/locations/), and [Atlanta Community Food Bank](https://www.acfb.org/).

The official customer destinations used as candidate evidence are the `sourceUrl` values embedded in the JSONL. They include the official pages for [Southern Queenz](https://southern-queenz.com/), [HEALing Community Health](https://healatlanta.org/), [Mercy Care](https://mercyatlanta.org/locations/), [Atlanta Ballet Centre](https://centre.atlantaballet.com/), [Trap Music Museum](https://trapmusicmuseum.com/), [Atlanta Legal Aid](https://atlantalegalaid.org/home/), [WorkSource Atlanta](https://worksourceatlanta.org/), [The Grocery Spot](https://thegroceryspot.org/), [A Tow](https://atowinc.com/), and all other official URLs listed row by row.

Specific evidence is preserved in every record’s `notes`: for example, the Busy Bee official order page publishes menu examples; the Children’s Museum official visit page publishes admission; the Municipal Market says EBT is accepted; the Grocery Spot says general public shopping is available by appointment; and the official Fulton adult behavioral-health page states its described eligibility and service set. These statements are not generalized beyond their source pages.

## Held candidates and reasons

| Held sourceRow | Lead | Hold reason |
|---|---|---|
| `multi-city-atlanta-held-001` | Alma Cocina | Official home page provided cuisine and neighborhood context but no verified numbered address in the reviewed extract; its location page did not extract readable content. |
| `multi-city-atlanta-held-002` | La Fonda Latina | Official page showed several numbered street names but not city/state per location. |
| `multi-city-atlanta-held-003` | Twisted Soul Cookhouse & Pours | Official page supported events/catering but not a numbered address. |
| `multi-city-atlanta-held-004` | Atlanta History Center | Official reviewed pages supported activities but not a numbered address. |
| `multi-city-atlanta-held-005` | City Youth Athletics recreation-center sites | City page says programs occur at several centers but does not tie current sports to numbered sites. |
| `multi-city-atlanta-held-006` | Mercy Care at Heritage Village | Official locations page says it is opening October 2026; status was future at research time. |
| `multi-city-atlanta-held-007` | Pata Negra | The official site says it is now Patria Mezcalería, so retaining both would create a stale-name duplicate. |

## Overlap, limitations, and follow-up boundaries

No pre-existing Atlanta research files were present in the assigned sweep folder at the time of this research, so no same-file candidate duplicates were found. **Metro overlap risk:** Eddie’s Attic is deliberately recorded as **Decatur**, a source-supported nearby destination; it may overlap a future Decatur sweep and should be reconciled by official address/name. The existing Pata Negra/Patria identity change is explicitly held to avoid overlap. Locations using Atlanta postal wording near municipal borders should retain their official page’s city labeling unless a later controlled reconciliation verifies otherwise.

This is a broad but time-bounded inventory, not a completeness claim. Official webpages can change; prospective visitors should confirm hours, prices, eligibility, appointment requirements, insurance, service availability, and age restrictions directly. No clinician, dentist, lawyer, counselor, or other regulated provider is endorsed; applicable entries are marked `regulated_review`. Ownership designations remain blank unless the organization’s own reviewed page directly stated the designation. Search-result snippets, review text, maps, and memory were not used as candidate evidence. This report does not make map pins or coordinate claims.

## Official source register

| sourceRow | Name | Reviewed official evidence URL | Disposition |
|---|---|---|---|
| `multi-city-atlanta-001` | The Busy Bee Cafe | https://order.toasttab.com/online/busy-bee-cafe-atlanta-810-martin-luther-king-drive-sw | candidate |
| `multi-city-atlanta-002` | Southern Queenz | https://southern-queenz.com/ | candidate |
| `multi-city-atlanta-003` | Paschal's | https://www.paschalsatlanta.com/ | candidate |
| `multi-city-atlanta-004` | La Fiesta Mexican Restaurant | https://lafiestaatl.com/ | candidate |
| `multi-city-atlanta-005` | Patria Mezcalería | https://www.patriamezcaleria.com/ | candidate |
| `multi-city-atlanta-006` | AltaToro | https://altatoro.com/ | candidate |
| `multi-city-atlanta-007` | HEALing Community Health Main Site | https://healatlanta.org/ | candidate |
| `multi-city-atlanta-008` | HEALing Community Health Abernathy Dental Office | https://healatlanta.org/ | candidate |
| `multi-city-atlanta-009` | Mercy Care at Gateway Center | https://mercyatlanta.org/locations/ | candidate |
| `multi-city-atlanta-010` | Fulton County Board of Health Adamsville Regional Health Center | https://fultoncountyboh.com/locations/ | candidate |
| `multi-city-atlanta-011` | Fulton County Adult Behavioral Health Services – Center for Health and Rehabilitation | https://www.fultoncountyga.gov/inside-fulton-county/fulton-county-departments/behavioral-health-and-developmental-disabilities/adult-behavioral-health-services | candidate |
| `multi-city-atlanta-012` | HOTWORX Atlanta Grant Park | https://www.hotworx.net/studio/atlanta-grantpark | candidate |
| `multi-city-atlanta-013` | City of Atlanta Wellness Center Fitness Center | https://wellnesscenter.atlantaga.gov/fitness-center | candidate |
| `multi-city-atlanta-014` | LUV YOUR HAIR STUDIO | https://luvyourhairstudio.com/ | candidate |
| `multi-city-atlanta-015` | Hammer & Nails Grooming Shop for Guys – Midtown | https://hammerandnailsgrooming.com/location/midtown-atlanta-ga-hammer-nails/ | candidate |
| `multi-city-atlanta-016` | Morningside Nail Bar | https://morningsidenailbaratl.com/ | candidate |
| `multi-city-atlanta-017` | Atlanta Ballet Centre for Dance Education – Michael C. Carlos Dance Centre | https://centre.atlantaballet.com/ | candidate |
| `multi-city-atlanta-018` | YMCA of Metro Atlanta | https://www.ymcaatlanta.org/sports/youth-sports/dance-gymnastics | candidate |
| `multi-city-atlanta-019` | Intown Tumbling, LLC | http://intowntumbling.com/index.html | candidate |
| `multi-city-atlanta-020` | Children's Museum of Atlanta | https://childrensmuseumatlanta.org/plan-your-visit/ | candidate |
| `multi-city-atlanta-021` | APEX Museum | https://www.apexmuseum.org/ | candidate |
| `multi-city-atlanta-022` | Trap Music Museum | https://trapmusicmuseum.com/ | candidate |
| `multi-city-atlanta-023` | High Museum of Art | https://high.org/ | candidate |
| `multi-city-atlanta-024` | Eddie's Attic | https://eddiesattic.com/location/ | candidate |
| `multi-city-atlanta-025` | Center Stage Atlanta | https://www.centerstage-atlanta.com/ | candidate |
| `multi-city-atlanta-026` | Fox Theatre | https://www.foxtheatre.org/ | candidate |
| `multi-city-atlanta-027` | Alliance Theatre | https://www.alliancetheatre.org/ | candidate |
| `multi-city-atlanta-028` | Atlanta Visitor Information Center at Centennial Olympic Park | https://discoveratlanta.com/explore/visitor-centers/ | candidate |
| `multi-city-atlanta-029` | Martinizing Cleaners Atlanta | https://martinizing.com/atlanta | candidate |
| `multi-city-atlanta-030` | Atomic Laundry & Dry Cleaners | https://atomiclaundry.net/ | candidate |
| `multi-city-atlanta-031` | The Municipal Market in Sweet Auburn | https://municipalmarketatl.com/ | candidate |
| `multi-city-atlanta-032` | Azalea Fresh Market | https://azaleamarket.com/ | candidate |
| `multi-city-atlanta-033` | Atlanta Habitat for Humanity ReStore Atlanta | https://www.atlantahabitat.org/restore/restore | candidate |
| `multi-city-atlanta-034` | Atlanta Habitat for Humanity Critical Home Repair | https://www.atlantahabitat.org/programs/critical-home-repair | candidate |
| `multi-city-atlanta-035` | Atlanta Car Care | https://www.atlantacarcareonline.com/ | candidate |
| `multi-city-atlanta-036` | A Tow, Inc. | https://atowinc.com/ | candidate |
| `multi-city-atlanta-037` | Jim Ellis Alfa Romeo Atlanta | https://www.jimellis.com/ | candidate |
| `multi-city-atlanta-038` | Atlanta Legal Aid Society – Fulton County / Downtown Headquarters | https://atlantalegalaid.org/home/ | candidate |
| `multi-city-atlanta-039` | Money Management International – Atlanta | https://www.moneymanagement.org/locations/georgia/atlanta | candidate |
| `multi-city-atlanta-040` | WorkSource Atlanta | https://worksourceatlanta.org/ | candidate |
| `multi-city-atlanta-041` | Atlanta Community Food Bank | https://www.acfb.org/ | candidate |
| `multi-city-atlanta-042` | The Grocery Spot | https://thegroceryspot.org/ | candidate |
| `multi-city-atlanta-043` | Kate's Club | https://www.katesclub.org/ | candidate |
| `multi-city-atlanta-044` | City of Atlanta Youth Athletics | https://www.atlantaga.gov/government/departments/department-parks-recreation/office-of-recreation/athletics-youth-adult/youth-5-17 | candidate |
| `multi-city-atlanta-held-001` | Alma Cocina | https://www.alma-atlanta.com/ | held |
| `multi-city-atlanta-held-002` | La Fonda Latina | https://lafondaatlanta.com/ | held |
| `multi-city-atlanta-held-003` | Twisted Soul Cookhouse & Pours | https://www.twistedsoulatl.com/ | held |
| `multi-city-atlanta-held-004` | Atlanta History Center | https://www.atlantahistorycenter.com/visit/ | held |
| `multi-city-atlanta-held-005` | City of Atlanta Youth Athletics recreation-center sites | https://www.atlantaga.gov/government/departments/department-parks-recreation/office-of-recreation/athletics-youth-adult/youth-5-17 | held |
| `multi-city-atlanta-held-006` | Mercy Care at Heritage Village | https://mercyatlanta.org/locations/ | held |
| `multi-city-atlanta-held-007` | Pata Negra | https://www.patanegraatl.com/ | held |
