# Online-Only Directory Listings Release Handoff

**Status:** Code complete and validated locally; not merged, deployed, or published to production.

## Purpose

This release makes a clear distinction between a physical local business and a legitimate online-only service or shop. A physical listing remains eligible for map discovery only after its public street address is confirmed and a reviewer accepts a source-backed location suggestion. An online-only listing can be searchable in the directory and available to Kinfolk when it has an attributable source plus a currently successful official website or official social destination. It is explicitly not given an invented street address, coordinate pair, map pin, or directions action.

## Safe publication model

A research record must use `targetKind: "online_business"`, must leave `address` empty, and must include its source URL plus an official customer destination. The preparation tool records `online_only_no_map_pin` in its preserved source notes. The review staging adapter preserves the country, validates the supplied destination-health report, and passes fresh successful source, website, and social evidence into the protected founder review queue.

An authenticated founder/admin remains the only actor who can make a publication decision. The normal decision endpoint remains protected by idempotency keys, an expected candidate revision, source-link validation, duplicate reconciliation, ownership-evidence controls, and separate regulated-service safeguards. A physical listing still requires reviewer-confirmed geocoding. An online listing cannot request a location suggestion and creates no `canonical_record_locations` row. It is published only as an unclaimed, not-verified business record with `is_online_only = true`.

## Member experience

Kinfolk includes online services in grounded directory results and labels their card text as an online service or shop. The website and mobile business detail pages show an online-only availability message in place of a map and directions; their official site or social destination remains directly available. Physical business pages preserve the existing map, pin, directions, and listing-detail behavior.

## Boundaries preserved

This release does not create, delete, or modify a user, password, authentication, tester-access, session, waitlist, or account record. It does not publish any existing research candidate automatically. It does not make an ownership, language, hours, accessibility, licensing, identity, or service claim that is not present in the reviewed source material.

## Validation

The API, scripts, mobile, and web TypeScript checks completed successfully after workspace declarations were regenerated locally. Focused API tests passed: 77 tests across directory publication and Kinfolk business cards. Focused inventory tooling tests passed: 10 tests across the preparation and global staging tools. `git diff --check` completed cleanly. Generated declaration files are deliberately excluded from the release change set.

## Deployment sequence

Merge the release pull request after its checks complete. Railway must deploy the merged commit to the real `api-server` service so its additive startup migration adds `directory_import_candidates.country`, permits `online_business`, adds `businesses.is_online_only`, and makes the legacy address/coordinate columns nullable for online rows only. The current production database and OpenAI credentials must not be printed, replaced, or copied. The web application must be deployed with the API release. Because the mobile detail experience changes, the next production iOS and Android builds must be created from the exact post-merge `main` commit. No native build is needed for later ordinary database publications after that app version is live.

No batch should be published merely because it is staged. A founder/admin must review source evidence and decide each candidate or an authorized, auditable approved subset. After publication, verify directory search, the listing detail’s official external link, a physical listing’s map pin, an online listing’s no-map state, and a controlled Kinfolk request.
