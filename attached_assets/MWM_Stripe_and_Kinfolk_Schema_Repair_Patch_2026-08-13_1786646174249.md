# Mapping With Melanin — StripeSync and Kinfolk Schema Repair Patch

**Purpose:** Repair the confirmed `stripe.accounts` startup failure, repair the `kinfolk_cultural_documents` foreign-key type mismatch, and prevent optional Kinfolk enrichment/persistence schema gaps from turning a member chat response into HTTP 500.

**Scope:** This package is surgical. It does not change login, business data, map behavior, rate limits, OpenAI credentials, or product features.

> **Important:** Run the preflight queries first. Do not manually create a partial StripeSync schema if StripeSync’s own version-matched migration runner can complete successfully. The manual Stripe table section below is a narrow recovery migration for package `stripe-replit-sync@1.0.0`, whose source was inspected for this package.

---

## 1. Preflight — must be run before applying any repair

```sql
-- P0-SCHEMA-PREFLIGHT.sql
SELECT
  to_regnamespace('stripe')                                          AS stripe_schema,
  to_regclass('stripe.accounts')                                     AS stripe_accounts,
  to_regclass('kinfolk_entities')                                   AS kinfolk_entities,
  to_regclass('kinfolk_source_records')                             AS kinfolk_source_records,
  to_regclass('kinfolk_cultural_documents')                         AS kinfolk_cultural_documents,
  to_regclass('kinfolk_embedding_outbox')                           AS kinfolk_embedding_outbox;

SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('kinfolk_entities', 'kinfolk_source_records', 'kinfolk_cultural_documents')
  AND column_name IN ('id', 'entity_id', 'source_id')
ORDER BY table_name, ordinal_position;

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.kinfolk_cultural_documents'::regclass;
```

Expected parent-key contract:

| Table | Key column | Required type |
| --- | --- | --- |
| `kinfolk_entities` | `id` | `text` |
| `kinfolk_source_records` | `id` | `text` |
| `kinfolk_cultural_documents` | `entity_id` | `text` |
| `kinfolk_cultural_documents` | `source_id` | `text` |

The failed version used `uuid` for both child columns while its parent keys are `text`; PostgreSQL correctly rejected the foreign key.

---

## 2. Exact Kinfolk cultural-document repair migration

Save as `sql/20260813_repair_kinfolk_cultural_documents.sql`. Apply once through the project’s controlled migration mechanism—not through an ad hoc browser SQL console.

