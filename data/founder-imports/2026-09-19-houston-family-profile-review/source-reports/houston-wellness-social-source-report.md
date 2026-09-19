# Houston Wellness, Dining, Music, and Social Experiences Research Report

## Scope and method

This research covers **Houston, Texas only**. Category selection was limited to spas, salons, nails, skincare, wellness, elevated dining, date-night dining, jazz, live music, and social experiences. It used the stated profile only to prioritize these categories; it makes no inference about identity, health status, income, family circumstances, or any preference beyond the context supplied.

Records were included only where a credible public, association, nonprofit, or municipal/destination source was opened **and** an official customer-facing destination was opened. Ownership and organizational designations are recorded only where the named source expressly supplies the designation. No ownership, demographic identity, licensing, accessibility, price, hours, quality, language, or safety conclusion has been inferred from a name, imagery, or location.

## Output counts

| File | Count | Treatment |
|---|---:|---|
| `candidates-wellness-social.jsonl` | 12 | Source-backed, destination-opened Houston records |
| `held-wellness-social.jsonl` | 6 | Leads retained for a stated verification, identity, location, or technical-access reason |

## Candidate mix and within-category duplicate checks

| Category | Candidate count | Deduplication check | Result |
|---|---:|---|---|
| Wellness | 3 | Normalized name + numbered address + official domain | No duplicates |
| Dining | 6 | Normalized name + numbered address + official domain | No duplicates |
| Music | 2 | Normalized name + numbered address + official domain | No duplicates |
| Social experiences | 1 | Normalized name + numbered address + official domain | No duplicates |

The same normalized-name/address/domain check was also applied across the full candidate set. **No cross-category duplicate records were found.** MOCA 4212 is classified once under dining even though its official destination also advertises live music; this avoids duplicating one physical venue across dining and music.

## Opened source and destination URLs

### Sources used for candidate inclusion

| Source | URLs opened | Use |
|---|---|---|
| Visit Houston / Houston First | [Spa guide](https://www.visithoustontexas.com/things-to-do/spas-and-fitness/unique-and-natural-spa-treatments/); [Live music guide](https://www.visithoustontexas.com/things-to-do/arts-and-culture/live-music/) | Source context for Sanctuary, Trellis, Persona, Axelrad, and Continental Club |
| Black Restaurant Week | [Houston campaign directory](https://blackrestaurantweeks.com/houston-black-restaurant-week/) | Houston restaurant directory and directory-level Black-owned designation for Davis Street, Winsome Prime, MOCA, and Juliet |
| Texas Restaurant Association | [Hispanic-Owned Restaurants in Texas](https://txrestaurant.org/Pub/Pub/Hispanic-Owned-Restaurants-in-Texas.aspx) | Houston-area association directory and directory-level Hispanic-owned designation for Caracol and Xochi |
| Discovery Green Conservancy | [Official destination](https://www.discoverygreen.com/) | Primary nonprofit source and customer-facing destination for Discovery Green |

### Official customer-facing destinations opened for candidates

- [Sanctuary Spa](https://www.besanctuary.com/)
- [Trellis Spa at The Houstonian](https://www.houstonian.com/trellis-spa)
- [Persona Medical Spa](https://personamedicalspa.com/)
- [Davis Street](https://www.davisstreet.com/)
- [Winsome Prime](https://www.winsomeprime.com/houston)
- [MOCA 4212](https://mocahtx.com/moca-restaurant/)
- [Juliet](https://www.juliethtx.com/)
- [Caracol](https://www.caracol.net/)
- [Xochi](https://www.xochihouston.com/)
- [Axelrad](https://www.axelradhouston.com/)
- [The Continental Club Houston](https://continentalclub.com/houstonclub)
- [Discovery Green](https://www.discoverygreen.com/)

### Additional opened public/official pages and held-lead destinations

- [Visit Houston Latin American cuisine guide](https://www.visithoustontexas.com/taste-houston/trending/hispanic-heritage-month-our-guide-to-latin-american-cuisine/)
- [Visit Houston Root of You listing](https://www.visithoustontexas.com/listings/the-root-of-you-salon-and-day-spa/20475/) and [The Root of You destination](https://www.therootofyou.com/)
- [Doc’s Jazz Club](https://docsjazzclub.com/)
- [A’dor Almeda](https://adoralmeda.com/)
- [Houston Jazz Collective](https://houstonjazzcollective.org/about/)
- [Jazz Houston](https://www.jazzhouston.org/)
- [Empire State Jazz Cafe](https://empirestatejazzcafe.com/)
- [House of Blues Houston](https://houston.houseofblues.com/)
- [713 Music Hall](https://www.713musichall.com/)
- [Hugo’s](https://www.hugosrestaurant.net/)

## Held-record rationale

The held file retains six leads rather than forcing uncertain records into the candidate set. The Root of You has a source/destination scope mismatch; Dripped Nails has no verified destination or numbered address; Doc’s Jazz Club was blocked by a security page; A’dor Almeda’s opened destination did not render current location/contact details; Houston Jazz Collective lacked a numbered public address/phone; and Jazz Houston supplied only a PO Box, not a public street address. These are not negative quality judgments.

## Limitations

Pages were reviewed as publicly available on **2026-09-19**. Restaurant and venue programming, business names, locations, menus, and social links can change. Directory-level Black-owned and Hispanic-owned labels are preserved as the respective directory/association’s explicit designations, not independently adjudicated ownership claims. The Texas Restaurant Association page identifies its list as Hispanic-owned; Black Restaurant Week describes its Houston campaign as a place to discover Black-owned restaurants and culinary businesses. The included medical-spa record is routed to `regulated_review`; the destination’s statements about licensed personnel were not independently verified against a licensing board. No coordinates were collected or written.

## Research-only statement

**This was research only. No production database/API write, pin, geocode, deployment, authentication change, user change, session change, payment change, or waitlist change was performed.**
