# Mapping with Melanin — Kinfolk Capability Layer

This package gives Kinfolk the behavior you described: **it understands the likely need, responds helpfully in the moment, and offers—not forces—the next relevant connection.** A legal-information question can lead to a respectful, optional attorney offer. A health question can lead to an optional local-clinician offer. A plumbing question can receive clear troubleshooting guidance and an optional verified-plumber offer. The member is always free to continue talking, decline the action, or never share a location.

> Kinfolk should be proactive about possibilities, but never presumptive about decisions.

## Required Kinfolk behavior

| Member situation | Kinfolk’s response | Optional next step |
|---|---|---|
| A member asks about an eviction notice, custody issue, contract, rights, or another legal concern. | Provides general educational information, source-backed guidance where appropriate, and a clear legal-information disclaimer. | Asks: **“Would you like to see verified local attorneys in your area?”** It does not retrieve or show them until the member chooses the action. |
| A member asks a medical or wellness question. | Provides educational information, reputable sources, and questions that may help with a clinical conversation; it does not diagnose. | Asks whether the member would like verified local medical professionals. Urgent safety signals do not trigger an ordinary listing card. |
| A member asks a plumbing question. | Walks through safe, practical troubleshooting in the same explanatory manner as a capable general assistant. | Offers verified nearby plumbers only after the member chooses. |
| A member says “I need to make a stop Uptown.” | Resolves **Uptown** using the member’s saved city context and an editorially verified local-place dictionary. | Offers appropriate local discovery only if the inferred need calls for it. |
| A member uses conversational language such as “y’all.” | Recognizes the register but does not stereotype or automatically mimic it. | Uses community-conversational language only if that member selected the **Community conversational** tone preference. |

## The consent rule

Kinfolk must follow this exact sequence:

1. **Understand the message.** Resolve intent, potential professional relevance, tone preference, and local context.
2. **Help first.** Give a useful, respectful answer in the chat.
3. **Offer, never push.** If a professional connection could be helpful, render one quiet optional action card. It is not a modal, forced decision, or automatic redirect.
4. **Retrieve only after consent.** Local attorneys, clinicians, plumbers, or businesses are returned only after the member presses **Show local options**.
5. **Respect a non-choice.** The member can simply continue the conversation. Kinfolk must not repeat the offer aggressively or treat declining as a negative signal.

This distinction matters: Kinfolk can be a step ahead by recognizing a possible need without deciding for the person that they need a lawyer, physician, or contractor.

## Included files

| File | Role |
|---|---|
| `server/kinfolk/capabilities/intentResolver.ts` | Classifies the primary need, identifies a potentially relevant professional, resolves local phrases, checks tone preferences, and detects urgent safety signals. |
| `server/kinfolk/capabilities/responseComposer.ts` | Creates the helpful first response and the quiet optional action card. |
| `server/kinfolk/capabilities/optionalProfessionalResults.ts` | Retrieves verified local professionals only after explicit member action. |
| `server/kinfolk/capabilities/registerCapabilityRoutes.ts` | Keeps inferred intent server-side in a short-lived turn and validates consent/action matching. |
| `server/kinfolk/capabilities/postgresCapabilityStores.ts` | PostgreSQL adapters for member context, local-place aliases, verified professionals, and secure turn storage. |
| `db/migrations/20260817_kinfolk_capabilities.sql` | Adds tone preferences, city-aware place aliases, and thirty-minute consent turns. |
| `client/src/features/kinfolk/KinfolkCapabilityResponse.tsx` | Renders Kinfolk’s answer, optional action card, and post-consent local results. |
| `client/src/features/profile/KinfolkTonePreference.tsx` | Lets the member choose a voice style explicitly. |
| `client/src/components/brand/GoldFeatherMark.tsx` | The approved gold-brushed feather accent for all MWM-owned UI marks. |

## Installation sequence

### 1. Apply the migration

Run `db/migrations/20260817_kinfolk_capabilities.sql` with the project’s existing migration process. The migration assumes `users`, `cities`, and a UUID `users.id`. Adjust only those schema references if the Replit project uses different table names.

