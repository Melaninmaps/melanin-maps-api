# Philadelphia city — fifth-depth source report

## Research boundary and result

This is a **research-only, protected-review package** for **Philadelphia city, Pennsylvania, United States**. It uses fresh public neighborhood, commercial-corridor, community-development-corporation, diaspora-business, and municipal-context sources. The pass retains **6** evidence-complete nonduplicate records and holds **10** leads. It is intentionally not padded.

Every retained physical-business record has a public source-supported numbered Philadelphia street address and an inspected official customer website or clearly official business-social destination. Records offering tattooing, in-home care, or tax and accounting services are routed to `regulated_review`; that routing is a cautious review label, **not** a finding about licensure, credentials, quality, safety, suitability, price, insurance, availability, outcomes, or legal status. The Fallser Club is routed to `community_resource` because its official site identifies it as a registered 501(c)(3) nonprofit. Ownership-designation text is included only where the source explicitly states it.

## Counts

| Measure | Count |
|---|---:|
| URLs reviewed or attempted | 36 |
| Fresh source families reviewed | 9 |
| Accepted candidates | 6 |
| Held leads | 10 |
| `physical_business` | 2 |
| `regulated_review` | 3 |
| `community_resource` | 1 |
| `cultural_place` | 0 |
| `online_business` | 0 |

| Accepted category | Count |
|---|---:|
| community resources | 1 |
| finance | 1 |
| healthcare | 1 |
| personal care/body art | 1 |
| retail | 1 |
| retail/food | 1 |

## Source families reviewed

The City of Philadelphia Department of Commerce explains the municipal commercial-corridor context and its support of community development corporations and business-improvement districts. It was used as context only, not as listing evidence. [1] **East Falls Development Corporation** supplied public individual merchant profiles and produced the Vault + Vine, Frequency Tattoo Company, and The Fallser Club records. [2] [3] **HACE CDC** supplied a public Fairhill and St Hugh directory with category, address, contact, and explicitly attributed ownership-designation fields; it produced 5th Street Florist and Angels On Call. [21] **Germantown United CDC** supplied a public business directory and produced A & M Berk Tax Services. [25] [26] [27]

The **Asian American Business Alliance of Greater Philadelphia** and **Asian American Chamber of Commerce of Greater Philadelphia** were read as diaspora-business sources. The former’s public member directory is under development, and the latter’s public material describes member-directory access but did not expose member records suitable for this package. [31] [32] [33] The Philadelphia Chinatown Development Corporation was read as an immigrant-community commercial-corridor source, but it did not expose a merchant directory. [34] The public Mt. Airy CDC directory route did not expose results in its extraction. [35] TECCDC’s 52nd Street directory describes a West Philadelphia business map as “Coming Soon.” [36] None of these nonproductive source-family pages supplies an accepted or held listing record.

## Accepted-record evidence ledger

| Record | Target kind | Public listing source | Official customer destination inspected |
|---|---|---|---|
| Vault + Vine | `physical_business` | East Falls profile [4] | Official café and shop site [5] |
| Frequency Tattoo Company | `regulated_review` | East Falls profile [6] | Official studio site [7] |
| The Fallser Club | `community_resource` | East Falls profile [8] | Official nonprofit venue site [9] |
| 5th Street Florist | `physical_business` | HACE public directory [21] | Official Instagram business profile [22] |
| Angels On Call | `regulated_review` | HACE public directory [21] | Official home and locations pages [23] [24] |
| A & M Berk Tax Services | `regulated_review` | Germantown United public directory [27] | Official tax-services site [28] |

Vault + Vine’s directory profile and official site agree on **3507 Midvale Avenue** and its phone. The official site describes a café, plants, gifts, and cut flowers. Frequency Tattoo Company’s source and official site agree on **4038 Ridge Avenue**, and the official site describes custom tattooing. The Fallser Club’s directory profile supplies **3721 Midvale Avenue**; its official site identifies a woman-owned and run nonprofit music venue and event space in East Falls and states that its operating entity is registered as a 501(c)(3). [4] [5] [6] [7] [8] [9]

The HACE directory labels 5th Street Florist as “Latinx-Owned Business, Women-Owned Business” and provides its **2830 N 5th Street** address and phone. Its linked official Instagram profile identifies a family-owned flower shop and describes floral arrangements. HACE and Angels On Call’s official locations page agree on the **612 W Luzerne Street** Philadelphia office and phone. [21] [22] [23] [24] The Germantown directory lists A & M Berk at **101–05 W Chelten Avenue**; its official site supplies **105 W Chelten Avenue**, which is contained within the directory’s stated range, and confirms the phone. [27] [28]

## Held-record evidence ledger

| Held lead | Listing source | Customer destination or limitation | Hold rationale |
|---|---|---|---|
| Moishe’s Pickles | East Falls profile [10] | Listed domain inspected [11] | No numbered street address; linked domain did not provide usable official customer content. |
| KGM Gaming Philadelphia | East Falls profile [19] | Official site [20] | Official site gives Bensalem and Pleasantville locations, not the listed Philadelphia location. |
| Price Contracting | East Falls profile [17] | Official site [18] | Source gives only ZIP; official site has no numbered Philadelphia location. |
| Globe Studios LLC | East Falls profile [15] | Linked domain attempted [16] | Official customer content was not usable in inspection. |
| Interior Options | East Falls profile [14] | No official link supplied | Source has address but no inspectable official customer destination. |
| Stanley’s Hardware | East Falls profile [12] | Supplied True Value route attempted [13] | Official location content was not usable in inspection. |
| Aaliyah’s Beautique | Germantown directory [27] | Supplied domain attempted [29] | Official customer content was not usable in inspection. |
| ACES Museum | Germantown directory [27] | Supplied museum domain attempted [30] | Official cultural-institution destination was not usable in inspection. |
| 3D Appliances | HACE public directory [21] | No official customer destination established | Address and HACE’s “Latinx-Owned Business” label exist, but official-destination evidence is absent. |
| 1st Stop Quick Mart | HACE public directory [21] | No official customer destination established | Source supports address and category but not the required official destination. |