```sql
BEGIN;

-- Dependency order is intentional. The document table cannot be created until
-- both text-key parent tables exist.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.kinfolk_entities (
  id                    text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canonical_name        text NOT NULL,
  entity_type           text NOT NULL,
  summary               text,
  era_start             integer,
  era_end               integer,
  cultural_context_tags text[],
  source_status         text NOT NULL DEFAULT 'active',
  last_verified_at      timestamptz DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kinfolk_source_records (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canonical_url   text NOT NULL UNIQUE,
  publisher       text NOT NULL,
  title           text NOT NULL,
  tier            text NOT NULL CHECK (tier IN ('A','B','C')),
  claim_scope     text[] NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'active',
  expected_host   text,
  http_status     integer,
  last_checked_at timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- If an earlier partial deployment somehow created the wrong UUID child types,
-- convert their values to text before constraints are recreated. This does not
-- delete documents. A non-UUID text parent key remains compatible.
DO $$
BEGIN
  IF to_regclass('public.kinfolk_cultural_documents') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'kinfolk_cultural_documents'
        AND column_name = 'entity_id'
        AND udt_name <> 'text'
    ) THEN
      ALTER TABLE public.kinfolk_cultural_documents
        ALTER COLUMN entity_id TYPE text USING entity_id::text;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'kinfolk_cultural_documents'
        AND column_name = 'source_id'
        AND udt_name <> 'text'
    ) THEN
      ALTER TABLE public.kinfolk_cultural_documents
        ALTER COLUMN source_id TYPE text USING source_id::text;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.kinfolk_cultural_documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        text REFERENCES public.kinfolk_entities(id) ON DELETE CASCADE,
  source_id        text REFERENCES public.kinfolk_source_records(id) ON DELETE SET NULL,
  document_type    varchar(48) NOT NULL DEFAULT 'summary'
                   CHECK (document_type IN ('summary','biography','event','place','topic','factsheet')),
  language_code    varchar(16) NOT NULL DEFAULT 'en',
  geography_scope  jsonb NOT NULL DEFAULT '{}'::jsonb,
  category         text,
  sensitivity_tier varchar(24) NOT NULL DEFAULT 'standard'
                   CHECK (sensitivity_tier IN ('standard','public_interest','sensitive','regulated','excluded')),
  content          text NOT NULL,
  content_tsv      tsvector NOT NULL DEFAULT to_tsvector('english', ''),
  embedding_status varchar(24) NOT NULL DEFAULT 'pending'
                   CHECK (embedding_status IN ('pending','ready','failed','stale','held')),
  status           varchar(24) NOT NULL DEFAULT 'held'
                   CHECK (status IN ('held','active','deprecated','needs_review')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kinfolk_cultural_documents
  ADD COLUMN IF NOT EXISTS embedding vector(1536),
  ADD COLUMN IF NOT EXISTS embedding_model text,
  ADD COLUMN IF NOT EXISTS embedding_version text;

-- Recreate only this migration's own FK constraints. The anonymous inline FK
-- names from a partially created table are removed by target, then re-added
-- with stable names for future inspection.
ALTER TABLE public.kinfolk_cultural_documents
  DROP CONSTRAINT IF EXISTS kinfolk_cultural_documents_entity_id_fkey,
  DROP CONSTRAINT IF EXISTS kinfolk_cultural_documents_source_id_fkey;

ALTER TABLE public.kinfolk_cultural_documents
  ADD CONSTRAINT kinfolk_cultural_documents_entity_id_fkey
    FOREIGN KEY (entity_id)
    REFERENCES public.kinfolk_entities(id)
    ON DELETE CASCADE,
  ADD CONSTRAINT kinfolk_cultural_documents_source_id_fkey
    FOREIGN KEY (source_id)
    REFERENCES public.kinfolk_source_records(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS kinfolk_cultural_docs_tsv_idx
  ON public.kinfolk_cultural_documents USING gin (content_tsv);
CREATE INDEX IF NOT EXISTS kinfolk_cultural_docs_status_idx
  ON public.kinfolk_cultural_documents (status, embedding_status, language_code);
CREATE INDEX IF NOT EXISTS kinfolk_cultural_docs_hnsw_idx
  ON public.kinfolk_cultural_documents USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'active' AND embedding_status = 'ready';

CREATE OR REPLACE FUNCTION public.kinfolk_update_content_tsv()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.content_tsv := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kinfolk_content_tsv_update ON public.kinfolk_cultural_documents;
CREATE TRIGGER kinfolk_content_tsv_update
  BEFORE INSERT OR UPDATE OF content ON public.kinfolk_cultural_documents
  FOR EACH ROW EXECUTE FUNCTION public.kinfolk_update_content_tsv();

CREATE TABLE IF NOT EXISTS public.kinfolk_embedding_outbox (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  uuid NOT NULL REFERENCES public.kinfolk_cultural_documents(id) ON DELETE CASCADE,
  operation    varchar(16) NOT NULL CHECK (operation IN ('upsert','delete','reembed')),
  attempts     integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at    timestamptz,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, operation)
);

COMMIT;
```

### Required verification

```sql
SELECT
  to_regclass('public.kinfolk_cultural_documents') AS documents_table,
  to_regclass('public.kinfolk_embedding_outbox')   AS outbox_table;

SELECT
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.kinfolk_cultural_documents'::regclass
ORDER BY conname;
```

