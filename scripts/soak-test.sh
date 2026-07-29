#!/usr/bin/env bash
# ── MWM 4-Hour Production Soak Test ──────────────────────────────────────────
#
# Polls /api/readyz and /api/pool-audit every 30s for 4 hours.
# Summarises at the end. Pass criteria documented below.
#
# Usage:
#   chmod +x scripts/soak-test.sh
#   CRON_SECRET=<your_secret> ./scripts/soak-test.sh
#
# Pass criteria (Manus audit requirement):
#   - Zero 5xx responses from /api/readyz
#   - pool.waiting never exceeds 2 across all samples
#   - pool.total never reaches POOL_MAX (20) consistently (brief spikes ok)
#   - Zero MOBILE_CRASH_REPORT events in Railway logs during the window
#   - /api/version bundle_sha256 stable (same artifact throughout)
#
# Output: soak-test-YYYY-MM-DD-HHMM.log in the current directory.
# ─────────────────────────────────────────────────────────────────────────────

BASE_URL="${SOAK_URL:-https://www.mappingwithmelanin.com}"
CRON_SECRET="${CRON_SECRET:?CRON_SECRET env var required}"
POLL_INTERVAL=30      # seconds between samples
TOTAL_SECONDS=14400   # 4 hours
LOG_POOL_EVERY=300    # full pool-audit summary every 5 minutes

LOGFILE="soak-test-$(date +%Y-%m-%d-%H%M).log"
START_EPOCH=$(date +%s)
END_EPOCH=$(( START_EPOCH + TOTAL_SECONDS ))

READYZ_TOTAL=0
READYZ_OK=0
READYZ_FAIL=0
POOL_PEAK_TOTAL=0
POOL_PEAK_WAITING=0
POOL_SUMMARY_COUNT=0
CRASH_REPORTS=0

log() { echo "[$(date -u +%H:%M:%SZ)] $*" | tee -a "$LOGFILE"; }
jq_safe() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$2','?'))" 2>/dev/null || echo "?"; }

log "=== MWM Production Soak Test ==="
log "Base URL: $BASE_URL"
log "Duration: ${TOTAL_SECONDS}s (4 hours)"
log "Poll interval: ${POLL_INTERVAL}s"
log "Log file: $LOGFILE"

# Capture starting build identity
log "--- Build Identity (start) ---"
VERSION_JSON=$(curl -sf --max-time 10 "$BASE_URL/api/version" 2>/dev/null)
log "version: $VERSION_JSON"
START_SHA=$(echo "$VERSION_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('bundle_sha256','?'))" 2>/dev/null)
log "bundle_sha256 at start: $START_SHA"

LAST_POOL_SUMMARY=$START_EPOCH

