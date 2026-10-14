# Persistent MWM Safety Location — Controlled Staging and Release Compliance Package

**Status:** Controlled isolated-staging route/restart validation passed. No production activation, mobile build, store submission, or live-member/location processing is authorized by this package.

**Deployed source under validation:** `46c795bad299f6d49404408047a55511ee7fad98`
**Service:** isolated Railway `kinfolk-memory-api-staging` only
**Test policy values:** maximum location age **300 seconds**; maximum reported accuracy radius **100 meters**. These are staging fixtures, not production policy.

## Product description and hard privacy boundary

Persistent MWM Safety Location is an optional member-to-MWM protection feature. After a first-party disclosure, explicit primary consent, and a distinct background choice, Mapping with Melanin holds **one current encrypted device location** to assess a qualifying verified emergency boundary.

The member selects each trusted MWM contact separately. A contact cannot view, request, collect, track, override, or obtain the member's coordinates, address, movement history, or location timestamp. A qualifying event may result only in a coarse Family Impact state: potentially affected, outside the reported area, location unknown, or member-confirmed safety. An outside-area result is not presented as proof that the member is safe.

The feature does not provide emergency response, dispatch, rescue, continuous tracking, police/ICE notification, public location links, or a contact-facing map. A review-only serious-violence workflow has no delivery bridge.

## Current safeguards to verify in isolated staging

- Collection is disabled unless a staging-only encryption-key ring, a 300-second freshness threshold, and a 100-meter accuracy threshold are configured.
- The isolated deployment restricts all Persistent Safety Location routes to a named disposable `@example.test` owner fixture. Other staging accounts receive no Persistent Safety Location access.
- The stored location uses AES-256-GCM with the member identifier as authenticated additional data. Only one encrypted current fix exists per owner; a new fix replaces it.
- Pause, explicit current-location deletion, global consent revocation, and foreground-permission loss delete the current encrypted fix. A resume requires a new authorized fix.
- A separate accepted, active, unblocked trusted relationship and separate per-contact Persistent Safety Location authorization are required for Family Impact evaluation.
- Family Impact matching requires a fresh, accurate fix and a supported incident boundary. Missing, expired, stale, inaccurate, deleted, revoked, or unavailable data produces `location_unknown`.
- Persistent-location results and Family Impact responses must omit coordinates, address, captured time, movement data, ciphertext, key material, provider errors, and any statement that an emergency contact has received or acknowledged a message.
- Controlled staging dispatch uses an in-process fake provider only. Durable in-app fallback can be tested, but this is not device delivery, receipt, acknowledgment, or a real emergency alert.

## Controlled staging evidence — 2026-10-12

Railway deployment `45c9aac6-f2cc-42b8-bc98-ddfca5a74653` reached **SUCCESS** at exact source `46c795bad299f6d49404408047a55511ee7fad98`. Its predecessor `809ccc83` was replaced; it is not current-source evidence.

Using only four disposable `@example.test` accounts, a staging-only key ring, the test policy values above, synthetic incident boundaries, and the in-process fake provider, the final validation passed:

1. The one configured disposable owner saw the feature disabled by default, gave primary/background consent, selected one accepted contact, stored a current encrypted fix, and separately enabled that contact for emergency-impact evaluation.
2. An accepted but unselected contact did not inherit emergency-impact authorization. Unlisted disposable accounts could not open settings or submit a fix.
3. A persistent-location-only synthetic potential-impact event was evaluated through the live staging application. The selected contact received only the coarse outcome; the response contained no coordinate, address, captured-time, or tracking data.
4. The only attempted handoff was the in-process fake provider. The durable in-app audit/fallback was present, with no claim of device delivery, receipt, acknowledgment, or real notification.
5. After an isolated API restart, primary consent, the current encrypted fix, and separate contact authorization persisted. Member deletion of the current fix produced `location_unknown`; a fresh explicit fix was then required before another eligible test.
6. Retry scheduling retained the durable in-app fallback. Per-contact revoke prevented a later handoff, and global revoke deleted the current fix and blocked later collection.
7. The authenticated owner observed the retired legacy `community-alerts` route as `410`. Anonymous/untrusted checks denied Persistent Safety Location (`401`) and the synthetic event/review endpoints (`404`).
8. The four synthetic events and all disposable accounts were removed. The local verifier state file was absent after cleanup.

The staging bridge originally selected temporary Family Impact consent only. `46c795ba` adds separately consented, active Persistent Safety Location authorization to its **staging-fixture selector** so this controlled test can exercise the same persistent-consent path. Its local disposable PostgreSQL reconciliation, focused API contract suite, and API typecheck passed before deployment. This change does not enable an external provider or serious-threat delivery.

## Apple assessment — release blocker for iOS persistent background collection

Apple Guideline 5.1.5 says that Location Services must be directly relevant, requires notice and consent, and states that location-based APIs **should not be used to provide emergency services**. The proposed functionality uses background location to assess a qualifying emergency and may notify a selected contact. On its ordinary meaning, that creates an unresolved risk that Apple will treat the feature as an emergency service. Member consent, community purpose, encryption, and contact limits do not negate the wording of the guideline. [1]

