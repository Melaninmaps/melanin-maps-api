---
name: Build sequence — two-commit rule and stale_bundle fix
description: Railway always uses committed dist; dist is always built one commit behind push. stale_bundle was redefined to use hash match instead of SHA comparison (July 29 2026).
---

## The Two-Commit Pattern (Permanent)

Every deploy requires TWO commits:
1. Source changes committed + dist built from previous HEAD (N-1 SHA in dist)
2. "rebuild from HEAD" commit: source unchanged, dist rebuilt from the N commit

After commit 2, `built_from_sha` in the running binary matches the commit BEFORE the push (N), and `railway_sha` is N+1 (the push commit). This gap is permanent by design.

## stale_bundle Semantics Fix (July 29 2026)

**Original definition:** `stale_bundle = railway_sha !== built_from_sha`
→ This was ALWAYS true by design (N+1 !== N), making it useless as a signal.

**New definition (commit 84daae1d):** `stale_bundle = BUNDLE_SHA256_SELF !== BUILD_BUNDLE_SHA256`
→ This is false whenever the correct binary is running (hash always matches when binary = what was built and committed).
→ Only true if the binary file on disk was swapped after the build.

Result: `stale_bundle: false` now means "correct binary is running" — the real safety signal.

## Real Correctness Gate (Unchanged)

`bundle_sha256_self === bundle_sha256` is the proof that the correct binary is running, regardless of SHA version gap.

**Why:** Railway uses the committed dist/index.mjs directly. Nixpacks build phases may or may not run a fresh compile. The binary hash is the only verifiable proof.

## How to Apply

Before declaring a deploy successful:
1. Check `stale_bundle: false` (binary hash matches)
2. Check `bundle_sha256_self === bundle_sha256`  
3. Check pool stats (total < 5, idle > 0, waiting = 0)

Note: `stale_bundle: true` now means something actually wrong happened (binary file was replaced). It should never appear in normal operations.