The `local_place_aliases` table is intentionally editorial. It maps a phrase only inside a known city. For example, `uptown` becomes **Uptown Charlotte** only when the member’s saved city is Charlotte, NC. Do not create a global rule that assumes every “Uptown” means Charlotte.

### 2. Register the server dependencies

```ts
import { registerKinfolkCapabilityRoutes } from "./kinfolk/capabilities/registerCapabilityRoutes";
import {
  createPostgresCapabilityTurnStore,
  createPostgresLocalContextRepository,
  createPostgresMemberContextRepository,
  createPostgresProfessionalDirectoryRepository,
} from "./kinfolk/capabilities/postgresCapabilityStores";

registerKinfolkCapabilityRoutes(app, {
  memberContextRepository: createPostgresMemberContextRepository(dbPool),
  localContextRepository: createPostgresLocalContextRepository(dbPool),
  professionalDirectoryRepository: createPostgresProfessionalDirectoryRepository(dbPool),
  turnStore: createPostgresCapabilityTurnStore(dbPool),
});
```

Add `registerKinfolkToneRoute(app, dbPool)` from `server/profile/registerKinfolkToneRoute.ts` to enable the preference control.

### 3. Integrate this branch into the existing Kinfolk flow

When a member sends a message, call `POST /api/kinfolk/capability-turns` before the generic-answer fallback. Render the response from `KinfolkCapabilityResponse.tsx`. The response contains a normal answer, optional action metadata when relevant, and a short-lived `turnId`.

When the member presses **Show local options**, the component calls `POST /api/kinfolk/capability-turns/:turnId/actions/:actionId`. This is the only point where verified professional records are retrieved. Do not call that action endpoint automatically after intent detection.

### 4. Preserve the gold feather visual language

Use `GoldFeatherMark` for Kinfolk headers, system answers, optional action cards, result labels, buttons, profile controls, navigation, Library categories, and other MWM-owned accents. Do not use Unicode emoji in MWM-authored UI or assistant text. Preserve a community member’s own message verbatim, including any emoji they choose to use.

### 5. Maintain professional-data quality

A local professional is eligible only when the directory record is active and verified. Before treating attorney, clinician, or plumber results as verified, keep an operational review process for license, practice/service category, address, and current status. Kinfolk should say that a listing is verified by the MWM directory; it should not claim that MWM has assessed a professional’s legal, medical, or technical competence.

## Tone and cultural-context rules

| Rule | Required behavior |
|---|---|
| Tone is a preference. | A member chooses **Warm and clear**, **Community conversational**, or **Concise and professional**. Kinfolk defaults to warm and clear. |
| Conversational language is not an identity guess. | Recognizing “y’all” may inform the response, but Kinfolk uses similar phrasing only if the member selected Community conversational. |
| Local meaning requires context. | “Uptown,” “the West End,” and similar phrases are resolved only with a member’s city/state or an explicitly named location. |
| Sensitive subjects need boundaries. | Kinfolk provides educational information and optional local connections; it does not diagnose, give personalized legal advice, or make mandatory decisions. |
| An offer is not pressure. | Each response exposes at most one relevant optional professional card. The member can ignore it and keep talking. |

## Release checks

| Check | Expected result |
|---|---|
| Ask about an eviction notice from a member with Charlotte saved. | Kinfolk gives educational legal framing and an optional attorney card; it does not automatically list attorneys. |
| Click the attorney card. | The server returns up to five verified Charlotte-area attorney listings. |
| Do not click the card. | No directory search is made; the conversation continues normally. |
| Ask a plumbing question. | Kinfolk provides practical guidance and offers plumbers only after consent. |
| Ask “I need to make a stop Uptown” with Charlotte saved. | Kinfolk resolves it as Uptown Charlotte through the place-alias table. |
| Use “y’all” with Warm and clear selected. | Kinfolk remains warm and clear; it does not automatically mimic the phrase. |
| Use “y’all” with Community conversational selected. | Kinfolk may use light conversational language without caricature or overuse. |
| Surface an urgent symptom phrase. | Kinfolk presents urgent-care framing and does not replace it with an ordinary clinician-listing action. |
| Inspect system UI and Kinfolk messages. | Gold feather marks are used for MWM accents; community-member emoji remain unchanged. |
