# VIBESNOW Taxonomy Reclassification — Read-Only Dry-Run Status

**Status:** source implementation complete; **authoritative database analysis not executed**.

- **Founder source:** `VIBESNOW.xlsx`
- **Founder source SHA-256:** `5b46a5f9f18a69840a1ca2e164f30f1c11d93f70c1f966c441d7f9e499525d16`
- **Generated source contract:** `lib/constants/src/founder-taxonomy-vibesnow.ts`
- **Read-only analysis command:**

```bash
DATABASE_URL='…' pnpm exec tsx scripts/dry-run-founder-taxonomy-reclassification.ts \
  --out reports/vibesnow-taxonomy-dry-run
```

> This is deliberately **not** a migration or an update script. It opens `BEGIN TRANSACTION READ ONLY`, sets a 30-second query timeout, queries `public.businesses`, rolls back, and writes only local JSON/Markdown artifacts.

## Current execution result

Direct database credentials are not available in this source-only sandbox. No attempt was made to derive, expose, or alter protected database connection values. The available staging public-directory endpoint was checked read-only on 2026-10-15 and returned **0 published businesses**. That endpoint does not expose drafts, private listings, or the complete database, so **zero is not a database count**.

| Required dry-run measure | Authoritative DB result | Staging public-catalog observation |
|---|---:|---:|
| Existing businesses analyzed | Not evaluated | 0 published records returned |
| Businesses requiring reclassification | Not evaluated | Not applicable |
| Confident deterministic remaps | Not evaluated | Not applicable |
| Records requiring human review | Not evaluated | Not applicable |
| Existing values with no safe equivalent | Not evaluated | Not applicable |
| Businesses with VIBES needing correction/removal | Not evaluated | Not applicable |

Run the command above only with explicitly authorized, read-only database access to produce the actual counts and the paired files:

- `reports/vibesnow-taxonomy-dry-run/dry-run-report.md`
- `reports/vibesnow-taxonomy-dry-run/reclassification-proposals.json`

## Classification rules

The dry run is intentionally conservative:

1. Retain an existing record when its stored category/subcategory is already a founder-approved pair.
2. Propose a remap only when a stored subcategory has a single exact founder destination or matches a short, explicit legacy alias list (for example, `Bookstore` → `Shopping & Retail` / `Books & Bookstores`).
3. Do **not** infer a category from prose, a website, social media, tags, review text, ownership, or location. Those fields are exposed only as reviewer evidence indicators.
4. Report a stored VIBE only when it is disallowed by the resulting category policy. The dry run does not remove, rewrite, or invent VIBES.
5. Do not change business IDs, ownership designations, verification status, publication status, reviews, direct quotations, map coordinates, or other user-authored content.

## Authorized follow-up after review

No database changes are authorized by this source work. If a later approved database operation is requested:

1. Use the generated proposal JSON and founder-approved human-review decisions as the only update input.
2. Before each update, write the original `category`, `subcategory`, and `vibes` fields to an immutable run-scoped rollback ledger keyed by business ID.
3. Validate each final category/subcategory pair and VIBE key against the shared founder contract in the same transaction.
4. Update only those three classification fields, by primary key, in an audited transaction.
5. Re-run the dry run and the regression suites before release.
6. Roll back by restoring the ledger values if acceptance checks fail; never delete, recreate, or re-key a business or alter reviews, ownership evidence, or map pins.
