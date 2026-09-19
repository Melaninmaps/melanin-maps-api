# Los Angeles County grooming, spa, and wellness directory research

**Research-only scope.** This wave identifies **12 candidate records** and **10 held records** for a single directory category: grooming, spa, massage/bodywork, skincare, nails, and related wellness services in **Los Angeles County, California**. The candidate set is deliberately limited to records with a numbered physical address and a credible public listing plus a customer-facing official destination that was opened. The two state and destination-marketing sources supplied the category discovery layer; official operator sites supplied current customer-facing confirmation.

This is **research only**. There was **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**.

## Result and routing summary

| Outcome | Count | Treatment |
|---|---:|---|
| Candidate | 12 | Each has a numbered LA County address, an opened directory/tourism source, and an opened official customer destination. |
| Held | 10 | Address conflict, closed/stale lead, official physical destination not verified, or an official destination that did not establish a distinct current spa. |
| `regulated_review` candidates | 12 | The official pages describe massage, facials/esthetics, hair/barber, nail, or acupuncture-related services. This route flags a need to review applicable provider/establishment authorization; it does **not** represent a finding that any license, permit, registration, or certification exists. |
| Ownership / LGBTQ+ designations | 0 | No designation was entered. None was inferred from marketing, geography, name, or audience context. |

The candidate file uses `regulated_review` consistently because the customer-facing pages describe service areas that can involve regulated practitioners or establishment rules. `regulatedProfession` identifies the service domain and explicitly says that authorization status requires review. It is not a claim about a person, business, credential, eligibility, or quality.

## Candidate coverage

The qualified set includes hotel/resort spas, a Korean spa and bathhouse, massage/bodywork locations, and a hotel salon/barber/nail destination. It spans Los Angeles, Beverly Hills, Pasadena, Santa Monica, Rancho Palos Verdes, and City of Industry, all within Los Angeles County. Specific services and addresses in the JSONL are sourced only from the linked public tourism/directory page and the official customer-facing destination. For example, Discover Los Angeles lists the Beverly Wilshire, Ritz-Carlton, Beverly Hills Hotel, Chuan, Omni, Sally’s, Wi Spa, Tomoko, and Raven leads; Visit California names the Peninsula and Terranea spas. [1] [2] [3]

Official pages were opened to confirm the current customer-facing service context and, where available, address and direct booking/contact. Those pages confirm current spa or salon offerings for the 12 candidates, including massage/facial/body treatments, hair/barber/nails where stated, and booking/contact details. [4] [5] [6] [7] [8] [9] [10] [11] [12] [13] [14] [15]

## Opened sources and URLs

The following URLs were opened and read in this wave. They are grouped by purpose; the candidate and held JSONL records preserve the source relevant to each individual lead.

