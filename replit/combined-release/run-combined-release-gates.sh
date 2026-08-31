#!/usr/bin/env bash
set -uo pipefail

MODE="${1:---precommit}"
if [[ "$MODE" != "--precommit" && "$MODE" != "--release" ]]; then
  echo "Usage: $0 [--precommit|--release]" >&2
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT" ]]; then
  echo "Run this inside the repository." >&2
  exit 2
fi
cd "$ROOT"
INITIAL_DIRTY="$(git status --porcelain)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVIDENCE="$ROOT/release-evidence/combined-release-$STAMP"
mkdir -p "$EVIDENCE/logs"

run_gate() {
  local name="$1"; shift
  echo "===== $name ====="
  set +e
  "$@" > >(tee "$EVIDENCE/logs/$name.log") 2>&1
  local status=$?
  set -e
  printf '%s\t%s\n' "$name" "$status" >> "$EVIDENCE/status.tsv"
  return 0
}

: > "$EVIDENCE/status.tsv"
printf 'mode\t%s\nbranch\t%s\ncommit\t%s\ndirty\t%s\n' \
  "$MODE" "$(git branch --show-current)" "$(git rev-parse HEAD)" "$(test -n "$INITIAL_DIRTY" && echo yes || echo no)" \
  > "$EVIDENCE/identity.tsv"

run_gate 01_diff_check git diff --check
run_gate 02_source_contracts node replit/combined-release/validate-combined-release.mjs
run_gate 03_frozen_install pnpm install --frozen-lockfile
run_gate 04_shared_types env NODE_OPTIONS=--max-old-space-size=4096 pnpm exec tsc --build --force
run_gate 05_api_typecheck env NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter @workspace/api-server typecheck
run_gate 06_web_typecheck env NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter @workspace/web typecheck
run_gate 07_mobile_typecheck env NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter @workspace/mobile typecheck
run_gate 08_mobile_lint pnpm --filter @workspace/mobile lint
run_gate 09_mobile_tests pnpm --filter @workspace/mobile test
run_gate 10_api_tests pnpm --filter @workspace/api-server test
run_gate 11_web_build pnpm --filter @workspace/web build
run_gate 12_api_build pnpm --filter @workspace/api-server build
run_gate 13_expo_doctor bash -lc 'cd artifacts/mobile && pnpm exec expo-doctor'
run_gate 14_expo_config bash -lc 'cd artifacts/mobile && pnpm exec expo config --type public --json'

if [[ "$MODE" == "--release" ]]; then
  run_gate 15_clean_tree test -z "$INITIAL_DIRTY"
  run_gate 16_ios_prebuild pnpm --filter @workspace/mobile prebuild:ios
  run_gate 17_android_prebuild pnpm --filter @workspace/mobile prebuild:android
fi

FAILURES=$(awk -F '\t' '$2 != 0 {count++} END {print count+0}' "$EVIDENCE/status.tsv")
{
  echo "# Combined Release Gate"
  echo
  echo "**Mode:** $MODE"
  echo
  echo "**Commit:** \`$(git rev-parse HEAD)\`"
  echo
  echo "**Result:** $([[ "$FAILURES" -eq 0 ]] && echo PASS || echo NO-GO)"
  echo
  echo "| Gate | Exit status |"
  echo "|---|---:|"
  awk -F '\t' '{printf "| %s | %s |\n", $1, $2}' "$EVIDENCE/status.tsv"
  echo
  echo "Database-backed API tests require the intended non-production or approved release-test DATABASE_URL. Missing database configuration is a BLOCKED gate, not a pass."
} > "$EVIDENCE/GO_NO_GO.md"

tar -czf "$ROOT/release-evidence/combined-release-$STAMP.tgz" -C "$ROOT/release-evidence" "combined-release-$STAMP"
sha256sum "$ROOT/release-evidence/combined-release-$STAMP.tgz" > "$ROOT/release-evidence/combined-release-$STAMP.tgz.sha256"
echo "Evidence: $EVIDENCE"
echo "Failures: $FAILURES"
[[ "$FAILURES" -eq 0 ]]
