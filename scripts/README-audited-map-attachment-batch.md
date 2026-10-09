# Audited map-attachment batch runner

`run-audited-map-attachment-batch.mjs` stages or executes a bounded batch of **already-qualified** map-only attachments through the existing guarded administrative route. It never writes directly to PostgreSQL.

## Safety contract

The runner accepts only a versioned JSON manifest with a maximum of 100 immutable business IDs. Every item must contain a freshly read canonical precondition, a first-party physical-address receipt, and an approved-geocoder receipt. It rejects duplicate IDs, protected profile fields, non-HTTPS sources, non-approved geocoder hosts, service-area claims, incomplete geocoder components, and any mismatch between the manifest's stored address and the first-party or geocoder query address.

The live server remains the final authority. It locks the canonical record, checks active documented eligibility, verifies the exact stored address against the receipt, requires the audit schema, writes only map evidence/coordinates/audits, and rejects any duplicate/superseded record or protected-field change. Exact replay is idempotent: a lost success response cannot create duplicate receipts or audit events.

## Required workflow

1. Build the manifest only from immutable-ID source research and a fresh profile snapshot.
2. Run a dry run. This is the default and writes a receipt without network traffic:

   ```bash
   node scripts/run-audited-map-attachment-batch.mjs \
     --manifest /absolute/path/batch.json \
     --receipt /absolute/path/batch-dry-run.json
   ```

3. Attach the dry-run receipt, research receipt hashes, and fixed manifest to the founder approval packet.
4. After explicit approval for that exact manifest, execute a bounded number of entries. The runner requires two matching manifest-specific execution gates and a bearer token. It proceeds **sequentially**, so one guarded hold does not alter or block independent records:

   ```bash
   MAP_ATTACHMENT_API_BASE=https://api.melaninmaps.com \
   MAP_ATTACHMENT_AUTH_BEARER="$ADMIN_TOKEN" \
   MAP_ATTACHMENT_BATCH_EXECUTION=philadelphia-map-batch-001 \
   node scripts/run-audited-map-attachment-batch.mjs \
     --manifest /absolute/path/batch.json \
     --execute \
     --execute-manifest philadelphia-map-batch-001 \
     --max-records 100 \
     --receipt /absolute/path/batch-execution.json
   ```

5. Review the execution receipt. It keeps the immutable expected-before snapshot, per-record server result, receipt IDs, hold/transport errors, and a post-batch public map visibility check. It does not delete or rewrite history; a rollback is a new separately authorized correcting map-only event.

The script is intentionally not a production scheduler and performs no automatic research, publication, ownership change, address text change, eligibility change, lifecycle change, directory write, or Kinfolk change.
