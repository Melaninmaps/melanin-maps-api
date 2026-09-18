# GPHCC Member Profiles — Philadelphia Deep-Dive Pass 3

## Scope and method

This pass reviewed the public [Greater Philadelphia Hispanic Chamber of Commerce membership directory](https://www.philahispanicchamber.org/membership-directory) and additional member first-party destinations. The directory is a Glueup-powered public index: many member profiles expose only a name, industry, and a member contact/role, while company address, phone, and social links are frequently marked “Available to Members.” Chamber membership is therefore treated as a discovery signal, not proof of ownership or identity.

Six candidate records were retained: five physical commercial records (including two separately mappable Puyero locations) and one online-only record. Physical records have a street address and a business-specific customer-facing destination. LUHV is classified online_business because its official site documents delivery, online shopping, and retail distribution but does not publish an owned street location.

## Evidence table

| Candidate | Chamber profile | First-party evidence | Inclusion notes |
|---|---|---|---|
| Puyero Venezuelan Flavor — 524 S 4th St | [Profile](https://www.philahispanicchamber.org/membership-directory/corporate/3440780) | [puyeroflavor.com](https://www.puyeroflavor.com/) publishes address, phone, hours, dine-in, takeout and delivery. | Physical commercial candidate.
| Puyero On Campus — 3428 Sansom St | [Profile](https://www.philahispanicchamber.org/membership-directory/corporate/3440780) | The same official site publishes this location, phone, hours, takeout and delivery. | Separate location record; no separate chamber profile found.
| El Merkury — 2104 Chestnut St | [Profile](https://www.philahispanicchamber.org/membership-directory/corporate/3492672) | [elmerkury.com](https://www.elmerkury.com/) describes Central American street food, specialties, ordering, and official social links. | Physical commercial candidate; address is published in the site’s current location copy/search-visible page.
| Tierra Colombiana Restaurant — 4535 N 5th St | [Profile](https://www.philahispanicchamber.org/membership-directory/corporate/3960834) | [Official site](https://tierracolombianarestaurant.com/) publishes Latin American/Caribbean food, menus, reservations, catering, events and hours. | Physical commercial candidate; address and phone cross-checked against the public business listing surfaced for the official destination; official extracted homepage did not print them.
| LUHV Food-Vegan Deli LLC | [Profile](https://www.philahispanicchamber.org/membership-directory/corporate/3440782) | [luhvfood.com](https://www.luhvfood.com) publishes vegan grocery delivery, online shop, product locator, wholesale and catering; it says products are in 200+ retail locations. | Online-only candidate; null address and no inferred pin.
| Jezabels — 208 South 45th St | [Profile](https://www.philahispanicchamber.org/membership-directory/corporate/3440983) | [jezabelsphl.com](https://www.Jezabelsphl.com) publishes address, phone, Argentine bakery/restaurant/market description, pre-order, reservations and experiences. | Physical commercial candidate.

## Ownership and regulated-service handling

The JSONL preserves only role labels explicitly printed in chamber profiles: Sofia DeLeon as Owner; Silvia Lucci as Founder/CEO; Jezabel Careaga as Founder & CEO; and Mercy Mosquera as Vicepresident. Puyero’s profile lists Simon Arends without an ownership role. These are published designations, not independently inferred ownership findings. No candidate is classified as a regulated profession; health, legal, finance, childcare, and similar services were not included in this retained set.

## Exclusions and access limits

The directory contained many additional members, but this pass did not retain profiles lacking a physical street address and a business-specific customer destination, nor did it use the chamber’s own social accounts or generic directory URLs as customer destinations. Spanish Workshop for Children was not retained because the reviewed public materials identified regional locations but did not provide one unambiguous street address suitable for a single physical map record. Casa Mexico / South Philly Barbacoa was not retained because the reviewed official page did not expose a street address in extracted content. Profiles whose website, phone, address, or social fields were marked “Available to Members” were not backfilled from chamber or generic search pages unless an official first-party destination supplied the required evidence.

Source access was public and read-only. No database/API was called and nothing was published.
