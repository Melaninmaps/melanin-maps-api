# Houston Beauty, Spa, and Self-Care Discovery Research

**Research date:** 2026-09-19
**Geography:** Houston and clearly Houston-metro locations only
**Category:** Nail salons, hair salons, textured/natural hair care, braiding, spa, skincare, facials, massage/bodywork, beauty supply, and self-care.

## Result

This research pass produced **18 candidate records** and **10 held records**. The candidate set favors leads for which an opened directory/editorial or official source supported the discovery lead and an opened official customer-facing website or official social profile supported the address or customer destination. The set contains hair, textured-hair, braiding, beauty-supply, day-spa, massage/bodywork, facial, and medical-spa options. Ownership designations appear only where a source explicitly made the designation.

Several candidates are deliberately routed as **`regulated_review`**. This is not a statement that a license is present or absent. It is a review-routing choice because an official destination describes medical-spa, injectable, massage, bodywork, or other potentially regulated services. No quality, availability, safety, accessibility, price, hours, language, demographic identity, or provider credentials were inferred.

## Source use and coverage

The Houston Black Pages says it promotes African American businesses in the Greater Houston area and its beauty-salon and beauty-supply directories supplied the source-designated Black-business leads. [1] [2] BLK Society describes its Houston Black-owned guide as hand-verified and was used where it supplied an explicit Black-owned designation. [3] Houstonia's 2024 Black-hair guide and 2026 spa guide supplied additional local discovery leads. [4] [5]

The table identifies every **opened source URL used for a candidate or held lead**, including official customer-facing destinations. Entries marked “held” are evidence of why a record was not promoted.

| Source family | Opened URL(s) | Use |
|---|---|---|
| The Houston Black Pages | [Beauty salons](http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-beauty-salon-directory~1880); [beauty supplies](http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-beauty-supply-stores-directory~5635); [directory categories](http://thehoustonblackpages.com/BusinessCategory.aspx) | Source-designated Black-business discovery and category context. |
| BLK Society | [Houston guide](https://www.blksociety.com/black-owned/houston); [Brashae’s](https://www.blksociety.com/stores/brashae-s-beauty-supply); [Lush RX](https://blksociety.com/directory/lush-rx-med-spa); [RCUE](https://blksociety.com/stores/rcue-nail-bar); [The Black Store](https://blksociety.com/stores/the-black-store); [Tendrils and Curls](https://blksociety.com/stores/tendrils-and-curls); [Pampered & Twisted](https://blksociety.com/stores/pampered-twisted-natural-hair-boutique); [T&C Beauty Supply](https://blksociety.com/stores/t-c-beauty-supply-store) | Black-owned designations, addresses, and closure/holding checks. |
| Houstonia | [Black hair salons](https://www.houstoniamag.com/style-and-shopping/black-hair-salons-houston); [day spas and massage](https://www.houstoniamag.com/health-and-wellness/best-massage-facial-day-spas-houston) | Editorial discovery of hair and spa candidates, then confirmed against official destinations. |
| Hair and beauty official destinations | [Brashae’s](https://brashaesbeautysupplytx.com/); [Salon Meyerland](https://www.salonmeyerland.com/); [Trendz by Tammy](https://trendzbytammy.com/); [The Beauty Vault Instagram](https://www.instagram.com/thebeautyvaulthtx/); [Beauty Vault store](https://beautyvaulta.com/); [WOW](https://wowhairbraiding.com/); [Pressed Roots locations](https://pressedroots.com/locations); [A Vibe Called Hair](https://avibecalledhair.square.site/); [Cheveux by Mone’](https://www.cheveuxbymone.com/); [Salon Rose](https://www.salonrose.co/); [Braid Bar](https://www.braidbarhouston.com/); [Feminine Attractions](https://feminineattractions.com/); [Gorgeous Strands](https://www.instagram.com/gorgeousstrands/); [J.A.M. Beauty Bar](https://jambeautybar.com/) | Official address, booking, service, social, or held-reason validation. |
| Spa and self-care official destinations | [Camellia Alise](https://www.camelliaalise.com/); [Lush RX](https://www.lushrx.com/); [ROG Medspa](https://rogmedspa.com/about-rog-medspa/); [ROG booking](https://booking.rogmedspa.com/); [Hammam](https://www.thehammamspa.com/); [Sanctuary](https://www.besanctuary.com/); [Sunset Body Works](https://www.sunsetbodyworks.com/); [My Spa Joy](http://www.myspajoy.com/); [Oasis Massage](https://oasismassagesalon.com/); [Bare Necessities](https://bnwax.com/); [Sudor](https://www.sudorsauna.com/); [True REST locations](https://truerest.com/locations/houston/) | Official customer-destination validation and held-reason checks. |
| Additional directory/source checks | [HTX Black Beauty Supply](https://www.htxblackbeautysupply.com/); [BuyBlack Houston Beauty & Spas](https://www.buyblack.org/houston/beauty-spas/) | Discovery-context checks. BuyBlack rendered only a count/load-more shell; it did not supply record-level evidence used in the output. |

## Candidate and held-record decisions

**Candidate inclusion.** Each candidate has a numbered physical address from an opened official site, an official social profile, or—where the source itself was the official profile—its displayed contact information. Business records with medical-spa or massage/bodywork offerings are segregated into `regulated_review`. The 18 candidate rows are distinct by normalized business name and street address. In particular, Lush RX appears once, Bare Necessities uses its Upper Kirby branch once, and WOW uses its Bissonnet branch once despite the official site describing two branches.

**Held records.** Ten leads remain held. Two source profiles explicitly identify Houston stores as closed. The Black Store has no verified official customer destination and a conflicting current-status signal. RCUE has no official customer-facing destination in the opened record. Braid Bar, Gorgeous Strands, J.A.M. Beauty Bar, and Sudor lack a publicly sourced numbered address. Feminine Attractions has unreconciled address conflict between the guide and official site. True REST's editorial Houston lead is not supported by the opened current official location list.

## Field and deduplication checks

The JSONL output contains **exactly 23 fields in the requested order**. `sourceRow` is consecutive within each file. Unknown values are represented by literal JSON `null`, not empty strings. Address, name, normalized name-plus-address, and official-domain checks were performed manually in assembling the rows; a final programmatic schema and row-order check was run during file creation. No coordinates were added. No record was duplicated in the candidate file.

## Limitations

This is a discovery-research artifact, not a verification of business operation, ownership, provider licensure, current menu, qualifications, accessibility, or safety. Directory records can become stale; official sites and official social profiles can also change. Source labels are retained as labels, rather than generalized into any unquoted demographic, linguistic, or ownership inference. Physical-business leads without a public numbered address, with conflict, or without an official destination were retained in held JSONL rather than promoted.

## Scope and non-production statement

This work is **research-only**. It performed **no production database/API write, publication, map pin, geocode, deployment, native build, auth/user/session/waitlist/payment change**.

## References

[1]: http://thehoustonblackpages.com/BusinessCategory.aspx "The Houston Black Pages business categories"
[2]: http://thehoustonblackpages.com/BusinessDirectory/houston-black-owned-beauty-salon-directory~1880 "The Houston Black Pages Beauty Salon Listings"
[3]: https://www.blksociety.com/black-owned/houston "BLK Society Black-Owned Houston guide"
[4]: https://www.houstoniamag.com/style-and-shopping/black-hair-salons-houston "Houstonia Black Hair Salons in Houston"
[5]: https://www.houstoniamag.com/health-and-wellness/best-massage-facial-day-spas-houston "Houstonia The Best Day Spas and Massage Spots in Houston"
