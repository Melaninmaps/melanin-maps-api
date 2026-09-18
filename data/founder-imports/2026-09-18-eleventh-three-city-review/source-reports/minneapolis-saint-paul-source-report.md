# Minneapolis–Saint Paul Mapping with Melanin Source Pass

**Prepared by Manus AI**

## Result

This research-only pass retained **27 records** for Minneapolis, Saint Paul, and the clearly supported nearby suburb of Bloomington. The retained set contains commercial businesses, community resources, one cultural place, and one regulated-review record. It also preserves **15 held candidates** where a source conflict, inaccessible official destination, unreliable address, or explicit access limitation prevented responsible retention. No conclusion is made about a business’s current operations, hours, accessibility, prices, availability, or licensure unless stated on an inspected source; those matters are outside this source pass.

The public discovery sources explicitly frame their lists as Black-owned-businesses resources, Hispanic-owned-or-supported-businesses resources, or Latino-community resources as stated in the relevant records. Those terms are source-supported context, not independent ownership certification. The Dripping Root and CLUES are the limited exceptions where their inspected official websites themselves use the recorded Black-owned/woman-owned and Latino-led language, respectively. The neighborhood, cultural, language, and community descriptions in individual records likewise reproduce only inspected public wording.

## Counts

| Target kind | Retained count |
| --- | ---: |
| business | 21 |
| community_resource | 4 |
| cultural_place | 1 |
| regulated_review | 1 |
| **Total retained** | **27** |
| **Held** | **15** |

| Category | Retained count |
| --- | ---: |
| food_and_drink | 12 |
| retail | 7 |
| community_resources | 4 |
| professional_services | 2 |
| arts_and_culture | 1 |
| beauty | 1 |
| **Total retained** | **27** |

## Scope and evidence method

Discovery began with public local destination, community, and editorial directories. Each retained commercial entry has a numbered street address, customer-facing official website or official business-social destination, a public discovery source URL, and no known conflict in the inspected facts. A street address appearing in both a directory and an official site was treated as consistent. Where the source gave a clear address and the official site did not contradict it, the source address is preserved with a record note explaining that evidence pattern. Minneapolis and Saint Paul were in scope. Bloomington was retained only where the Minnesota United public directory and the official Levels destination both supported the Mall of America context; no other out-of-scope brand locations were added.

Community resources and the cultural place are deliberately not treated as commercial map pins. Grooming House is classified **regulated_review** because barber services are regulated; this is an evaluation queue classification, not a declaration that any individual or business is licensed. The pass did not use directions, databases, APIs, coordinates, map pins, logins, payments, user accounts, or publication/deployment actions.

### Duplicate method

Before writing, all pre-existing JSONL records under `/home/ubuntu/directory-research-wave-2026-09-18/` were scanned except this pass’s own output folder. This covered **2,772 prior records**. The comparison key was the normalized compound of `name + city + state + address`: lowercase strings with all non-alphanumeric characters removed. Retained records were also compared against one another with the same rule. The final parser re-ran the cross-folder comparison and found **no retained exact normalized duplicate**. The JSONL files were parsed line by line after writing; all **27 candidate** and **15 held** rows are valid JSON and have the required field set.

## Retained evidence

The retained commercial set includes food and drink, retail, professional-services, and recreation-adjacent retail/venue entries. Source and official-destination URLs appear in every row of `candidates.jsonl`; selected evidentiary patterns are summarized below.

| Evidence pattern | Retained examples |
| --- | --- |
| Visit Saint Paul listing + matching official business site | Black Garnet Books, Bouquets by Carolyn, Flava Café, La Boulangerie Marguerite, MetroNOME Brewery, The Coven |
| Minnesota United Black-business list + matching official business site | Nashville Coop, Tommie’s Pizza, 2 Scoops Eatery, Kobi Co., STUDIIYO23, Levels, The Dripping Root, The B Suite |
| Minnesota United Hispanic-business list + matching official business site | Tacos El Primo, Manny’s Tortas, Fanni’s Mini Market, El Burrito Mercado |
| Public source + official organization/cultural destination | Cookie Cart, CLUES, LatinoLEAD, Centro Tyrone Guzman, Penumbra |
| Official business-social profile inspected as the customer-facing destination | Demera was inspected but moved to held due to conflicting public phone facts; no business-social-only entry was retained in the final set. |

