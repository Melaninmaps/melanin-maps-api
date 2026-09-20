# Allentown–Lehigh Valley Everyday-Life Research Source Report

## Scope and research boundary

This research-only inventory covers **Allentown, Bethlehem, Easton**, plus source-supported nearby destinations in Nazareth. It was prepared for everyday-life discovery, with particular attention to Hispanic and Black diaspora-relevant food, cancer-survivor and family support, education, basketball/youth recreation, culture/nightlife, health, legal aid, practical services, and difficult-day resources. It does **not** create, edit, geocode, pin, publish, or connect to any directory database. The JSONL files contain **no coordinates**.

## Count reconciliation

| File | Count | Basis |
|---|---:|---|
| `candidates.jsonl` | 40 | Physical places have a numbered address except the one official delivery-only online service; every candidate has an official customer destination read during research. |
| `held-candidates.jsonl` | 5 | Plausible leads held for a missing numbered address, inaccessible official page, or insufficient current official service evidence. |
| Total researched records | 45 | Candidate plus held records. |

Every record uses the contract’s 23 fields in its required order. All `sourceRow` values begin `multi-city-allentown-`.

## Coverage achieved

| Category | Candidate examples | Evidence notes |
|---|---|---|
| Cancer, hospital, dental, mental health, and fitness | Cancer Support Community Greater Lehigh Valley; LVH–17th Street; St. Luke’s Allentown; Star Community Health Dental; LVH Dental Clinic; Haven House; Allentown YMCA | The cancer-support location offers support programs, family programming, resources/referral, a wig salon and a Spanish-language group; hospital, dental and mental-health providers are routed as `regulated_review`. |
| Hispanic, Caribbean, Southern/soul, Mexican and Dominican dining | Mikey’s; Urban Skillet; Casa de Campo; UNO Taqueria; Plaza Azteca; Urbano; Mesa; Don Juan Mex Grill; Tacos Y Tequila | Official pages were read for each candidate. No owner ethnicity has been inferred. Directly stated family-owned evidence is retained only for Casa de Campo and Plaza Azteca. |
| Employment, education, legal and financial-pressure supports | North Penn Legal Services; PA CareerLink; The Literacy Center; Northampton Community College; Community Action Lehigh Valley | Sources document civil legal-aid intake, job seeker/training resources, ESL/GED/workforce programs, college/certificates/aid, and housing/financial education/community action programs. |
| Food, housing, shelter, caregiving and difficult-day support | Allentown Area Ecumenical Food Bank; Allentown Rescue Mission; New Bethany; Allentown Public Library | Official pages document food access, emergency shelter details, rent/utility arrears/housing-locator support, hygiene/meal/wellness programs, and library resource navigation. |
| Basketball, gymnastics, ballet, youth and family activity | City of Allentown Parks & Recreation; Parkettes; Force Gymnastics; Ballet Guild; Allentown Art Museum; Crayola Experience; Sigal Museum | The City’s official athletics page identifies multiple youth basketball organizations. Gymnastics, dance, museum/youth art, hands-on creativity and history programs are source-described. |
| Music, arts, nightlife and day-trip context | ArtsQuest/Musikfest; Godfrey Daniels; Allentown Art Museum; Sigal Museum; Crayola Experience; ABE airport | Music/festival and performing-arts pages were read. ABE’s official page provides airport, flight-status, parking/transportation and travel-help context. |
| Beauty, laundry, household and vehicle needs | Studio 924; Rooted; Lehigh Valley Drycleaning; Martinizing delivery service; Allied Automotive | Official service pages document beauty/spa, garment-care, delivery-only cleaning, repair/inspection and mobility amenities. |

## Sources and verification notes

