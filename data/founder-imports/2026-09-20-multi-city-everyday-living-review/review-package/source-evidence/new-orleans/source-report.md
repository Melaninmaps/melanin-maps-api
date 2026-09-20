# New Orleans, LA — Everyday-Life Research Source Report

## Scope and research boundary

This is a **research-only** inventory for New Orleans, Louisiana and source-supported nearby destinations in Jefferson, Metairie, and Jean Lafitte. It was created for later review only. It does **not** create, alter, geocode, pin, publish, or suppress directory records; it does not connect to any directory database. Both JSONL files contain **no coordinates**.

## Count reconciliation

| File | Count | Basis |
|---|---:|---|
| `candidates.jsonl` | 40 | Current official customer, official organization, government, or named official-directory evidence plus a numbered physical address (except no online-only records were used). |
| `held-candidates.jsonl` | 4 | Plausible leads retained because a current official customer destination, current address, or both could not be verified. |
| Total researched records | 44 | 40 candidates + 4 holds. |

Candidate coverage by primary category is reconciled below.

| Primary category | Candidates | Coverage notes |
|---|---:|---|
| Food and drink | 12 | Black-source-supported Creole/Soul and Senegalese options; Ethiopian; Mexican, taco, Colombian-rooted Latin-Caribbean, and Spanish/Southwestern options. Published price evidence spans Felipe’s $3 happy-hour tacos, Morrow’s $10+ menu item, and Dakar’s $175 tasting menu. No unstated price band was inferred. |
| Health, legal, and difficult-day support | 6 | Community health/behavioral-health/dental destinations, civil legal aid, survivor services, and reentry assistance. All health, dental, and legal destinations are marked `regulated_review`. |
| Employment and education | 1 | Technical workforce and career training. Café Reconcile also supports youth workforce training and is counted in food/drink for its physical café. |
| Fitness and beauty | 5 | Fitness club, city recreation fitness site, natural-hair/barber services, and two nail salons. |
| Arts, music, museums, family, and youth | 10 | Art, children’s, jazz, and African American museums; jazz/live-music venues; interactive art; ballet; gymnastics; and free youth baseball/softball instruction. |
| Travel, mobility, household, and nearby day trip | 6 | Hotel, two vehicle-repair options in the nearby metro, city towing retrieval, dry cleaning, and an NPS wetlands day-trip trail. |
| **Total** | **40** | Counts are mutually exclusive by the record’s primary category. |

## Sources read and evidence use

Discovery used the official New Orleans & Company multicultural/food guides, NPS, city-government and institutional sources, plus limited established editorial discovery. Every included candidate was then checked against an official customer, official organization, government, or named official-organization directory destination as recorded in the row’s `sourceUrl`.

