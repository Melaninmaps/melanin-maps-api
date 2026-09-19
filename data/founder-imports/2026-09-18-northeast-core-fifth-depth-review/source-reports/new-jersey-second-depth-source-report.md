# New Jersey second-depth — source report

**Research status:** review-only. Completed 2026-09-18; no geocoding, coordinates, map pins, API/database writes, publication, deployment, or business-account changes were performed.

## Output and disposition counts

* **Retained candidates:** 15
* **Held candidates:** 14
* **Target kinds:** business (10), online_business (3), regulated_review (2)
* **Retained categories:** Arts & design (1), Books & culture (1), Business services (1), Childcare (1), Food & beverage (5), Online retail (2), Online retail & learning (1), Personal and document services (1), Photography & media (2)
* **Everyday-need categories inspected:** food & beverage; books & culture; photography & media; arts & design; retail; business services; health services; childcare; personal/document services; online retail & learning. This exceeds the requested seven-category inspection threshold.

## Source families checked

- My Downtown Camden municipal downtown business directory
- Camden County National Black Business Month business listing
- Trenton Downtown Association business-directory / business-spotlight family
- Statewide Hispanic Chamber of Commerce of New Jersey member directory
- North Jersey Alumnae Chapter Delta Sigma Theta Black Owned Business Directory
- Burlington Mercer Chamber of Commerce member-directory interface (reviewed; no retained record)
- Mercer County Diverse Business Directory landing page (reviewed; no usable listing export)
- Chamber of Commerce Southern New Jersey directory endpoint (reviewed; no usable record extraction)

## Dedupe method

Before writing, the generator parsed every pre-existing `candidates.jsonl` and `held-candidates.jsonl` under `/home/ubuntu/directory-research-wave-2026-09-18/`, excluding this output folder. It normalized names, city, state, country, and address by lowercasing and stripping non-alphanumerics. Each retained row was rejected if either its full normalized five-part key matched an existing row or its normalized name + city + state matched (the conservative same-name screen). No retained row matched. Uncertain similar names were not merged.

## Retention boundary

A physical commercial record was retained only when a listing-level public source supplied a business name, category, and numbered street address, and an official customer-facing website or official social destination was inspected without an unresolved address conflict. Explicit online/service-by-appointment businesses were retained only with `address: null` and no coordinates. Counseling, childcare, and notary/document-service leads are routed as `regulated_review`; no credential, licensure, quality, safety, language, price, hours, availability, accessibility, or protected-trait claim is inferred. Non-retained leads remain in `held-candidates.jsonl` with concrete reasons. Directory placement is the only ownership-context evidence used, with attribution in the records.

## Inspected URLs and dispositions

