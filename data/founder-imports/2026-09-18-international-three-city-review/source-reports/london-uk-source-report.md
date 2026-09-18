# London, United Kingdom — Mapping with Melanin Source Pass

## Scope and method

This is a **research-only source pass** for London, United Kingdom. It contains London addresses only; the selected locations are within London rather than peripheral localities. Discovery favoured public cultural, municipal, charity, diaspora, destination and editorial sources, after which the relevant official organisation or business destination was inspected. Search-result snippets were not treated as evidence. No map, directions, geocoding, latitude/longitude, database, API, website/app, account, payment, or publication action was created or used.

UK address treatment follows the source form: building or unit, street, London locality where supplied, and UK postcode. `state` is null in every retained record because no source supplied a province/region/parish/county as the record’s state-equivalent; London is retained in `city`, and no US state or ZIP convention has been imposed. Online-only Black2Business UK has a null address and no coordinates.

The output distinguishes `physical_business`, `cultural_place`, `community_resource`, `regulated_review`, and `online_business`. Cultural places and community resources are explicitly not commercial map pins. Health/wellbeing-related BLAM is retained only as `regulated_review`; this is a review routing label and **does not certify a licence, credential, availability, or clinical outcome**.

## Results

| File | Retained / held records |
|---|---:|
| `candidates.jsonl` | 20 |
| `held-candidates.jsonl` | 10 |

### Retained candidates by target kind

| Target kind | Count |
|---|---:|
| physical_business | 11 |
| cultural_place | 5 |
| community_resource | 1 |
| regulated_review | 2 |
| online_business | 1 |
| **Total** | **20** |

### Retained candidates by category

| Category | Count |
|---|---:|
| food_dining | 8 |
| retail | 1 |
| beauty | 1 |
| arts_culture | 5 |
| community_resources | 2 |
| family_youth_education | 1 |
| recreation | 1 |
| professional_services | 1 |
| **Total** | **20** |

## Deduplication

Before writing, all 2,863 parseable records across every pre-existing `*.jsonl` beneath `/home/ubuntu/directory-research-wave-2026-09-18/` were indexed, excluding this output folder. Normalized exact comparisons used name + city + state/province/parish + country + address (case-folded, punctuation/diacritics removed). A second exact-name candidate scan found no name matches in the prior corpus; no exact duplicate was retained. The output files were excluded from the source corpus during comparison.

## Inspected URLs

Every URL opened/fetched during this pass is listed below. “Retained evidence” informed one or more candidates. “Held evidence” specifically informed a held record. “Context/rejected” was opened for discovery or validation but did not support a retained record. Failures, parked domains, unrelated content and inaccessible destinations are deliberately documented rather than substituted with search snippets.

