# Los Angeles County luxury hotels & destination stays

**Scope and result.** This is a research-only directory-research wave for one category: **luxury hotels and destination stays** in **Los Angeles County, California**. It contains **19 candidate records** with both an opened independent directory record and an opened official customer-facing destination. The directory source was Forbes Travel Guide, whose property pages label the selected properties “VERIFIED LUXURY.” That label is source attribution, not an independent quality judgment made here. All candidate addresses are numbered street addresses in Los Angeles, Beverly Hills, Santa Monica, West Hollywood, Rancho Palos Verdes, or Westlake Village, California; these are Los Angeles County records only.

The category was selected only because it is relevant to the requested hospitality and travel focus. The voluntary profile in the task was not used to infer or assign any identity, sexual orientation, marital status, health, wealth, occupation, language, preference, eligibility, safety, quality, or business ownership. No LGBTQ+ designation is claimed. The sole ownership designation recorded, for Oceana Santa Monica, is reproduced only because the Forbes page explicitly says it is “family-owned and privately operated.”

## Coverage and inclusion rule

A candidate required all of the following: an individually opened Forbes Travel Guide property page showing “VERIFIED LUXURY”; a clearly supported numbered address in a Los Angeles County city; and an opened official customer-facing hotel/resort destination that corroborated the business as an active visitor-facing property. The `website` field is the official destination; `sourceUrl` is the independent directory listing. Search terms are neutral and limited to services described by the opened sources. The data contains no coordinates, map pins, pricing, availability claims, patron claims, or inferred attributes.

| Measure | Count |
|---|---:|
| Candidate records | 19 |
| Held records | 2 |
| Candidate target kinds | 19 physical_business |
| Duplicate business records after review | 0 |
| Recorded LGBTQ+ designations | 0 |
| Explicit ownership/designation records | 1 |

## Opened sources and official destinations

Each row below enumerates the opened independent directory page and the opened official customer-facing destination used to support the corresponding candidate. Links in the two source columns resolve to the numbered references in the References section.

| Candidate | Independent directory source opened | Official customer-facing destination opened |
|---|---|---|
| Hotel Bel-Air | [1] | [2] |
| The Beverly Hills Hotel | [3] | [4] |
| Four Seasons Hotel Los Angeles at Beverly Hills | [5] | [6] |
| Beverly Wilshire, Beverly Hills, A Four Seasons Hotel | [7] | [8] |
| Waldorf Astoria Beverly Hills | [9] | [10] |
| Regent Santa Monica Beach | [11] | [12] |
| Shutters on the Beach | [13] | [14] |
| Hotel Casa del Mar | [15] | [16] |
| Santa Monica Proper Hotel | [17] | [18] |
| 1 Hotel West Hollywood | [19] | [20] |
| The West Hollywood EDITION | [21] | [22] |
| The Maybourne Beverly Hills | [23] | [24] |
| Terranea Resort | [25] | [26] |
| Downtown L.A. Proper Hotel | [27] | [28] |
| Four Seasons Hotel Westlake Village | [29] | [30] |
| Oceana Santa Monica, LXR Hotels & Resorts | [31] | [32] |
| The Georgian | [33] | [34] |
| Fairmont Century Plaza | [35] | [36] |
| L’Ermitage Beverly Hills | [37] | [38] |

An initial Forbes destination index was opened but did not expose its property listings in the extraction; individual property pages were therefore used instead. [39] The following additional URLs were opened but not used to create a candidate: the official Ritz-Carlton destination returned no extractable content, while the attempted Forbes Sunset Tower property URL rendered generic site content rather than a property profile. Both leads are preserved in held JSONL. [40] [41] [42] The initially attempted Regent domain did not resolve through the extractor; the working official Regent destination in the candidate table was then opened. [43]

## Duplicate and boundary checks

Within the selected category, names and numbered addresses were normalized and checked together. No two candidate records shared both a normalized business name and street address. Brand-adjacent components—restaurants, spas, pools, rooftop venues, event programs, lounges, and hotel-internal experiences—were retained only as source-supported discovery terms and were not emitted as separate records. The Beverly Hills and Los Angeles labels in a hotel name were not treated as a geographic conflict when the opened listing and official destination provided one numbered address. Westlake Village was retained only as the City of Westlake Village, Los Angeles County record at 2 Dole Drive; no Ventura County record was added.

## Held leads and limitations

The held file contains **The Ritz-Carlton, Los Angeles** because its Forbes listing was opened but its official customer-facing page did not return usable content for verification in this session. **Sunset Tower Hotel** is held because its official site was opened, but the attempted independent Forbes property URL did not yield a usable property record; a search-result snippet was deliberately not substituted for source evidence. Held records are not recommendations and are not candidate records.

This is a bounded source-backed directory pass, not an exhaustive inventory of Los Angeles County lodging, visitor-service providers, or travel advisors. It favors individually verified hotel and destination-stay records over unverified discovery results. Current offerings, operating status, eligibility, pricing, accessibility details, reservation availability, and social-media availability can change and should be confirmed directly with the business. No conclusion about a property’s ownership, designation, service quality, suitability, or safety is intended beyond the exact source-attributed fields.

## Research-only status

**Research-only; no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change.**

## References

