# Isolated-Staging Kinfolk Migration Runner

This runbook applies only to the existing isolated Railway project `mwm-kinfolk-memory-stage`. It is a one-off local command run with Railway service variables injected through the Railway CLI. It is **not** an API endpoint, startup hook, scheduled job, persistent database tool, or general migration framework.

The runner has one hard-coded inventory of eleven October 14 migration files and their SHA-256 hashes. It rejects any other filename, checksum, SQL input, target, altered source lineage, missing encryption configuration, missing prerequisite, conflicting guard trigger, history mismatch, or unrecorded partial state.

## Preconditions for a separately authorized execution

1. The founder has authorized the live isolated-staging execution after reviewing the runner commit and receipt.
2. The checkout is clean and the runner source has `49b7dfbbe454a8f7058be429da938d1c24ed2e0a` as an ancestor. The only files changed since that source base must be the runner, its test, and this runbook.
3. Railway CLI is available and authenticated with the existing authorized Railway account. Railway documents that `railway run` injects the selected service's variables into a local command, while its `--project`, `--environment`, and `--service` flags target a particular service. The runner independently verifies the resulting Railway project, environment, service, repository, and branch identifiers before it opens a database connection.
4. The service provides `DATABASE_URL` and the existing sensitive-memory encryption key identifiers. No value is printed.

## Dry run first

The only permitted dry-run command has no execution switch. It opens a read-only transaction to inspect the fixed prerequisites, approved-migration ledger rows, named postconditions, and canonical guard triggers. It prints only migration filenames, fixed hashes, and pending/recorded state.

```bash
railway run \
  --project 37ed0a9d-a280-43d5-b6ca-885f237b84ea \
  --environment 62bca1b8-7187-4e16-9c9b-f8885ec7de50 \
  --service 7c02d801-6273-4e77-aea3-1db8bd86be18 \
  --no-local \
  pnpm --dir artifacts/api-server exec tsx \
  src/scripts/isolatedStagingKinfolkMigrationRunner.ts
```

The command must stop on any nonzero result. It must not be retried after a partial or unexpected state without a new review.

## Apply command — separate founder authorization required

Only after a successful dry run and a separate approval may the fixed execution switch be supplied:

```bash
railway run \
  --project 37ed0a9d-a280-43d5-b6ca-885f237b84ea \
  --environment 62bca1b8-7187-4e16-9c9b-f8885ec7de50 \
  --service 7c02d801-6273-4e77-aea3-1db8bd86be18 \
  --no-local \
  pnpm --dir artifacts/api-server exec tsx \
  src/scripts/isolatedStagingKinfolkMigrationRunner.ts \
  --apply-authorized-isolated-staging-20261014
```

For each pending approved file, the runner strips only that file's outer transaction wrapper, executes the unchanged verified SQL inside one new transaction, writes the exact filename and SHA-256 receipt to the existing `schema_migrations` ledger, and commits. A failure rolls back the current migration. Previously recorded migrations are never rerun: their hash and named postconditions must match before they are treated as recorded.

No step in this runbook authorizes a deployment, source push, service configuration change, provider activation, migration execution, fixture creation, production access, or mobile action.

## References

- [Railway CLI `run`](https://docs.railway.com/cli/run)
- [Railway CLI `link`](https://docs.railway.com/cli/link)
- [Railway-provided variables](https://docs.railway.com/variables/reference)
