# Kinfolk Proof-of-Concept Business Review Bundle

This directory contains the **business-directory portion only** of the founder-provided workbook `Mapping_with_Melanin_Kinfolk_Proof_of_Concept_Businesses_P14_Expanded.xlsx`, received September 5, 2026. The workbook SHA-256 is `a3c30a2ffdad6b1567fd3558309d3d0a82eb9a2becb4fc62074fa2fbacd19531`.

The source workbook describes 115 public organizations and businesses plus separate fictional profile, scenario, and ranking worksheets. **No persona/profile rows are included in this import bundle.** Persona information must never become a public business attribute, ownership claim, or community signal.

## Review inventory

The checksum-locked candidate manifest contains 115 rows and 115 unique dedupe keys:

| Intended review destination | Rows | Publication rule |
| --- | ---: | --- |
| Ordinary business review | 60 | May publish only after canonical duplicate reconciliation, live-link review, and exact street-location evidence |
| Regulated-service review | 13 | Must also have current licensing/authority evidence |
| Community-resource review | 2 | Must route to Resources, never the business directory |
| Manual destination/location review | 40 | Cannot publish until event/place/international routing and country-aware location handling are resolved; this includes the hybrid Urban Art Gallery business/resource decision |

The workbook spans 90 U.S., 9 U.K., 8 Canadian, and 8 French rows. Current founder publication writes U.S. business country data only, so every international record remains held for a country-aware contract rather than being mislabeled as U.S.-based.

## Checksums

| File | SHA-256 |
| --- | --- |
| `kinfolk-poc-business-candidates.jsonl` | `a1981d62915bad12ce076dea670f6d12eaa95aa39517aa8bdc89c02a2ded8502` |
| `kinfolk-poc-link-input.json` | `692472fbaae54f0ec1a34c92c4bcf557bec30d2bfb0ee6a61c489c74b13cd052` |
| `kinfolk-poc-link-validation.json` | `0e711957db6f77e2e6d9839b44e611580b1bacd44a0c81c87fe4c9838673cfc9` |
| `selected-philadelphia-evidence.json` | `7d9672c92bdcc8edea9d86f8f10343df3ab89be0d6c5f93eb3fde487bd1c559f` |
| `selected-demo-publication-plan.json` | `ff7871b8e3433096fcaede6d42015bf4d6ce9b787dbfc9b0356f9b660764c9d0` |
| `selected-creator-video-evidence.json` | `4a7fa96862f28e985c14e1ddfcbf85e23e4523367468137e3dda4e03178fdf2e` |
| `selected-creator-video-validation.json` | `a4b824d309b6bb6b8050b411ef6ee9020c592a4b0d8952379c5a4765ddc5b917` |

The link check used the same public-network-only, DNS-pinned validator as founder review. Of 171 unique URLs, 132 returned a successful response, 18 were reachable but access-restricted, and 21 remained unresolved. An unresolved result is a review hold; it is not proof that a business is closed.

The controlled publication plan selects four distinct Philadelphia business types: Loomen Labs, Uncle Bobbie's Coffee & Books, Amina, and Queen & Rook Game Cafe. Each remains subject to the same live founder decision, duplicate reconciliation, location suggestion, and atomic unclaimed-publication checks. Creator-video evidence is stored separately and never turns a candidate into a verified or endorsed business. Five researched creator links passed the hardened public-network check; only links for a business that is actually published may be attached to that public business, and only after a separate approved-public contribution decision.

## Public data boundary

Only the workbook’s category, subcategory, public name, public URL, verification source, and factual service/offerings text are eligible to become public after review. Twenty-five records currently have exact street-address evidence; the other 90 rows remain location-held. Persona-match scores, persona-oriented notes, demographic signals, age assumptions, safety claims, accessibility claims, price assumptions, subjective fit statements, and founder-supplied ownership signals are not copied into this bundle at all. Ownership designations are empty on all 115 candidates and may be added only after a founder separately records exact current evidence through the governed review process.

The staging importer writes only `directory_import_batches` and `directory_import_candidates`, performs no public business/resource writes, and marks the batch `in_review` only after all 115 rows are present atomically. Publication remains one candidate at a time through the founder decision API.