| Source family | URLs read | Evidence use |
|---|---|---|
| New Orleans & Company | [Black-owned restaurant guide](https://www.neworleans.com/things-to-do/multicultural/black-owned-businesses-in-new-orleans/black-owned-restaurants-in-new-orleans/); [Hispanic-owned restaurant guide](https://www.neworleans.com/things-to-do/multicultural/hispanic-heritage-in-new-orleans/hispanic-owned-restaurants-in-new-orleans/) | Credible tourism discovery and direct Black-owned guide context. Official customer sites supplied candidate operational/location evidence. |
| Official restaurant/customer sites | [Dooky Chase’s](https://www.dookychaserestaurants.com/), [Lil’ Dizzy’s](https://www.lildizzyscafe.net/), [Café Reconcile](https://cafereconcile.org/), [Dakar](https://www.dakarnola.com/reservations/), [Acamaya](https://www.acamayanola.com/), [Felipe’s](https://felipestaqueria.com/locations/louisiana/french-quarter-new-orleans/), [Baru](https://www.barutapasnola.com/), [Santa Fe](https://santafenola.com/) | Food type, address, ordering/reservations, published pricing only where available, and stated ownership/owner details where present. |
| Health/community/government | [CrescentCare](https://www.crescentcare.org/), [HOPE Community Health Center](https://hope-chc.org/), [Family Justice Center](https://www.nofjc.org/), [First 72+](https://www.first72plus.org/contact), [SLLS official directory entry](https://www.laep.uscourts.gov/content/southeast-louisiana-legal-services), [NORDC Fitness](https://nordc.org/programs-activities/fitness), [City towing](https://nola.gov/find-my-towed-vehicle/) | Services, location, eligibility/age where published, crisis/reentry context, and government process information. |
| Museums/music/youth | [NOMA](https://noma.org/visit/visitor-information/), [LCM](https://lcm.org/), [Jazz Museum](https://nolajazzmuseum.org/visit), [NOAAM](https://www.noaam.org/visit-noaam), [Preservation Hall](https://www.preservationhall.com/), [Tipitina’s](https://tipitinas.com/), [Music Box Village](https://musicboxvillage.com/), [New Orleans School of Ballet](https://www.neworleansschoolofballet.com/), [NOLA Gymnastics](https://www.iflipuptown.com/), [MLB Youth Academy](https://www.mlb.com/mlb-youth-academy/new-orleans) | Current visits, admissions/accessibility where published, performances, youth programming, and numbered locations. |
| Travel/practical/nearby | [Four Seasons](https://www.fourseasons.com/neworleans/), [Uptown Auto Specialist](https://myuptownauto.com/), [C.A.R.S.](https://neworleansautorepair.net/), [Young’s](https://www.youngsdrycleaning.com/stores), [NPS Barataria Preserve](https://www.nps.gov/jela/planyourvisit/barataria-preserve.htm) | Lodging, mobility, garment-care, and source-supported nearby-day-trip context. |

## Specific evidence notes

**Black food coverage** is not inferred from names, cuisine, or staff. Dooky Chase’s and Lil’ Dizzy’s are designated Black-owned only because New Orleans & Company’s explicitly titled Black-owned guide is cited in `ownershipEvidence`; their own sites separately substantiate locations and family operation. Dakar’s Black-owned designation is likewise sourced to that guide. Addis was discovered through the guide but has no ownership designation in the JSONL because the available official-site wording did not directly establish an ownership designation for Addis itself. Neyow’s was not labeled Black-owned because the only wording located on its official page occurred in a private review, which this contract forbids using.

**Hispanic/Latin food coverage** does not require an ownership claim. Acamaya’s official site identifies Mexico City/Gulf influences; Felipe’s, Barracuda, Baru, and Santa Fe provide customer-facing cuisine evidence. Baru’s official site directly names Chef & Owner Edgar Caro and Cartagena/Latin-Caribbean roots, but no ethnicity/ownership designation was inferred.

**Regulated-service routing** is intentional: CrescentCare, HOPE Community Health Center, Louisiana Dental Center, and Southeast Louisiana Legal Services are `regulated_review`, not publish-ready professional listings. No clinician, dentist, attorney, or counselor identity/credential was invented or extracted.

**Nearby scope** is source-supported rather than assumed: Uptown Auto Specialist’s own site identifies Jefferson; C.A.R.S. identifies Metairie; NPS identifies the Wetland Trace Boardwalk in Jean Lafitte and discloses current Barataria closures/relocation context.

## Holds

| Held lead | Reason it remains held |
|---|---|
| Maïs Arepas | Tourism discovery evidence gives a numbered address, but the apparent official customer site did not resolve in this research session. Current official identity/address needs confirmation. |
| El Pavo Real | Official site and contact page were available, but neither supplied a numbered street address. |
| Sweet Soulfood | Apparent official site could not be read, preventing confirmation of current address and services. |
| La Cocinita | Apparent official site did not resolve, preventing confirmation of an official customer destination and current address. |

## Overlap risk and limitations

The New Orleans target folder had no pre-existing candidate or hold file when checked, so no direct record-level overlap with existing city research could be reconciled. Source-path overlap exists for the notable food destinations Dooky Chase’s, Addis, Lil’ Dizzy’s, and Dakar: each was discovered through New Orleans & Company and then checked on its own official customer page. This is documented rather than treated as duplicate evidence. The same approach was used for institutional discovery where relevant.

Search snippets were used only to discover possible sources; they were not used as candidate evidence. Some official sites were inaccessible or did not disclose a numbered street address; those plausible leads were held rather than promoted. Operating details, admissions, event age limits, price, availability, and accessibility can change and should be rechecked by any later review. The inventory is broad but not exhaustive; no generic chains, unsupported ownership claims, map pins, coordinates, vague service-area records, or invented provider attributes were added.