**Cookie Cart** is a retained community resource because Visit Saint Paul lists its Saint Paul bakery at 946 Payne Avenue and its official site explicitly describes first-job experience and leadership training in Minneapolis and Saint Paul bakeries. **Penumbra** is a retained cultural place, not a business map pin: its official contact page gives 270 North Kent Street, and the official description refers to professional productions through the prism of the African American experience. **CLUES**, **LatinoLEAD**, and **Centro Tyrone Guzman** are retained community resources because their official destinations identify programs and official locations. They are not commercial map pins.

## Held evidence

A candidate was held rather than guessed whenever reconciliation failed.

| Held candidate | Reason retained in `held-candidates.jsonl` |
| --- | --- |
| Soul Bowl | Minnesota United lists 701 Plymouth Avenue North; the official website lists 428 South 2nd Street. |
| Strive Bookstore | Minnesota United lists 901 Nicollet Mall; the official site says the bookstore moved to 825 Nicollet Mall, Suite 160. |
| Pimento Jamaican Kitchen | Visit Saint Paul lists a Saint Paul address, while the official locations page lists Minneapolis locations only. |
| West Indies Soul Food | The directory’s ZIP/location presentation conflicts with the official site’s 839 University Avenue West, St. Paul, MN 55104. |
| Taqueria y Birrieria Las Cuatro Milpas | The community source identifies Minneapolis; the official site identifies Bloomington. |
| Fit 1st Running | The inspected official page displays two different Minneapolis addresses. |
| Afro Deli & Grill | The source has 5 West 7th Place; the official site says the Saint Paul location moved, without establishing the current address in the inspected material. |
| Get Down Coffee Co. | The official site identifies the listed address but says “Closed For Construction.” |
| Taqueria Marquez | The source supports Saint Paul, but the inspected official site yielded no readable public content and no reliable numbered address. |
| La Doña Cervecería | The state editorial source supports Minneapolis cultural programming, but the proposed official destination could not be resolved for inspection. |
| Minnesota African American Heritage Museum and Gallery | The state source describes the institution but the official site could not be resolved and the source article does not supply a numbered address. |
| Pretty Girls Boutique | The source supports an online boutique but does not establish a Twin Cities locality; the proposed official destination yielded no readable public content. |
| A to Z Housing | The individual public directory listing was blocked by a security check; no official customer-facing destination or numbered address was established. |
| Taqueria Los Ocampo | Both inspected sources support a Lake Street Minneapolis location, but neither supplied a reliable numbered street address. None was inferred. |
| Demera Ethiopian Restaurant & Bar | The source/official Facebook inspection yielded inconsistent public phone evidence: 651-224-6224 in profile intro and 651-434-4170 on a public post graphic. |

## Inspected URLs

Every URL below was opened directly during this pass. The two source destinations marked inaccessible were still inspected, and their resulting limitations are reflected in held records. Several URLs that exposed addresses through map-link anchors were treated as text evidence only; no directions or mapping action was taken.

### Public discovery and destination sources

