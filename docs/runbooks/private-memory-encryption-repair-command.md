# Private-memory encryption: source-only authorization command

**Copyable user prompt—not an executable production script:**

```text
Authorize a bounded SOURCE-ONLY Kinfolk private-memory encryption repair in
/home/ubuntu/work/mwm-kinfolk-memory-repair-20261010 on
staging/kinfolk-full-candidate-20261014. Verify branch, HEAD/parent and a clean
working tree first; do not reset or overwrite unexpected work.

Encrypt all new ordinary private-memory writes and explicit owner corrections,
including preferred names, using the existing AES-256-GCM server-key architecture.
Store only a nonsecret placeholder, generic ciphertext/key ID and an internal
owner-bound keyed duplicate token. Preserve sensitive-vault reauthentication,
consent, owner scoping, relevance, correction, pause, revoke/delete, and standalone
Map/Directory/Cultural Journey/Living Library no-memory boundaries. Do not alter
the completed Cultural Journey implementation or the founder completion register.

Legacy plaintext may be read only in authorized owner/Kinfolk paths and must not
be rewritten on read or duplicate detection. Only explicit owner correction may
convert a legacy row here. No automatic/bulk conversion. Decryption failure must
omit prompt content, return a recoverable owner error and leave existing content
unchanged, with no plaintext fallback or logging.

Authorize only source/schema-migration-code edits and focused synthetic tests plus
API no-emit source typecheck via scripts/validate-private-memory-encryption.sh.
Check diff hygiene and >=10 GiB free storage. Commit a traceable source-only change
only after this gate passes. Report exact commit/parent, files, tests/typecheck,
legacy behavior and remaining gates. Do not claim staging/runtime acceptance.

FORBIDDEN: deploy, push, app/server startup, config or secret changes, dependency
upgrades, migration/schema execution, DB clients or real member/data access,
mobile tests, unrelated suites, and automatic/bulk legacy migration. Migration
SOURCE CODE is permitted; executing it requires separate written authorization.
```

## Repair contract and separately authorized gates

- **New ordinary storage:** `content` is `[Encrypted private memory]`; `encrypted_content` and `encryption_key_id` hold AES-256-GCM output. Authenticated context binds ordinary ciphertext to its owner and purpose. `content_fingerprint` is a domain-separated HMAC equality token, never a plaintext hash or client-visible field. Sensitive vault columns/consent/reauth remain the legacy-compatible representation.
- **Authorized reads only:** owner settings and transient Kinfolk selection decrypt ordinary content. An unavailable key or integrity failure never falls back to `content`. Direct owner operations receive `PRIVATE_MEMORY_SECURE_ACCESS_REQUIRED` with `recoverable: true`; validation happens before an existing ordinary edit/pause mutation. Revoke/delete remain possible without opening content. No private-content logging is added.
- **Legacy is not fully converted at rest:** rows with no generic representation remain readable in existing authorized paths. Read/duplicate/lifecycle operations never backfill them; an explicit content correction (including a preferred-name re-save) writes encrypted form. **Untouched legacy plaintext requires a separately authorized, controlled at-rest conversion. This repair implements no automatic or bulk migration.**
- **Source migration only:** the additive `kinfolk_private_memories_ordinary_encryption_v5` migration adds nullable fields and an insert/content-change guard. It preserves legacy metadata-only lifecycle changes and sensitive-vault storage. The existing startup schema gate is aligned with it; starting the API would execute DDL and is therefore outside this authorization. PostgreSQL execution/acceptance is not proved by source assertions.
- **Key gate:** no secret was provisioned or changed. The existing `KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY` (32 bytes, base64) and its key ID must be securely available before ordinary writes can succeed. The current architecture resolves one active key ID. Key rotation/removal, old-key availability and duplicate-token continuity require a separately reviewed keyring plan; do not silently rotate keys or rewrite records here.
- **Rollback gate:** the pre-repair application source cannot decrypt a newly encrypted ordinary row and would treat its nonsecret placeholder as ordinary content. Therefore, after the first encrypted ordinary write, rolling back only the application code to a pre-repair build is **not a safe recovery action**. A release plan must require a no-overlap cutover, verified key availability, and either (a) rollback only before any encrypted ordinary write or (b) a separately reviewed compatible roll-forward recovery. Never restore plaintext merely to make an older binary work. This is an operational release constraint, not permission to deploy.
- **Validation gate:** focused handler tests use disposable in-memory adapters and synthetic process-local keys, never app startup or a DB. The SAFE script checks current API/dependency source with in-memory no-emit compiler options because tracked generated DB declarations can lag schema edits; it creates no compiler configuration file and does not regenerate or commit build outputs. Passing this gate is **source evidence only**, not migration, deployed API, staging, browser, native or device acceptance.
- **Release gate:** deployment, configuration/key provisioning, schema execution, controlled legacy conversion and runtime acceptance each require separate authorization and evidence.