Expected results include FKs from `entity_id text` to `kinfolk_entities(id text)` and `source_id text` to `kinfolk_source_records(id text)`.

---

## 3. StripeSync recovery migration — package `stripe-replit-sync@1.0.0`

The preferred repair is to call the package’s own `runMigrations({ databaseUrl })` **before** `getStripeSync()`, then require `to_regclass('stripe.accounts')` to exist before the sync client is used.

If the package migration ledger says its migration already ran while the table is absent, use this narrowly scoped recovery migration. It recreates the exact `stripe.accounts` table shape defined by the package’s version-matched migration `0046_sync_status_per_account.sql`. It does not attempt to replay all package migrations or invent a Stripe schema.

Save as `sql/20260813_repair_stripe_accounts.sql`:

```sql
BEGIN;

CREATE SCHEMA IF NOT EXISTS stripe;

CREATE TABLE IF NOT EXISTS stripe.accounts (
  id               text PRIMARY KEY,
  raw_data         jsonb NOT NULL,
  first_synced_at  timestamptz NOT NULL DEFAULT now(),
  last_synced_at   timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  business_name    text GENERATED ALWAYS AS ((raw_data->'business_profile'->>'name')::text) STORED,
  email            text GENERATED ALWAYS AS ((raw_data->>'email')::text) STORED,
  type             text GENERATED ALWAYS AS ((raw_data->>'type')::text) STORED,
  charges_enabled  boolean GENERATED ALWAYS AS ((raw_data->>'charges_enabled')::boolean) STORED,
  payouts_enabled  boolean GENERATED ALWAYS AS ((raw_data->>'payouts_enabled')::boolean) STORED,
  details_submitted boolean GENERATED ALWAYS AS ((raw_data->>'details_submitted')::boolean) STORED,
  country          text GENERATED ALWAYS AS ((raw_data->>'country')::text) STORED,
  default_currency text GENERATED ALWAYS AS ((raw_data->>'default_currency')::text) STORED,
  created          integer GENERATED ALWAYS AS ((raw_data->>'created')::integer) STORED
);

CREATE INDEX IF NOT EXISTS idx_accounts_business_name
  ON stripe.accounts (business_name);

-- Do not create the package's `handle_updated_at` trigger manually unless the
-- package's version-matched migration runner confirms its helper function exists.
-- The sync client can upsert this table without that optional housekeeping trigger.

COMMIT;
```

Then change startup code so package migrations are still the source of truth and StripeSync never uses a missing schema:

```ts
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn('DATABASE_URL not set — skipping Stripe init');
    return;
  }

  const { runMigrations } = await import('stripe-replit-sync');
  await runMigrations({ databaseUrl });

  const { rows: [{ exists }] } = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass('stripe.accounts') IS NOT NULL AS exists`,
  );
  if (!exists) {
    throw new Error('stripe-replit-sync migrations completed without stripe.accounts');
  }

  const stripeSync = await getStripeSync();
  const webhookBase = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
  await stripeSync.findOrCreateManagedWebhook(`${webhookBase}/api/stripe/webhook`);
}
```

**Startup-order repair:** run `runStartupMigrations` to completion first, then begin nonessential workers. StripeSync must remain non-blocking for normal member browsing, but readiness must report its exact unavailable state rather than a false all-green result.

---

## 4. Kinfolk route patch — optional schema gaps must not produce HTTP 500

Apply the following changes in `artifacts/api-server/src/routes/kinfolk.ts`.

### A. Add the helper near other private route utilities

```ts
function pgCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code?: unknown }).code ?? '') || undefined
    : undefined;
}

function isOptionalSchemaGap(err: unknown): boolean {
  const code = pgCode(err);
  return code === '42P01' ||        // undefined_table
    code === '42703' ||             // undefined_column
    code === '3F000' ||             // invalid_schema_name
    /relation .* does not exist|column .* does not exist/i.test(
      err instanceof Error ? err.message : String(err),
    );
}

