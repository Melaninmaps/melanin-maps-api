# Delaware statewide review-only research report

**Scope and result.** This research pass covered Delaware statewide, with retained coverage in **Wilmington, Newark, Georgetown, and Millsboro**. Wilmington is the principal focus, while the surrounding communities are included only where an inspected source and customer-facing destination supplied the required evidence. The pass retained **8 records** and held **9 records**. It deliberately did not seek to fill a quota. The retained set covers home construction, groceries, retail, business services, dining, and regulated health/personal-care review routes.

## Evidence and routing standard

A retained physical commercial record has a name, category, source, inspected official website or official business-social destination, and a non-conflicting numbered street address. Health and aesthetic care records are routed as **`regulated_review`** rather than ordinary businesses. The record is not a recommendation and does not make a claim about licensure, quality, pricing, safety, availability, accessibility, language, or ownership beyond explicit source wording. Online-only status was not inferred.

## Retained records

| Name | Target kind | Location | Evidence result |
|---|---|---|---|
| Dabar Home Builders | business | Millsboro | DALE individual profile and official site match at 28454 Dupont Blvd. |
| Calderon Market & Bakery | business | Georgetown | DALE profile identifies the entity; inspected official Facebook page supplies 432 E Market St. |
| Huxley & Hiro | business | Wilmington | Official Downtown Wilmington directory and official site match at 601 N Market Street. |
| First Ascent | business | Wilmington | Official directory and official contact page match at 1400 N Market Street. |
| DE.CO Food Hall | business | Wilmington | Official directory supplies 111 West 10th Street; official customer site identifies the same downtown operation and gives no conflicting address. |
| Torres Cafe | business | Wilmington | Official directory and official site match at 307 N King Street. |
| Aurum MediSpa | regulated_review | Georgetown | DALE profile and official site are name/phone-consistent; the official site supplies 505 W Market St Suite 145. |
| Smile Brite Dental Care | regulated_review | Newark | DelawareBlack individual listing and official site establish the dentist office at 300 Biddle Ave Suite 204. |

## Held records

| Name | Target kind | Hold rationale |
|---|---|---|
| 1st State Concrete LLC | manual_review | The DALE profile has a street address, but the customer destination inspected was a third-party marketplace profile rather than an official business destination. |
| 302 Custom Tint LLC | manual_review | The source profile did not yield a reliable public address, and the identified Instagram destination was login-restricted. |
| Oleo Gentleman’s Salon | regulated_review | DALE gives a Frankford address while the official site gives a Selbyville address. |
| MadeHerselfABoss | manual_review | No physical address; sources do not explicitly say online-only. |
| Delaware Afro-American Sports Hall of Fame | manual_review | Sources establish programming and temporary venues, not a single public numbered place for the organization. |
| Create Magic Art Shop | manual_review | The official municipal listing says “Opening Soon,” and the official site does not repeat the street address. |
| House of David - Food, Clothes, Shelter | manual_review | Only a locality and donation-platform link were found; no numbered address or reliable organization destination was established. |
| Full Circle Martial Arts Studio | regulated_review | The child/after-school lead lacks both street address and official customer destination. |
| Fathers Mentoring Fathers Inc | manual_review | The source lacks a street address and its linked official site could not be resolved by the extractor. |

## Counts

| Measure | Count |
|---|---:|
| Retained candidates | 8 |
| Held candidates | 9 |
| `business` retained | 6 |
| `regulated_review` retained | 2 |
| `manual_review` held | 7 |
| `regulated_review` held | 2 |
| Retained categories | 6 |
| Source families inspected | 8 |

## Source-family coverage

The pass inspected eight public source families. **¡DALE!**, run through La Plaza Delaware, states that its member community is a network of local Latino-owned and operated businesses and provides a public member directory. Its individual member profiles supplied leads in Millsboro and Georgetown. [1] [2] **DelawareBlack** describes its Black Directory as highlighting Black-owned businesses, community organizations, and events. Individual listing pages were inspected for cultural, community, health, and family-service routes. [3] **Wilmington Made** provides a public Black-owned-business directory, and **Downtown Wilmington’s Business Directory** is an official local business-district directory. Both were opened; the latter produced several Wilmington commercial leads. [4] [5] The **Delaware Hispanic Chamber of Commerce** directory, **Delaware Black Chamber of Commerce** site, **Delaware Office of Supplier Diversity**, and **Delaware Hispanic Commission** resource page were also opened as relevant public organizational or official source families. They informed coverage and source-family validation, but did not yield additional retained rows meeting all destination and address rules in this pass. [6] [7] [8] [9]

