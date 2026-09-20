# Source Report: Alabama State University, Montgomery, Alabama

**Research scope.** This is research-only work for Alabama State University (915 S. Jackson Street, Montgomery, AL), following the supplied HBCU Neighborhood Directory Candidate Contract. The review sought nearby, everyday-life physical businesses and returned one eligible candidate plus two held leads. No ingestion, publication, production-table write, pin creation, or database access was attempted.

## Candidate source ledger

| Source | What it establishes | Disposition |
|---|---|---|
| [WSFA 12 News: First Black-owned coffee shop opens in Montgomery](https://www.wsfa.com/2021/06/13/first-black-owned-coffee-shop-opens-montgomery/) | Identifies The Coffee House as Montgomery’s first Black-owned coffee shop, quotes owner Mrs. Hardmon, and gives the numbered address **981 Adams Avenue**. | Primary ownership/address evidence for the candidate. |
| [The Coffee House Instagram](https://www.instagram.com/thecoffeehouseof334/) | Official social/destination page surfaced for The Coffee House; its profile title describes it as the only Black-owned coffee shop in Montgomery. | HTTPS official destination used in the candidate record. |
| [Montgomery Area Chamber of Commerce directory entry](https://www.montgomerychamber.com/list/member/the-coffee-house-11910) | Independently corroborates The Coffee House at **981 Adams Avenue, Montgomery, AL 36104** and phone **334-564-4554**. | Authoritative address/phone corroboration. |

## Held-lead source ledger

| Source | What it establishes | Hold reason |
|---|---|---|
| [Vintage Café official website](https://www.vintagecafemgm.com/) | Official HTTPS destination publishes **416 Cloverdale Road, Montgomery, AL 36106**, phone 334-356-1944, and describes coffee, breakfast/lunch, and daytime-eatery services. | No explicit ownership designation/evidence was found in the inspected site or authoritative sources. It is held rather than treated as an ownership-designated candidate. |
| [Amelia Salon official Black hair salon page](https://ameliasalon.com/black-hair-salon-montgomery-al/) | Official HTTPS page publishes **1023 Woodley Rd, Montgomery, AL 36106**, phone 334-262-3972, and describes Amelia as a professional African-American/Black hair salon; it also identifies stylist Sally Evans as Alabama Board of Cosmetology licensed. | “Black hair salon” describes clientele/service specialization, not explicit business ownership. No explicit Black-owned designation/evidence was verified, so it is held. |

## Count reconciliation

| File | Count | Result |
|---|---:|---|
| `candidates.jsonl` | 1 | One record meets official HTTPS destination, numbered-address, everyday-business, and explicit ownership-evidence requirements. |
| `held-candidates.jsonl` | 2 | Two plausible physical leads have numbered addresses and official destinations but lack explicit ownership evidence. |
| Total reviewed output records | 3 | Within the contract maximum of three eligible candidates; held leads are separately reported and are not counted as eligible candidates. |

## Validation notes and limitations

The Coffee House was the only business promoted to `candidates.jsonl` because the independent WSFA report explicitly states Black ownership and supplies the address, while the Chamber directory corroborates the address and phone. Vintage Café and Amelia Salon were not rejected as implausible businesses; they were held narrowly because the contract prohibits inferring ownership from a Black-focused service description, customer audience, community context, or other indirect signals. Current operating status, hours, menus, accessibility, licensing beyond the Amelia page’s own statement, distance from campus, and service quality were not independently asserted. Addresses and destinations should receive a later health check before any protected review or publication workflow.

All records use `sourceStatus: "research_only"`, `targetKind: "physical_business"`, and `country: "US"`; no latitude/longitude, PII, or unsupported operational claims are included.