async function optionalKinfolk<T>(
  stage: string,
  fallback: T,
  work: () => Promise<T>,
): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (isOptionalSchemaGap(err)) {
      logger.warn(
        { stage, pgCode: pgCode(err) },
        'Kinfolk optional enrichment unavailable; continuing without it',
      );
      return fallback;
    }
    throw err;
  }
}
```

### B. Make cultural phrases optional

**Replace:**

```ts
const culturalPhrases = await getCachedCulturalPhrases();
```

**With:**

```ts
const culturalPhrases = await optionalKinfolk(
  'cultural_phrases',
  [] as Array<{ group_name: string; phrase: string; english_gloss: string }>,
  () => getCachedCulturalPhrases(),
);
```

### C. Make session-memory reads and writes optional as a pair

**Replace the current session-read block** with:

```ts
let currentSession: typeof kinfolkSessionsTable.$inferSelect | null = null;
let sessionPersistenceAvailable = true;

if (sessionId && req.user?.id) {
  try {
    const [session] = await db
      .select()
      .from(kinfolkSessionsTable)
      .where(and(
        eq(kinfolkSessionsTable.id, sessionId),
        eq(kinfolkSessionsTable.userId, req.user.id),
      ))
      .limit(1);
    currentSession = session ?? null;
  } catch (err) {
    if (!isOptionalSchemaGap(err)) throw err;
    sessionPersistenceAvailable = false;
    logger.warn(
      { stage: 'session_read', pgCode: pgCode(err) },
      'Kinfolk memory unavailable; answering without saved session',
    );
  }
}
```

**Then change the later session-save guard from:**

```ts
if (req.user?.id && memoryEnabled) {
```

**to:**

```ts
if (req.user?.id && memoryEnabled && sessionPersistenceAvailable) {
```

And wrap that session insert/update itself:

```ts
try {
  // existing currentSession update OR new session insert block, unchanged
} catch (err) {
  if (!isOptionalSchemaGap(err)) throw err;
  logger.warn(
    { stage: 'session_write', pgCode: pgCode(err) },
    'Kinfolk answered successfully but could not save optional session memory',
  );
  finalSessionId = undefined;
}
```

### D. Do not disguise unexpected application/provider errors as the same 500

Keep genuine unexpected errors observable, but include a sanitized stage identifier in the server log and return retriable status classes correctly:

```ts
let chatStage = 'user_lookup';
try {
  // Before every mandatory boundary, set chatStage, for example:
  // chatStage = 'context_resolution';
  // chatStage = 'prompt_build';
  // chatStage = 'provider_call';
  // chatStage = 'session_persist';
} catch (err) {
  logger.error(
    {
      chatStage,
      pgCode: pgCode(err),
      errName: err instanceof Error ? err.name : typeof err,
      errMessage: err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300),
      stack: err instanceof Error ? err.stack?.slice(0, 600) : undefined,
    },
    'kinfolk-chat-error',
  );

  // Keep the existing timeout/queue/provider-429 classifications below.
}
```

This patch is intentionally narrow: missing optional table/column/schema errors become a degraded-but-useful Kinfolk reply, while unexpected errors still surface with enough diagnostics to be fixed.

---

## 5. Required proof package after deployment

1. `GET /api/version` shows fresh SHA and `stale_bundle:false`.
2. Startup logs contain no `stripe.accounts does not exist` and no failed `kinfolk_cultural_documents` migration entries.
3. `POST /api/kinfolk/chat` returns HTTP 200 for `What is 2 plus 2?` with both a normal tester and an `is_load_test=true` account.
4. Temporarily simulate an optional-table absence only in a controlled local/staging test; assert HTTP 200 with a reply and the `optional enrichment unavailable` warning—not 500.
5. Re-run the staged 1 → 5 → 15 → 30 canary only after the one-user chat smoke test passes.
