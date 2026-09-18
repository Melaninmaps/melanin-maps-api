# Memphis and Nearby Tennessee Communities — Source Report

## Scope and method

This was a **research-only source pass** for Memphis and nearby Tennessee communities. No repository, application code, database, public API, user/account/authentication system, waitlist, deployment, or external destination was modified. Nothing was staged or published. Search-result snippets were used only to discover pages; each item treated as evidence below was opened and inspected. Candidate records require both a public source URL and a specific official customer-facing website or official business-social destination. Records with absent/inadequate addresses, conflicting facts, unsafe/compromised destinations, or regulated-service evidence gaps were placed in the held file.

A feasible exact duplicate comparison was run across all pre-existing `*.jsonl` under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output folder, using normalized **name + city + state + address**. No retained candidate matched an existing normalized key.

## Inspected URLs and support

| # | URL | Status | Support / disposition |
|---:|---|---|---|
| 1 | <https://blackchamberofmemphis.org/business-directory> | Inspected | Official Black Chamber directory; used for discovery and to establish the Chamber as a community-backed directory. |
| 2 | <https://memphisblackbusinessdirectory.com/> | Inspected | Community directory; supplied local inclusion basis and links for 4D Marketing, 111 Madison, Mande Dibi, Jackie Mae’s Place, Tea Bar 901, Memphis Welding School, and Cxffeeblack. Directory inclusion was not treated as ownership certification. |
| 3 | <https://www.memphistravel.com/trip-ideas/black-history-memphis> | Inspected | Official Memphis Tourism Black-history guide; supports cultural-place discovery for Stax, Hattiloo, National Civil Rights Museum, and First Baptist Beale Street. |
| 4 | <https://ilovememphisblog.com/Black-Owned-Memphis> | Inspected | Page extraction returned only site-shell content; not used as record evidence. |
| 5 | <https://civilrightsmuseum.org/> | Inspected | First-party visitor destination; supports National Civil Rights Museum name, 450 Mulberry St address, phone, tickets, and official social links. |
| 6 | <https://staxmuseum.com/> | Inspected | First-party Stax visitor site (with links to staxmuseum.org); supports 926 E. McLemore Ave, phone, ticketing, and Facebook. |
| 7 | <https://hattiloo.org/> | Inspected | First-party theatre site; supports address, box office, ticketing, Facebook link, and its self-description as a Black repertory theatre. |
| 8 | <http://luxurycleaningagency.com/home> | Inspected | First-party cleaning-service page; its contact details conflicted with the directory and the directory address was Southaven, Mississippi, outside this TN-only wave. No record created. |
| 9 | <http://4dmarketing.biz> | Inspected | First-party marketing-services site; supports Memphis address, services, contact, social links, and direct minority/veteran-owned designation. Retained. |
| 10 | <https://www.one11madison.com> | Inspected | First-party restaurant/event-venue site; supports street address, phone, dining/reservations and social links. Retained. |
| 11 | <https://www.mandedibi.com/> | Inspected | First-party restaurant site; supports street address, phone, menu/order links and social links. Retained. |
| 12 | <https://www.jackiemaesplace.com/> | Inspected | First-party restaurant site; supports Millington street address, phone, cuisine, and online ordering. Retained. |
| 13 | <https://memphisweldingschool.com/> | Inspected | First-party trade-school site; supports street address and program claim, but not regulator/approval verification. Held for regulated education review. |
| 14 | <https://www.theteabar901.com/> | Inspected | First-party shop; supports online shopping and Memphis origin, but no numbered street address. Retained only as online_business. |
| 15 | <https://blackchamberofmemphis.org/business-directory/oteka-technologies> | Inspected | Official Chamber profile; supplied ownership/certification statements and an address that conflicts with the official site. Held. |
| 16 | <https://cxffeeblack.com/> | Inspected | Linked ecommerce site; supplies a shopping destination but not a physical address or an explicit online-only statement. Held. |
| 17 | <https://blackchamberofmemphis.org/business-directory/tea-bar-901> | Inspected | Official Chamber profile; supports Memphis-based brand description, phone, official shop and social destinations. Retained as online_business. |
| 18 | <https://blackchamberofmemphis.org/business-directory/100-black-men-of-memphis> | Inspected | Official Chamber profile; supports nonprofit program description and linked destinations. Linked website later found unreliable for a public-service listing; held. |
| 19 | <https://www.facebook.com/FirstBaptistBeale/> | Inspected | Extraction returned Facebook login-only content; did not establish an official current destination or address. Held. |
| 20 | <https://otekatech.com/> | Inspected | First-party contractor site; supports customer services, social links, and 3349 Winbrook Dr, conflicting with the Chamber’s 3332 address. Held pending resolution/licensing review. |
| 21 | <https://100bmom.org/> | Inspected | Linked purported organization site; showed unrelated gambling links and lacked reliable current public-service contact/address. Held. |
| 22 | <https://www.firstbaptistbeale.org/> | Attempted | Hostname could not be resolved by the extractor; no evidence used. |
| 23 | <https://100blackmenmemphis.org/> | Attempted | Hostname could not be resolved by the extractor; no evidence used. |
| 24 | <https://otekatechnologies.com/> | Attempted | Hostname could not be resolved by the extractor; no evidence used; the working first-party destination was subsequently inspected at otekatech.com. |

## Output counts

### Retained records by target kind

| Target kind | Count |
|---|---:|
| business | 4 |
| online_business | 1 |
| cultural_place | 3 |
| **Total retained** | **8** |

### Retained records by category

| Category | Count |
|---|---:|
| Food & Dining | 3 |
| Arts & Culture | 3 |
| Professional Services | 1 |
| Food & Beverage | 1 |
| **Total retained** | **8** |

### Held records by target kind

| Target kind | Count |
|---|---:|
| regulated_review | 2 |
| manual_review | 2 |
| community_resource | 1 |
| **Total held** | **5** |

## Limitations

This source pass does not certify ownership, protected traits, licensure, bilingual capacity, pricing, hours, accessibility, availability, health outcomes, operational status, or any other unverified claim. A business directory is a source basis for local inclusion, not ownership certification. No coordinates, map pins, or directions data were created. Several websites were dynamic, incomplete, or unavailable to extraction; those limitations are stated in the held records rather than being filled by inference. The scope excludes Southaven, Mississippi despite its proximity because this wave is limited to Tennessee communities.