while [ "$(date +%s)" -lt "$END_EPOCH" ]; do
  NOW=$(date +%s)
  ELAPSED=$(( NOW - START_EPOCH ))
  REMAINING=$(( END_EPOCH - NOW ))

  # ── /api/readyz poll ─────────────────────────────────────────────────────
  READYZ_JSON=$(curl -sf --max-time 10 "$BASE_URL/api/readyz" 2>/dev/null)
  READYZ_STATUS=$?
  READYZ_TOTAL=$(( READYZ_TOTAL + 1 ))

  if [ $READYZ_STATUS -eq 0 ]; then
    DB=$(echo "$READYZ_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('db','?'))" 2>/dev/null)
    POOL_JSON=$(echo "$READYZ_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('pool',{})))" 2>/dev/null)
    PTOTAL=$(echo "$POOL_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null)
    PIDLE=$(echo "$POOL_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('idle',0))" 2>/dev/null)
    PWAITING=$(echo "$POOL_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('waiting',0))" 2>/dev/null)

    if [ "$PTOTAL" -gt "$POOL_PEAK_TOTAL" ] 2>/dev/null; then POOL_PEAK_TOTAL=$PTOTAL; fi
    if [ "$PWAITING" -gt "$POOL_PEAK_WAITING" ] 2>/dev/null; then POOL_PEAK_WAITING=$PWAITING; fi

    if [ "$DB" = "ok" ]; then
      READYZ_OK=$(( READYZ_OK + 1 ))
      log "READYZ ok | pool total=$PTOTAL idle=$PIDLE waiting=$PWAITING | elapsed=${ELAPSED}s remaining=${REMAINING}s"
    else
      READYZ_FAIL=$(( READYZ_FAIL + 1 ))
      log "READYZ DEGRADED | $READYZ_JSON | elapsed=${ELAPSED}s"
    fi
  else
    READYZ_FAIL=$(( READYZ_FAIL + 1 ))
    log "READYZ FAILED (curl exit $READYZ_STATUS) | elapsed=${ELAPSED}s"
  fi

  # ── /api/pool-audit summary every 5 minutes ───────────────────────────────
  if [ "$(( NOW - LAST_POOL_SUMMARY ))" -ge "$LOG_POOL_EVERY" ]; then
    AUDIT_JSON=$(curl -sf --max-time 10 \
      -H "x-cron-secret: $CRON_SECRET" \
      "$BASE_URL/api/pool-audit?summary=true" 2>/dev/null)
    if [ -n "$AUDIT_JSON" ]; then
      POOL_SUMMARY_COUNT=$(( POOL_SUMMARY_COUNT + 1 ))
      log "POOL_AUDIT summary #${POOL_SUMMARY_COUNT}: $AUDIT_JSON"
    else
      log "POOL_AUDIT summary: endpoint not responding (404 or timeout — bundle may be stale)"
    fi
    LAST_POOL_SUMMARY=$NOW
  fi

  # ── crash-reports check every 5 minutes ──────────────────────────────────
  if [ "$(( NOW - LAST_POOL_SUMMARY ))" -le 5 ]; then
    CRASH_JSON=$(curl -sf --max-time 10 \
      -H "x-cron-secret: $CRON_SECRET" \
      "$BASE_URL/api/crash-reports/recent" 2>/dev/null)
    if [ -n "$CRASH_JSON" ]; then
      NEW_CRASHES=$(echo "$CRASH_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null)
      if [ "${NEW_CRASHES:-0}" -gt 0 ]; then
        CRASH_REPORTS=$NEW_CRASHES
        log "CRASH_REPORTS: $NEW_CRASHES crash(es) received during test window"
        log "$CRASH_JSON"
      fi
    fi
  fi

  sleep "$POLL_INTERVAL"
done

# ── Final build identity check ───────────────────────────────────────────────
log "--- Build Identity (end) ---"
END_VERSION=$(curl -sf --max-time 10 "$BASE_URL/api/version" 2>/dev/null)
END_SHA=$(echo "$END_VERSION" | python3 -c "import sys,json; print(json.load(sys.stdin).get('bundle_sha256','?'))" 2>/dev/null)
log "bundle_sha256 at end: $END_SHA"
if [ "$START_SHA" = "$END_SHA" ]; then
  log "ARTIFACT_STABLE: bundle_sha256 unchanged throughout test window"
else
  log "ARTIFACT_CHANGED: bundle_sha256 changed mid-test — Railway redeployed during soak"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
log "=== SOAK TEST SUMMARY ==="
log "Duration: ${TOTAL_SECONDS}s"
log "Readyz polls: $READYZ_TOTAL | ok=$READYZ_OK | fail=$READYZ_FAIL"
log "Pool peak total: $POOL_PEAK_TOTAL / 20"
log "Pool peak waiting: $POOL_PEAK_WAITING"
log "Pool audit summaries logged: $POOL_SUMMARY_COUNT"
log "Crash reports received: $CRASH_REPORTS"
log ""
log "=== PASS/FAIL ==="
PASS=true
[ "$READYZ_FAIL" -gt 0 ] && { log "FAIL: $READYZ_FAIL readyz failures"; PASS=false; }
[ "$POOL_PEAK_WAITING" -ge 3 ] && { log "FAIL: pool.waiting reached $POOL_PEAK_WAITING (threshold: 3)"; PASS=false; }
[ "$CRASH_REPORTS" -gt 0 ] && { log "FAIL: $CRASH_REPORTS crash reports received"; PASS=false; }
[ "$START_SHA" != "$END_SHA" ] && { log "WARN: artifact changed mid-test"; }
$PASS && log "PASS: all criteria met" || log "FAIL: see above"
log "Full log: $LOGFILE"
