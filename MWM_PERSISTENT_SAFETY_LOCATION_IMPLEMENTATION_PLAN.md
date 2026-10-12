# MWM Persistent Safety Location — Implemented Phase 1–6 Plan

## Objective and safety boundary

**Persistent Safety Location** is a voluntary member-to-MWM protection capability. It lets Mapping with Melanin hold one encrypted, current location fix solely to decide whether an opted-in member may be affected by a qualifying verified emergency. It is intentionally separate from the existing **Temporary Trusted Live Sharing** feature.

> A trusted relationship never grants a contact a live map, exact coordinates, an address, a movement history, a location timestamp, or the ability to collect location in the background.

A qualifying Family Impact notice can be considered only when all of the following are true: the member has active MWM Safety Location consent, the location is sufficiently current and accurate under the configured operating policy, the event is eligible and geographically matched, and the owner separately authorized that specific accepted MWM contact. An `outside_reported_area` result is never phrased as evidence that the member is safe. Serious-violence delivery remains review-only and default-off.

## Implemented design

| Layer | Implemented control | Boundary preserved |
|---|---|---|
| Consent | A versioned `mwm-persistent-safety-location-v1` member consent records primary opt-in, a distinct background choice, OS permission state, pause, revoke, and update timestamps. | No existing member is enrolled. Revocation deletes the current fix and revokes per-contact authorizations; it cannot auto-reactivate. |
| Sensitive data | One encrypted current fix per member uses AES-256-GCM, a rotation-ready `MWM_PERSISTENT_SAFETY_LOCATION_ENCRYPTION_KEYS` ring, and member ID as authenticated additional data. | No plaintext coordinate columns, public route, share URL, or history endpoint exists. A new update overwrites the prior encrypted fix. |
| Retention | Pause, revoke, foreground-permission loss, and explicit deletion remove the encrypted current fix immediately. An immutable audit stores only state labels, not coordinates. | No automated retention/purge duration has been invented. A founder/privacy/legal decision is still required before any scheduled audit retention or deletion policy is activated. |
| Contacts | `mwm_persistent_safety_location_contact_consents` is a separate per-contact consent record for accepted, active, unblocked MWM contacts only. | Existing temporary Family Impact consent does not imply persistent-location consent; no unselected contact receives a delivery audit or handoff. |
| Emergency matching | Family Impact decrypts only in server memory after consent, account, relationship, and block checks; it evaluates freshness, accuracy, and a supported boundary, then persists a coarse outcome audit. | Responses and notices contain only the general emergency area, uncertainty, and check-in action. Exact GPS, address, captured time, and movement information stay undisclosed. |
| Delivery | Existing Family Impact requires `potentially_affected`, separately consented contact authorization, durable in-app persistence before any provider handoff, duplicate suppression, and revalidation on retry. | The circuit remains default-off. Provider acceptance is not receipt or acknowledgment. Review-only serious-threat workflow has no delivery bridge. |
| Native interface | Safety Hub now links to a dedicated Safety Location setting screen. It presents the first-party disclosure, enable, background permission status, current/stale/unavailable status, pause/resume, revoke, current-data deletion, and individual contact switches. | The screen explicitly distinguishes Temporary Trusted Live Sharing and says that contacts cannot see a live map. |
| Native collection | A top-level Expo TaskManager task uses `expo-location` only after the member explicitly enables the feature and grants the required OS permissions. Android includes a visible foreground-service notification; a failed/offline update is dropped rather than queued locally. | No location is collected at launch or stored in AsyncStorage. A device restart, OS termination, permission downgrade, battery policy, or network loss may make location unavailable; the UI makes no continuous-protection guarantee. |

## API surface

All endpoints require the signed-in owner and send `Cache-Control: no-store, private`:

