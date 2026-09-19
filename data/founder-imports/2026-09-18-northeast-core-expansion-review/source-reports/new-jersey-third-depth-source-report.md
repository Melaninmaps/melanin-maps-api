# New Jersey Third-Depth Review-Only Mapping Research

## Result

This review-only pass retained **8 candidates** and held **4 candidates**. The retained set is deliberately small: every physical commercial candidate has a listing-level source, a publicly supported numbered address, and an inspected official website or official business-social destination. No coordinates, map pins, production writes, account changes, or other operational actions were made.

The geographic emphasis was New Jersey statewide, with particular attention to Camden and South Jersey. The set also includes Somerville because the public downtown directory supplied listing-level, address-and-destination evidence. Source discovery and inspection covered food and beverage, retail, financial services, home services and trades, health and wellness, arts and culture, education/childcare, non-profits/community services, and grocery/food markets.

## Counts and category coverage

| Output | Count | Category coverage |
|---|---:|---|
| Retained candidates | 8 | Food and beverage (3); community services (2); financial services (1); home services (1); retail (1) |
| Held candidates | 4 | Food and beverage (1); arts/culture (1); childcare (1); health research (1) |
| Existing-record duplicate exclusions | 12 | Food and beverage; home services; retail; arts/culture; financial and professional services |
| Public source families opened | 8 | Municipal/BID, local business association, downtown alliance, Black-business directory, Black-community directory, African American chamber, statewide Hispanic chamber, regional chamber directory |

The **retained** records are Safe and Sound Stewards; The All Natural Corner 2; Hopeworks Camden; Center for Family Services; Runnemede Plumbing, Heating, Cooling & Electric; Moka & Co; Bombay Canteen; and Reunion Sweet Parlor. Safe and Sound and Runnemede are routed as `regulated_review` because they are finance/accounting and explicitly licensed trade services, respectively. Hopeworks and Center for Family Services are routed as `community_resource`; no commercial status was inferred for them.

The **held** records were not relaxed into candidates. Bert’s Steak & Sub House lacks an official customer destination on the listing. Walt Whitman House and Coriell Institute for Medical Research lack a numbered address in the inspected listing. Respond, Inc. – Linden St Child Development Center lacks a numbered listing address, while its inspected organization homepage provides an organizational contact address rather than a confirmed center address.

## Deduplication

Before source work, the complete prior research corpus was parsed: **102 JSONL files, 3,267 records, and zero malformed JSON lines**, excluding this output folder. Each prospective record was conservatively screened using normalized name plus city, state, country, and address; a normalized same-name/city/state/country screen was also run. Full-record duplicates were blocked from emission. The following matches were excluded rather than duplicated: Nuanced Café; Thomas Lift (William Butler’s Studio); Luminous Solar; Bricks Chimney Services; Fresh Start Restoration; Lienas Group Cakes and Gifts Corp; Flores de Azucar; Mexican Spice; Medina Food Market; Phoenician Construction, LLC; The Mexi Boys; and Triple C/3c DBA Taste of the Caribbean Food Market. The Mexi Boys and Taste of the Caribbean were additionally observed to have address discrepancies between their Chamber listing and inspected official destination, but were already excluded as existing records.

## Source families and inspected URLs

The following is the complete URL log for the pages opened or fetched in this research pass. “Official destination” means an official website or business social page expressly linked by the inspected listing, or directly inspected as the organization’s customer destination. A failed or dynamic page remains listed so the research boundary is auditable.

### Downtown Camden Business Directory (municipal/BID source family)

**Directory/category pages opened**

- https://mydowntowncamden.com/business-directory/
- https://mydowntowncamden.com/business-directory/page/2/
- https://mydowntowncamden.com/places/category/food-beverage/
- https://mydowntowncamden.com/places/category/arts-culture-entertainment/
- https://mydowntowncamden.com/places/category/educational-institutions/
- https://mydowntowncamden.com/places/category/financial-institutions/
- https://mydowntowncamden.com/places/category/non-profits/

**Listing pages opened**

- https://mydowntowncamden.com/places/berts-steak-sub-house/
- https://mydowntowncamden.com/places/nuanced-cafe/
- https://mydowntowncamden.com/places/medina-food-market/
- https://mydowntowncamden.com/places/safe-and-sound-stewards/
- https://mydowntowncamden.com/places/walt-whitman-house/
- https://mydowntowncamden.com/places/coriell-institute-for-medical-research/
- https://mydowntowncamden.com/places/thomas-lift-william-studio/
- https://mydowntowncamden.com/places/hopeworks-camden/
- https://mydowntowncamden.com/places/respond-inc-linden-st-child-development-center/
- https://mydowntowncamden.com/places/the-all-natural-corner-2/
- https://mydowntowncamden.com/places/center-for-family-services/

**Official destinations inspected**

