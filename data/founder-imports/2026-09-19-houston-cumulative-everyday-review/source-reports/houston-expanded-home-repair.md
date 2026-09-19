# Houston Home Repair & Everyday Needs Research

**Scope and result.** This research-only wave identified **8 candidate records** and **8 held records** for practical Houston and Houston-metro home-maintenance discovery. The candidates cover HVAC and plumbing, roofing, electrical work, construction and remodeling, and public or nonprofit repair assistance. The file deliberately routes HVAC, electrical, and pest-control providers to `regulated_review` rather than representing licensure as established. It also preserves only literal ownership designations: APD Roofing’s own site calls itself Black-owned and minority-owned, while Raven’s BuyBlack specialty link expressly uses “Black-owned.” [1] [2] [3]

This is **research only**. It makes **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**.

## Candidate coverage

The candidate set prioritizes a Black-business directory and opened official destinations, then adds official municipal and nonprofit resources where they create practical everyday-life options. BuyBlack identifies Raven as a Houston home-services listing and identifies its HVAC specialty as Black-owned; Raven’s own site confirms its Houston contact location and its plumbing/HVAC service-and-repair activity. [1] [4] APD appears in the opened BuyBlack Houston home-services results, while APD’s official site provides the current Houston address, roofing/gutter services, and its literal Black-owned and minority-owned designation. [2] [3]

The municipal and nonprofit resources are intentionally retained as `community_resource` records. The City’s DR24 program says it serves eligible Houston homeowners whose primary residences were damaged by the 2024 Derecho or Hurricane Beryl, and it currently directs prospective applicants to call for a packet. [5] Houston Habitat’s official page describes a repair waitlist for its senior and veteran Critical Home Repair program. [6] Rebuilding Together Houston states that it provides no-cost critical repairs and gives its Houston office contact. [7] [8] Harris County’s program is a useful Houston-metro option, but its official page expressly says the service area is outside the City of Houston and that assistance remains subject to review and funding. [9]

## Dedupe and routing checks

I performed a within-category exact-name, normalized-name, phone, and numbered-address review. No candidate has the same normalized name plus the same official/current address as another candidate. The City of Houston’s broad Single-Family Home Repair Program was not duplicated as a candidate: its page says the general program’s funding is exhausted, while its distinct, currently documented DR24 pathway is included once. The broad program is retained in held JSONL so the availability limitation remains visible. [10] [5]

Two source-contact conflicts were resolved conservatively. A Renewable Electric’s Black Pages listing gives one address and phone, while its opened customer-facing Facebook page gives a different Houston address and phone; the candidate retains the latter and explicitly flags the discrepancy. [11] [12] O’Neal’s individual BuyBlack profile and its opened Facebook page also show different street-suite addresses; the official Facebook address is retained, and the conflict is recorded. [13] [14]

Providers that offer services subject to Texas regulatory systems are marked `regulated_review`, not “licensed.” Texas says that ACR contractors must be licensed and that electrical work must be performed through a licensed electrical contractor; the Texas plumbing board offers a public license lookup, and Texas Agriculture states that its Structural Pest Control Service licenses applicators around structures. [15] [16] [17] [18] These sources establish the review route, not the licenses of any individual candidate.

## Held leads and limitations

The held file is substantive rather than padded. Reed Appliance Commercial has explicit BuyBlack Black-owned wording and an address, but no opened official customer-facing destination appeared in its individual profile. [19] Total Volt Electric has an explicit Black-owned statement and a linked website, but the opened official site produced no extractable content, so it remains held pending destination confirmation. [20] Southern Exterminating’s Black Pages profile links its own Wix site and gives a pest-control license number, but that linked destination likewise did not yield extractable content; its regulatory status was not independently confirmed. [21]

