# Mapping with Melanin: Allentown/Lehigh Valley Repair, Auto, and Mobility Discovery

**Result.** This research wave produced **19 candidate records** and **8 held leads** for one everyday-needs directory category: home repair, automotive repair and supplies, towing, passenger mobility, HVAC, plumbing, electrical, and related maintenance. The candidate file applies a conservative two-source pattern whenever an appropriate directory source was available: an opened Greater Lehigh Valley Chamber directory or cultural-business list, plus an opened official customer-facing destination. Public transit is included as a practical community mobility resource on its opened official site. One official-only automotive record, Schearer’s, is retained because its opened site directly publishes its identity, address, contact details, and inspection service; it carries no ownership designation.

## Scope and inclusion standard

The geography is limited to **Allentown, Bethlehem, Easton, and clearly Lehigh Valley-serving resources**. Each physical-business candidate has a source-supported numbered street address. Ownership and certification fields repeat only wording shown on an opened source. Empty fields are literal JSON `null`; they do not signal a negative claim. Auto providers that expressly list Pennsylvania state or emissions inspection are routed as `regulated_review`. No broader licensure, quality, price, availability, language, safety, accessibility, demographic identity, or service claim is inferred.

The source set centers on the Greater Lehigh Valley Chamber’s Black-owned list, Latinx-owned list, and automobile-services directory. The Chamber describes the Black list as a working list and the Hispanic Chamber describes its mission as supporting and strengthening the region’s business community. [1] [2] [3] The records preserve those source-specific designations rather than assigning identity from a name, image, neighborhood, or service type.

## Candidate coverage

The 19 candidates break down as follows: six Black-owned home-maintenance or repair businesses; one Black-owned and Latinx-owned maintenance business; one Latinx-owned plumbing lead; eight Chamber-directory automotive/towing/supply businesses; one official-only automotive inspection business; one family-owned home-services business; and one official public-mobility resource. The 8 held entries are deliberately excluded from the candidate count because their official destination was unavailable, stale, gated, not verifiable, or their numbered address was not supported by an opened source.

| Group | Candidate records | Evidence pattern |
| --- | ---: | --- |
| Black-owned home repair, maintenance, and mobility | 7 | Chamber Black-owned list plus official destination; Jaze also appears on the Latinx-owned list |
| Latinx-owned plumbing | 1 | Hispanic Chamber list plus official Instagram profile |
| Chamber-directory automotive, towing, and supply | 8 | Chamber automobile-services directory plus official site |
| Officially evidenced additional service/mobility resources | 3 | Official customer-facing site and contact page; Schearer’s is the official-only automotive exception |
| **Total candidates** | **19** | See `candidates-repair-auto.jsonl` |
| **Held leads** | **8** | See `held-repair-auto.jsonl` |

## Opened-source inventory

All URLs below were opened during this research wave. “Candidate evidence” means the source contributed to a retained candidate. “Held review” means it was opened to assess a lead that did not meet the inclusion standard. The reference list is also the complete URL enumeration for this report.

| Source | Use in this wave | Outcome |
| --- | --- | --- |
| Greater Lehigh Valley Chamber Black-owned businesses [1] | Candidate and held designations, addresses, and contacts | Opened; used for Black-owned records and holds |
| Greater Lehigh Valley Chamber Hispanic/Latinx-owned businesses [2] | Candidate and held designations, addresses, and contacts | Opened; used for Drain Surgeons, Jaze, and held leads |
| Greater Lehigh Valley Chamber automobile services directory [3] | Automotive/towing/supply discovery | Opened; used for 8 retained records |
| Hispanic Chamber mission page [4] | Context for the Hispanic Chamber source | Opened |
| Brothers that Just do Gutters [5] | Candidate official destination | Opened |
| Custom Weatherization [6] | Candidate official destination | Opened |
| Jaze Properties Facebook page [7] | Candidate official destination | Opened |
| JCJ Property Maintenance [8] | Candidate official destination | Opened |
| Kings Towing and Auto Repair [9] | Candidate official destination | Opened |
| Milltek Decking & Railing [10] | Candidate official destination | Opened |
| Visit Vans [11] | Candidate official destination | Opened |
| Drain Surgeons Plumbing Instagram [12] | Candidate official destination | Opened |
| Dave & Wayne Auto Center [13] | Candidate official destination | Opened |
| Wrenchtec [14] | Candidate official destination | Opened |
| A-1 Towing [15] | Candidate official destination | Opened |
| Alex Foreign Motors [16] | Candidate official destination | Opened |
| Allied Automotive [17] | Candidate official destination | Opened |
| Lehigh Fleet Services [18] | Candidate official destination | Opened |
| The Brake Shop & Auto Repair [19] | Candidate official destination | Opened |
| Jacobs Auto Supplies [20] | Candidate official destination | Opened |
| Curtis Total Service and contact page [21] [22] | Candidate service and address verification | Opened |
| Schearer’s Sales and Service [23] | Official-only candidate exception | Opened |
| LANTA and contact page [24] [25] | Community mobility resource and address verification | Opened |
| IMEC Facebook page [26] | Held: gated/non-verifiable official destination | Opened |
| One More Ride [27] | Held: no extractable content | Opened attempt; no extractable content |
| All Out Removal domain [28] | Held: parked, unrelated domain | Opened |
| Belisaire Painting and contact page [29] [30] | Held: no numbered address published | Opened |
| Albanese Easton page [31] | Held: no numbered address published | Opened |
| Lehigh Valley business-directory search [32] | Directory category availability review | Opened |

## Dedupe and routing checks

