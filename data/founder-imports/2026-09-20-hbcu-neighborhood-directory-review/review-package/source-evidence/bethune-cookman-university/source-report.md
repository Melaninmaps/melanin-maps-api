# Bethune–Cookman University neighborhood directory research

**Campus/city:** Bethune–Cookman University, Daytona Beach, Florida
**Research date:** 2026-09-20
**Scope:** Research-only review of nearby physical everyday-life businesses; no ingestion, publication, or database access.

## Candidates returned

Two candidates are returned in `candidates.jsonl`:

1. **Bethune Grill**, 731 Dr. Mary McLeod Bethune Blvd., Daytona Beach, FL 32114. Its official website gives the numbered address, phone, restaurant offerings, and explicitly says it is one-half mile west of the Bethune-Cookman campus. The official Facebook page independently repeats the address and phone. BuyBlack.org's Daytona Beach results explicitly list Bethune Grill in its Black-owned-business directory; the designation is not inferred from name, location, or cuisine.
2. **Salon 230**, 116 Magnolia Ave, Daytona Beach, FL 32114. The official About page gives the numbered address, phone, and services (hair, nails, facials/skincare, massage, makeup, and styling). The same official page explicitly states, “Salon 230 is a family-owned space.”

## Held lead

One plausible lead is in `held-candidates.jsonl`:

- **Soul Foods** is listed by THEBBD as a Black-owned restaurant at 948 Orange Ave and has an official HTTPS website. However, the official website contains conflicting numbered addresses: its LOCATION section says 948 Orange Avenue while a footer displays 560 Dr Mary McLeod Bethune Boulevard. Under the contract's ambiguity rule, it is held pending independent address resolution.

## Source ledger

| Business | Source | URL | Evidence used | Status |
|---|---|---|---|---|
| Bethune Grill | Official website | https://www.bethunegrill.com/ | 731 Dr. Mary McLeod Bethune Blvd.; phone; food offerings; “one half mile WEST” of Bethune-Cookman campus | Verified destination/address/nearby claim |
| Bethune Grill | Official Facebook page | https://www.facebook.com/BethuneGrill/ | Address, phone, operating history, official website link | Independent corroboration |
| Bethune Grill | BuyBlack.org Daytona Beach results | https://www.buyblack.org/daytona-beach | Explicit inclusion under “Black-owned business Results - Daytona Beach” | Ownership evidence |
| Salon 230 | Official About page | https://www.salon230.com/about | “family-owned space”; 116 Magnolia Ave; phone; service list | Verified destination/address/ownership |
| Soul Foods | Official website | https://soulfoodsrestaurant.com/ | HTTPS destination; 948 Orange Avenue location; food description; phone; conflicting footer address | Held for ambiguity |
| Soul Foods | THEBBD business listing | https://thebbd.black/business/soul-foods-daytona-beach | Explicit “Black-Owned Business” and “Black-Owned Restaurant/Café/Bar”; 948 Orange Ave; website link | Ownership/address corroboration, but does not resolve official-site conflict |

## Count reconciliation and limitations

| File | Count | Result |
|---|---:|---|
| `candidates.jsonl` | 2 | Eligible candidates with HTTPS official destinations, numbered addresses, and explicit ownership evidence |
| `held-candidates.jsonl` | 1 | Plausible lead held for conflicting official addresses |

The contract permits a maximum of three candidates; two are returned. Ownership evidence is included only where an appropriate source explicitly states a designation. “Family-owned” is retained as an ownership designation because it is the exact language on Salon 230's official page; it is not converted into a minority, Black, Latino, or woman-owned claim. No hours, accessibility, licensing, pricing, or other unsupported attributes were added as candidate facts. Proximity is directly documented for Bethune Grill by its official website; Salon 230 is in Daytona Beach but its source does not quantify distance from campus.

All records use `sourceStatus: "research_only"`, contain no coordinates or PII, and are not claims of live publication.