Discovery was informed by multiple credible regional and public sources, including [Discover Lehigh Valley](https://www.discoverlehighvalley.com/), [VisitPA’s Lehigh Valley guide](https://www.visitpa.com/explore/regions/lehigh-valley/), the [City of Allentown Parks & Recreation](https://www.allentownpa.gov/en-us/Government/Departments/Parks-Recreation), and the [Allentown Public Library resources page](https://www.allentownpl.org/resources-for-help/). Those discovery sources were **not** treated as sole evidence where an official customer destination existed.

The evidence URL stored in each JSONL record is the applicable official business, organization, public-agency, hospital, school, museum, airport, or official location page. Major official evidence sources include:

- [Cancer Support Community Greater Lehigh Valley official location page](https://www.cancersupportcommunity.org/location/cancer-support-community-greater-lehigh-valley) and [local official site](https://www.cancersupportglv.org/).
- [LVH–17th Street](https://www.lvhn.org/locations/lehigh-valley-hospital-17th-street), [LVH Dental Clinic](https://www.lvhn.org/locations/dental-clinic-lehigh-valley-hospital-17th-street), [St. Luke’s Allentown](https://www.slhn.org/locations/stlukes-hospital-allentown-campus), [Star Dental](https://www.slhn.org/locations/star-community-health-dental-sigal), [Haven House](https://haven-house.com/), and [Allentown YMCA](https://www.ymcarivercrossing.org/locations/allentown-ymca).
- Official food destinations: [Mikey’s](https://mikeyscaribbeanrestaurant.com/), [Urban Skillet](https://www.urban-skillet.com/), [Casa de Campo](https://www.casadecampopa.com/), [UNO Taqueria](https://unotaqueriapa.com/), [Plaza Azteca](https://plazaazteca.com/location-pennsylvania-plaza-azteca-allentown/), [Urbano](https://www.urbanobethlehem.com/), [Mesa](https://www.mesamexican.com/), [Don Juan Mex Grill](https://donjuanmexgrill.com/lafayette-college-hill), and [Tacos Y Tequila](https://www.tacosytequilaeaston.com/).
- Official practical, education and legal destinations: [North Penn Legal Services](https://www.nplspa.org/who-we-are/contact.html), [PA CareerLink](https://careerlinklehighvalley.org/job-seekers/), [The Literacy Center](https://theliteracycenter-lv.org/), [Northampton Community College](https://www.northampton.edu/), [Community Action Lehigh Valley](https://www.communityactionlv.org/), [Allentown Food Bank](https://allentownfoodbank.org/), [Allentown Rescue Mission](https://www.allentownrescuemission.org/contact-us-revised/), and [New Bethany](https://newbethany.org/i-need-assistance/).
- Official youth, culture, service and travel destinations: [City athletics](https://www.allentownpa.gov/en-us/Government/Departments/Parks-Recreation/Recreation/Athletic-Programming), [Parkettes](https://parkettes.com/), [Force Gymnastics](https://www.forcegymnastics.com/), [Ballet Guild](https://www.bglv.org/), [Allentown Art Museum](https://www.allentownartmuseum.org/youth-programs/), [ArtsQuest/Musikfest](https://www.artsquest.org/musikfest/), [Godfrey Daniels](https://godfreydaniels.org/), [Crayola Experience](https://www.crayolaexperience.com/easton/about-us/contact-us), [Sigal Museum](https://sigalmuseum.org/), [Studio 924](https://studio924salon.com/), [Rooted](https://www.salonrooted.com/), [Lehigh Valley Drycleaning](http://lvdrycleaning.com/locations.html), [Martinizing](https://martinizing.com/allentown), [Allied Automotive](https://alliedautomotiveservice.com/), and [ABE](https://www.flyabe.com/contact-us/).

## Holds and rationale

| Held lead | Reason held |
|---|---|
| Hispanic Center Lehigh Valley | Official accessible page supports its programs and service community but lacks a numbered address and phone. |
| Island Bay Grill | Official footer supports a location/contact lead, but customer-facing content is password protected and does not state current cuisine/menu/service details. |
| East Side Youth Center | Official page supports sports and workshops, but a numbered location is not published on the accessible official pages. |
| Neighborhood Health Centers of the Lehigh Valley / Vida Nueva Clinic | Official site is blocked by a security interstitial in this environment; potential clinic details require official-location confirmation. |
| Turning Point of Lehigh Valley | Public-agency/library discovery supports relevance, but the official domain could not be resolved/read to validate address and current services. |

## Limitations and review flags

The sweep did not infer ethnic, racial, Hispanic/Latino, Black, language, accessibility, licensing, age, ownership, price, or availability claims. Therefore, it does not label candidates Black-owned or Hispanic-owned except that no such owner-identity designation is used; only direct “family-owned” statements are preserved for two restaurants. Official pages did not consistently publish comparable menu-price data, so no unsupported price tier is assigned; users should check the linked current menus/order pages. Provider, dental, hospital, mental-health, and legal-aid candidates are intentionally `regulated_review` leads rather than endorsements of individual professionals.

Some official sites were inaccessible to text extraction or incomplete (including the held items), and the Allentown YMCA reports a limited reopening with particular amenities closed. These conditions and direct source wording are recorded in notes. There were no pre-existing city files in the assigned shared folder at the start of this research, so no overlap with prior city research was identified; notable places that appeared in multiple discovery paths were deduplicated to one candidate record each.

**Publication boundary:** These artifacts are research only. They have not been written to or connected with any production directory database, and they contain no coordinates, geocodes, map pins, or map URLs fabricated as location evidence.