The candidate file was deduplicated within this category by normalized business name, street address, telephone number, and official destination. **Jaze Properties LLC** appears in both the Black-owned and Latinx-owned Chamber lists; it is deliberately one candidate record with both explicit source designations. **Wrenchtec** has an Easton/Forks and a Nazareth location; only the Easton/Forks location is retained. All other retained candidates have distinct names and/or addresses. No candidate was duplicated across home repair, automotive, or mobility subcategories.

The field order was checked against the requested 23-field schema in every candidate and held line. Candidate `sourceRow` values run consecutively from 1 through 19; held `sourceRow` values run consecutively from 1 through 8. The JSONL contains no coordinates and no fabricated social links. Where directory and official phone values differed, the candidate notes identify the discrepancy and the official destination’s current number was used.

## Held leads and limitations

Held leads are not rejections of the businesses. They are research controls. Dell’s Auto Care lacks an opened official customer-facing destination. IMEC’s linked Facebook URL did not expose verifiable business content. One More Ride’s listed site yielded no extractable content. All Out’s listed domain was parked and unrelated. De Jesus General Contractor lacks a numbered address in the permitted geography and an official destination. The Ortiz Ark lacks an opened official business destination. Belisaire and Albanese have valid official service pages but the opened sources did not supply the required numbered address.

Several official sites make their own marketing or service statements. This output records only neutral, discoverable terms explicitly supported by those sites; it does not evaluate quality, current availability, price, safety, accessibility, language, licensing, or suitability. The Chamber lists also identify themselves as working lists, so listings and contact information can change. Users should confirm details with a provider before relying on them. [1] [2]

## Research-only statement

This is **research only**. It made **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**. No data was uploaded or published.

## Files

| Artifact | Path | Contents |
| --- | --- | --- |
| Candidate JSONL | `/home/ubuntu/directory-research-wave-2026-09-19/allentown-expanded-everyday-needs/candidates-repair-auto.jsonl` | 19 deduplicated candidate records |
| Held JSONL | `/home/ubuntu/directory-research-wave-2026-09-19/allentown-expanded-everyday-needs/held-repair-auto.jsonl` | 8 incomplete, stale, unsupported, or unverified leads |

## References

[1]: https://www.lehighvalleychamber.org/black-owned-businesses.html "Greater Lehigh Valley Chamber — List of Black Owned Businesses"
[2]: https://www.lehighvalleychamber.org/hispanic-owned-businesses.html "Greater Lehigh Valley Chamber — List of Latinx Owned Business in the Lehigh Valley"
[3]: https://lehighvalleypacoc.wliinc16.com/Automobile-Parts,-Repairs,-Services-Detailing "Greater Lehigh Valley Chamber — Automobile Parts, Repairs, Services & Detailing"
[4]: https://www.lehighvalleychamber.org/hispanicchamber.html "Hispanic Chamber of Commerce of the Lehigh Valley — Mission"
[5]: https://lehigh-valley.brothersgutters.com/ "The Brothers that just do Gutters — Lehigh Valley"
[6]: https://www.truenergysaver.com/ "Custom Weatherization, LLC — Home"
[7]: https://www.facebook.com/people/Jaze-Properties-LLC/100063580718947/ "Jaze Properties LLC — Facebook"
[8]: https://jcjfixit.wixsite.com/jcjpropertymaintence "JCJ Property Maintenance — Home"
[9]: https://kingsautopa.wixsite.com/kingstowingpa "Kings Towing and Auto Repair — Home"
[10]: https://milltekco.com/ "Milltek Decking & Railing — Deck Builder"
[11]: https://visitvans.com/ "Visit Vans Transportation — Home"
[12]: https://www.instagram.com/drainsurgeonsplumbing/ "Drain Surgeons Plumbing — Instagram"
[13]: https://www.davenwayneautocenter.com/ "Dave & Wayne Auto Center — Home"
[14]: https://wrenchtec.com/ "Wrenchtec Automotive Services — Home"
[15]: https://a1towinglehighvalley.com/ "A-1 Towing Lehigh Valley — Home"
[16]: https://www.alexforeignmotors.com/ "Alex Foreign Motors — Home"
[17]: https://alliedautomotiveservice.com/ "Allied Automotive — Auto Repair in Allentown"
[18]: https://lehighfleetservices.com/ "Lehigh Fleet Services — Auto Repair Services in Bethlehem"
[19]: https://brakeshopandautorepair.com/ "The Brake Shop & Auto Repair — Home"
[20]: https://www.jacobsautosupplies.com/ "Jacobs Auto Supplies — Home"
[21]: https://www.curtistotalservice.com/ "Curtis Total Service — Plumbing, HVAC, and Electrical"
[22]: https://www.curtistotalservice.com/contact/ "Curtis Total Service — Contact"
[23]: https://www.schearers.com/ "Schearer’s Sales and Service — European Automotive Service Center"
[24]: https://lantabus.com/ "LANTA — Public Transit and LANtaVan"
[25]: https://lantabus.com/contact-us/ "LANTA — Contact Us"
[26]: https://www.facebook.com/imecpower "IMEC Power — Facebook"
[27]: http://www.onemorerides.com/ "One More Ride — Listed Business Website"
[28]: http://www.alloutremoval.com/ "All Out Removal — Parked Domain"
[29]: https://www.belisairepaintingpa.com/ "Belisaire Painting & Bathtub Refinishing — Home"
[30]: https://www.belisairepaintingpa.com/contact-us "Belisaire Painting & Bathtub Refinishing — Contact"
[31]: https://www.albanesecontracting.com/hvac-contractor-in-easton-pa "Albanese Electrical & Mechanical Contractor — Easton HVAC Contractor"
[32]: https://web.lehighvalleychamber.org/search "Greater Lehigh Valley Chamber — Business Directory Search"
