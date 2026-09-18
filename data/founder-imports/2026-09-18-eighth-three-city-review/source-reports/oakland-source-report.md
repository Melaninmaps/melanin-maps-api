# Oakland and Nearby East Bay Source Report

**Result.** This research-only wave retains **11** source-backed places and resources for Oakland and nearby East Bay communities, and holds **3** records for unresolved verification. The retained set deliberately covers retail, food and drink, arts and culture, and community support rather than concentrating on restaurants. **This work is research only: it was not staged, published, or otherwise externally written.**

## Retained coverage

| Target kind | Count |
|---|---:|
| business | 4 |
| cultural_place | 3 |
| community_resource | 4 |
| **Total** | **11** |

| Category | Count |
|---|---:|
| arts_and_culture | 4 |
| community_support | 4 |
| food_and_drink | 2 |
| shopping | 1 |
| **Total** | **11** |

The two mapless retained resources are **Black Cultural Zone** and **The Betti Ono Foundation**. Each has an explicit Oakland context and a current public first-party destination, but neither supplies a current organization street address; no project, historic, inferred, or coordinate-based address was substituted. The Oakland Latino Chamber was inspected as a public resource source but was not retained in this limited pass because its available address is a post-office box rather than a numbered street location, and its material did not add a distinct candidate beyond the retained community-resource set.

## Held records

**Betti Ono Gallery** is held because Visit Oakland lists a gallery at 1427 Broadway while the organization’s current official site describes the physical Downtown Oakland venue as operating from 2011–2021. **Marcus Books** is held because its official retail website directly supports the Black-owned designation but the inspected pages did not provide a verified numbered Oakland street address. **alaMar Dominican Kitchen** is held because its Visit Oakland listing provides a linked first-party site, but that official site returned no extractable material when opened. The held JSONL records the full reason for each; none is a map-ready candidate.

## Duplicate and data checks

A feasible exact duplicate check was completed against the pre-existing local city JSONL research under `/home/ubuntu/directory-research-wave-2026-09-18/`. The comparison normalized **name + city + state + address** by lowercasing and removing non-alphanumeric characters. It compared the 11 retained records against 1341 existing records from other city directories and found **0 exact normalized duplicates**. It also found no duplicate retained keys within this Oakland file. Every line in both final JSONL files was parsed after serialization; all lines are valid UTF-8 JSON objects.

## Inspected sources and support

All **25** URLs below were opened and inspected; no search-result snippet was treated as evidence. Sources marked “retained support” provide the address, designation, public destination, or service context used by a retained row. Sources marked “hold support” document why the named record is held. Sources marked “context only” were inspected but did not create a retained record.

| Ref. | Inspected URL | Support outcome |
|---|---|---|
| [1] | Visit Oakland Black-owned downtown tour | Retained context for the tourism-publisher list and the reviewed Black-owned business set. |
| [2] | AAMLO official page | Retained support for the official cultural-place description, address, phone, events, and visit destination. |
| [3] | Black Cultural Zone official home | Retained support for its East Oakland/Black culture context and mapless public organization destination. |
| [4] | La Peña Cultural Center official home | Retained support for the Berkeley cultural-place address and public events destination. |
| [5] | Oakland Latino Chamber official home | Context only; inspected public chamber source, but no distinct candidate retained in this small pass. |
| [6] | SSCF official home | Retained support for the Oakland community-resource address, public service context, and contact destination. |
| [7] | Visit Oakland Juntos listing | Corroborating retained support for Juntos’ named cultural-center identity, address, phone, and official website link. |
| [8] | Visit Oakland Renegade listing | Retained support for the Oakland retail address, official destination link, and publisher’s Black-owned label. |
| [9] | Visit Oakland Joyce Gordon listing | Retained support for the gallery address, phone, official social destinations, and publisher designations. |
| [10] | Visit Oakland Betti Ono listing | Hold support because the listing’s physical-gallery information conflicts with the current official-site history. |
| [11] | Visit Oakland Sobre Mesa listing | Retained support for address, phone, official destination, and publisher’s Black- and Latin-owned labels. |
| [12] | Visit Oakland alaMar listing | Hold support: supplies a tourism listing and linked official destination, but first-party validation remained insufficient. |
| [13] | Juntos official home | Retained support for a current public inquiry destination and numbered Oakland address. |
| [14] | Marcus Books official home | Hold support for the retailer’s direct Black-owned designation and customer site, but no verified numbered Oakland address. |
| [15] | Red Bay Coffee official home | Corroborating retained support for the business’s direct Black-owned designation and customer commerce destination. |
| [16] | OAACC official home | Retained support for chamber identity, Oakland office address, and public small-business resource destination. |
| [17] | Renegade Running official home | Retained support for a current customer-facing retail destination. |
| [18] | Joyce Gordon Gallery official home | Opened; no extractable text returned. The retained row relies on the inspected tourism listing and official social destinations it links. |
| [19] | Betti Ono Foundation official home | Retained support for the current mapless foundation record; also establishes past-tense venue history supporting the held gallery record. |
| [20] | Sobre Mesa official home | Retained support for the official dining/reservation destination and Oakland location. |
| [21] | alaMar official home | Opened; no extractable text returned. This result is the basis for holding rather than retaining alaMar. |
| [22] | Marcus Books visit page | Opened; no extractable text returned. The missing verified physical address remains unresolved. |
| [23] | Red Bay Coffee official cafés page | Retained support for the Grand Ave Oakland location and customer-ordering destination. |
| [24] | Oakland Latino Chamber contact page | Context only; confirms public chamber contact/resource destination and post-office-box mailing address. |
| [25] | Black Cultural Zone events page | Retained support for a current public events destination; no organization street address was supplied. |