A hold expresses an **evidence limitation only**. It is not a closure, activity, quality, safety, ownership, accessibility, or suitability conclusion.

## Duplicate checks against four prior passes

Before emission, the four required raw candidate files were read: `philly-city-high-yield`, `philly-city-second-depth`, `philly-city-third-depth`, and `philly-city-fourth-depth`. The validator normalized name, city, state, country, and address using Unicode folding, lowercasing, ampersand harmonization, and removal of nonalphanumeric characters. It compared every accepted row against prior normalized full tuples and conservatively screened normalized names within Philadelphia. It also screened the candidate file against itself and the held file. **No accepted record matched a prior raw candidate tuple or same-name screen, and no duplicate appeared in this output package.**

The validation additionally confirms sequential `sourceRow` values, the exact 23-label schema and label order, JSON parsing, absence of any string value equal to `"null"`, absence of coordinate-style field names, and sourceRow integrity. `jq` was run against both JSONL outputs after writing.

## Limitations

Several directories were dynamic, incomplete, under development, or lacked individual official-customer destinations. The review did not promote a lead solely because a local directory named it, even when an address or demographic designation was present. Inaccessible or unrelated web content was recorded as a verification limitation and was never treated as a conclusion that a business is closed or inactive. Search snippets and third-party review sites were not used as candidate evidence.

## Research-only statement

This package is **not published**. It created only the three local review artifacts described in the task. No production database write, API write, geocoding, coordinates, mapping, map pin, deployment, code change, authentication change, user or account change, password change, session change, waitlist change, membership change, payment action, form submission, or public record publication was performed.

## References

[1]: https://www.phila.gov/departments/department-of-commerce/for-community-organizations/commercial-corridor-management-and-cleaning/ "City of Philadelphia — Commercial corridor management and cleaning"
[2]: https://discovereastfalls.org/ "East Falls Development Corporation"
[3]: https://discovereastfalls.org/businesses/ "East Falls Business Directory"
[4]: https://discovereastfalls.org/store/vault-vine/ "East Falls Directory — Vault + Vine"
[5]: https://www.vaultandvine.co/ "Vault + Vine official customer site"
[6]: https://discovereastfalls.org/store/frequency-tattoo/ "East Falls Directory — Frequency Tattoo"
[7]: https://www.frequencytattoo.com/ "Frequency Tattoo Company official site"
[8]: https://discovereastfalls.org/store/fallser-club/ "East Falls Directory — The Fallser Club"
[9]: https://www.eastfalls.com/ "The Fallser Club official site"
[10]: https://discovereastfalls.org/store/moishes-pickles-2/ "East Falls Directory — Moishe’s Pickles"
[11]: https://www.moishespickles.com/ "Supplied Moishe’s Pickles customer domain"
[12]: https://discovereastfalls.org/store/stanleys-hardware/ "East Falls Directory — Stanley’s Hardware"
[13]: https://www.stores.truevalue.com/pa/philadelphia "Supplied Stanley’s Hardware customer route"
[14]: https://discovereastfalls.org/store/interior-options/ "East Falls Directory — Interior Options"
[15]: https://discovereastfalls.org/store/globe-studios-llc/ "East Falls Directory — Globe Studios LLC"
[16]: https://www.globestudiosllc.com/ "Supplied Globe Studios customer domain"
[17]: https://discovereastfalls.org/store/price-contracting/ "East Falls Directory — Price Contracting"
[18]: https://www.rpricecontracting.com/ "Price Contracting official site"
[19]: https://discovereastfalls.org/store/kgm-gaming-philadelphia/ "East Falls Directory — KGM Gaming Philadelphia"
[20]: https://www.kgmgaming.com/ "KGM Gaming official site"
[21]: https://www.hacecdc.org/business-directory/ "HACE CDC Fairhill & St Hugh Business Directory"
[22]: https://www.instagram.com/5thstflorist/ "5th Street Florist official Instagram"
[23]: https://angelsoncall.com/ "Angels On Call official site"
[24]: https://angelsoncall.com/locations/ "Angels On Call official locations"
[25]: https://germantowncdc.org/explore/ "Germantown United CDC — Explore"
[26]: https://germantowncdc.org/business-services/ "Germantown United CDC — Business services"
[27]: https://germantowncdc.org/directory/ "Germantown United CDC Business Directory"
[28]: https://berktax.com/ "A & M Berk Tax Services official site"
[29]: http://www.aaliyahsbeautique.com/ "Supplied Aaliyah’s Beautique customer domain"
[30]: https://www.acesmuseum.online/ "Supplied ACES Museum customer domain"
[31]: https://asianbusinessphila.com/ "Asian American Business Alliance of Greater Philadelphia"
[32]: https://asianbusinessphila.com/member-directory "Asian American Business Alliance public member directory"
[33]: https://asianchamberphila.org/ "Asian American Chamber of Commerce of Greater Philadelphia"
[34]: https://chinatown-pcdc.org/ "Philadelphia Chinatown Development Corporation"
[35]: https://mtairycdc.app.neoncrm.com/np/clients/mtairycdc/publicaccess/membershipDirectory.do?pagingPage=1&md=3&pagingNumberPer=100 "Mt. Airy CDC public business-directory route"
[36]: https://teccdc.com/community/52-st-business-directory "TECCDC 52nd Street Business Directory"
