---
name: Correct build + deploy sequence
description: The exact steps required to ship source changes to Railway without leaving the dist one commit behind — and why stale_bundle is always structurally true.
---

## The Rule

**Every shipping sequence is TWO commits, not one.**

### Step-by-step

```
# 1. Make ALL source changes to files (do not commit yet)

# 2. Build the bundle — HEAD at this moment becomes built_from_sha
cd artifacts/api-server && pnpm run build

# 3. Copy bundle to root dist/ (Railway runs dist/index.mjs at root, not artifacts/api-server/dist/)
cd /home/runner/workspace && cp -r artifacts/api-server/dist/* dist/

# 4. Commit EVERYTHING together (source + dist)
git add -A
git commit -m "feat/fix: <description>"
git push github main        ← COMMIT 1 — Railway starts deploying this
```

After Railway picks up Commit 1 and the new binary is live:

```
# 5. Rebuild from the new HEAD (which is now Commit 1's SHA)
cd artifacts/api-server && pnpm run build
#    → BUILD_IDENTITY written: built_from_sha = <Commit 1 SHA>

# 6. Copy again
cd /home/runner/workspace && cp -r artifacts/api-server/dist/* dist/

# 7. Commit dist-only
git add dist/
git commit -m "chore: rebuild dist from HEAD <Commit 1 SHA short>"
git push github main        ← COMMIT 2 — stale_bundle now as close to false as possible
```

## Why stale_bundle Is Always True by One Commit

`build.mjs` embeds `built_from_sha` = the git HEAD SHA **at the moment the build runs**.
That HEAD SHA is the commit BEFORE the one that will include the dist.
So after pushing Commit 1, `railway_sha` = Commit 1, `built_from_sha` = Commit 0 → stale = true.

After Commit 2:
- `railway_sha` = Commit 2
- `built_from_sha` = Commit 1
- `stale_bundle` = true (Commit 2 ≠ Commit 1), BUT **Commit 2 only changes dist/** — all source fixes are in Commit 1's bundle

**There is no way to make stale_bundle = false with this architecture unless the dist is committed separately before the push. The structural lag is one commit by design.**

## The Real Health Signal

Do NOT use `stale_bundle` as a blocking gate. Use this instead:

```
bundle_sha256_self === bundle_sha256
```

This confirms Railway is running the **committed** `dist/index.mjs` (not a stale file from a failed rsync). If these match, the correct binary is running — regardless of `stale_bundle`.

## What the Version Endpoint Shows (Live)

```
GET /api/version
{
  railway_sha:      "c452d871"   ← current HEAD Railway is running
  built_from_sha:   "e9ace8c2"   ← HEAD when pnpm run build was last run
  stale_bundle:     true          ← always true by one commit (structural)
  bundle_sha256:    "651285..."   ← embedded in binary at build time
  bundle_sha256_self: "651285..." ← computed from running file — MUST match above
}
```

## Why This Matters (Root Cause of Pool Exhaustion)

On July 29 2026, pool exhausted repeatedly because:

1. `/api/kinfolk/chat` contained a `Promise.all` firing **5 parallel `pool.query()` calls** (cross-city bridge, kinfolk.ts ~line 1521).
2. With 4 concurrent chat users → 20 connections → entire pool consumed.
3. If any of those 5 queries hung past `statement_timeout` (10 s) and the pg driver didn't cleanly receive the cancellation, the connection was orphaned permanently.
4. The fix (replace Promise.all with single `ILIKE ANY` query + replace 3 twin-rec queries with 1 CTE) was committed as **e9ace8c2** but the dist in that commit was built from **c674b692** (one before). Railway was running the old parallel code.
5. A second "rebuild from HEAD" commit **c452d871** put the fix into the actual running binary.

## Railway Build Cache — Critical Detail

Railway uses Docker layer caching. The `[phases.prebuild]` command in `nixpacks.toml` is the cache-bust key:

```toml
[phases.prebuild]
cmds = ["echo build-ref-<UNIQUE_VALUE> > /tmp/build_ref.txt"]
```

**If this string does not change between pushes, Railway reuses its cached compiled binary and ignores your source changes entirely.** The committed `dist/index.mjs` is also irrelevant in that case — Railway serves its own cached build.

When Railway DOES rebuild from source (nixpacks full build):
- It runs `pnpm --filter @workspace/api-server run build`
- `built_from_sha` in the binary = the SHA of the commit being deployed
- `railway_sha` = same commit SHA
- `stale_bundle` = **FALSE** ← the only way to achieve this

**Rule: Update the build-ref string whenever you push a fix that MUST land in the running binary.** Use a descriptive slug: `build-ref-<short-sha>-<feature-slug>`.

Example: `build-ref-c452d871-pool-kinfolk-fix`

## Checklist Before Every Push

- [ ] All source changes saved to disk
- [ ] `pnpm run build` run AFTER all source changes (not before any of them)
- [ ] `cp -r artifacts/api-server/dist/* dist/` done
- [ ] Both source + dist included in the same git commit
- [ ] After Railway picks up the build: confirm `built_from_sha` in /api/version matches the source commit SHA
- [ ] If `built_from_sha` does NOT match (old dist snuck in), do a second rebuild-only commit immediately