**Release decision:** Keep iOS persistent background collection disabled in every public build unless Apple provides a written clarification or an App Review determination that specifically covers this functionality. Do not describe the capability with another label to avoid the restriction.

### Apple clarification packet

Before any iOS release that includes this feature, provide Apple with:

1. A precise description: voluntary current-only encrypted location retained by MWM; no contact map, tracking, or emergency dispatch; coarse private impact assessment only; separate contact opt-in; member controls.
2. The complete in-app disclosure and the exact `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` strings.
3. A screen recording showing enable, background choice, status, pause, delete, revoke, and that contacts see no coordinates.
4. A statement that serious-violence delivery remains disabled and that no service guarantees emergency response.
5. A request for guidance on whether this use falls within the 5.1.5 emergency-service restriction and whether the proposed implementation is reviewable.

Apple documents that background updates need the Location Updates background capability and that users must be told background updates occur. Apple also recommends When In Use authorization whenever possible and says an app must be prepared for a user to choose it rather than Always. [2] [4]

**iOS fallback if Apple does not clear the feature:** remove/disable `ACCESS_BACKGROUND`-equivalent iOS collection from the public build and retain only member-initiated, foreground-only Safety workflows that do not claim emergency service or background protection. No location-based Family Impact alerting should ship on iOS without counsel and Apple review guidance.

### Apple privacy disclosure draft

If and only if iOS background collection is cleared, declare **Precise Location** in App Store Connect as collected, linked to the user, and used for App Functionality—not tracking, advertising, analytics, sale, or marketing. Apple defines collection to include transmission that permits access beyond servicing a real-time request, and requires disclosures to be current for the app and integrated third-party code. [3]

The App Store privacy entry and published privacy policy must state that one current location is encrypted server-side, is used only for the member-enabled safety assessment, is not shown to contacts, is not sold or used for advertising, and can be paused, deleted, or revoked. A general privacy label cannot substitute for the specific App Review clarification above.

## Google Play preparation

Google Play permits background location only where it is core functionality, provides significant user benefit, is expected by the user, and cannot reasonably be delivered in the foreground. Its policy explicitly recognizes physical safety as a possible significant benefit, but it requires review and does not guarantee approval. [5] [6]

### Proposed declaration framing — do not submit yet

**One core feature only:** “Member-enabled Safety Location privately checks whether a verified qualifying emergency may affect the member. It stores one encrypted current fix for that assessment. It does not expose a live map or coordinates to contacts.”

The declaration must explain why a foreground-only workflow would not meet the member-enabled protection choice, while avoiding any claim that the app provides emergency dispatch, guaranteed protection, or first-responder services. If that justification cannot be truthfully made part of Mapping with Melanin's core functionality, remove background location from the Android build rather than submit a weak declaration.

### Prominent disclosure draft

> **Safety Location uses your location in the background only if you turn it on.** Mapping with Melanin keeps one encrypted current location to privately check whether a qualifying verified emergency may affect you. Your trusted contacts cannot see your location. We may send only a limited impact notice to contacts you separately select. You can pause, delete the current location, or turn Safety Location off at any time. This feature does not provide emergency response or continuous tracking.

Place this standalone disclosure immediately before the system permission flow. It must not be hidden in settings, bundled with unrelated disclosures, or replaceable by a privacy-policy link. Google requires a prominent in-app disclosure before the relevant permission and requires the app and store listing privacy policy to cover collection, use, sharing, retention, and deletion. [5] [7]

### Google Play evidence checklist

