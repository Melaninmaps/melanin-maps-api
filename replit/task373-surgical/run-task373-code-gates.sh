#!/usr/bin/env bash
set -uo pipefail

ROOT="${1:-$PWD}"
MODE="${2:---precommit}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVIDENCE="$ROOT/release-evidence/task373-code-gates-$STAMP"
LOGS="$EVIDENCE/01-code-gates"
SUMMARY="$EVIDENCE/code-gates-summary.csv"

overall=0

record_gate() {
  local id="$1"
  local status="$2"
  local code="$3"
  local log="$4"
  printf '%s,%s,%s,%s\n' "$id" "$status" "$code" "${log#$ROOT/}" >> "$SUMMARY"
  if [[ "$status" != "PASS" ]]; then overall=1; fi
}

run_gate() {
  local id="$1"
  shift
  local log="$LOGS/$id.log"
  echo "\n===== $id =====" | tee "$log"
  set +e
  # Expo config output can contain provider keys. Redact secret-shaped JSON
  # fields before writing or echoing evidence; preserve the wrapped command's
  # exit code via PIPESTATUS[0].
  "$@" 2>&1 | sed -E 's/("(apiKey|googleMapsApiKey|sentryDsn|token|secret|password|privateKey)"[[:space:]]*:[[:space:]]*")[^"]*"/\1[REDACTED]"/g' | tee -a "$log"
  local code=${PIPESTATUS[0]}
  set -e
  if [[ $code -eq 0 ]]; then
    record_gate "$id" PASS 0 "$log"
  else
    record_gate "$id" FAIL "$code" "$log"
  fi
}

if [[ ! -f "$ROOT/pnpm-workspace.yaml" && ! -f "$ROOT/package.json" ]]; then
  echo "TASK373 ERROR: $ROOT is not a workspace root" >&2
  exit 2
fi

cd "$ROOT"

status_before="$(git status --short 2>&1 || true)"

mkdir -p "$LOGS"
printf 'gate,status,exit_code,log\n' > "$SUMMARY"

{
  echo "timestamp=$STAMP"
  echo "mode=$MODE"
  echo "root=$ROOT"
  echo "branch=$(git branch --show-current 2>/dev/null || echo unknown)"
  echo "commit=$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "node=$(node --version 2>/dev/null || echo missing)"
  echo "pnpm=$(pnpm --version 2>/dev/null || echo missing)"
} > "$EVIDENCE/environment.txt"

printf '%s' "$status_before" > "$EVIDENCE/git-status-before.txt"

if [[ "$MODE" == "--release" && -n "$status_before" ]]; then
  echo "Release mode requires a clean committed tree." > "$LOGS/clean-tree.log"
  record_gate clean-tree FAIL 1 "$LOGS/clean-tree.log"
else
  echo "Tree status accepted for mode $MODE." > "$LOGS/clean-tree.log"
  record_gate clean-tree PASS 0 "$LOGS/clean-tree.log"
fi

run_gate surgical-source-contracts node "$SCRIPT_DIR/validate-task373-surgical.mjs" "$ROOT"
run_gate frozen-install pnpm install --frozen-lockfile
if [[ "$MODE" == "--release" ]]; then
  run_gate ios-prebuild pnpm --filter @workspace/mobile run prebuild:ios
  run_gate android-prebuild pnpm --filter @workspace/mobile run prebuild:android
else
  echo "Skipped until a clean committed tree; run again with --release." > "$LOGS/ios-prebuild.log"
  echo "Skipped until a clean committed tree; run again with --release." > "$LOGS/android-prebuild.log"
  printf '%s,%s,%s,%s\n' ios-prebuild BLOCKED 0 "${LOGS#$ROOT/}/ios-prebuild.log" >> "$SUMMARY"
  printf '%s,%s,%s,%s\n' android-prebuild BLOCKED 0 "${LOGS#$ROOT/}/android-prebuild.log" >> "$SUMMARY"
  overall=1
fi
run_gate mobile-audit pnpm --filter @workspace/mobile run audit
run_gate mobile-typecheck pnpm --filter @workspace/mobile run typecheck
run_gate mobile-lint pnpm --filter @workspace/mobile run lint
run_gate mobile-tests pnpm --filter @workspace/mobile test
run_gate workspace-typecheck pnpm -r --if-present run typecheck
run_gate workspace-lint pnpm -r --if-present run lint
run_gate workspace-tests pnpm -r --if-present test
run_gate workspace-builds env PORT=3000 BASE_PATH=/ METRO_PORT=8082 pnpm -r --if-present run build
run_gate expo-doctor pnpm --filter @workspace/mobile exec expo-doctor
run_gate expo-config pnpm --filter @workspace/mobile exec expo config --json

pnpm --filter @workspace/mobile why eslint > "$LOGS/why-eslint.log" 2>&1 || true
pnpm --filter @workspace/mobile why eslint-config-expo > "$LOGS/why-eslint-config-expo.log" 2>&1 || true
pnpm --filter @workspace/mobile why zod > "$LOGS/why-zod.log" 2>&1 || true

git status --short > "$EVIDENCE/git-status-after.txt" 2>&1 || true

cat > "$EVIDENCE/GO_NO_GO.md" <<EOF
# Task #373 Code-Gate Decision

**Generated:** $STAMP  
**Mode:** $MODE  
**Commit:** $(git rev-parse HEAD 2>/dev/null || echo unknown)

## Decision

**$(if [[ $overall -eq 0 ]]; then echo GO_FOR_SIGNED_BUILD_AND_DEVICE_TESTING; else echo NO_GO; fi)**

The detailed code-gate results are in \`code-gates-summary.csv\`; full unfiltered logs are in \`01-code-gates/\`.

## Gates not satisfied by code checks

The overall store release remains **NO-GO** until signed artifact identity, TestFlight/Google internal installation, physical iOS and Android device matrices, image/video persistence after relaunch, native crash diagnostics, reviewer access, UGC controls, account deletion, store declarations, and Google pre-launch evidence are attached and independently verified.
EOF

(
  cd "$(dirname "$EVIDENCE")"
  zip -qr "$(basename "$EVIDENCE").zip" "$(basename "$EVIDENCE")"
)

echo "TASK373 evidence: $EVIDENCE"
echo "TASK373 summary: $SUMMARY"
if [[ $overall -eq 0 ]]; then
  echo "TASK373 code gates passed; proceed to signed candidates and native device evidence."
  exit 0
fi

echo "TASK373 remains NO-GO. Fix every FAIL/BLOCKED row and rerun."
exit 1