| URL | Result and use |
| --- | --- |
| https://mnblackbusiness.com/ | Opened. Directory identifies itself as a centralized directory of Black business owners and entrepreneurs; individual A to Z Housing page subsequently blocked. |
| https://www.minneapolis.org/support-black-lives/black-owned-boutiques-shops/ | Opened. Meet Minneapolis Black-owned boutiques/shops discovery source; used especially for held Fit 1st Running and Pretty Girls Boutique review. |
| https://www.visitsaintpaul.com/things-to-do/shopping/black-owned-businesses/ | Opened. Visit Saint Paul Black-owned-businesses listing; source for Saint Paul candidates and held reconciliation. |
| https://www.exploreminnesota.com/article/how-to-support-black-owned-businesses-minnesota | Opened. State destination/editorial source for Penumbra and the held museum reconciliation. |
| https://mspmag.com/arts-and-culture/black-owned-businesses-in-the-twin-cities/ | Opened. Twin Cities editorial discovery source; read for candidate discovery only, with individual official destinations used for evidence. |
| http://latinochambermn.chambermaster.com/list | Opened. Latino Chamber public directory landing page; reviewed for category coverage and directory context. |
| https://mnlatinos.com/ | Opened. Latino-owned businesses and resources discovery directory; reviewed for discovery and context. |
| https://www.exploreminnesota.com/culture-heritage/ways-to-support-latino-community | Opened. State tourism Latino-community editorial source; used for cultural/resource discovery and La Doña hold. |
| https://www.mnufc.com/community/hispanic-owned-businesses | Opened. Minnesota United Hispanic-owned-or-supported community list; retained and held source as identified in rows. |
| https://www.mnufc.com/community/black-owned-businesses | Opened. Minnesota United Black-owned-businesses community list; retained and held source as identified in rows. |
| https://spokesman-recorder.com/black-business-directory/ | Opened. Public Black-business directory landing page; reviewed for discovery coverage. |
| https://www.exploreminnesota.com/profile/penumbra-theatre-company/1864 | Opened. Destination profile supporting Penumbra discovery and its address. |
| https://mnblackbusiness.com/businesses/a-to-z-housing/ | Opened; security-check page blocked listing inspection, therefore held. |

### Official commercial and organization destinations inspected

