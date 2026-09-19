# Philly & Bucks Specialty Services — Sixth-Depth Research Ledger

**Purpose and routing.** This is a protected, review-only research intake. It is not a production import, map-pin publication, or customer-facing directory. The retained records are all `pending_review`; the one held record is `needs_research`. No production database was accessed or modified.

## Results

| Measure | Count |
|---|---:|
| Retained research candidates | 18 |
| Held candidates | 1 |
| Cited primary source URLs | 20 |
| Required prior-corpus JSONL files checked | 19 |
| Required prior-corpus records checked | 320 |
| Prior unique normalized name/city/state keys | 320 |
| Prior unique normalized official destinations | 431 |
| Prior-corpus normalized name/city/state conflicts | 0 |
| Prior-corpus official-destination conflicts | 0 |
| In-batch normalized name/city/state conflicts | 0 |
| In-batch official-destination conflicts | 0 |

## Source Evidence Ledger

| Source URL | Source | Outcome | Retrieval and verification notes |
|---|---|---:|---|
| https://www.phonerepairphilly.com/temple-campus.html | Official Phone Repair Philly Temple Campus page | Retained 1 | Official location page opened; street address, phone, booking/customer site, repair scope, and Facebook link verified. |
| https://www.dreesephotography.com/ | Official D’Mont Reese Photography & Video site | Retained 1 | Official site opened; address, phone, photography/video/event-service scope, and site-linked social destinations verified. |
| https://pridefittraining.com/contact/ | Official PrideFit contact page | Retained 1 | Official contact page opened; address, phone, service navigation, and site-linked Facebook/Instagram verified. |
| https://www.preferred-auto.net/ | Official Preferred Automotive Specialists site | Retained 1 | Official site opened; address, phone, auto-repair service categories, and Facebook link verified. Routed to regulated review. |
| https://www.junctionpc.com/ | Official Junction PC site | Retained 1 | Official site opened; Doylestown address, phone, and technology-service scope verified. |
| https://fitlerclub.com/ | Official Fitler Club site | Retained 1 | Official site opened; street address, membership destination, work/wellness/events scope, and Facebook/Instagram verified. Routed to regulated review due to advertised bars. |
| https://www.cosclub.org/ | Official Cosmopolitan Club of Philadelphia site | Retained 1 | Official site opened; address, phone, membership contact, and club-program scope verified. |
| https://playonphilly.org/contact-us/ | Official Play On Philly contact page | Retained 1 | Official contact page opened; music-center address, phone, enrollment route, and Facebook/Instagram links verified. |
| https://rocktothefuture.org/ | Official Rock to the Future site | Retained 1 | Official site opened; program description, Lyric Lab program-venue address, phone, and Facebook/Instagram links verified. |
| https://pysc.org/ | Official Philadelphia Youth Sports Collaborative site | Retained 1 | Official site opened; office address, provider directory/services, phone, Facebook, and Instagram verified. |
| https://philaedfund.org/ | Official Philadelphia Education Fund site | Retained 1 | Official site opened; college-access/education resource scope and Philadelphia address/phone verified. |
| https://www.pyninc.org/ | Official Philadelphia Youth Network site | Retained 1 | Official site opened; youth education/employment program scope, address, phone, Facebook, and Instagram verified. |
| https://yeahphilly.org/contact-us/ | Official YEAH Philly contact page | Retained 1 | Official contact page opened; address, phone, program-information route, Facebook, and Instagram verified. |
| https://www.phila.gov/departments/department-of-human-services/ | Official City of Philadelphia Department of Human Services page | Retained 1 | Official City page opened; public service links, address, information phone, Facebook, and Instagram verified. |
| https://bcoc.org/ | Official Bucks County Opportunity Council site | Retained 1 | Official home page opened; social-care program scope and customer website verified. |
| https://bcoc.org/contact/ | Official Bucks County Opportunity Council contact page | Retained 1 | Official contact page opened; administrative address, phone, Facebook, and Instagram verified for the retained Bucks County Opportunity Council record. |
| https://fcpartnership.org/ | Official Foundations Community Partnership site | Retained 1 | Official site opened; Bucks County youth/family support scope, address, phone, Facebook, and Instagram verified. |
| https://www.ymcarivercrossing.org/locations/doylestown-ymca | Official River Crossing YMCA Doylestown page | Retained 1 | Official branch page opened; address, phone, sports/fitness/aquatics/esports scope, Facebook, and Instagram verified. |
| https://tylerparkarts.org/ | Official Tyler Park Center for the Arts site | Retained 1 | Official site opened; address, arts offerings, phone, Facebook, and Instagram verified. |
| https://business.lbccc.org/member-directory/Details/bucks-county-performing-arts-institute-4777689 | Lower Bucks County Chamber of Commerce member directory | Held 1 | Credible chamber member page opened; program description and phone verified. Its linked official site http://www.bcpai.org/ returned a hosting placeholder, and no physical customer address was published. |


