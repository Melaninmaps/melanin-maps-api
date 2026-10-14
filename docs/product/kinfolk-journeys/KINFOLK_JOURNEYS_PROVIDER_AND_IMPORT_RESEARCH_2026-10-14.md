# Kinfolk Journeys — Legitimate Provider and Member-Selected Import Research

**Date:** 2026-10-14
**Status:** Architecture evidence; no providers, credentials, OAuth clients, API keys, background polling, email forwarding addresses, purchases, or live member connections were created.

> **Product decision:** Kinfolk Journeys defaults to member-selected, one-item-at-a-time imports—pasted confirmation text, a selected PDF, an `.eml` confirmation, an `.ics` calendar file, a native selected calendar event, or manual entry. Kinfolk displays extracted fields for member review and saves nothing as confirmed until the member explicitly approves it.

## Evidence-led capability matrix

| Source | Legitimate direct member-data access | Source-only implementation decision | Explicit boundary |
|---|---|---|---|
| Google Calendar | OAuth scopes are calendar-wide, not selected-event scopes. Contextual selected-event access requires a Google Workspace add-on. | Keep native device selection/manual `.ics` as the default; model optional Google free/busy/calendar adapters accurately. | Do not call ordinary Calendar OAuth “selected event” access. |
| Gmail | Standard Gmail read scopes are mailbox-wide/restricted. A current-message Workspace add-on is a separate contextual product. | Selected `.eml`, forwarded confirmation, PDF, paste, or Workspace add-on only after separate product approval. | No inbox scanning or ongoing Gmail sync. |
| Microsoft Outlook Mail/Calendar | Graph `Mail.Read` and `Calendars.Read` are mailbox/calendar-wide. A current Outlook-item add-in is distinct. | Selected `.eml`/`.ics`, paste, manual entry; direct Graph is not enabled as a “selected confirmation” connector. | No mailbox/calendar subscription, delta sync, or app-only permission. |
| Delta | Official customer pages are not an app integration; Delta terms restrict automated access without written permission. | Parse only member-selected confirmation/update content; use Delta as the source of truth for status. | No Delta login, scraping, My Trips automation, polling, or record-locator retrieval. |
| Ticketmaster | Discovery is public metadata. Order/ticket APIs require an official partner relationship; Wallet tickets are issuer-controlled. | Member-selected confirmation/event details only; keep tickets and entry credentials in Ticketmaster/Wallet. | No “Connect Ticketmaster”, ticket import, SafeTix/QR/barcode retention, or status sync. |
| Apple Wallet | PassKit access is limited to pass types the app’s developer team is entitled to access; there is no consumer Wallet-read OAuth scope. | Do not upload/read `.pkpass`; member supplies an original confirmation or enters itinerary facts. | No enumeration, copying, re-signing, or syncing foreign Wallet passes. |
| Google Wallet | Wallet APIs are issuer-to-member pass issuance/management, not consumer pass-library reading. | Do not offer Wallet import; accept an original selected confirmation instead. | No Google Wallet pass enumeration or cloning. |
| iOS/Android device calendar | Calendar access is broad when granted. System editor/intents support member-reviewed event creation without broad reads. | Retain explicit native calendar selection; use system write/editor handoffs where import is unnecessary. | Do not describe calendar permission as event-specific. |
| iOS/Android document/share selection | System picker/share gives a capability only over the member-selected item. | Add `.eml` and `.ics` selected-document paths alongside private PDF/image staging. | No standing access to the source app, inbox, storage, or Wallet. |

## Required source changes from this research

1. Treat **selected `.eml` and `.ics` files** as supported private document inputs, with text-only parsing, field-level provenance, review-before-save, and no raw source persistence.
2. Continue bounded selectable-text PDF extraction; do not infer facts from unreadable PDF/image attachments.
3. Reject or leave unprocessed Wallet pass packages, QR/barcodes, SafeTix/entry tokens, payment data, and unneeded passenger/companion data.
4. Make Google/Microsoft mail adapters unavailable by default rather than describing a mailbox-wide OAuth grant as selected-confirmation access.
5. Keep Delta, Ticketmaster, airline, hotel, wallet, and flight-status connectors in an honest **manual/member-selected source required** state absent written provider authorization.
6. Keep native calendar reads just-in-time and explicit; native calendar event creation remains member-reviewed/tentative.

## Consent, security, retention, and audit baseline

- Ask at the moment the member chooses one specific source; state what is read, how it is reduced to proposed fields, and that it is not sent to ordinary Kinfolk chat.
- Store only member-confirmed itinerary fields by default. Derived import facts retain source kind, confidence, review status, and audit metadata; raw text is processed in memory for the request and not saved by the Journeys parser.
- Keep provider tokens encrypted, disclose scope and retention, and support disconnect/delete separately. No live provider route should be enabled until provider-specific prerequisites and policy review are complete.
- Never treat a confirmation file as proof that a ticket remains valid, a reservation is current, or a flight/event has not changed.

## Official reference set

### Google

- [Google Calendar authorization](https://developers.google.com/workspace/calendar/api/auth)
- [Gmail OAuth scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Google Workspace Add-on scopes](https://developers.google.com/workspace/add-ons/concepts/workspace-scopes)
- [Google API user data policy](https://developers.google.com/terms/api-services-user-data-policy)
- [Restricted-scope production readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)

### Microsoft

- [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Microsoft permissions and consent overview](https://learn.microsoft.com/en-us/entra/identity-platform/permissions-consent-overview)
- [Outlook add-in permissions](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/understanding-outlook-add-in-permissions)
- [Save an Outlook message as `.eml`](https://support.microsoft.com/en-us/outlook/mail/save-an-outlook-message-as-a-eml-file-a-pdf-file-or-as-a-draft)

### Travel, events, Wallet, and native platforms

- [Delta terms of use](https://www.delta.com/us/en/legal/terms-of-use)
- [Delta Flight Status](https://www.delta.com/flightstatus)
- [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [Ticketmaster Partner API](https://developer.ticketmaster.com/products-and-docs/apis/partner/)
- [Apple PassKit app/pass access](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Apps.html)
- [Apple EventKit and EventKitUI](https://developer.apple.com/documentation/eventkit/accessing-calendar-using-eventkit-and-eventkitui)
- [Android Calendar Provider](https://developer.android.com/guide/topics/providers/calendar-provider)
- [Android Storage Access Framework](https://developer.android.com/training/data-storage/shared/documents-files)
- [Google Wallet Android flow](https://developers.google.com/wallet/generic/android)

## Separate approval gates later

1. **Production migration and service deployment** for the already-prepared private Journey schema/API/Web source.
2. **Individual provider integration approval** only after provider contract, OAuth client setup, accurate scope disclosure, security/privacy assessment, and a member-facing consent/revoke/deletion design are reviewed.
3. **Gmail restricted-scope public launch** only after the relevant Google verification/security requirements are satisfied.
4. **Delta/Ticketmaster/provider automation** only with written provider authorization and a documented supported API/partner contract.
5. **Native build/TestFlight approval** after source review; no build was created during this work.