| Disposition | Inspected URL | Use / result |
|---|---|---|
| Retained evidence | <https://www.visitlondon.com/things-to-do/place/442369-black-cultural-archives> | External destination listing and address for Black Cultural Archives. |
| Retained evidence | <https://blackculturalarchives.org/> | Official Black Cultural Archives destination, mission, address and social links. |
| Retained evidence | <https://www.timeout.com/london/restaurants/londons-best-nigerian-and-west-african-restaurants> | Editorial discovery for Chishuru, 805 Restaurants and The Flygerians. |
| Retained evidence | <https://www.chishuru.com/> | Official Chishuru destination and address. |
| Retained evidence | <https://www.805restaurants.com/> | Official 805 Restaurants destination and Old Kent Road address. |
| Retained evidence | <https://www.theflygerians.com/> | Official The Flygerians destination and Peckham address. |
| Retained evidence | <https://www.chukuslondon.co.uk/> | Official Chuku’s destination and Tottenham address. |
| Retained evidence | <https://www.blackeatsldn.com/directory/> | Black Eats directory evidence for Chuku’s, Aso Rock and Rhythm Kitchen; directory-level Black-owned designation. |
| Retained evidence | <https://www.asorockfood.com/> | Official Aso Rock destination and Dalston address. |
| Retained evidence | <https://rhythmkitchen.co/> | Official Rhythm Kitchen destination and Stratford address. |
| Retained evidence | <https://www.arepaandco.com/> | Official Arepa & Co destination and Elephant Park address. |
| Retained evidence | <https://www.latinolife.co.uk/articles/where-eat-latin-london> | LatinoLife editorial discovery and address evidence for Arepa & Co. |
| Retained evidence | <https://conuco.co.uk/> | Official Conuco destination and Brixton Road address. |
| Retained evidence | <https://www.tatacheers.com/cuisine/conuco-venezuelan-comfort-food-in-oval/> | Independent local editorial discovery for Conuco. |
| Retained evidence | <https://www.newbeaconbooks.com/> | Official New Beacon Books destination and address. |
| Retained evidence | <https://trippin.world/guide/black-owned-businesses-in-london> | Editorial discovery for New Beacon Books and Elite Evolution; its designation is retained only as source wording. |
| Retained evidence | <https://www.goldentouchcosmetics.co.uk/> | Official Golden Touch destination, products and Forest Gate address. |
| Retained evidence | <https://www.stylist.co.uk/beauty/hair/black-owned-hair-shops-london/821566> | Editorial discovery and Black-owned designation wording for Golden Touch; also discovery for held Ruka and Detangled. |
| Retained evidence | <https://autograph.org.uk/> | Official Autograph source and public destination. |
| Retained evidence | <https://www.198.org.uk/> | Official 198 Contemporary Arts and Learning source and public destination. |
| Retained evidence | <https://www.almasartfoundation.org/> | Official Almas Art Foundation destination and address. |
| Retained evidence | <https://www.acasaonline.org/african-art-gallery-opening-london/> | ACASA external discovery for Almas Art Foundation. |
| Retained evidence | <https://www.islington.gov.uk/about-the-council/equality-and-diversity/challenging-inequality/black-cultural-centre> | Islington Council source and public destination for the Black Cultural Centre. |
| Retained evidence | <https://www.latinamericanhouse.org.uk/> | Official Latin American House destination, community description and social links. |
| Retained evidence | <https://www.lbhf.gov.uk/living-independently/living-independently-service-directory/latin-american-house> | Council directory evidence for Latin American House services and address. |
| Retained evidence | <https://uklatincommunity.org/> | Official UK Latin Community CIC source and Food Shop programme location. |
| Retained evidence | <https://blamuk.org/> | Official BLAM source, legal description and registered company address. |
| Retained evidence | <https://howardleague.org/third-sector-and-community-organisations/> | Independent charity guide evidence for BLAM and held Black Minds Matter UK. |
| Retained evidence | <https://www.elite-evolution.co.uk/> | Official Elite Evolution destination and Hackney Wick address. |
| Retained evidence | <https://black2business.uk/> | Official online-directory description for Black2Business UK. |
| Held evidence | <https://www.africacentre.org.uk/> | Official page expressly reports temporary building closure; Africa Centre held. |
| Held evidence | <https://eatofeden.co.uk/> | Inspected destination presented unrelated casino content; Eat of Eden held. |
| Held evidence | <https://www.brixtonsoupkitchen.org/> | Inspected destination presented unrelated gambling content; Brixton Soup Kitchen held. |
| Held evidence | <https://prickldn.com/> | Inspected destination resolved to a Substack profile without shop-address corroboration; Prick LDN held. |
| Held evidence | <https://www.puretenature.com/> | Inspected destination presented unrelated betting content; Pureté Nature held. |
| Held evidence | <https://detangled-hair.com/> | Official page reports maintenance and cannot take orders; Detangled Hair held. |
| Held evidence | <https://rukahair.com/> | Official retail destination inspected but did not corroborate the Curl Bar physical service location; Ruka Hair held. |
| Held evidence | <https://themallwoodgreen.co.uk/news-events/celebrating-black-owned-businesses/> | Mall editorial discovery for Aunties Beauty; absent official business destination and unit-level address led to hold. |
| Held evidence | <https://www.blackmindsmatteruk.com/> | Official charity destination and restricted-therapy notice; absent physical address led to hold. |
| Held evidence | <https://www.4frontproject.org/> | Official closing/transition statement; 4FRONT held. |
| Context/rejected | <https://blackculturalarchives.org/visit-us> | Opened; no content extracted. The official homepage and Visit London supplied sufficient BCA evidence. |
| Context/rejected | <https://akokorestaurant.co.uk/> | Attempted official destination; hostname could not be resolved. Not retained. |
| Context/rejected | <https://www.timeout.com/london/restaurants/londons-best-caribbean-restaurants> | Opened for Caribbean discovery; no record retained from this page because a directly verified alternative mix was used. |
| Context/rejected | <https://www.jamdelish.com/> | Attempted official destination; hostname could not be resolved. Not retained. |
| Context/rejected | <https://www.unclejohnsbakery.co.uk/> | Attempted official destination; hostname could not be resolved. Not retained. |
| Context/rejected | <https://blackequityorg.com/> | Opened for community-resource discovery; no physical street/building address established for a retained record. |
| Context/rejected | <https://www.london.gov.uk/who-we-are/what-london-assembly-does/questions-mayor/find-an-answer/latin-american-business-community-london> | Opened as municipal historical discovery context; not used as current record evidence. |
| Context/rejected | <https://blackhistorystudies.com/events/black-cultural-centre-islington/> | Opened as community context; current Islington Council page supplied the retained municipal evidence. |
| Context/rejected | <https://www.islington.gov.uk/about-the-council/news/2022/12/black-cultural-centre-opens-in-islington> | Opened; no content extracted. Not used. |
| Context/rejected | <https://www.princeofpeckham.co.uk/> | Official page inspected but did not show the business street address in the extraction; not retained. |
| Context/rejected | <https://www.jamaicapattyco.com/> | Opened; no content extracted. Not retained. |
| Context/rejected | <https://blackhistorystudies.com/> | Official organisation page inspected; no local physical organisation address established for retention. |
| Context/rejected | <https://www.growlondonlocal.london/learn-something/black-entrepreneurs-london-where-to-find-support/> | Opened for professional-support discovery; candidate official destination below did not extract. |
| Context/rejected | <https://www.londonchamber.co.uk/black-business-association/> | Opened; no content extracted. Not retained. |
| Context/rejected | <https://kulturecosmetics.com/> | Official domain was parked. Not retained. |
| Context/rejected | <https://www.blackownedlondon.com/> | Opened as Black-owned-business discovery context; no additional record survived destination verification. |
| Context/rejected | <https://charlottemensah.com/pages/hair-lounge> | Opened; no content extracted. Not retained. |
| Context/rejected | <https://blackbusinessclub.org/> | Opened; no content extracted. Not retained. |
| Context/rejected | <https://www.treasuretress.co.uk/> | Official e-commerce page inspected; it did not explicitly establish online-only status, so not retained. |
| Context/rejected | <https://colourriotnails.com/> | Attempted official destination; hostname could not be resolved. Not retained. |
| Context/rejected | <https://darksugars.co.uk/> | Attempted official destination; hostname could not be resolved. Not retained. |
| Context/rejected | <https://therecordshop.co.uk/> | Opened; page extraction did not establish a customer-facing destination. Not retained. |

## Retention and hold rationale

Physical commercial records have a name, category, inspected public source URL, inspected official customer-facing website, and a non-conflicting public street/building address in UK form. Source-level designations such as “Black-owned” are preserved only where the inspected source explicitly makes that designation; the records make clear that these are source or directory designations and do not independently certify ownership. Other community, cultural and language wording is likewise attributed in `ownershipEvidence` or `notes`.

Held records document sources or destinations that were parked, inaccessible, unrelated to the business, unsupported at the address level, uncorroborated by the current official destination, currently unavailable as expressly stated by the official destination, or expressly in a closure/transition condition. Holding is a research decision, not an operational-status conclusion beyond the specific source wording quoted in the record notes.

## Research-only boundary

This pass is discovery and verification research only. It makes **no publication, pin placement, directions, account, login, payment, waitlist, deployment, licence certification, operational-hours, price, accessibility, language-fluency, immigration, health-outcome or ownership-certification claim**. A later human reviewer must determine any publication, eligibility, regulated-service, current availability and ownership questions.