| URL | Result and use |
| --- | --- |
| https://www.blackgarnetbooks.com/ | Opened; official bookstore and 1319 University Avenue West address. |
| https://www.bouquetsbycarolyn.net/ | Opened; official florist, 920 Selby Avenue, phone. |
| https://cookiecart.org/ | Opened; official youth-work/leadership description and Minneapolis address; Saint Paul address came from Visit Saint Paul. |
| https://www.flavacafe.org/ | Opened; official 623 University Avenue West address and youth/career description. |
| http://www.groominghouse.biz/ | Opened; official business destination and Instagram link. |
| https://www.groominghouse.biz/location-hours | Opened; no extractable content, so it was not used as address evidence. |
| https://www.hyacinthstpaul.com/ | Opened; official restaurant destination. |
| https://la-marg.com/ | Opened; official Saint Paul and Minneapolis bakery addresses. |
| https://lipesteem.com/ | Opened; official cosmetics retail destination and official social links. |
| https://lipesteem.com/pages/contact-us | Opened; page did not add an address. |
| https://metronomebrewery.com/ | Opened; official 385 Broadway Street location and phone. |
| https://pimento.com/ | Opened; official locations page established Minneapolis locations, producing a Saint Paul source conflict. |
| http://www.afrodeli.com/ | Opened; official company/locations content, including notice that Saint Paul moved down the street. |
| https://theurbanlightsmusic.com/ | Opened; official music retail destination, no conflicting address supplied. |
| https://www.thecoven.com/ | Opened; official St Paul location and coworking/event-space description. |
| https://penumbratheatre.org/ | Opened; official African American experience description. |
| https://penumbracenter.org/contact/ | Opened; official 270 North Kent Street contact/location evidence. |
| https://fit1strunning.com/ | Opened; two different Minneapolis addresses appeared, so held. |
| https://tommiespizza.com/ | Opened; official 1556 Selby Avenue location/phone. |
| https://www.westindiessoulfoods.com/ | Opened; official 839 University Avenue West address producing a source-location conflict. |
| https://www.nashvillecoop.com/ | Opened; official Saint Paul location/address/phone. |
| https://www.facebook.com/DemeraMN/ | Opened; official Facebook restaurant profile. Conflicting public phone facts triggered a hold. |
| https://soulbowlmn.com/ | Opened; official 428 South 2nd Street address producing a source address conflict. |
| https://www.taquerialosocampo.com/ | Opened; official cuisine/history site but no reliable numbered Minneapolis street address in inspected content. |
| https://mannystortas.com/ | Opened; official 920 East Lake Street, #125 address/phone. |
| https://www.fannisminimarket.com/ | Opened; official 2820 East 42nd Street address/phone. |
| https://www.tacoselprimo.com/ | Opened; official Minneapolis locations and phone. |
| https://www.marquezgrillmn.com/ | Opened; no extractable content, therefore held. |
| https://4milpasmn.com/ | Opened; official Bloomington address conflicting with Minneapolis source locality. |
| https://www.elburritomercado.com/ | Opened; official 175 Cesar Chavez Street address/phone. |
| https://clues.org/ | Opened; official Latino-led nonprofit/programmatic and St Paul address evidence. |
| https://www.thedrippingrootjuicebar.com/ | Opened; official Black-owned/woman-owned wording and 4002 Minnehaha Avenue address. |
| https://strivepubandco.com/bookstore | Opened; official 825 Nicollet Mall, Suite 160 location and moved-location notice. |
| https://www.lovekobico.com/ | Opened; official 48 South 9th Street store and mother-daughter company description. |
| https://sliceminneapolis.com/ | Opened; no extractable content. No Slice Brothers record was retained or held because this was discovery-only and not otherwise evaluated. |
| https://getdowncoffee.com/ | Opened; official address and “Closed For Construction” notice, so held. |
| https://www.b-suite.co/ | Opened; official Black-professionals cultural hub/co-working description. |
| https://2scoopseatery.com/ | Opened; official 921 Selby Avenue location and family-owned description. |
| https://studiiyo23.com/ | Opened; official Minneapolis fashion/sneaker address and site description. |
| https://www.levelsfashion.com/ | Opened; customer-facing apparel destination branded for Mall of America, no conflicting address. |
| https://www.latinoleadmn.org/ | Opened; official leadership/advocacy description and Saint Paul address. |
| https://www.centromn.org/ | Opened; official Minneapolis address and intergenerational programs. |
| https://maaahmg.org/ | Opened; hostname did not resolve to a public IP during inspection, so held. |
| https://newrulesmpls.com/ | Opened; hostname did not resolve to a public IP during inspection. No New Rules record was retained or held because no complete candidate was constructed. |
| https://www.shopprettygirlsboutique.com/ | Opened; no extractable content, reinforcing the locality/official-destination hold. |
| https://www.ladonacerveceria.com/ | Opened; hostname did not resolve to a public IP during inspection, so held. |

## Research-only boundary

The three accompanying files are **research artifacts only**. This pass created no public map, map pin, geocoding or coordinate data, directions request, database, API, user/account/login/password, payment flow, waitlist, or deployment. It does not publish, contact, transact with, authenticate to, certify, endorse, or make operational claims about any listed entity. Held records are not recommendations or negative findings; they are unresolved leads preserved to avoid fabrication.

## References