[1]: https://www.forbestravelguide.com/hotels/los-angeles-california/hotel-bel-air "Forbes Travel Guide: Hotel Bel-Air"
[2]: https://www.dorchestercollection.com/los-angeles/hotel-bel-air/ "Hotel Bel-Air official website"
[3]: https://www.forbestravelguide.com/hotels/los-angeles-california/the-beverly-hills-hotel "Forbes Travel Guide: The Beverly Hills Hotel"
[4]: https://www.dorchestercollection.com/los-angeles/the-beverly-hills-hotel/ "The Beverly Hills Hotel official website"
[5]: https://www.forbestravelguide.com/hotels/los-angeles-california/four-seasons-hotel-los-angeles-at-beverly-hills "Forbes Travel Guide: Four Seasons Hotel Los Angeles at Beverly Hills"
[6]: https://www.fourseasons.com/losangeles/ "Four Seasons Hotel Los Angeles at Beverly Hills official website"
[7]: https://www.forbestravelguide.com/hotels/los-angeles-california/beverly-wilshire-beverly-hills-a-four-seasons-hotel "Forbes Travel Guide: Beverly Wilshire, Beverly Hills, A Four Seasons Hotel"
[8]: https://www.fourseasons.com/beverlywilshire/ "Beverly Wilshire official website"
[9]: https://www.forbestravelguide.com/hotels/los-angeles-california/waldorf-astoria-beverly-hills "Forbes Travel Guide: Waldorf Astoria Beverly Hills"
[10]: https://www.hilton.com/en/hotels/laxwawa-waldorf-astoria-beverly-hills/ "Waldorf Astoria Beverly Hills official website"
[11]: https://www.forbestravelguide.com/hotels/los-angeles-california/regent-santa-monica-beach "Forbes Travel Guide: Regent Santa Monica Beach"
[12]: https://santamonica.regenthotels.com/ "Regent Santa Monica Beach official website"
[13]: https://www.forbestravelguide.com/hotels/los-angeles-california/shutters-on-the-beach "Forbes Travel Guide: Shutters on the Beach"
[14]: https://www.shuttersonthebeach.com/ "Shutters on the Beach official website"
[15]: https://www.forbestravelguide.com/hotels/los-angeles-california/casa-del-mar "Forbes Travel Guide: Casa del Mar"
[16]: https://www.hotelcasadelmar.com/ "Hotel Casa del Mar official website"
[17]: https://www.forbestravelguide.com/hotels/los-angeles-california/santa-monica-proper-hotel "Forbes Travel Guide: Santa Monica Proper Hotel"
[18]: https://www.properhotel.com/santa-monica/ "Santa Monica Proper Hotel official website"
[19]: https://www.forbestravelguide.com/hotels/los-angeles-california/1-hotel-west-hollywood "Forbes Travel Guide: 1 Hotel West Hollywood"
[20]: https://www.1hotels.com/west-hollywood "1 Hotel West Hollywood official website"
[21]: https://www.forbestravelguide.com/hotels/los-angeles-california/the-west-hollywood-edition "Forbes Travel Guide: The West Hollywood EDITION"
[22]: https://www.marriott.com/en-us/hotels/laxeb-the-west-hollywood-edition/overview/ "The West Hollywood EDITION official website"
[23]: https://www.forbestravelguide.com/hotels/los-angeles-california/the-maybourne-beverly-hills "Forbes Travel Guide: The Maybourne Beverly Hills"
[24]: https://www.maybournebeverlyhills.com/ "The Maybourne Beverly Hills official website"
[25]: https://www.forbestravelguide.com/hotels/los-angeles-california/terranea-resort "Forbes Travel Guide: Terranea Resort"
[26]: https://www.terranea.com/ "Terranea Resort official website"
[27]: https://www.forbestravelguide.com/hotels/los-angeles-california/downtown-la-proper-hotel "Forbes Travel Guide: Downtown L.A. Proper Hotel"
[28]: https://www.properhotel.com/downtown-la/ "Downtown L.A. Proper Hotel official website"
[29]: https://www.forbestravelguide.com/hotels/los-angeles-california/four-seasons-hotel-westlake-village "Forbes Travel Guide: Four Seasons Hotel Westlake Village"
[30]: https://www.fourseasons.com/westlakevillage/ "Four Seasons Hotel Westlake Village official website"
[31]: https://www.forbestravelguide.com/hotels/los-angeles-california/oceana-santa-monica-lxr-hotels-resorts "Forbes Travel Guide: Oceana Santa Monica, LXR Hotels & Resorts"
[32]: https://www.hoteloceanasantamonica.com/ "Oceana Santa Monica official website"
[33]: https://www.forbestravelguide.com/hotels/los-angeles-california/the-georgian "Forbes Travel Guide: The Georgian"
[34]: https://www.thegeorgian.com/ "The Georgian official website"
[35]: https://www.forbestravelguide.com/hotels/los-angeles-california/fairmont-century-plaza "Forbes Travel Guide: Fairmont Century Plaza"
[36]: https://www.fairmont.com/en/hotels/los-angeles/fairmont-century-plaza.html "Fairmont Century Plaza official website"
[37]: https://www.forbestravelguide.com/hotels/los-angeles-california/lermitage-beverly-hills "Forbes Travel Guide: L'Ermitage Beverly Hills"
[38]: https://www.lermitagebeverlyhills.com/ "L'Ermitage Beverly Hills official website"
[39]: https://www.forbestravelguide.com/destinations/los-angeles-california "Forbes Travel Guide Los Angeles destination index"
[40]: https://www.forbestravelguide.com/hotels/los-angeles-california/the-ritz-carlton-los-angeles "Forbes Travel Guide: The Ritz-Carlton, Los Angeles"
[41]: https://www.ritzcarlton.com/en/hotels/laxrz-the-ritz-carlton-los-angeles/overview/ "The Ritz-Carlton, Los Angeles official website attempted destination"
[42]: https://www.forbestravelguide.com/hotels/los-angeles-california/sunset-tower-hotel "Forbes Travel Guide: Sunset Tower Hotel attempted property URL"
[43]: https://www.regentsantamonica.com/ "Attempted Regent Santa Monica domain"
