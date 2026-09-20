# Hampton University neighborhood business research

**Research target:** Hampton University, Hampton, Virginia. **Status:** research only. No ingestion, publication, or database access was attempted.

## Result

Three candidates are included. Each has an HTTPS official destination, a numbered Hampton street address, an everyday-life business category, and explicit ownership evidence. No held leads met the threshold for inclusion as a plausible but incomplete candidate during this pass, so `held-candidates.jsonl` is intentionally empty.

The entries are concentrated in the downtown/Phoebus-area street network around Queens Way and Mellen Street. This report does not assert a walking distance or rank proximity to Hampton University because no distance calculation was part of the evidence contract.

## Source ledger

| Candidate | Official destination and address evidence | Ownership evidence | Source status |
|---|---|---|---|
| Pour Girls | The official site gives `17 E. Queens Way, Hampton, VA 23669`, phone 757-224-5829, restaurant description, and HTTPS destination. [1] | The official site states “Women Owned and Proud of It!” and names Michelle Bullington and Iryna Patterson as owners/operators. [1] | Included |
| Las Reinas Cocina | The official site gives `13 East Queens Way, Hampton VA 23669`, phone 757-872-2667, restaurant description, and HTTPS destination. [2] | The official site states that it is “proudly woman-owned and operated.” [2] | Included |
| Scratch Bakery | The bakery’s official site gives `19 E Mellen St, Hampton, VA 23663`, phone 757-224-8430, bakery services, and HTTPS destination. [3] | Visit Hampton identifies Lashonda Sanford as owner and lists Scratch Bakery in its women-owned-business guide. [4] | Included |

## Contract checks and limitations

All three records use `targetKind: "physical_business"`, `country: "US"`, and `sourceStatus: "research_only"`. No latitude/longitude, personal contact details, inferred ownership, or unsupported regulated-profession claims were added. Official social URLs are included only where they were published by the business’s official site or destination page. The Las Reinas Facebook URL was retained as a social destination link, while the business’s own HTTPS website is the primary destination.

The source set confirms current-looking web destinations and addresses as retrieved for this research date, but it does not establish licensing, accessibility, prices, hours beyond what the sites state, or exact distance from campus. Those attributes should be checked separately before any protected review or publication workflow.

## References

[1]: https://www.pourgirlsbar.com/ "Pour Girls official website"

[2]: https://www.lasreinascocina.com/ "Las Reinas Cocina official website"

[3]: https://itsmadefromscratch.com/ "Scratch Bakery official website"

[4]: https://visithampton.com/women-owned-businesses-hamptons-empowered-entrepreneurs/ "Visit Hampton: Women-Owned Businesses: Hampton’s Empowered Entrepreneurs"