Springtime Air is held because its directory-linked domain now resolves to a domain-for-sale page, an evident stale-destination signal. [22] Excellent Electric is held because the opened directory profile supplies contact information but no official destination. [23] Just Muscle and Aguirre House Painting & Handyman Services are held because the available opened directory evidence did not provide a source-supported numbered address plus a verifiable official destination. [24] [2] These limitations prevent unsupported claims about current operation, ownership, quality, availability, price, safety, language, hours, or credentials.

## Opened sources and URLs

The following URLs were opened during this wave. The first group supplies candidate evidence; the second supports validation, routing, and held-lead decisions.

| Ref. | Opened source / URL | Role in this wave |
|---|---|---|
| [1] | BuyBlack — Raven Mechanical profile | Black-owned specialty wording, directory source, contact and service lead |
| [2] | BuyBlack — Houston Home Services directory | APD and Aguirre category-source discovery |
| [3] | APD Roofing official Black-owned-business page | Literal ownership designations and official contact |
| [4] | Raven Mechanical official website | Official destination, address, phone, plumbing/HVAC service evidence |
| [5] | City of Houston DR24 Home Repair Program | Current municipal disaster-repair resource |
| [6] | Houston Habitat Critical Home Repair Program | Nonprofit repair program, waitlist, contact, supported services |
| [7] | Rebuilding Together Houston official homepage | Nonprofit repair assistance description |
| [8] | Rebuilding Together Houston contact page | Official Houston office and phone |
| [9] | Harris County Home Repair Program | Houston-metro eligibility, services, and contact |
| [10] | City of Houston general Home Repair page | Funding-closure and program-relationship decision |
| [11] | Houston Black Pages Contractors directory | A Renewable Electric and Springtime Air source listings |
| [12] | A Renewable Electric official Facebook page | Current customer-facing contact and service description |
| [13] | BuyBlack — O’Neal individual profile | Directory contact evidence |
| [14] | O’Neal Construction official Facebook page | Official contact destination and current address |
| [15] | Texas Department of Licensing and Regulation — ACR | HVAC regulatory review route |
| [16] | Texas Department of Licensing and Regulation — Electricians | Electrical regulatory review route and license search |
| [17] | Texas State Board of Plumbing Examiners | Plumbing consumer/license-search route |
| [18] | Texas Department of Agriculture — Structural Pest Control Service | Pest-control regulatory review route |
| [19] | BuyBlack — Reed Appliance Commercial profile | Held appliance-repair lead and Black-owned wording |
| [20] | BuyBlack — Total Volt Electric profile | Held Houston-metro electrical lead and explicit designation |
| [21] | Houston Black Pages — Southern Exterminating profile | Held pest-control lead, contact, and link-out |
| [22] | SpringtimeAir linked domain | Stale-destination check; domain listed for sale |
| [23] | Houston Black Pages — Excellent Electric profile | Held electrical lead with no official destination |
| [24] | BuyBlack — Houston Handyman directory | Held handyperson lead with incomplete physical address |
| [25] | Houston Hispanic Chamber directory homepage | Opened chamber-directory context; no qualifying record was taken |
| [26] | City of Houston MWSBE certification page | Opened municipal directory/certification context; no record extracted |
| [27] | City of Houston MWSBE vendor portal | Opened official portal; JavaScript-only access prevented record extraction |
| [28] | Houston Black Pages Cleaning Services directory | Opened Black-directory cleaning category; no official-destination-verified record met inclusion rules |
| [29] | Houston Black Pages Exterminator directory | Opened Black-directory pest-control category; Southern lead advanced to held |
| [30] | BuyBlack Houston Appliances & Repair directory | Opened Black-directory appliance category; Reed advanced to held |
| [31] | BuyBlack Houston Handyman directory | Opened Black-directory handyperson category; Just Muscle advanced to held |
| [32] | BuyBlack Houston Construction directory | Opened Black-directory construction category; O’Neal advanced to candidate |

## References

