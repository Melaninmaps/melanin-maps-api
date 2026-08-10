---
name: Startup guard ANY($N) type-inference bug
description: PostgreSQL "inconsistent types deduced for parameter $N" in startup guards when using ANY($N) with a JS string array alongside other typed parameters.
---

# Startup guard ANY($N) type-inference bug

## The Rule
Never use `WHERE col = ANY($N)` in a pool.query() call that also has other typed parameters ($1, $2, etc.). PostgreSQL's type inference fails when it must resolve the type of a parameter that appears both in SET/comparison clauses AND in an ANY() array context alongside other parameters.

**Why:** PostgreSQL deduces parameter types from context. When $1 = hash (varchar, from `SET password_hash = $1`) and $2 = array (from `ANY($2::text[])`), the presence of `::text[]` on $2 causes PostgreSQL to re-evaluate $1's type inference and fail with "inconsistent types deduced for parameter $1" — even though $1 itself is unambiguous from the column type alone. The exact mechanism is version/query-plan dependent, but the symptom is reproducible.

## How to Apply
Replace bulk `ANY($N)` UPDATE with a per-email loop:

```typescript
// ❌ FAILS — inconsistent types error
await pool.query(
  `UPDATE users SET password_hash=$1, ... WHERE LOWER(email) = ANY($2::text[])`,
  [hash, emailsArray]
);

// ✅ WORKS — per-row loop avoids type ambiguity
for (const email of emails) {
  await pool.query(
    `UPDATE users SET password_hash=$1, ... WHERE LOWER(email) = $2`,
    [hash, email]
  );
}
```

## Known Affected Guards (as of Aug 10 2026)
- `ensureTesterUniversalAccounts` — **FIXED** in commit 548fc238 (per-email loop)
- `ensureLibraryContentActivation_v1` — still broken, Task #225 covers it
- `ensureAfricanGeographyNodes_v1` — still broken, Task #225 covers it
- `ensureAdminAccounts` / `ensureTesterAccounts` — use `ANY($1)` with ONLY ONE parameter → works fine (no type ambiguity with a single-parameter query)

## Key Signal
Boot log: `WARN: [guard name] failed: inconsistent types deduced for parameter $1`