| Purpose | Opened source / URL |
|---|---|
| Primary Los Angeles tourism directory | [Discover Los Angeles — Spas index, page 1](https://www.discoverlosangeles.com/tags/spas); [page 2](https://www.discoverlosangeles.com/tags/spas?page=1); [page 3](https://www.discoverlosangeles.com/tags/spas?page=2) |
| Primary Los Angeles tourism editorial guide | [Discover Los Angeles — Your Moment of Zen: The Best Spas in Los Angeles](https://www.discoverlosangeles.com/things-to-do/your-moment-of-zen-the-best-spas-in-los-angeles) |
| State tourism corroboration | [Visit California — L.A.’s Poshest Spas](https://www.visitcalifornia.com/experience/las-poshest-spas/) |
| Candidate official destinations | [Four Seasons Beverly Wilshire Spa](https://www.fourseasons.com/beverlywilshire/spa/); [Ritz-Carlton Spa](https://www.ritzcarlton.com/en/hotels/laxlz-the-ritz-carlton-los-angeles/spa/); [Beverly Hills Hotel Spa](https://www.dorchestercollection.com/en/los-angeles/the-beverly-hills-hotel/spa/); [Chuan Spa](https://www.langhamhotels.com/en/the-langham/los-angeles/wellness/chuan-spa/); [Peninsula Spa](https://www.peninsula.com/en/beverly-hills/wellness/luxury-hotel-spa); [Terranea Spa](https://www.terranea.com/spa/) |
| Candidate official destinations, continued | [Sally Spa](https://sally-w.com/); [Omni Spa details](https://www.omnihotels.com/hotels/los-angeles-california-plaza/spa/details); [Wi Spa](https://www.wispausa.com/); [Raven Santa Monica](https://theravenspa.com/santa-monica/); [Tomoko](https://tomokospa.com/contact/); [Very Very Beverly Hills Salon](https://www.fourseasons.com/beverlywilshire/spa/salon_services/) |
| Held-lead verification | [Neihulé](https://www.neihule.com/); [Bliss](https://www.blissworld.com/); [InterContinental link](http://www.intercontinental.com/losangeles); [Ole Henriksen](https://olehenriksen.com/); [Burke Williams](https://www.burkewilliams.com/); [The NOW](https://www.thenowmassage.com/); [Maybourne](https://www.maybournebeverlyhills.com/spa/); [Beverly Hills Plaza Hotel & Spa](https://www.discoverlosangeles.com/hotels/beverly-hills-plaza-hotel-spa); [Malibu Beach Inn](https://www.discoverlosangeles.com/hotels/malibu-beach-inn) |

## Duplicate check

A within-category duplicate review compared normalized name, street address, city, and official domain. No candidate duplicates remain. Three distinctions were material. First, **The Spa at The Beverly Wilshire** and **Very Very Beverly Hills Salon** share an address but are separate official customer-facing service destinations with different named offerings, so they remain separate. Second, **The Raven Spa — Santa Monica** is retained while the officially closed Silver Lake location is held. Third, hotel listings that merely carried a spa tag were not expanded into candidates unless a separate, current spa operation was verified.

## Held records and limitations

The held file is a deliberate exclusion log, not a negative judgment about any organization. Neihulé has a direct address conflict between Discover LA and the official site. Bliss and Ole Henriksen opened as product-commerce destinations rather than confirming the legacy physical spa. The former Spa InterContinental link did not establish a current spa at the listed property. The Raven’s official site explicitly says Silver Lake is closed. Burke Williams and The NOW have service-confirming official main sites but an unextractable locations destination left their LA County numbered addresses unverified. The Maybourne spa URL resolved to general hotel content rather than confirming a current spa. Beverly Hills Plaza Hotel & Spa and Malibu Beach Inn had directory spa tags, but no separately verified current spa operation was established.

Directory and tourism pages can lag property changes, as the held records demonstrate. The dataset therefore records only source-stated facts and does not infer current operating status where the official destination failed to corroborate it. It does not verify individual practitioner licensure, business permits, insurance, accessibility, pricing, availability, service quality, safety, ownership, LGBTQ+ status, or suitability for any person. Marketing language was not treated as evidence of quality, identity, luxury, safety, ownership, or eligibility.

## Source-attribution rules applied

Every record has a `sourceUrl`, `sourceName`, and `sourceStatus`; the directory/tourism source is not presented as the business’s own claim. Websites and social links were included only when opened pages directly supplied them. `ownershipDesignations` and `ownershipEvidence` are `null` throughout because no explicit designation was used. The voluntary audience profile was used only to select the grooming/spa/wellness category; it was not used to infer facts about any user or business. Search terms are neutral, semicolon-separated descriptions grounded in the public source or official customer destination.

## Files

| File | Purpose |
|---|---|
| `candidates-grooming-spa.jsonl` | 12 candidate records, each with exactly the required 23 fields in the required order. |
| `held-grooming-spa.jsonl` | 10 excluded/held leads with the candidate fields plus `holdReason`. |
| `report-grooming-spa.md` | This research log, methodology, counts, URLs, duplicate check, and limitations. |

## References

[1]: https://www.discoverlosangeles.com/tags/spas "Discover Los Angeles — Spas directory"
[2]: https://www.discoverlosangeles.com/things-to-do/your-moment-of-zen-the-best-spas-in-los-angeles "Discover Los Angeles — Your Moment of Zen: The Best Spas in Los Angeles"
[3]: https://www.visitcalifornia.com/experience/las-poshest-spas/ "Visit California — L.A.’s Poshest Spas"
[4]: https://www.fourseasons.com/beverlywilshire/spa/ "Four Seasons Beverly Wilshire — Beverly Hills Spa"
[5]: https://www.ritzcarlton.com/en/hotels/laxlz-the-ritz-carlton-los-angeles/spa/ "The Ritz-Carlton, Los Angeles — Spa"
[6]: https://www.dorchestercollection.com/en/los-angeles/the-beverly-hills-hotel/spa/ "The Beverly Hills Hotel — Spa and Wellness"
[7]: https://www.langhamhotels.com/en/the-langham/los-angeles/wellness/chuan-spa/ "The Langham Huntington, Pasadena — Chuan Spa"
[8]: https://www.peninsula.com/en/beverly-hills/wellness/luxury-hotel-spa "The Peninsula Beverly Hills — The Peninsula Spa"
[9]: https://www.terranea.com/spa/ "Terranea Resort — The Spa"
[10]: https://sally-w.com/ "Sally Spa at Pacific Palms Resort"
[11]: https://www.omnihotels.com/hotels/los-angeles-california-plaza/spa/details "Omni Los Angeles Hotel at California Plaza — Spa Details"
[12]: https://www.wispausa.com/ "Wi Spa"
[13]: https://theravenspa.com/santa-monica/ "The Raven Spa — Santa Monica"
[14]: https://tomokospa.com/contact/ "Tomoko Japanese Spa Beverly Hills — Contact"
[15]: https://www.fourseasons.com/beverlywilshire/spa/salon_services/ "Four Seasons Beverly Wilshire — Salon Services"