- https://www.nuancedcafe.com/
- https://medina-food-market.business.site/ *(opened; no extractable public text, so not relied upon)*
- https://www.safeandsoundstewards.com/
- https://nj.gov/dep/parksandforests/historic/waltwhitmanhouse.html
- https://www.coriell.org/
- https://thomaslift.com/
- https://hopeworks.org/
- https://respondincnj.org/
- https://the-all-natural-corner-store-2.square.site/
- https://www.centerffs.org/

### South Jersey Business Association (local association source family)

**Directory and listing pages opened**

- https://www.southjerseybusinessassociation.org/local-business-directory/
- https://www.southjerseybusinessassociation.org/listings/luminous-solar/
- https://www.southjerseybusinessassociation.org/listings/phoenician-construction-llc/
- https://www.southjerseybusinessassociation.org/listings/bricks-chimney-services/
- https://www.southjerseybusinessassociation.org/listings/runnemede-plumbing-heating-cooling-electric/
- https://www.southjerseybusinessassociation.org/listings/fresh-start-restoration-anthony-cellasio/

**Official destinations inspected**

- http://www.luminoussolar.com/
- https://www.phoenicianconstructioninc.com/ *(opened; hostname was not resolvable by the reader)*
- https://www.fixedbybricks.com/
- https://www.thebigredr.com/
- http://www.getafreshstartrestoration.com/

### Downtown Somerville Business Directory (downtown alliance source family)

**Directory and official destinations inspected**

- https://downtownsomerville.org/business-listing/
- https://mokanco.com/somerville/
- https://www.instagram.com/mokacocoffee
- https://bombaycanteen.com/
- https://www.sweetparlor.com/

### Statewide Hispanic Chamber of Commerce of New Jersey (Chamber directory source family)

**Directory/category pages opened**

- https://business.shccnj.org/list
- https://business.shccnj.org/list/category/grocery-stores-72
- https://business.shccnj.org/list/category/restaurants-74
- https://business.shccnj.org/list/category/contractors-23

**Listing pages opened**

- https://business.shccnj.org/list/member/lienas-group-cakes-and-gifts-corp-elizabeth-46688
- https://business.shccnj.org/list/member/flores-de-azucar-jersey-city-45350
- https://business.shccnj.org/list/member/the-mexi-boys-east-brunswick-51689
- https://business.shccnj.org/list/member/mexican-spice-51662
- https://business.shccnj.org/list/member/triple-c-3c-dba-taste-of-the-caribbean-food-market-orange-45153

**Official destinations inspected**

- https://lienascakes.com/
- https://www.instagram.com/_flores_de_azucar_/
- http://www.themexiboys.com/
- http://www.mexicanspice.net/
- https://tasteofthecaribbeanfoodmarket.com/
- https://tasteofthecaribbeanfoodmarket.com/location.php

### African American Chamber of Commerce (Chamber directory source family)

- https://membership.aachamber.com/list
- https://membership.aachamber.com/list/Search/shopping-specialty-retail-792059
- https://membership.aachamber.com/list/Search/restaurants-food-beverages-792064
- https://membership.aachamber.com/list/Search/business-professional-services-792025

### North Jersey Alumnae Chapter, Delta Sigma Theta Black-Owned Business Directory (diaspora/Black-business source family)

- https://www.northjerseydeltas.org/black-owned-business-directory

### Black Community Shoppe New Jersey Black-Owned Business Directory (Black-business source family)

- https://www.blackcommunityshoppe.com/new-jersey

### Chamber of Commerce Southern New Jersey (regional chamber source family)

- https://business.chambersnj.com/directory *(opened; reader returned navigation only, so it yielded no listing-level records)*

## Research-only boundary

This output is a **research review queue**, not a map or a recommendation. It stores only public source wording, listing facts, and directly observed official-destination information. No ownership, protected traits, culture, language, licensure beyond an explicit statement, pricing, availability, hours, quality, safety, accessibility, or current operating status was inferred. The `sourceStatus` value `listed` means the record was present on its public source when inspected; it is not an assertion that the organization is open, active, licensed, or endorsed. No latitude/longitude or map coordinate was created.

## References

[1]: https://mydowntowncamden.com/business-directory/ "Downtown Camden Business Directory"
[2]: https://www.southjerseybusinessassociation.org/local-business-directory/ "South Jersey Business Association Local Business Directory"
[3]: https://downtownsomerville.org/business-listing/ "Downtown Somerville Full Business Directory"
[4]: https://business.shccnj.org/list "Statewide Hispanic Chamber of Commerce of New Jersey Business Directory"
[5]: https://membership.aachamber.com/list "African American Chamber of Commerce Active Member Directory"
[6]: https://www.northjerseydeltas.org/black-owned-business-directory "North Jersey Alumnae Chapter Black-Owned Business Directory"
[7]: https://www.blackcommunityshoppe.com/new-jersey "Black Community Shoppe New Jersey Directory"
[8]: https://business.chambersnj.com/directory "Chamber of Commerce Southern New Jersey Directory"