- Complete the Location Permissions Declaration with **one** background-location feature.
- Record a concise video, preferably 30 seconds or less, showing the prominent disclosure, affirmative opt-in, Android permission flow, visible foreground-service notification, status, pause/delete/revoke, and no-coordinate contact boundary.
- Put the same feature explanation in the store description and screenshots without asserting emergency response.
- Confirm `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, and `FOREGROUND_SERVICE_LOCATION` are present only in a version whose declaration is ready for review.
- Explain battery restrictions, delayed/background update limits, denied permission, app termination, and connectivity loss as possible `location_unknown` outcomes. Android warns that background updates are limited on Android 8.0 and later. [6]
- Provide an active, non-editable public privacy-policy URL in the app and the store listing, plus Data safety declarations.

## Proposed privacy and retention policy — founder/privacy/legal review required

This is a proposal only. The service must not activate an automatic retention purge until it is approved and implemented.

### Purpose and collection

Mapping with Melanin would collect a member's precise device location only after an explicit Safety Location opt-in, separate background choice, and operating-system authorization. It would collect a current fix when the member's device supplies one during the enabled feature. It would not collect location from Temporary Trusted Live Sharing consent alone.

### Storage, access, and disclosure

The product stores one current encrypted fix associated with the member account. Mapping with Melanin's server may decrypt it only to classify an eligible emergency boundary after the member has separately authorized a specific accepted trusted contact. Trusted contacts receive no coordinates, address, location timestamp, history, or tracking interface. Contacts may receive only a limited Family Impact notice if the result is potentially affected and the fake/approved delivery gate is enabled. No result promises safety or emergency response.

### Proposed retention schedule

| Data | Proposed handling | Exception |
|---|---|---|
| Current encrypted location | Replace on every accepted fix; delete immediately on pause, foreground-permission loss, member deletion request, or consent revocation. Delete when no longer current under the approved location-retention rule. | Preserve only under a documented legal hold that identifies the authority, scope, reviewer, and end date. |
| Non-coordinate operational audit labels | Retain for **30 days**, then automatically delete when an approved implementation is deployed. Audit records must never contain coordinates, address, ciphertext, provider payloads, or contact-visible timestamps. | Security incident, fraud investigation, or legally required preservation, each documented with a narrowly scoped hold and review cadence. |
| Family Impact event and delivery audit | Retain only long enough to operate cancellation, correction, retry, member inquiry, and incident review under the approved schedule. | Same documented legal/security hold process; no indefinite default retention. |
| Support/deletion request record | Keep the minimum request, action, and completion evidence needed to respond and demonstrate compliance. | A valid legal preservation obligation only. |

### Member controls and rights

Members can review disclosure and permission state, pause collection, delete the current location, revoke persistent-location consent, and revoke individual contact authorization. Revocation stops future matching and cancels pending eligible retries after revalidation. A member deletion request must remove the current location and linked active consent/authorization data, subject only to disclosed legal/security preservation. Corrections or withdrawals of source incidents must cancel or correct the related event state and prevent further delivery.

### Security and incident response

Use modern transport encryption, the configured AES-256-GCM key ring, least-privilege operational access, no coordinate logging, and separate review of any production key rotation. A confirmed security incident requires containment, key/risk assessment, affected-data scope analysis, notice decisions under applicable law, and a documented corrective action. No raw location is included in standard telemetry, client logs, provider payloads, or support responses.

### Decisions still required

1. Production freshness and accuracy thresholds.
2. The precise maximum lifetime for an encrypted current fix when no replacement arrives.
3. Approval of the proposed 30-day non-coordinate audit retention, deletion job, and legal/security hold process.
4. Identity of the privacy/legal owner for deletion requests, correction/withdrawal decisions, legal holds, and security incidents.
5. Whether an external notification provider may ever be enabled, its acceptable channels, message wording, operational owner, retries, and receipt semantics.
6. Apple clarification outcome and the final iOS feature decision.
7. Google Play declaration wording, privacy-policy publication, Data safety disclosure, and demonstration video approval.

## Physical-device acceptance protocol — prepared, not started

Use only the isolated staging API, the disposable fixture owner and contacts, fictional coordinates, synthetic incidents, and the fake provider. A source test or staging API result is not a device result.

### Both platforms

1. Confirm the disclosure appears before any OS permission prompt.
2. Enable foreground permission, then independently choose background permission; test denial and restricted states.
3. Confirm the owner status shows state/permission information without coordinates or ciphertext.
4. Verify pause, resume, delete-current-location, individual-contact revoke, and global revoke. Confirm current collection stops and a resumed session needs a new fix.
5. Test fresh/accurate, stale, expired, inaccurate, deleted, absent, and revoked states against controlled synthetic boundaries. Only fresh/accurate matching may be potentially affected.
6. Confirm unselected, unrelated, blocked, and revoked contacts cannot access persistent settings, coordinates, Family Impact notices, or fake-provider handoff.
7. Confirm a contact sees no GPS, address, timestamp, history, or tracking map in any screen or notification.
8. Validate accessibility labels, screen-reader reading order, dynamic text, error states, and the truthfulness of unavailable states.
9. Exercise controlled fake notification result only. Record that it is not physical push receipt or acknowledgment.
10. Toggle the staging flag off and confirm safe feature disablement and rollback behavior.

### iOS-specific

- Test first opt-in, When In Use, Always request, and user downgrade to When In Use.
- Test the background indicator, app backgrounding, system termination/relaunch behavior, connectivity loss, and restart.
- Do not run a public iOS build with persistent background collection until Apple policy clearance is documented.

### Android-specific

- Confirm foreground-service notification title/body/stop path while collection is active.
- Test Android 10+ background permission flow, battery optimization/restriction behavior, app swipe-away/termination, and delayed update behavior.
- Verify denied/limited permission and offline conditions produce `location_unknown`, not a stale implied-protection state.

## References

[1]: https://developer.apple.com/app-store/review/guidelines/ "Apple App Review Guidelines"
[2]: https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background "Handling location updates in the background"
[3]: https://developer.apple.com/app-store/app-privacy-details/ "App privacy details on the App Store"
[4]: https://developer.apple.com/documentation/bundleresources/choosing-the-location-services-authorization-to-request "Choosing the Location Services Authorization to Request"
[5]: https://support.google.com/googleplay/android-developer/answer/9799150?hl=en "Understanding location in the background permissions"
[6]: https://developer.android.com/develop/sensors-and-location/location/background "Access location in the background"
[7]: https://support.google.com/googleplay/android-developer/answer/9888076?hl=en "Google Play User Data policy"
