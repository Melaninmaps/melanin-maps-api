# Toronto, London, and Kingston Source-Backed International Directory Review Package

**Status:** **RESEARCH / REVIEW ONLY — NOT PUBLISHED.** Nothing in this package has been written to a production database, exposed in website/mobile search, placed on the live map, or made available to live Kinfolk recommendations. It does not modify users, authentication, login, passwords, sessions, tester access, waitlist records, billing, payments, or deployment configuration.

## Package identity

| Field | Value |
|---|---|
| Coverage | Toronto and expressly supported Greater Toronto communities, Canada; London, United Kingdom; Kingston and Kingston/St Andrew, Jamaica |
| Consolidated source candidates | 63 |
| Review-manifest candidates | 63 |
| Held by package normalization | 0 |
| Pending reviewer queue | 62 |
| Needs-research reviewer queue | 1 |
| Review-manifest SHA-256 | `519bd230ce959470933ceaec9dcffad98f46f8f0ac5135183ae2b0768782911a` |
| Source-manifest SHA-256 | `dbf86fe261bd747d50b44ec15c2599a573eaaa5526715455d32fc45666dd170d` |
| Destination check | 87 of 88 distinct selected customer destinations returned reachable HTTP responses; one network-error result remains a review gate |

## Review composition

| Route | Candidates | Publication treatment |
|---|---:|---|
| Commercial business | 26 | May be considered for the protected commercial import only after reviewer approval, live-directory duplicate reconciliation, and country-aware server-side address/geocode verification. |
| Online-only business | 2 | May be searchable after approval but must remain addressless and mapless. |
| Regulated-review lead | 7 | Requires country-appropriate licensing, registration, or authority review; must not be presented as a vetted provider based on this package alone. |
| Community resource | 13 | Remains in the resource route and must not become a commercial map pin. |
| Cultural place | 15 | Remains in the cultural route and must not become a commercial-business map pin. |
| **Total** | **63** | **Protected reviewer workflow required.** |

Sixty-one records have source-backed physical addresses in the local country format. This does not create a public map pin. Only reviewer-approved physical commercial businesses that pass country-aware server-side geocoding may enter the commercial map layer. The two online-only records are explicitly addressless and mapless. Emancipation Park is a cultural-place record with no suitable numbered street address in inspected source material, so its package address is null and it remains mapless.

## Country-aware evidence handling

| Geography | Address handling |
|---|---|
| Toronto/GTA | Canadian civic/building addresses, locality, province and postal code only where the inspected source provided them. No US state or ZIP format was added. |
| London | UK building/unit, street, London locality and postcode format. `state` remains null because no source supplied an applicable state-equivalent. |
| Kingston | Jamaican street/building, locality, and locally published Kingston postal-zone forms where supplied. No US state, ZIP, coordinates, or US-specific geocoding convention was imposed. |

## Destination-review gate

The destination check is a review signal, **not** a closure finding. **Jamaica Business Development Corporation** is in the `needs_research` queue because its selected official destination (`https://jbdc.net/`) returned a network error to the bounded automated check. Its source and official evidence remain preserved for a reviewer’s current manual check. The remaining 62 candidates are `pending_review`; none is automatically published. A successful response does not prove an entity is open, accepting customers, licensed, owned by a particular person/group, or currently available.

## Evidence and source boundaries

Each candidate retains a public source URL and a selected customer-facing official website or official business-social destination. The country/city reports enumerate every inspected source, retained/held evidence, and local-address limits: [Toronto source report](../source-reports/toronto-source-report.md), [London source report](../source-reports/london-uk-source-report.md), and [Kingston source report](../source-reports/kingston-jamaica-source-report.md).

Public directories, tourism/editorial coverage, chambers, municipal sources, and community lists are retained only as **source basis**. They are not ownership certification and do not justify inferred identity, culture, language, licensing, hours, pricing, accessibility, availability, immigration outcome, health outcome, or operating-status claims. Demographic, cultural, ownership, and language wording remains attributed only where the inspected public source states it.

## Required protected reviewer sequence

1. Verify the review-manifest SHA-256 value above. Do not manually alter the manifest after verification.
2. Stage the manifest only through the existing protected directory-import route. Do **not** use direct production SQL or an unmanaged bulk insert.
3. Reconcile every record against the live directory by normalized name, customer destination, address, country, applicable region, and existing business identifier. A collision is an enrichment/review task, never an automatic duplicate listing.
4. Resolve the Jamaica Business Development Corporation destination gate with current reviewer evidence before considering publication.
5. Route records by `targetKind`. Approved physical commercial businesses with supported local street/building addresses can proceed to country-aware server-side geocoding. Online-only records remain without a coordinate, pin, or directions action. Regulated-review records require appropriate authority/licensing review. Cultural places and community resources retain separate routes.
6. After approved publication, test public `/api/businesses` search by full name, relevant terms, typo-tolerant query, and location; test physical map-marker click-through to a listing page and official destination; then test authenticated Kinfolk retrieval against only published, local, relevant listings.

> No reviewer approval has occurred through this package. Until staging, duplicate review, approval, country-aware geocode, publication, and public verification succeed, these 63 candidates are **not live directory inventory**.

## Package files

- `international-three-city-combined-review-only-candidates.jsonl` — immutable review manifest after checksum verification.
- `international-three-city-combined-review-held-candidates.jsonl` — package-level held queue; empty for this package. Original city-pass holds remain in `../held/`.
- `international-three-city-combined-review-summary.json` — candidate, queue, destination-health, and checksum summary.
- `international-three-city-combined-destination-health.json` — bounded-concurrency customer-destination check results.

## Safety invariants

This package contains no production database credential or production-write command. It cannot itself publish a business, map pin, resource, or cultural listing. It does not create coordinates, directions, or artificial addresses, and does not add/delete users or alter authentication, passwords, tester access, sessions, waitlist, payment, or account-approval flows.
