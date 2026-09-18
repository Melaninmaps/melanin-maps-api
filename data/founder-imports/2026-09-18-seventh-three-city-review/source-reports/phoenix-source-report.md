# Mapping with Melanin — Phoenix and Nearby Valley Communities Source Report

## Scope and method

This is **research-only** source-pass work for Phoenix and nearby Valley communities, Arizona. It was **not staged, not published, and not written to any repository, application, database, public API, user/account system, authentication system, waitlist, or deployment**. The assigned output directory contains only the two JSONL research files and this report.

I opened and inspected the 21 URLs enumerated below rather than treating search-result snippets as evidence. Retained records require a public HTTP(S) source URL and a specific official customer-facing website or official social destination. Physical businesses and cultural places are retained only with a numbered street address. Chamber listings provide a valid source basis, but **chamber membership/listing alone is not treated as protected-trait ownership certification**. The work deliberately favors a cross-category set rather than an restaurant-heavy list.

## Output counts

**Retained candidates: 11. Held candidates: 5. Inspected URLs: 21.**

### Retained candidates by target kind

| Target kind | Count |
|---|---:|
| business | 7 |
| community_resource | 2 |
| cultural_place | 2 |

### Retained candidates by category

| Category | Count |
|---|---:|
| Apparel & accessories | 1 |
| Arts & culture | 2 |
| Beauty & personal care | 1 |
| Books & media | 2 |
| Business services | 1 |
| Food & beverage | 1 |
| Specialty retail | 1 |
| Youth development | 2 |

## Inspected-source ledger

| # | URL inspected | Source / type | What inspection supported or why it was not used |
|---:|---|---|---|
| 1 | <https://www.visitphoenix.com/stories/post/black-owned-businesses/> | Visit Phoenix editorial guide | Opened. The local tourism guide supports Black-owned-guide inclusion and provided leads, street addresses, official links, or hold triggers for Black Theatre Troupe, Grassrootz, Stardust & Sage, Straw & Wool, A.T. Oasis, and held entries. |
| 2 | <https://members.azhcc.com/directory> | Arizona Hispanic Chamber member directory | Opened. The extracted response exposed no usable member detail; no row relies on it. |
| 3 | <https://blackchamberaz.org/> | Black Chamber of Arizona home | Opened. It identifies the chamber and links to its directory; used to understand publisher context, not as an ownership certification. |
| 4 | <https://intentionalist.com/blog/the-in-ten-tionalist-guide-to-latinx-heritage-month-phoenix-edition/> | Intentionalist editorial guide | Opened. The 2019 guide identifies Palabras as Latino-owned and names its owner; the retained row preserves the editorial source/date and separately verifies its current official destination. |
| 5 | <https://blackchamberaz.org/bcaz-directory> | Black Chamber of Arizona directory | Opened. The directory is headed “BCAZ Certified Businesses” and contains Valley listings. Used for discovery and chamber-listing context; membership/listing is not treated as an ownership certification. |
| 6 | <https://blacktheatretroupe.org/> | Black Theatre Troupe official site | Opened. Confirms visit/box-office destination, Phoenix street address, phone, and official socials. |
| 7 | <http://www.grassrootzbookstore.com/> | Grassrootz Bookstore official site | Opened. Confirms official online shop, Phoenix address, phone, and self-description as Black & Activist-Owned. |
| 8 | <https://stardustandsage.com/> | Stardust & Sage official site | Opened. Confirms public retail site, product categories, Phoenix address, phone, and socials. |
| 9 | <https://strawandwool.com/> | Straw & Wool official site | Opened. Confirms official online catalog and the Roosevelt Street Phoenix retail address. |
| 10 | <https://atoasiscoffee.com/> | A.T. Oasis official site | Opened. Confirms coffee/tea customer destination, online order/pickup links, street address, phone, and socials. |
| 11 | <https://blackchamberaz.org/directory/all-mixd-up-beauty-lounge/> | BCAZ listing: All Mix’d Up Beauty Lounge | Opened. Supports chamber listing, category, contact information, and linked official site; it does not establish protected-trait ownership. |
| 12 | <https://blackchamberaz.org/directory/fastsigns-of-gilbert/> | BCAZ listing: FASTSIGNS of Gilbert | Opened. Supports chamber listing, printing category, contact information, and linked official site; it does not establish protected-trait ownership. |
| 13 | <https://blackchamberaz.org/directory/new-pathways-for-youth-npfy/> | BCAZ listing: New Pathways for Youth | Opened. Supports chamber listing, education/nonprofit categories, contact information, official site, and social links; it does not establish protected-trait ownership. |
| 14 | <https://blackchamberaz.org/directory/a-ready-minded-youth-foundation/> | BCAZ listing: A Ready Minded Youth Foundation | Opened. Supports the Phoenix address, trade-skills/youth-development categories, phone, and official site; it does not establish protected-trait ownership. |
| 15 | <https://xico.org/> | Xico official site | Opened. Supports the cultural mission, public classes/artwork destinations, current Phoenix address, phone, and official socials. |
| 16 | <https://palabrasbookstore.com/> | Palabras Bilingual Bookstore official site | Opened. Confirms public bookstore/event destination, Phoenix street address, phone, and socials. |
| 17 | <https://allmixdupaz.com/> | All Mix’d Up Beauty Lounge official site | Opened. Confirms public salon and booking destination, Chandler address, phone, and socials. |
| 18 | <http://www.fastsigns.com/2195> | FASTSIGNS of Gilbert official site | Opened. Redirected to the Gilbert location page; confirms address, phone, quote destination, services, socials, and official “locally owned and operated” designation. |
| 19 | <https://npfy.org/> | New Pathways for Youth official site | Opened. Confirms public youth-enrollment/mentor destinations, programs, Phoenix address, phone, and socials. |
| 20 | <https://www.armygroup.org/> | A Ready Minded Youth official site | Opened. Confirms public youth-program information, contact path, and Metro Phoenix location wording; it does not state a street address. |
| 21 | <https://xico.org/contact/> | Xico contact page | Opened but blocked by a cookie/security check. The main official Xico page separately supplied the retained contact/address information. |