[1]: https://www.buyblack.org/united-states/houston/home-services/raven-mechanical-lp "Raven Mechanical, LP — BuyBlack.org"
[2]: https://www.buyblack.org/united-states/texas/houston/home-services "Home Services Directory — Houston, Texas — BuyBlack.org"
[3]: https://www.apdroofing.com/black-owned-business "Minority Owned Roof Repairs — APD Roofing"
[4]: https://www.ravenmechanical.com/ "Raven Mechanical — Official Website"
[5]: https://houstontx.gov/hcdrecovery/dr24/hrp/ "DR24 Single-Family Home Repair Program — City of Houston"
[6]: https://www.houstonhabitat.org/build-repair/critical-repair/ "Critical Home Repair Program — Houston Habitat for Humanity"
[7]: https://rebuildingtogetherhouston.org/ "Rebuilding Together Houston — Official Website"
[8]: https://rebuildingtogetherhouston.org/contact "Contact — Rebuilding Together Houston"
[9]: https://hcd.harriscountytx.gov/Residents/Home-Repair-Program "Home Repair Program — Harris County Housing and Community Development"
[10]: https://houstontx.gov/housing/home-repair.html "Home Repair — City of Houston Housing and Community Development"
[11]: http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-contractors-directory~22 "Contractors Listings — The Houston Black Pages"
[12]: https://www.facebook.com/arellcservice.org/ "A Renewable Electric LLC — Facebook"
[13]: https://www.buyblack.org/united-states-of-america/houston/home-services/o-neal-construction-remodeling-services-llc "O'Neal Construction & Remodeling Services LLC — BuyBlack.org"
[14]: https://www.facebook.com/ONealConstruction/ "O'Neal Construction & Remodeling Services — Facebook"
[15]: https://www.tdlr.texas.gov/acr/acr.htm "Air Conditioning and Refrigeration Contractors — Texas Department of Licensing and Regulation"
[16]: https://www.tdlr.texas.gov/electricians/ "Electricians — Texas Department of Licensing and Regulation"
[17]: https://tsbpe.texas.gov/find-a-plumber/ "Find-a-Plumber — Texas State Board of Plumbing Examiners"
[18]: https://www.texasagriculture.gov/Regulatory-Programs/Pest-and-Weed/Pesticides/Structural-Pest-Control-Service "Structural Pest Control Service — Texas Department of Agriculture"
[19]: https://www.buyblack.org/united-states/houston/reed-appliance-commercial "Reed Appliance Commercial — BuyBlack.org"
[20]: https://www.buyblack.org/united-states/pearland/construction/total-volt-electric "Total Volt Electric — BuyBlack.org"
[21]: http://thehoustonblackpages.com/BusinessDetailsPremium/houston-black-exterminator-southern-exterminating~32389 "Southern Exterminating — The Houston Black Pages"
[22]: https://springtimeair.com/ "SpringtimeAir.com — Domain Listing"
[23]: http://thehoustonblackpages.com/BusinessDetailsPremium/houston-black-service-techs-excellent-electric~34898 "Excellent Electric — The Houston Black Pages"
[24]: https://www.buyblack.org/united-states/houston/handyman "Handyman Directory — Houston — BuyBlack.org"
[25]: https://business.houstonhispanicchamber.com/hhccmemberdirectory "Houston Hispanic Chamber of Commerce Directory"
[26]: https://houstontx.gov/housing/compliance/mwsbe/index.html "MWSBE Certification and Hiring — City of Houston"
[27]: https://houston.mwdbe.com/ "City of Houston Office of Business Opportunity Vendor Portal"
[28]: http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-cleaning-services-directory~5625 "Cleaning Services Listings — The Houston Black Pages"
[29]: http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-exterminator-directory~5644 "Exterminator Listings — The Houston Black Pages"
[30]: https://www.buyblack.org/texas/houston/appliances-repair "Appliances & Repair Directory — Houston — BuyBlack.org"
[31]: https://www.buyblack.org/united-states/houston/handyman "Handyman Directory — Houston — BuyBlack.org"
[32]: https://www.buyblack.org/united-states/texas/houston/construction "Construction Directory — Houston — BuyBlack.org"
