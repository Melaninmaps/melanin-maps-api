# Florida A&M University neighborhood directory research

**Research date:** 2026-09-20
**Campus/city:** Florida A&M University, Tallahassee, Florida
**Scope:** Research-only; no ingestion, publication, or database access was attempted.

## Contract application

The contract permits **0–3** nearby, everyday-life physical businesses and requires a current official HTTPS destination, a numbered physical address supported by the business or an authoritative source, and explicit ownership evidence where an ownership designation is recorded. I returned three candidates, all food businesses with numbered Tallahassee addresses and explicit Black-ownership evidence. Proximity was recorded only where a source explicitly connected a business to FAMU; no distance threshold or coordinates were invented.

## Candidate source ledger

| Candidate | Official/primary destination and address evidence | Ownership evidence | Status |
|---|---|---|---|
| Olean's Cafe | [Visit Tallahassee partner page](https://visittallahassee.com/partners/oleans-cafe/) gives **1605 S Adams St, Tallahassee FL 32301**, phone, Southern-food description, and says it is directly across from FAMU. | The same authoritative tourism page explicitly says Olean McCaskill owns and operates the café. [Black Restaurant Week](https://blackrestaurantweeks.com/16-black-owned-eateries-in-tallahassee/) corroborates the founders and Black-owned culinary context. | Included |
| SneauxBall Catering Co. | [Official location page](https://www.sneauxball.com/location) lists Store Front **2033 S. Adams St.**; [official bio](https://www.sneauxball.com/bio) repeats the address. | [Official bio](https://www.sneauxball.com/bio) explicitly identifies Jarrett Maloy as founder and owner. [Black Restaurant Week](https://blackrestaurantweeks.com/16-black-owned-eateries-in-tallahassee/) corroborates owner and Black-owned feature context. | Included |
| Pineappetit | [Official website](https://www.pineappetit.com/) lists **Restaurant: 626-2A Railroad Square, Tallahassee, FL 32310** and phone; [Black Restaurant Week](https://blackrestaurantweeks.com/16-black-owned-eateries-in-tallahassee/) independently lists a Tallahassee address and official website. | The official press kit explicitly calls Pineappetit a Florida-based **Black-owned** culinary brand and identifies Chef Samuel Burgess as Founder & Owner. | Included |

## Held-lead ledger

| Held lead | Evidence found | Precise hold reason |
|---|---|---|
| Crabs on the Run | [Black Restaurant Week](https://blackrestaurantweeks.com/16-black-owned-eateries-in-tallahassee/) lists 1174 Capital Circle SE, an official-looking HTTPS URL, and Chef Green Hawkins; the URL currently resolves to an expired-domain sales page. | **Hold:** current official destination is unreachable/ambiguous; contract rule 10 requires an official HTTPS destination that is reachable and unambiguous. |
| Halisi Africa | [Black Restaurant Week](https://blackrestaurantweeks.com/16-black-owned-eateries-in-tallahassee/) lists 625 Railroad Square and ownership context, but the listed website is HTTP. | **Hold:** no independently validated current HTTPS official destination; contract requires HTTPS. |

## Count reconciliation and limitations

`candidates.jsonl` contains **3** eligible records; `held-candidates.jsonl` contains **2** plausible but contract-ineligible leads. No exact normalized name-plus-street-address duplicate was included. Sources vary in freshness, and this review did not independently verify operating hours, licensing, menus, accessibility, or measured walking/driving distance. The Visit Tallahassee page is an authoritative destination source for Olean's but its “Go to Website” field is blank; the page itself is used as the current HTTPS destination because it supplies the address, business description, and explicit ownership evidence. All records remain `research_only` and are not claims of live publication.

## URLs consulted

- https://www.famu.edu/
- https://visittallahassee.com/blog/blackowned/
- https://visittallahassee.com/Activities/black-owned-businesses/
- https://visittallahassee.com/partners/oleans-cafe/
- https://www.sneauxball.com/
- https://www.sneauxball.com/location
- https://www.sneauxball.com/bio
- https://www.pineappetit.com/
- https://blackrestaurantweeks.com/16-black-owned-eateries-in-tallahassee/
- https://www.crabsontheruntally.com/