## Evidence and disposition notes

The retained set consists of customer-facing destinations supported by Visit Phoenix, Intentionalist, the Black Chamber of Arizona directory, and/or direct first-party sites. Current customer-facing destinations were opened for all retained rows. “Official site was opened” means the site exposed public customer, visitor, program, booking, shopping, enrollment, or quote content; it does **not** make an unsupported claim about hours, availability, accessibility, licensing, health outcomes, or operational status.

Five leads are deliberately held: Archwood Exchange because the inspected tourism listing flags it as temporarily closed; Mrs. White’s Golden Rule Cafe and Berry Berry Best Acai Bowls because the inspected source did not establish an official customer-facing destination; ATL Wings because the source says only “Multiple Locations,” not one numbered retained address; and 2 Doves Notary because the source did not provide enough public commission/licensure evidence for regulated-service review.

## Exact duplicate check and validation

A feasible exact duplicate check scanned all pre-existing `*.jsonl` research under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding the two Phoenix outputs being generated. Each prospective retained row was compared using normalized **name + city + state + address** (lowercase, non-alphanumeric characters removed). No retained candidate matched an existing normalized key. Pre-existing JSONL parse errors encountered during scan: 0. Every newly written JSONL line was constructed as JSON and reparsed before output.

## Limitations

This is a bounded, source-backed directory wave, not an exhaustive census. Publisher ownership designations are preserved only where the publisher or business directly supplied them; protected traits are not inferred from names, culture, services, chamber participation, or locality. Intentionalist’s Palabras ownership designation is explicitly dated 2019; its current official customer destination was opened separately, but continuity of ownership is not inferred. Some first-party sites supply current customer destinations without making all operational details verifiable. No coordinates, map pins, directions data, hours, pricing, language/bilingual-capability claims, service availability, accessibility claims, or licensing claims were created.
