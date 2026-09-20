# Source report — Lincoln University, Pennsylvania

## Scope and method

Research was limited to physical, everyday-life businesses near Lincoln University in the Oxford, Pennsylvania area. The contract requires an HTTPS official destination, a numbered physical address, and explicit ownership evidence where an ownership designation is recorded. Search leads were checked against official business sites and authoritative local-organizational pages; ownership was never inferred from names, cuisine, location, or imagery.

## Eligible candidates

One candidate passed all required checks: **Wholly Grounds Coffeehouse**, 47 S. Third Street, Oxford, PA 19363. Its official HTTPS site identifies the business, describes coffee, donuts, sandwiches and related services, gives the numbered address and phone, and explicitly states that the Hamm Family are owners and that it is a family business. The official site also lists a separate drive-thru location at 2176 Baltimore Pike; only the downtown address is recorded as the candidate.

## Held leads

Two plausible leads were retained rather than promoted. **Sweet Cakes Supplies, LLC** has explicit co-owner evidence in an Oxford Mainstreet Facebook post and a numbered address in search/third-party listings, but its purported official HTTPS site was unreachable during validation. **Vanessa Ross Cakes** has explicit owner evidence in the same Oxford Mainstreet post and an HTTPS destination/social presence, but available sources describe it as home-based and do not provide a numbered street address. Both therefore remain in `held-candidates.jsonl`.

## Source ledger

| Business / purpose | URL | Source role and result |
|---|---|---|
| Wholly Grounds official site | https://whollygroundscoffeehouse.com/ | Primary source. Confirms name, coffee/food services, ownership wording, phone, 47 S. Third Street address, and second drive-thru address. |
| Wholly Grounds local directory page | https://oxfordmainstreet.com/directory/wholly-grounds/ | Authoritative local organization. Confirms dining category and 47 South Third Street address; links a Facebook destination. |
| Oxford Mainstreet ownership post | https://www.facebook.com/DowntownOxfordPA/posts/10159088768294582 | Explicitly identifies Vanessa Ross as owner of Vanessa Ross Cakes, co-owner of Sweet Cakes Supplies, and Cheryl Hamm as co-owner of Wholly Grounds Coffeehouse. Used as ownership evidence for held leads; official Wholly Grounds site independently confirms Hamm Family ownership. |
| Sweet Cakes Supplies official destination | https://sweetcakessupplies.com/ | HTTPS destination attempted; hostname could not be resolved in validation, so lead held. |
| Vanessa Ross Cakes official/social lead | https://www.facebook.com/VanessaRossCakes and https://www.instagram.com/vanessarosscakes/ | HTTPS social destinations found; sources describe a Lincoln University home-based business but no numbered address, so lead held. |
| Oxford Mainstreet directory | https://oxfordmainstreet.com/business-directory/ | Local directory context; page returned sponsor list rather than complete historical directory records. |

## Count reconciliation and limitations

`candidates.jsonl`: **1** eligible record. `held-candidates.jsonl`: **2** plausible but blocked records. No unsupported ownership, address, category, price, accessibility, licensing, hours, menu, or service claims were added. Proximity was treated conservatively as the Oxford area surrounding Lincoln University; no distance or travel-time claim is made. The research is for later review only and does not assert publication or live ingestion.

## Retrieval caveats

The Oxford Mainstreet homepage returned a 403 on fetch, and its general directory endpoint exposed sponsor content rather than a full listing set. Third-party search results were used only to understand lead status, not as a substitute for the required official destination and explicit ownership checks. Sweet Cakes Supplies was not promoted because the official HTTPS site could not be independently reached.
