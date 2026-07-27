---
name: pool.query over db.execute for raw SQL
description: Drizzle db.execute(sql`...`) can silently fail in the esbuild bundle; use pool.query(text, params) for reliable raw SQL
---

## The rule
For raw parameterized SQL in `artifacts/api-server`, use `pool.query(sqlString, [params])` directly rather than `db.execute(sql`...`)`.

## Why
`db.execute(sql`...`)` with Drizzle ORM's `sql` template tag failed silently inside the esbuild bundle when called in async request handlers — the function's catch block ran but pino-pretty swallowed the error log, creating the appearance that the function was never called. `pool.query()` uses the native `pg` driver interface which is proven to work (same mechanism as `executeSql` in the sandbox).

## How to apply
- Import `pool` from `@workspace/db` alongside `db`.
- Write: `await pool.query<{ col: string }>('SELECT ... WHERE x = $1', [value])`
- Result shape: `{ rows: Row[], rowCount: number }` — access data via `result.rows[0]?.col`.
- Use `pool.query` for any INSERT/UPDATE/SELECT that you need to run as raw SQL. Drizzle ORM query builder (`.select()`, `.insert()`, etc.) still works fine for standard CRUD.
