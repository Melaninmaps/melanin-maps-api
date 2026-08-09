---
name: Deploy verification standard — MANDATORY after every web deploy
description: Exact steps required before declaring any web deploy complete. Failure to follow these caused the Safari EventEmitter crash to ship undetected.
---

# Deploy verification standard — MANDATORY after every web deploy

**Why:** Chrome passes where Safari fails. A bundle change that looks clean in logs can still be broken in production for a significant user segment. "Railway picked up the SHA" is NOT the same as "users can load the page."

## Required checks — in order

### 1. Confirm correct bundle is served
```bash
curl -s "https://www.mappingwithmelanin.com/" | grep -o 'assets/index-[^"]*'
```
Expected: the NEW bundle hash. If the old hash appears, production is still on the old build — stop and investigate.

### 2. Confirm zero errors on the NEW bundle
```bash
curl -s "https://www.mappingwithmelanin.com/__errors" | python3 -c "
import sys,json; d=json.load(sys.stdin)
errs = d['errors']
print(f'total: {d[\"count\"]}')
for e in errs: print(e['ts'], e['ua'][:40], e['body'][:100])
"
```
Wait at least 5 minutes after the new bundle goes live before checking, to allow organic traffic to generate errors if they exist. Zero errors on the new bundle hash = clean.

### 3. Confirm stale_bundle: false
```bash
curl -s "https://www.mappingwithmelanin.com/api/version" | python3 -m json.tool
```
`stale_bundle: false` means the running binary's SHA matches what was committed — confirming the correct build is live.

### 4. Cross-browser mental check
Before every deploy that touches the web bundle, ask: "Does anything in this bundle rely on Node globals (EventEmitter, Buffer, process, global, stream, etc.)?" If yes — the fix must be removing the dependency, not patching globals. Browser polyfills mask issues on Chrome but fail on Safari/Firefox at module evaluation time.

## Declare "done" ONLY when all 4 pass.

Never declare complete when:
- /__errors has unresolved errors from the current or a previous bundle
- The served bundle hash doesn't match the expected new hash
- stale_bundle is true (means Railway is running a cached or old binary)
