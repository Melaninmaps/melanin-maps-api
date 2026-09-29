#!/usr/bin/env bash
# Historical release dispatcher retained only to protect old instructions.
#
# It can prepare or verify a source candidate, but it cannot request native
# builds, submit artifacts, or promote a store release. Native actions are
# permitted only after a validated release-evidence chain reaches
# INTEGRATION_TESTED for the exact immutable source SHA.

set -euo pipefail

MODE="${1:-}"
case "$MODE" in
  prepare|verify|build) ;;
  *)
    printf '%s\n' 'Usage: RELEASE_SHA=<full Git SHA> bash scripts/replit-release-115-85.sh prepare|verify|build' >&2
    exit 64
    ;;
esac

: "${RELEASE_SHA:?Set RELEASE_SHA to the exact full Git SHA.}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
  printf 'RELEASE_DISPATCH_BLOCKED: %s\n' "$*" >&2
  exit 1
}

require_exact_clean_source() {
  git fetch origin --prune
  local head main
  head="$(git rev-parse HEAD)"
  main="$(git rev-parse origin/main)"
  [ "$head" = "$RELEASE_SHA" ] || fail "HEAD $head does not equal RELEASE_SHA $RELEASE_SHA"
  [ "$main" = "$RELEASE_SHA" ] || fail "origin/main $main does not equal RELEASE_SHA $RELEASE_SHA"
  [ -z "$(git status --porcelain)" ] || fail "release checkout is dirty; commit reviewed source/static assets first"
}

case "$MODE" in
  prepare)
    require_exact_clean_source
    RELEASE_SHA="$RELEASE_SHA" bash scripts/run-build-115-85-requirements-gate.sh --prepare-static
    printf '%s\n' 'SOURCE_PREPARE_PASS: review and commit only the synchronized static artifact diff. This is CODED/AUTOMATED_TESTED preparation, not a native build request.'
    ;;
  verify)
    require_exact_clean_source
    RELEASE_SHA="$RELEASE_SHA" bash scripts/run-build-115-85-requirements-gate.sh --verify-final
    printf 'SOURCE_VERIFY_PASS: exact_sha=%s. Record validated automated evidence with scripts/release-state.mjs before any isolated integration test.\n' "$RELEASE_SHA"
    ;;
  build)
    printf '%s\n' 'RELEASE_DISPATCH_BLOCKED: Direct EAS build requests are retired. Validate an immutable release-evidence chain through INTEGRATION_TESTED first; a separately approved dispatcher must then record returned EAS artifact evidence before any device stage.' >&2
    exit 64
    ;;
esac
