# Bucks County family and cultural intake — source report

**Scope and status.** This is a protected, review-only research intake for Bucks County, Pennsylvania. It is not a production import, publication, map-pin feed, or recommendation. The 24 retained records are all marked `pending_review`; the held file is intentionally empty because unqualified discoveries were excluded rather than used to inflate a hold count.

## Evidence ledger

| Source URL | Retrieval and verification notes | Retained / held |
|---|---|---:|
| https://www.visitbuckscounty.com/blog/stories/post/black-owned-businesses-in-bucks-county/ | Visit Bucks County’s dated Jan. 30, 2026 guide explicitly frames its selections as Black-owned businesses. Official business sites were also opened for the customer destination and physical details. | 5 / 0 |
| https://www.mamiecolettebakery.com/ | Official Newtown bakery page supplied 202 South State St., phone, bakery description, and Facebook/Instagram links. | 1 / 0 |
| https://www.sofreshjuiceco.com/ | Official Perkasie cafe site supplied 1 N 7th St., cafe/juice/coffee offerings, customer destination, and social links. | 1 / 0 |
| https://theburgerly.com/ | Official New Hope restaurant page supplied 137 S Main St., phone, menu/ordering and Facebook/Instagram links. | 1 / 0 |
| https://waxnscentstudio.com/ | Official New Hope studio page supplied 15 N Main St., phone, workshop descriptions and Facebook/Instagram links. | 1 / 0 |
| https://yogamazia.com/ | Official site describes virtual and regional support, customer contact and Instagram, but no customer street address; routed as `online_business`. | 1 / 0 |
| https://www.aamuseumbucks.org/ | Official Langhorne museum page confirms 867 Langhorne-Newtown Rd., public exhibits/tickets and social links. | 1 / 0 |
| https://www.mercermuseum.org/ | Official source confirms Mercer Museum’s Doylestown visitor address, tickets, events and social accounts. | 1 / 0 |
| https://michenerartmuseum.org/ | Official Doylestown museum page confirms 138 S Pine St., exhibitions and youth/family arts programs. | 1 / 0 |
| https://www.thetileworks.org/ | Official Doylestown Tile Works page confirms 130 E Swamp Rd., tours, hands-on experience, contact and social links. | 1 / 0 |
| https://pearlsbuck.org/ | Official Perkasie organization page confirms 520 Dublin Rd., historic tours, exhibits, family programming and social links. | 1 / 0 |
| https://brtstage.org/ | Official Bristol theater page confirms 120 Radcliffe St., ticketing, youth mentorship and arts camp descriptions. | 1 / 0 |
| https://bcptheater.org/ and https://bcptheater.org/contact/ | Official New Hope theater pages confirm 70 S Main St., box office, classes and social customer destinations. | 1 / 0 |
| https://tylerparkarts.org/ | Official Richboro arts-center page confirms 10 Stable Mill Rd., workshops, camps and social links. | 1 / 0 |
| https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/neshaminy-state-park | Commonwealth source verifies Bensalem park address, listed recreation and contact. | 1 / 0 |
| https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/washington-crossing-historic-park | Commonwealth source verifies park address, historic/outdoor programming and customer contact. | 1 / 0 |
| https://www.buckscounty.gov/facilities/facility/details/Core-Creek-Park-1 | Bucks County facility page verifies Langhorne address, boat/rental and recreation features. | 1 / 0 |
| https://www.aoyarts.org/About-Us | Official Yardley nonprofit arts-center page confirms address, youth/adult classes, camps, and social links. | 1 / 0 |
| https://yobc.org/ | Official site supports grade 4–12 orchestral programming and customer destination; it does not show a street-number service location on the inspected page. | 1 / 0 |
| https://www.buckscountysymphony.org/education-and-youth/ | Official page supports Family Concert, competition, school outreach and customer contact; only a P.O. box is published. | 1 / 0 |
| https://bcoc.org/ and https://bcoc.org/who-we-are/ | Official nonprofit pages support food, housing, coaching, weatherization and VITA pathways; inspected pages do not show a street-number service address. | 1 / 0 |
| https://fsabc.org/ | Official Langhorne nonprofit page confirms street address, customer contact and published community-service pathways. | 1 / 0 |
| https://buckslib.org/ | Official library-system homepage confirms Doylestown address, library-card and calendar pathways, and notes a Levittown branch. | 1 / 0 |
| https://belmontsgarage.com/ | Official Langhorne garage site confirms physical address, phone, repair and maintenance categories, and Facebook. | 1 / 0 |
| https://premiumbarbershop.net/ | Official Levittown barbershop site confirms address, booking destination, phone and stated grooming services. | 1 / 0 |

## Mandatory prior-corpus deduplication

The full prescribed September 18 core corpus was scanned before retention: `philadelphia`, `philadelphia-deep-pass`, all six `philly-city-*-depth` folders present, and all five `pa-suburbs-*-depth` folders present—**10 directories and 19 qualifying core JSONL files** (`candidates.jsonl` and `held-candidates.jsonl` wherever present). The scan read **320 prior records**, yielding **320 normalized `(name, city, state)` keys** and **442 normalized customer destinations**.

Normalization lowercased values and removed every non-alphanumeric character for name/city/state. Website domains were lowercased with `www.` removed; for Instagram, Facebook and TikTok, the hostname plus normalized path was compared so account-level destinations were not collapsed to an entire platform. Each proposed record was tested against both sets. **24 proposed records were checked; 0 were excluded for a prior normalized name/location or shared official website/social destination; 24 were retained.** The normalized prospective-to-prior test output is retained in the job workspace at `/home/ubuntu/jobs/1dbb3b42a240_a2/prospective_dedupe.txt` for audit.

## Coverage and limitations

Coverage includes cultural/history museums and public art/craft centers; historic and outdoor public places; youth music, theater, arts and library pathways; food; an explicitly sourced Black-owned-business subset; barbering; auto repair; and countywide community-service organizations. Place records are deliberately routed as `cultural_place`, community pathways as `community_resource`, and the address-less Yogamazia customer destination as `online_business`, rather than misclassifying them as ordinary physical businesses. No user-persona traits are placed in records.

The research does **not** claim suitability, availability, price, hours, age eligibility beyond expressly cited program text, accessibility, safety, health outcomes, language, licensing, ownership beyond explicit attribution, or professional credentialing. Listed programs, events, contact points and customer destinations should be rechecked during review. For the two address-limited music organizations and BCOC, no street address was invented. No coordinates, map pins, production systems, or production databases were accessed.