## Dedupe protocol

Before writing, all JSONL files below `/home/ubuntu/directory-research-wave-2026-09-18/` were read except this output directory. The comparison key was a normalized tuple of **name + city + state + country + address**. Normalization applied Unicode ASCII folding, lowercase conversion, and removal of non-alphanumeric characters. Exact normalized-key matches were excluded; uncertain same-name records were not merged. The only direct prior-package collision identified among reviewed leads was The Sold Firm at 800-B N. Tatnall Street, Wilmington, which was excluded rather than re-added. This package contains no retained normalized-key duplicate found by the final validator.

## Research-only boundary

This is a **research-only, review-only** package. It contains no geocoding, latitude/longitude, map pins, production database or API writes, deployment changes, authentication changes, password changes, waitlist or payment changes, or public publication. No conclusion is made about a business’s current operations, quality, safety, accessibility, price, language, ownership, protected traits, licensing, or availability unless the limited, attributed wording in a record explicitly states it.

## Inspected URL log

All URLs opened or directly queried during this pass are logged below. “Source” refers to a directory, organization, or official page used for lead evidence. “Official destination” refers to the customer-facing official site or official business-social destination that was inspected. “Family/context” URLs were opened to establish source-family scope but did not independently produce a retained row.

| URL | Role | Result / reasoning |
|---|---|---|
| https://delawareblack.com/black-directory | Source family | Opened; public Black Directory family and category coverage inspected. |
| https://daledelaware.org/en/home/ | Source family | Opened; DALE describes its local Latino-owned and operated member network. |
| https://daledelaware.org/directory/ | Source family | Opened; public DALE member directory inspected. |
| https://daledelaware.org/en/business-directory/ | Source family | Opened; dynamic public DALE directory inspected. |
| https://daledelaware.org/en/business-directory/#!biz/id/6499c105f6c2832b3234a646 | Individual source route | Opened; profile route rendered through DALE public directory widget and was cross-checked against public profile endpoint. |
| https://daledelaware.org/en/business-directory/#!biz/id/667312f34508a4df0b0051ca | Individual source route | Opened; 302 Custom Tint route reviewed and held. |
| https://api.membershipworks.com/v2/account/6499c105f6c2832b3234a646/profile | DALE individual source | 1st State Concrete held for lacking independent official destination. |
| https://www.thumbtack.com/de/new-castle/concrete-contractors/1st-state-concrete/service/482552316996894720 | Customer destination check | Third-party marketplace profile; not an official business destination. |
| https://api.membershipworks.com/v2/account/667312f34508a4df0b0051ca/profile | DALE individual source | 302 Custom Tint held for no reliable address/destination. |
| https://www.instagram.com/302_custom_tint/ | Customer destination check | Login-restricted; unable to inspect enough evidence. |
| https://api.membershipworks.com/v2/account/6552560f420ca1244f020d52/profile | DALE individual source | Dabar retained. |
| https://dabarhomebuilders.com/ | Official destination | Dabar retained; inspected office address matches source. |
| https://api.membershipworks.com/v2/account/63f7acee3afde248062b4ac6/profile | DALE individual source | Calderon retained with official business-social confirmation. |
| https://www.facebook.com/calderonnn.bakery/ | Official business-social destination | Calderon retained; customer-facing address and phone inspected. |
| https://api.membershipworks.com/v2/account/63f64c4ccf982424a2148c92/profile | DALE individual source | Aurum retained as regulated review route. |
| https://www.aurummedispa.com/ | Official destination | Aurum retained; physical address and services inspected. |
| https://api.membershipworks.com/v2/account/65343dfc45149274130ef30d/profile | DALE individual source | Oleo held for address conflict. |
| https://oleosalon.com/ | Official destination | Oleo held; official Delaware location conflicts with directory address. |
| https://www.wilmingtonmade.com/blackownedbusinesses | Public Black-owned business directory | Opened as a public Black-business source; used for scope and leads, without adding prior-package duplicates. |
| https://downtownwilmingtonde.com/businesses | Source family | Opened; official local directory family inspected. |
| https://downtownwilmingtonde.com/businesses/2026/7/7/huxley-amp-hiro | Individual source | Huxley & Hiro retained. |
| https://huxleyandhiro.com/ | Official destination | Huxley & Hiro retained; matching street address inspected. |
| https://downtownwilmingtonde.com/businesses/2022/4/13/first-ascent | Individual source | First Ascent retained. |
| https://firstascentdesign.com/ | Official destination | First Ascent services inspected. |
| https://firstascentdesign.com/contact/ | Official destination | First Ascent retained; matching street address inspected. |
| https://downtownwilmingtonde.com/businesses/2025/9/9/deco-food-hall | Individual source | DE.CO retained. |
| https://www.decowilmington.com/ | Official destination | DE.CO customer site inspected; no conflicting address presented. |
| https://www.decowilmington.com/location/ | Official destination check | No extractable content; source address is retained only because it remains publicly supported by the municipal directory. |
| https://downtownwilmingtonde.com/businesses/2025/2/4/break-time | Individual source | Torres Cafe retained. |
| https://torrescafede.com/ | Official destination | Torres Cafe retained; matching street address inspected. |
| https://downtownwilmingtonde.com/businesses/2023/10/19/huxley-amp-hiro-booksellers | Individual source | Create Magic held because source calls location opening soon. |
| https://www.createmagicstudios.com/ | Official destination | Create Magic held; official site is Wilmington-wide rather than street-specific. |
| https://delawareblack.com/black-directory/listing/the-sold-firm | Individual source | Inspected; excluded due existing-package duplicate. |
| https://www.thesoldfirm.com/ | Official destination | Inspected; low-content destination; no duplicate was added. |
| https://delawareblack.com/black-directory/listing/fathers-mentoring-fathers-inc | Individual source | Fathers Mentoring Fathers held. |
| http://www.fathersmentoringfathers.org/ | Official destination check | Could not be resolved by extractor. |
| https://delawareblack.com/black-directory/listing/full-circle-martial-arts-studio | Individual source | Full Circle held for missing address and official destination. |
| https://delawareblack.com/black-directory/listing/madeherselfaboss-1 | Individual source | MadeHerselfABoss held for unqualified online-only status/no street address. |
| https://madeherselfaboss.com/ | Official destination | Services and Delaware-born wording inspected; no physical address or explicit online-only statement. |
| https://delawareblack.com/black-directory/listing/smile-brite-dental-care | Individual source | Smile Brite retained as regulated review route. |
| https://www.smilebritedelaware.com/ | Official destination | Smile Brite retained; office address inspected. |
| https://delawareblack.com/black-directory/listing/house-of-david-food-clothes-shelter | Individual source | House of David held for no street address/reliable official destination. |
| https://kindest.com/house-of-david-support | Linked destination check | Donation platform; not treated as organization-controlled official destination. |
| https://delawareblack.com/black-directory/listing/delaware-afro-american-sports-hall-of-fame | Individual source | DAASHOF held for no verified organization location. |
| https://www.daashof.org/ | Official destination | DAASHOF programming and event venues inspected; none adopted as a base location. |
| https://www.hchamber.org/ | Source family/context | Opened; Delaware Hispanic Chamber and directory route inspected. |
| https://www.hchamber.org/member-directory | Source family/context | Opened; no extractable public individual records available in this pass. |
| https://debcc.org/ | Source family/context | Opened; Delaware Black Chamber public organization source inspected. |
| https://osd.delaware.gov/Home/OSD/ | Official source family/context | Opened; Delaware Office of Supplier Diversity public search interface inspected. |
| https://hispanic.delaware.gov/resources/ | Official source family/context | Opened; state Hispanic-serving resource route inspected. |

## References

[1]: https://daledelaware.org/en/home/ "DALE Delaware home page"
[2]: https://daledelaware.org/directory/ "DALE public business directory"
[3]: https://delawareblack.com/black-directory "DelawareBlack Black Directory"
[4]: https://www.wilmingtonmade.com/blackownedbusinesses "Wilmington Made Black Owned Business Directory"
[5]: https://downtownwilmingtonde.com/businesses "Downtown Wilmington Business Directory"
[6]: https://www.hchamber.org/ "Delaware Hispanic Chamber of Commerce"
[7]: https://debcc.org/ "Delaware Black Chamber of Commerce"
[8]: https://osd.delaware.gov/Home/OSD/ "Delaware Office of Supplier Diversity"
[9]: https://hispanic.delaware.gov/resources/ "Delaware Hispanic Commission Community Resources"
