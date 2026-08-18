# Mapping with Melanin — Kinfolk and Gold Feather Regression Patch

This patch corrects the regression shown in the screenshots. A member who asks **“Charlotte NC night life”** has already supplied a usable city and state. Kinfolk must resolve that location, retrieve verified nightlife listings for it, and answer directly. The generic location prompt is now allowed only when a nightlife question contains no resolvable city.

The patch also establishes one MWM-owned visual rule: **every MWM system accent that formerly appeared as a Unicode emoji is rendered as the polished gold feather-outline mark.** This applies to Kinfolk, navigation, buttons, category cards, status labels, and editorial/system copy. Community-member message text is untouched; if a member uses an emoji, it remains their authored content.

## Root cause

The regression occurred because a generic “location required” guard ran before the question was parsed for a location. Consequently, `Charlotte NC night life` was handled as though it contained no city. Separately, the library category configuration used hard-coded Unicode emoji values, so the MWM visual language had drifted away from the approved gold feather treatment.

## Included files

| File | What it changes |
|---|---|
| `server/kinfolk/cityAwareNightlife.ts` | Detects nightlife intent, resolves a city alias from the question, retrieves verified nightlife listings, and answers directly. |
| `server/kinfolk/kinfolkHandler.patch.ts` | Shows the exact insertion point: run city-aware nightlife handling before the existing generic location guard. |
| `server/kinfolk/postgresKinfolkDirectoryRepository.ts` | Parameterized PostgreSQL adapter for city aliases and verified nightlife listings. |
| `db/migrations/20260817_kinfolk_city_resolution.sql` | Adds authoritative city aliases, including Charlotte forms, plus retrieval-quality telemetry. |
| `client/src/components/brand/GoldFeatherIcon.tsx` | The reusable polished gold feather-outline SVG component. |
| `client/src/components/brand/mwmVisualLanguage.tsx` | MWM-owned accent renderer and system-content emoji guardrail; it leaves member text intact. |
| `client/src/styles/mwm-gold-feather.css` | Gold feather color and visual token styling. |
| `client/src/features/library/libraryCategoryCards.patch.tsx` | Replaces hard-coded category emoji with the gold feather accent. |
| `client/src/features/kinfolk/KinfolkNightlifeResponse.tsx` | Renders Kinfolk results and listings using the feather mark rather than emoji. |
| `server/kinfolk/cityAwareNightlife.test.ts` | Regression tests for Charlotte city resolution and assistant emoji stripping. |

## Apply in this order

### 1. Add city aliases and telemetry

Apply `db/migrations/20260817_kinfolk_city_resolution.sql` through the existing database migration process. Confirm the existing `cities` table uses `id`, `name`, `state_code`, `latitude`, `longitude`, and `is_active`. If its column names differ, change only those references in the migration and PostgreSQL adapter.

Add state-qualified aliases for every city that Kinfolk supports. At minimum, preserve the Charlotte aliases inserted by the migration: `charlotte`, `charlotte nc`, and `charlotte north carolina`. The state-qualified forms are what make a query such as `Charlotte NC night life` deterministic.

### 2. Register the directory repository

Create the repository with the project’s existing PostgreSQL client. If the application uses an ORM, retain the `KinfolkDirectoryRepository` interface and translate the SQL in `postgresKinfolkDirectoryRepository.ts` into the ORM’s query syntax.

```ts
import { createPostgresKinfolkDirectoryRepository } from "./kinfolk/postgresKinfolkDirectoryRepository";

const directoryRepository = createPostgresKinfolkDirectoryRepository(dbPool);
```

Only active and verified businesses with nightlife-relevant category, subcategory, or tags are returned. Keep those fields clean and reviewed; Kinfolk must not invent nightlife options that are absent from the directory.

### 3. Move city-aware handling ahead of the generic location guard

Apply `server/kinfolk/kinfolkHandler.patch.ts` to the existing Kinfolk message route. Its ordering is the important change:

```ts
if (isNightlifeIntent(question)) {
  return answerKinfolkQuestion({
    question,
    repository: directoryRepository,
    answerWriter: existingKinfolkAnswerWriter,
  });
}

return runExistingKinfolkHandler(question);
```

Do **not** retain any earlier condition that asks for a location before `answerKinfolkQuestion` runs. The resolver uses the member’s stated city first. Only an unresolved request such as `nightlife suggestions` receives a city/metro prompt.

The answer writer receives the resolved city and verified listing context. Its instruction prohibits emojis and invention of venues, hours, safety details, or availability. If the writer fails, the service returns a factual deterministic response from the verified directory.

### 4. Install the gold feather-outline system

Import `client/src/styles/mwm-gold-feather.css` once in the application’s global stylesheet entry point.

```ts
import "./styles/mwm-gold-feather.css";
```

Replace MWM-owned emoji markup with the approved component:

```tsx
// Before: an MWM-owned Unicode emoji in a category card
<span>{category.emoji}</span>

// After: the approved MWM-owned visual accent
<MwmOwnedAccent label={`${category.name} category`} surface="category-card" />
```

Remove `emoji` fields from system category/configuration objects, as demonstrated in `libraryCategoryCards.patch.tsx`. Use `MwmOwnedAccent` or `GoldFeatherIcon` in all MWM-created navigation, buttons, cards, Kinfolk headers, system messages, and status controls.

Use `BrandedText` for displayed text that has an origin. It removes Unicode emoji from MWM and Kinfolk content, while retaining the original member-authored string without modification:

```tsx
<BrandedText origin="kinfolk">{assistantReply}</BrandedText>
<BrandedText origin="member">{memberMessage}</BrandedText>
```

## Required release checks

| Check | Expected result |
|---|---|
| Submit `Charlotte NC night life` to Kinfolk. | Kinfolk answers with Charlotte, NC verified nightlife options. It does not ask for a city. |
| Submit `nightlife suggestions` with no location. | Kinfolk asks which city, neighborhood, or metro area to use. |
| Return an answer-writer response containing an emoji. | The stored/displayed Kinfolk response contains no Unicode emoji. |
| Open Library category cards. | Every former emoji is replaced by the gold feather-outline icon. |
| Display a community member’s emoji-containing message. | The member’s emoji remain unchanged. |
| Use a stale or unsupported city alias. | Kinfolk asks for clarification rather than guessing a location. |
| Query a resolved city with no verified nightlife listings. | Kinfolk states that the verified directory has no listing to recommend with confidence; it does not invent venues. |

## Data and governance notes

The retrieval event table is for service-quality monitoring. It records intent, resolved city, query text, result count, and timestamp. It must not be expanded to capture a member ID, full chat transcript, exact member coordinates, or IP address. Review zero-result nightlife events in aggregate to identify cities that need better directory coverage.