| Family | URL | Disposition |
|---|---|---|
| My Downtown Camden business directory | https://mydowntowncamden.com/business-directory/ | source index; listings reviewed |
| My Downtown Camden | https://mydowntowncamden.com/places/category/arts-culture-entertainment/ | category index reviewed |
| My Downtown Camden | https://mydowntowncamden.com/places/category/professional-services/ | category index reviewed |
| My Downtown Camden | https://mydowntowncamden.com/places/category/food-beverage/ | category index reviewed |
| My Downtown Camden | https://mydowntowncamden.com/places/la-unique-african-american-bookstore-and-cultural-center/ | retained source |
| Official | https://www.launiquebookstore.com/ | retained official |
| My Downtown Camden | https://mydowntowncamden.com/places/nuanced-cafe/ | retained source |
| Official | https://www.nuancedcafe.com/ | retained official |
| My Downtown Camden | https://mydowntowncamden.com/places/ejm-photography-studio/ | retained source |
| Official | https://www.ejmphoto.com/ | retained official |
| My Downtown Camden | https://mydowntowncamden.com/places/thomas-lift-william-studio/ | retained source |
| Official | https://thomaslift.com/ | retained official |
| My Downtown Camden | https://mydowntowncamden.com/places/mci-cleaning-services-inc/ | held source |
| Official | https://mcicleaning.com/ | held: address conflict |
| My Downtown Camden | https://mydowntowncamden.com/places/medina-food-market/ | held source |
| Official | https://medina-food-market.business.site/ | held: no extractable content |
| My Downtown Camden | https://mydowntowncamden.com/places/dion-gama-hair-braiding/ | held: no destination |
| My Downtown Camden | https://mydowntowncamden.com/places/leap-stem-puerto-rican-art-center/ | held: no destination |
| My Downtown Camden | https://mydowntowncamden.com/places/mylestone-restaurant/ | reviewed; no official destination |
| Camden County | https://www.camdencounty.com/service/national-black-business-month/ | source listing family / retained and held records |
| Official | https://www.rochestersbbqandgrill.com/ | held: address conflict |
| Official | https://galeriemarie.net/ | held: address conflict |
| Official | https://www.lesbiveggies.com/ | held: address conflict |
| Official | https://catscreationsbakerynj.com/ | held: domain unresolved |
| Official | https://www.freehaveneducationalfarms.com/ | held: location unresolved |
| Official | https://auntbertaskitchen.com/ | held: address conflict |
| Official | https://eccsupply.com/ | held: closed |
| Official | https://littlehandsservices.com/ | held: unsafe unrelated redirect |
| Official | https://www.dpccounseling.com/ | retained official |
| Official | https://hotbuttersoulsupperclub.com/ | retained official |
| Official | https://www.wander-boutique.com/ | retained official |
| Official | https://www.artisanartgallery.com/ | reviewed; not retained |
| Official | http://backalleybarbeque.net/ | reviewed; unrelated destination |
| Trenton Downtown Association | https://www.trenton-downtown.com/business-directory | source index |
| Trenton Downtown Association | https://www.trenton-downtown.com/blog/business-spotlights | source index |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/base-camp-trenton | retained source |
| Official | https://www.basecamptrenton.com/ | retained official |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/photographer-quayshaun-williams | retained source |
| Official | https://www.muchbetterworld.com/ | retained official |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/skil-lit-cafe | retained source |
| Official | https://skillitcafe.com/ | retained official |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/1911-smokehouse-bbq | retained source |
| Official | https://1911bbq.com/ | retained official |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/warren-street-multiservices | retained source |
| Official | https://warrenstservices.com/ | retained official |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/royal-cake-creations | held source |
| Official | https://royalcakecreations.com/ | held: domain unresolved |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/moja-life | held source |
| Official | https://www.mojalife.com/ | held: no extractable content |
| Official | https://www.instagram.com/mojalifenj/ | held: profile unavailable |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/tracys-kitchen | reviewed; no retained record |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/success-barber-shop-salon | reviewed; no inspected official destination |
| Trenton Downtown Association | https://www.trenton-downtown.com/blogs/classic-used-books | reviewed; dated source / no current commercial verification |
| Statewide Hispanic Chamber | https://business.shccnj.org/list | source index |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/restaurants-74 | category reviewed |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/member/the-shop-pizzeria-market-50487 | retained source |
| Official | https://www.theshoppizzeriamarket.com/ | retained official |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/childcare-55 | category reviewed |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/member/miranda-s-daycare-llc-51429 | retained source |
| Official | http://mirandas-daycare.square.site/ | retained official |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/health-care-99 | category reviewed |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/member/devine-alignment-boonton-46677 | reviewed; no retained record |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/auto-repair-services-123 | category reviewed |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/financial-investment-services-27 | category reviewed |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/grocery-stores-72 | category reviewed |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/clothing-shoes-79 | category reviewed |
| Statewide Hispanic Chamber | https://business.shccnj.org/list/category/printing-typesetting-services-5 | category reviewed |
| North Jersey Deltas | https://www.northjerseydeltas.org/black-owned-business-directory | source listing family / retained records |
| Official | https://www.harperscafenj.com/ | retained official |
| Official | https://www.harperscafenj.com/west-orange-new-jersey | retained official location |
| Official | https://www.culturedexpressions.com/ | retained official |
| Official | https://www.loveyourselfallnatural.com/ | retained official |
| Official | https://jamsbykim.com/ | retained official |
| Official | http://www.africanworldimports.com/ | reviewed; outside New Jersey / no public storefront |
| Official | https://www.cafemoso.com/ | reviewed; no extractable content |
| Official | https://www.bse.coffee/ | discovered but not retained |
| Burlington Mercer Chamber | https://burlingtonmercerchamber.org/member-directory/ | directory interface reviewed |
| Mercer County | https://www.mercercounty.org/work/mercer-county-small-business-outreach-program/mercer-county-business-directory | landing page reviewed |
| Southern New Jersey Chamber | https://business.chambersnj.com/directory/FindStartsWith?term=N | endpoint reviewed |

## Held-record summary

Held outcomes comprise five unresolved numbered-address conflicts, one closed/parked business site, four missing or unusable official customer destinations, one unsafe unrelated redirect, and three records with no official customer destination in the public listing. The source and destination URLs plus record-specific reasons are in `held-candidates.jsonl`.