## Exact Dedupe Method

Before retention, the process enumerated every `*.jsonl` file under the required prior corpus directories: `philadelphia`, `philadelphia-deep-pass`, all `philly-city-*-depth`, and all `pa-suburbs-*-depth` folders. It parsed **320** prior records from **19** files.

A name/location key was normalized by lowercasing `name`, `city`, and `state` separately and removing all non-alphanumeric characters; the three normalized values were then compared as an ordered tuple. This resulted in **320** prior unique normalized name/city/state keys. Official website, Instagram, Facebook, and TikTok destinations were independently normalized by lowercasing, removing the `http://` or `https://` scheme, removing a leading `www.`, and trimming a trailing slash. This resulted in **431** unique comparable prior official destinations. Each retained and held row was tested against both indexes before output; results were **0** name/location conflicts and **0** destination conflicts. The same two tests also produced **0** duplicates within the retained batch. The retained set has **18** unique name/location keys and **46** unique official social/web destinations.

## Coverage

| Category | Retained count | Included practical gaps |
|---|---:|---|
| arts and culture | 1 | arts classes, workshops, camp, and community arts events |
| auto repair | 1 | automotive maintenance and repair |
| children and teen programs | 3 | music, youth programs, teen resource connection |
| education and college preparation | 1 | college access and career-connected learning |
| education and college/career preparation | 1 | college access and career-connected learning |
| fitness | 1 | fitness and athletic training |
| fitness, children, and sports programs | 1 | fitness, aquatics, youth sports, and esports |
| photography and event services | 1 | photography, videography, photo booths, DJ services |
| social care and community resources | 3 | child/family, food, housing, economic mobility, youth/family support |
| social clubs | 2 | membership, coworking, and social connection |
| sports | 1 | youth sports provider discovery and trainings |
| technology repair | 1 | phone/tablet/computer repair and IT support |
| technology services | 1 | specialty services |


| Target kind | Retained count |
|---|---:|
| business | 5 |
| community_resource | 10 |
| cultural_place | 1 |
| regulated_review | 2 |

## Known Limitations and Review Flags

All facts are limited to what the cited official pages or the cited public chamber directory expressly published when retrieved on 2026-09-19. A link from an official website was used as the official social/customer destination where available; no social account was assumed official without that linkage. No ownership designation was retained because no identity or ownership claim was necessary to establish these candidates. No coordinates, map pins, qualification claims, licensing claims, availability claims, pricing claims, safety claims, accessibility claims, or service outcomes were created.

The Fitler Club record is routed to `regulated_review` because its official site advertises bars, and the Preferred Automotive Specialists record is routed to `regulated_review` because its official site describes motor-vehicle repair and state inspections. Neither record certifies a license, authorization, credential, inspection outcome, or quality. Community, city-government, and cultural candidates remain routed as `community_resource` or `cultural_place`, rather than being treated as ordinary businesses. The Doylestown YMCA record does not state or assess daycare licensing; child-care references on the page were deliberately not used as such a claim.

Bucks County Performing Arts Institute is held, not retained: a credible chamber page supported a youth-performing-arts description and phone, but its listed official website returned a hosting placeholder and the chamber entry had no eligible physical customer address. Rock to the Future's address is explicitly described in its official source as the Lyric Lab program venue; it is not asserted to be an administrative office.
