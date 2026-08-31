# Kinfolk Private-Memory Controls

## Runtime control

Kinfolk private memory is fail-closed in production. It is available only when
the process has `KINFOLK_PRIVATE_MEMORY_ENABLED=true` exactly. Any missing,
empty, or other value disables it in production. Development and test retain
their existing enabled behavior.

When disabled, the private-memory GET, POST, and DELETE APIs return
`403 PRIVATE_MEMORY_DISABLED`; Kinfolk does not load private-memory rows into
an AI prompt and does not read or write Kinfolk chat sessions. A user's
settings preference cannot override this runtime control. New effective user
settings also default the Kinfolk-memory preference to false in an unenabled
production process.

## Equivalent database controls

For defense in depth, database operators can revoke the application's
`SELECT`, `INSERT`, `UPDATE`, and `DELETE` privileges on
`kinfolk_private_memories`, or enforce equivalent row-level-security policies
that deny the application role. Do the same for `kinfolk_sessions` when chat
history must be unavailable. Apply, verify, and roll back these controls using
the production database change process; they are not substitutes for the
runtime flag.

## Encryption status

`kinfolk_private_memories.content` is currently plaintext at rest. Do not
enable the feature for production use until application-managed encryption,
key management, and an encrypted-data migration have shipped. Existing
plaintext rows must remain inaccessible (runtime flag off and, where required,
database controls in place) until that work is complete.