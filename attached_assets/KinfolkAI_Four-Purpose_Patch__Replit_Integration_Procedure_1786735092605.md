# KinfolkAI Four-Purpose Patch: Replit Integration Procedure

## What this fixes

This patch enforces four contracts: flywheel events are idempotent and privacy-aware; educational answers expose evidence or admit limitations; safety answers carry a deterministic current-source disclaimer; and promotional recommendations can contain only server-authoritative, non-hidden, non-duplicate businesses.

## Apply in this order

### 1. Backup and branch

```bash
git status
git checkout -b fix/kinfolk-four-purpose-contract
pg_dump "$DATABASE_URL" --format=custom --file=before-kinfolk-four-purpose.dump
```

### 2. Run the additive SQL

```bash
psql "$DATABASE_URL" --set ON_ERROR_STOP=1 -f MWM_KINFOLK_FOUR_PURPOSE_SCHEMA.sql
```

If the migration fails because a column has a different name, stop. Do not remove or rename data. Map the actual schema column in one migration and rerun with `ON_ERROR_STOP=1`.

### 3. Integrate the TypeScript helpers

Copy `MWM_KINFOLK_FOUR_PURPOSE_PATCH.ts` into the Kinfolk server module. Import:

```ts
import {
  PUBLIC_BUSINESS_SQL,
  enforceKinfolkResponse,
  buildFlywheelEvent,
} from "../kinfolk/MWM_KINFOLK_FOUR_PURPOSE_PATCH";
```

In every Kinfolk catalog, discovery-enrichment, and nearby-nudge query, add:

```sql
AND COALESCE(b.is_duplicate, false) = false
AND COALESCE(b.permanently_hidden, false) = false
```

Do not use `status = 'active'` alone.

After parsing the model response and after local catalog enrichment, replace model recommendations with the server-validated result:

```ts
const enforced = enforceKinfolkResponse({
  reply,
  modelRecommendations: recommendations?.businesses ?? [],
  catalog: businessCatalog,
  sources: currentSources,
  libraryAction,
  intentClass,
});

reply = enforced.reply;
recommendations = enforced.recommendations;
currentSources = enforced.sources;
```

Return these additional fields:

```ts
educationalStatus: enforced.educationalStatus,
safetyNotice: enforced.safetyNotice,
promotionDisclosure: enforced.promotionDisclosure,
rejectedRecommendations: enforced.rejectedRecommendations,
```

The model must not be able to create a business recommendation merely by returning a name. The name or ID must resolve to the server catalog.

### 4. Make flywheel events idempotent

Replace fire-and-forget growth capture for durable events with an insert using the unique index:

```ts
const event = buildFlywheelEvent({
  userId: req.user.id,
  eventType: "kinfolk_query",
  canonicalSubject: growthSubject.canonicalSubject,
  sourceSurface: "kinfolk_chat",
  sensitive: sensitivityTier === "excluded",
  isLoadTest: (req.user as { isLoadTest?: boolean }).isLoadTest === true,
});

await pool.query(
  `INSERT INTO kinfolk_flywheel_events
     (user_id, event_type, canonical_subject, source_surface, event_day, learning_eligible, is_load_test, created_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
   ON CONFLICT (user_id, event_type, canonical_subject, source_surface, event_day)
   DO NOTHING`,
  [event.userId, event.eventType, event.canonicalSubject, event.sourceSurface,
   event.eventDay, event.learningEligible, event.isLoadTest, event.createdAt],
);
```

Never put the raw question, medical details, safety details, or voice transcript in this event table.

### 5. Education contract

Whenever a Library action is returned, attach its published topic URL or source records to `currentSources`. If no source is available, return `educationalStatus: "limited"` and tell the user that the Library topic contains the source-backed material. Do not display a citation that was not actually fetched or stored.

### 6. Safety contract

Return `safetyNotice` for safety, emergency, danger, crime, or medical-risk intents. Use official sources when available. Without an official current source, explicitly say the answer is not a current official alert and direct the user to local authorities. For immediate danger, direct the user to emergency services. Do not turn community averages into a safety guarantee.

### 7. Promotion contract

Keep `smartPromotion` only when each business ID resolves through the same validated catalog. Return `null` for unsupported model proposals. Display paid, sponsored, or claimed status separately; never infer ownership or paid placement.

## Tests

Run:

```bash
npm run typecheck
npm test
npm run build
npx vitest run MWM_KINFOLK_FOUR_PURPOSE_TESTS.ts
```

Required proof:

| Test | Expected |
|---|---|
| Fictional model-only business | Rejected; no public recommendation. |
| Duplicate/hidden catalog row | Excluded from recommendations. |
| Verified catalog row | Returned with canonical ID and evidence. |
| Library answer with source | `educationalStatus=grounded`. |
| Library answer without source | `educationalStatus=limited`; no fake citation. |
| Safety answer without official source | Safety disclaimer present. |
| Repeated same Kinfolk question | One flywheel event per user/day/subject/surface. |
| Sensitive question | No learning-eligible flywheel event. |

## Deploy and prove

```bash
git add .
git commit -m "Enforce Kinfolk flywheel, education, safety, and promotion contracts"
git push origin fix/kinfolk-four-purpose-contract
```

Deploy to staging, then return redacted evidence with the commit SHA, migration output, test output, and HTTP responses. No raw prompts, transcripts, tokens, cookies, or user identities should appear in evidence.