| Endpoint | Purpose |
|---|---|
| `GET /api/safety/persistent-location` | Owner-only status, permission state, current/stale/unavailable state, and last successful update metadata—never coordinates or ciphertext. |
| `PUT /api/safety/persistent-location/consent` | Explicit primary consent plus separate background choice and disclosure version. |
| `PATCH /api/safety/persistent-location/permissions` | Records current OS permission state; foreground permission loss deletes the current fix. |
| `PATCH /api/safety/persistent-location/pause` | Pause/resume; pause clears the current encrypted fix. |
| `POST /api/safety/persistent-location/fix` | Authenticated native update only while active, unpaused, feature-enabled, encryption-ready, and OS-permission-authorized. |
| `DELETE /api/safety/persistent-location/location` | Member-requested deletion of the current encrypted fix. |
| `DELETE /api/safety/persistent-location/consent` | Revokes member consent, clears the current fix, and revokes all per-contact persistent-location authorizations. |
| `GET/PUT /api/safety/persistent-location/contacts` | Owner manages only per-contact emergency disclosure consent. No contact-read endpoint exists. |

## Local validation completed

A fresh disposable PostgreSQL reconciliation harness exercised actual current Express routes and the additive startup registry, then started a second application process against the same database. It verified all of the following without a real member, location, provider, or device:

1. New Persistent Safety Location begins disabled; first-party disclosure, primary consent, and a separate background choice are required.
2. An encrypted current fix can be stored only by the owner after consent; an unrelated authenticated member cannot write one.
3. Pause deletes the current fix, resume requires a new update, and owner-facing status contains no coordinate or ciphertext.
4. A selected accepted contact must receive a second, separate authorization; an independently accepted but unselected contact receives no Family Impact delivery record.
5. Six-month durable relationship, primary consent, and selected-contact authorization survive schema initialization and restart.
6. An expired temporary session plus an absent/deleted persistent fix yields `location_unknown`, not a fabricated safe/outside finding.
7. Retry timing, in-app fallback, event cancellation, block/revocation rechecks, and disabled serious-threat delivery continue to pass under the existing safety reconciliation workflow.
8. Persistent contact revocation and global member revocation survive restart and block new collection immediately.

The current source checks also include encrypted-payload integrity/owner-binding tests, API privacy contracts, native permission/task contracts, existing web Safety contracts, TypeScript validation, and resolved Expo config validation.

## Required physical-device verification

The implementation is **not** physical-device acceptance. Test iOS and Android separately in an accepted native build using disposable accounts only:

| Scenario | Expected result |
|---|---|
| First enable with foreground/background allowed | Disclosure appears before OS prompts; only then is the OS request made; visible Android foreground-service notification appears while active. |
| Foreground allowed / background denied or restricted | Consent can remain visible, but background collection does not start; UI accurately reports unavailable permission and no protection guarantee. |
| System permission downgrade | App syncs a downgraded state, deletes the current stored location after foreground loss, and Family Impact treats the member as `location_unknown`. |
| Background/foreground, network loss/reconnect, device restart | No local coordinate queue is created; a later successful fresh update may replace the old one; stale/unavailable state is honest. |
| Pause, delete, revoke | Background task stops; current fix is deleted; contact consent is revoked on global revoke; no automatic reactivation occurs. |
| Emergency, retry, contact revoke/block | Only a separately authorized contact with a potentially affected result may reach the fake/controlled delivery path; payload reveals no GPS or implied proof of safety. |

## Store disclosure and operating gates

Apple review materials must accurately explain the core emergency-protection use, foreground/Always location requests, visible stop controls, the fact that background updates can be interrupted, data handling, and deletion controls. Google Play requires a core-functionality justification, prominent in-app disclosure before the runtime request, privacy-policy disclosure, background-location declaration, and a demonstration video when submitting a build that requests background location. Neither platform review process is started by this implementation.

Before activation outside disposable local validation, the founder must decide the operational freshness/accuracy policy and retention/deletion policy. The application fails closed to `location_unknown` and does not activate collection unless both `SAFETY_PERSISTENT_LOCATION_MAX_AGE_SECONDS` and `SAFETY_PERSISTENT_LOCATION_MAX_ACCURACY_METERS` are bounded and configured. Activation also requires an environment-scoped encryption-key ring and explicit authorization to deploy the additive migration and enable the default-off collection flag in isolated staging. Production activation, real locations, real alerts, and app-store distribution remain out of scope.
