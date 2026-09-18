# Source Pass 06 — Visit Philadelphia additional Black and Latino guides

## Scope and source family
This pass used Visit Philadelphia public guides beyond the already captured Black-owned and Latino-owned shops-and-boutiques guides. The source family and actual URLs traversed were:

- [Shop Philadelphia Black-, Latino- & AAPI-Owned Businesses](https://www.visitphilly.com/philadelphia-black-latino-aapi-owned-businesses/) — overview page and all linked guide/article destinations shown under “Explore Shops, Restaurants & More.”
- [Explore Black Philadelphia](https://www.visitphilly.com/black-philadelphia/) — overview page, Top Picks, and linked cultural/restaurant destinations.
- [Legacy & Love](https://www.visitphilly.com/legacyandlove/) — full feature page, all six business profiles.
- [Black-Owned Restaurants to Try in Philadelphia](https://www.visitphilly.com/articles/philadelphia/black-owned-restaurants-to-seek-out-in-philadelphia/) — full article listing, alphabetical sections 01–43 and additional cafes/bakeries/drinks sections through item 49; all public “Where” lines were traversed.
- [Latino-Owned Restaurants to Check Out in Philadelphia](https://www.visitphilly.com/articles/philadelphia/latino-owned-restaurants-in-philadelphia/) — full article listing, alphabetical items 01–53 and map/list index.
- [Dine Latino Restaurant Week](https://www.visitphilly.com/things-to-do/events/dine-latino-restaurant-week/) — event page and participating-restaurant examples; it points to the Greater Philadelphia Hispanic Chamber’s live roster, but that roster was not treated as a separate source family.

Official destinations independently opened for retained records included Plant and People, Banana Mousse, Paul Beale’s Florist, Hakim’s Bookstore, Arterial Coffee Instagram, 48th Street Grille, Abyssinia Instagram, African Small Pot, All The Way Live Cafe, Amina, Adelita, Alta Cocina (not retained due address conflict), Amá, Amada, Tierra Colombiana, Johnson House, The Colored Girls Museum, and AAMP.

## Results
The JSONL contains **17 retained candidates**: **14 physical commercial businesses** (food: 9; retail: 4; cafe/plant: 1), and **3 physical cultural places**. No online-only businesses were retained.

The pass also found community/resource-adjacent and cultural records through the Black Philadelphia guide. Johnson House and AAMP were retained as `cultural_place`, not as commercial business pins. No public Visit Philadelphia listing in the traversed pages exposed a house of worship, mutual-aid group, food-support provider, family/parent support provider, elder/disability provider, shelter, funeral service, or civic nonprofit with both an exact address and an independently opened official destination that could be retained without inference.

## Omissions and blocks
Most article listings were not retained because the task requires independently opened current official websites or official public social destinations; the article’s own link alone was not treated as independent verification. The full Black restaurant article exposed approximately 49 numbered businesses across restaurants, bars, cafes, bakeries and drinks, and the Latino restaurant article exposed 53 numbered entries plus alternate locations and non-restaurant places. Those not represented in the JSONL were omitted rather than inferred.

Alta Cocina was omitted despite an official destination because Visit Philadelphia gives 4113 G Street for one listing while the current official site displays 2460 North 5th Street; this unresolved address conflict fails the exact-source/address consistency standard. Amada’s current official page was opened and verified as the official destination, but its fetched page did not expose the street address; the exact address is retained from the Visit Philadelphia article. African Small Pot’s official Instagram was opened but did not display a street address; the exact address is retained from the Visit Philadelphia article. Arterial Coffee’s official Instagram was opened and verified, but no phone was publicly shown. The Colored Girls Museum official site was opened and verified but no exact public street address was displayed, so it was held out.

Ownership fields reproduce only Visit Philadelphia’s source-specific labels or descriptions (for example, Black-owned, Latino-owned, family-run, or named owner statements); no identity, language, accessibility, licensing, or service claims were inferred.