[1]: https://www.visitsaintpaul.com/things-to-do/shopping/black-owned-businesses/ "Black-Owned Businesses — Visit Saint Paul"
[2]: https://www.mnufc.com/community/black-owned-businesses "Black-Owned Businesses & Resources — Minnesota United FC"
[3]: https://www.mnufc.com/community/hispanic-owned-businesses "Hispanic-Owned Businesses & Resources — Minnesota United FC"
[4]: https://www.exploreminnesota.com/article/how-to-support-black-owned-businesses-minnesota "How to Support Black-Owned Businesses in Minnesota — Explore Minnesota"
[5]: https://www.exploreminnesota.com/culture-heritage/ways-to-support-latino-community "12 Ways to Support and Celebrate Minnesota’s Latino Community — Explore Minnesota"
[6]: https://www.minneapolis.org/support-black-lives/black-owned-boutiques-shops/ "Shop at These Black-Owned Minneapolis Boutiques and Stores — Meet Minneapolis"
[7]: https://mnblackbusiness.com/ "Minnesota Black-Owned Business Directory"
[8]: https://mnlatinos.com/ "Minnesota Latinos"
[9]: http://latinochambermn.chambermaster.com/list "Business Directory Search — Latino Chamber of Commerce Minnesota"
[10]: https://spokesman-recorder.com/black-business-directory/ "MSR Black Business Directory"
[11]: https://penumbracenter.org/contact/ "Contact — Penumbra"
[12]: https://clues.org/ "Home — Comunidades Latinas Unidas En Servicio"
[13]: https://www.latinoleadmn.org/ "LatinoLEAD"
[14]: https://www.centromn.org/ "Centro Tyrone Guzman"
[15]: https://www.thedrippingrootjuicebar.com/ "The Dripping Root"
[16]: https://strivepubandco.com/bookstore "Strive Bookstore"
[17]: https://soulbowlmn.com/ "Soul Bowl"
[18]: https://pimento.com/ "Pimento Jamaican Kitchen"
[19]: https://www.westindiessoulfoods.com/ "West Indies Soul Food INC"
[20]: https://4milpasmn.com/ "Taqueria Y Birrieria Las Cuatro Milpas"
[21]: https://fit1strunning.com/ "Fit 1st Running"
[22]: https://www.afrodeli.com/ "Afro Deli & Grill"
[23]: https://getdowncoffee.com/ "The Get Down Coffee Co."
[24]: https://www.facebook.com/DemeraMN/ "Demera Ethiopian Restaurant & Bar"
[25]: https://www.blackgarnetbooks.com/ "Black Garnet Books"
[26]: https://www.bouquetsbycarolyn.net/ "Bouquets by Carolyn"
[27]: https://cookiecart.org/ "Cookie Cart"
[28]: https://www.flavacafe.org/ "Flava Café"
[29]: http://www.groominghouse.biz/ "Grooming House"
[30]: https://la-marg.com/ "La Boulangerie Marguerite"
[31]: https://metronomebrewery.com/ "MetroNOME Brewery"
[32]: https://www.nashvillecoop.com/ "Nashville Coop"
[33]: https://tommiespizza.com/ "Tommie’s Pizza"
[34]: https://www.thecoven.com/ "The Coven"
[35]: https://2scoopseatery.com/ "2 Scoops Eatery"
[36]: https://www.lovekobico.com/ "Kobi Co."
[37]: https://studiiyo23.com/ "STUDIIYO23"
[38]: https://www.levelsfashion.com/ "Levels | Mall of America"
[39]: https://www.tacoselprimo.com/ "Tacos El Primo"
[40]: https://mannystortas.com/ "Manny’s Tortas"
[41]: https://www.fannisminimarket.com/ "Fanni’s Mini Market"
[42]: https://www.elburritomercado.com/ "El Burrito Mercado"
[43]: https://theurbanlightsmusic.com/ "Urban Lights Music"
[44]: https://mspmag.com/arts-and-culture/black-owned-businesses-in-the-twin-cities/ "Where to Support Black-Owned Businesses in the Twin Cities — Mpls.St.Paul Magazine"
[45]: https://www.exploreminnesota.com/profile/penumbra-theatre-company/1864 "Penumbra Theatre Company — Explore Minnesota"
[46]: https://mnblackbusiness.com/businesses/a-to-z-housing/ "A to Z Housing — Minnesota Black-Owned Business Directory"
[47]: https://www.marquezgrillmn.com/ "Taqueria Marquez"
[48]: https://maaahmg.org/ "Minnesota African American Heritage Museum and Gallery"
[49]: https://www.shopprettygirlsboutique.com/ "Pretty Girls Boutique"
[50]: https://www.ladonacerveceria.com/ "La Doña Cervecería"
