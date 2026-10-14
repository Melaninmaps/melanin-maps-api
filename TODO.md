# Kinfolk Journeys Source-Only Implementation Checklist

This checklist records the founder-approved Kinfolk Journeys source implementation. It does **not** authorize production deployment, migration execution, provider credentials, live provider connections, native builds, TestFlight, directory changes, or DNS changes.

## 1. Private Journey persistence and lifecycle

- [x] Add a member-scoped Journey model separate from existing Life Journeys with `draft`, `review_needed`, `confirmed`, `active`, `completed`, `archived`, and `deleted` states.
- [x] Persist dates, time zones, destinations, lodging, transportation, reservations, commitments, preferences, companions, saved places, retention choice, member consent, reminders, and audit history without making any Journey public by default.
- [x] Distinguish hard commitments, tentative plans, Kinfolk suggestions, and booked/confirmed items. Kinfolk cannot silently move, cancel, reinterpret, or book a confirmed item.
- [x] Prepare additive review-only migration and rollback notes without applying either.
- [x] Add a bounded, unregistered retention executor. It is not scheduled or runnable in production until separate approval.

## 2. Creation, import, review, and editing

- [x] Support manual Journey creation, member-confirmed Kinfolk draft creation, date/time/location entry, pasted confirmation text, private PDF/image staging, and future provider-import adapters.
- [x] Require Review & Confirm before extracted facts become usable for planning.
- [x] Preserve field-level source, confidence, extraction status, duplicate/conflict state, and member confirmation state for imported/extracted facts.
- [x] Support owner editing, deleting, correcting, ordering, confirmation/tentative choices with explicit loading, errors, and retry states.

## 3. Connections and provider adapters

- [x] Implement Google/Microsoft calendar and mail adapter contracts with PKCE/state/nonce/redirect/scope validation boundaries, connection states, consent, refresh/reconnect, and disconnect design.
- [x] Default calendar access to free/busy; calendar details and selected email confirmations require separate member consent.
- [x] Restrict email handling to selected confirmations; never scan an inbox silently.
- [x] Implement manual flight/lodging/event/transport support and an honest unavailable state for live flight providers.
- [x] Keep OAuth network activity disabled by default. No credentials, provider calls, commercial subscriptions, or real connections were created.

## 4. Governed itinerary intelligence and safety

- [x] Reuse the existing governed MWM/Kinfolk Current catalog and itinerary contracts rather than introduce an ungoverned recommendation path.
- [x] Preserve confirmed commitments and route member-selected Kinfolk suggestions through the explicit `drafts/from-kinfolk` review path.
- [x] Keep suggestions as proposals until a member saves/accepts them; no booking, reservation, purchase, email action, calendar write, or automatic rescheduling exists.
- [x] Add opt-in per-Journey reminders; delivery remains disabled until a separately approved notification permission and worker exist. Location/trusted-contact sharing is not added to Journeys.

## 5. Web and mobile member experience

- [x] Deliver authenticated Web and mobile Journeys list/detail/create, imports, review, connection/status, calendar selection, reminder, privacy, retention, disconnect/delete, loading, empty, error, retry, and unavailable-source states.
- [x] Keep conversation-created and Journeys-area records synchronized only through explicit owner-confirmed server operations.
- [x] Preserve existing Kinfolk, Map, Safety Hub, directory, membership, authentication, and Admin behavior.

## 6. Validation and release preparation

- [x] Add focused tests for isolation/authorization contracts, private document boundaries, consent/revoke/expiry/reconnect/delete, OAuth state/PKCE/provider validation, duplicate imports, confirmed-commitment immutability, provider failure, no-invention behavior, retention expiry, and Web/mobile parity contracts.
- [x] Run focused API/Web/mobile tests and typechecks after implementation.
- [ ] Prepare the source-only release packet with exact commit, changed files, review-only migration, feature matrix, provider setup requirements, privacy/security/retention review, rollback plan, and the smallest next approval after the source commit is created.