## Limitations

A public listing, tourism label, chamber description, or self-description is a source basis for inclusion only. It is not an independent certification of ownership, identity, present operations, quality, price, hours, availability, accessibility, language capability, licensure, legal eligibility, or outcomes. Publisher and business designations are preserved only where supplied. No coordinates, pins, directions data, inferred addresses, or operational-status claims were created. Some customer destinations are online inquiry, events, or retail sites; their current accessibility and fulfillment were not independently tested.

## References

[1]: https://www.visitoakland.com/things-to-do/tours/self-guided/downtown-oakland-tour/ "Visit Oakland — Tour Black-Owned Businesses in Downtown Oakland"
[2]: https://oaklandlibrary.org/aamlo/ "Oakland Public Library — African American Museum and Library at Oakland"
[3]: https://www.blackculturalzone.org/ "Black Cultural Zone — Official Website"
[4]: https://lapena.org/ "La Peña Cultural Center — Official Website"
[5]: https://oaklandlatinochamber.com/ "Oakland Latino Chamber of Commerce — Official Website"
[6]: https://sscf.org/ "East Bay Spanish Speaking Citizens' Foundation — Official Website"
[7]: https://www.visitoakland.com/listing/juntos-fruitvale-cultural-arts-center/8053/ "Visit Oakland — Juntos Fruitvale Cultural Arts Center"
[8]: https://www.visitoakland.com/listing/renegade-running/5785/ "Visit Oakland — Renegade Running"
[9]: https://www.visitoakland.com/listing/joyce-gordon-gallery/901/ "Visit Oakland — Joyce Gordon Gallery"
[10]: https://www.visitoakland.com/listing/betti-ono-gallery/1041/ "Visit Oakland — Betti Ono Gallery"
[11]: https://www.visitoakland.com/listing/sobre-mesa/5773/ "Visit Oakland — Sobre Mesa"
[12]: https://www.visitoakland.com/listing/alamar-dominican-kitchen/1150/ "Visit Oakland — alaMar Dominican Kitchen"
[13]: https://juntosfruitvale.org/ "Juntos Fruitvale Cultural Arts Center — Official Website"
[14]: https://www.marcusbooks.com/ "Marcus Books — Official Website"
[15]: https://www.redbaycoffee.com/ "Red Bay Coffee — Official Website"
[16]: https://oaacc.org/ "Oakland African American Chamber of Commerce — Official Website"
[17]: https://renegade-running.com/ "Renegade Running — Official Website"
[18]: http://www.joycegordon.gallery/ "Joyce Gordon Gallery — Official Website"
[19]: http://www.bettiono.com/ "The Betti Ono Foundation — Official Website"
[20]: https://www.sobremesaoak.com/ "Sobre Mesa — Official Website"
[21]: http://www.alamaroakland.com/ "alaMar Dominican Kitchen — Official Website"
[22]: https://marcusbooks.com/visit "Marcus Books — Visit Page"
[23]: https://www.redbaycoffee.com/pages/cafes "Red Bay Coffee — Cafés"
[24]: https://oaklandlatinochamber.com/contact/ "Oakland Latino Chamber of Commerce — Contact"
[25]: https://www.blackculturalzone.org/events "Black Cultural Zone — Upcoming Events"
