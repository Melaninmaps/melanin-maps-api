#!/usr/bin/env bash
# Isolated-staging authenticated Kinfolk memory workflow.
#
# This verifier refuses arbitrary targets and creates only a staging-fixture
# account that the dedicated fixture service removes in its EXIT cleanup. It
# prints decision metadata only—never prompts, replies, tokens, memory IDs,
# account identifiers, or provider output.
set -euo pipefail

base="${KINFOLK_STAGING_BASE:?set KINFOLK_STAGING_BASE}"
fixture_base="${KINFOLK_STAGING_FIXTURE_BASE:?set KINFOLK_STAGING_FIXTURE_BASE}"
expected_base="https://kinfolk-memory-api-staging-staging.up.railway.app"
expected_fixture_base="https://kinfolk-memory-validation-seed-staging.up.railway.app"

if [[ "$base" != "$expected_base" || "$fixture_base" != "$expected_fixture_base" ]]; then
  echo "This verifier is limited to the declared isolated Kinfolk staging services." >&2
  exit 2
fi

run_id="${KINFOLK_STAGING_RUN_ID:-$(date +%s)-$RANDOM}"
email="kinfolk-safety-contact-memory-${run_id//[^a-zA-Z0-9-]/-}@example.test"
password="FixtureMemory-${run_id//[^a-zA-Z0-9]/}-Validation"
username="kinfolkmemory${run_id//[^a-zA-Z0-9]/}"
work="$(mktemp -d)"
token=""
baseline_memory_ids="$work/baseline-memory-ids.txt"
cleanup_safe=false
fixture_prepared=false
fixture_member_registered=false

request() {
  local method="$1" path="$2" bearer="$3" data="$4" output="$5"
  local -a args=(-sS -X "$method" "$base$path" -H 'Content-Type: application/json' -o "$output" -w '%{http_code}')
  if [[ -n "$bearer" ]]; then args+=(-H "Authorization: Bearer $bearer"); fi
  if [[ -n "$data" ]]; then args+=(--data "$data"); fi
  curl "${args[@]}"
}

fixture_request() {
  local method="$1" path="$2" data="$3" output="$4"
  local -a args=(
    -sS -X "$method" "$fixture_base$path"
    -H 'Content-Type: application/json'
    -H 'x-kinfolk-staging-fixture: enable'
    -o "$output" -w '%{http_code}'
  )
  if [[ -n "$data" ]]; then args+=(--data "$data"); fi
  curl "${args[@]}"
}

require_status() {
  local actual="$1" expected="$2" label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "${label}: expected HTTP ${expected}; received ${actual}." >&2
    exit 1
  fi
}

assert_json() { python3 - "$1" "$2" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
expression = sys.argv[2]
if not eval(expression, {'__builtins__': {'len': len}}, {'d': data}):
    raise SystemExit(f"sanitized assertion failed: {expression}")
PY
}

cleanup() {
  local cleanup_failure=0
  set +e

  if [[ -n "${token:-}" && "$cleanup_safe" == "true" ]]; then
    cleanup_list="$work/cleanup-memories.json"
    status=$(request GET /api/kinfolk/memories "$token" "" "$cleanup_list")
    if [[ "$status" == "200" ]]; then
      cleanup_ids="$work/cleanup-memory-ids.txt"
      python3 - "$cleanup_list" "$baseline_memory_ids" > "$cleanup_ids" <<'PY'
import json,sys
baseline=set(open(sys.argv[2]).read().splitlines())
for memory in json.load(open(sys.argv[1])).get("memories", []):
    value=memory.get("id")
    if isinstance(value, str) and value and value not in baseline:
        print(value)
PY
      while IFS= read -r id; do
        request DELETE "/api/kinfolk/memories/$id" "$token" "" "$work/cleanup-$id.json" >/dev/null || cleanup_failure=1
      done < "$cleanup_ids"
      printf 'sanitized_cleanup_new_memories=%s\n' "$(wc -l < "$cleanup_ids")"
    else
      cleanup_failure=1
    fi
  fi

  if [[ "$fixture_prepared" == "true" ]]; then
    fixture_cleanup="$work/fixture-cleanup.json"
    status=$(fixture_request POST /fixture/cleanup-safety-contact "$(python3 - "$email" <<'PY'
import json,sys
print(json.dumps({'email': sys.argv[1]}))
PY
)" "$fixture_cleanup")
    if [[ "$status" != "200" ]]; then
      cleanup_failure=1
    elif [[ "$fixture_member_registered" == "true" ]]; then
      python3 - "$fixture_cleanup" <<'PY' || cleanup_failure=1
import json,sys
result=json.load(open(sys.argv[1]))
if result.get('ok') is not True or result.get('accountRemoved') is not True:
    raise SystemExit(1)
PY
    else
      python3 - "$fixture_cleanup" <<'PY' || cleanup_failure=1
import json,sys
if json.load(open(sys.argv[1])).get('ok') is not True:
    raise SystemExit(1)
PY
    fi
    if [[ "$cleanup_failure" == "0" ]]; then
      printf 'fixture_account_cleanup=passed\n'
    fi
  fi

  rm -rf "$work"
  return "$cleanup_failure"
}
trap 'initial_status=$?; cleanup; cleanup_status=$?; if [[ "$cleanup_status" != "0" ]]; then exit "$cleanup_status"; fi; exit "$initial_status"' EXIT

# The fixture service authorizes exactly one disposable staging address and
# later deletes that address, its sessions, and fixture-linked records.
fixture_allow="$work/fixture-allow.json"
status=$(fixture_request POST /fixture/allow-safety-contact "$(python3 - "$email" <<'PY'
import json,sys
print(json.dumps({'email': sys.argv[1]}))
PY
)" "$fixture_allow")
require_status "$status" 200 "fixture allowlist"
assert_json "$fixture_allow" "d.get('ok') is True and d.get('scope') == 'isolated_staging_only'"
fixture_prepared=true

# Register through the real application authorization flow. A collision is a
# hard failure, not an invitation to reuse an account of unknown provenance.
register="$work/register.json"
status=$(request POST /api/auth/register "" "$(python3 - <<PY
import json
print(json.dumps({
  'firstName':'Kinfolk', 'lastName':'Validation', 'email':'$email',
  'password':'$password', 'username':'$username',
  'dateOfBirth':'1990-01-01', 'agreeToTerms':True
}))
PY
)" "$register")
require_status "$status" 201 "disposable staging registration"
token=$(python3 - "$register" <<'PY'
import json,sys
value=json.load(open(sys.argv[1])).get('token')
if not isinstance(value, str) or not value:
    raise SystemExit('registration did not return a usable staging session')
print(value)
PY
)
fixture_member_registered=true

# Preserve only the starting memory IDs and delete only records from this run.
: > "$baseline_memory_ids"
baseline="$work/baseline-memories.json"
status=$(request GET /api/kinfolk/memories "$token" "" "$baseline")
require_status "$status" 200 "memory baseline"
python3 - "$baseline" > "$baseline_memory_ids" <<'PY'
import json,sys
for memory in json.load(open(sys.argv[1])).get("memories", []):
    value=memory.get("id")
    if isinstance(value, str) and value:
        print(value)
PY
cleanup_safe=true

# Explicit ordinary preference -> selected consent -> later relevant recall.
plan="$work/plan.json"
message="Remember that I prefer affordable vegan restaurants with quiet seating and wheelchair access. Validation marker $run_id."
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-a','message':'''$message'''}))
PY
)" "$plan")
require_status "$status" 200 "memory consent plan"
assert_json "$plan" "d.get('memoryConsentPlan') is not None and len(d['memoryConsentPlan'].get('ordinary', [])) > 0"
selected=$(python3 - "$plan" <<'PY'
import json,sys
plan=json.load(open(sys.argv[1]))['memoryConsentPlan']
print(json.dumps([item['id'] for item in plan.get('ordinary', [])]))
PY
)

consent="$work/consent.json"
status=$(request POST /api/kinfolk/memory-consent "$token" "$(python3 - <<PY
import json
print(json.dumps({'consent':True,'message':'''$message''','selectedIds':json.loads('''$selected'''),'sessionId':'staging-memory-$run_id-a'}))
PY
)" "$consent")
require_status "$status" 201 "memory consent save"
assert_json "$consent" "d.get('saved',0) >= 1 and d.get('enabled') is True"

recall="$work/recall.json"
relevant_message="Write a friendly dinner invitation for a vegan-friendly, wheelchair-accessible gathering with quiet seating."
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-b','message':'''$relevant_message'''}))
PY
)" "$recall")
require_status "$status" 200 "relevant cross-conversation recall"
assert_json "$recall" "(d.get('memoryUse') or {}).get('applied') is True"

# An empty governed catalog and an unrelated prompt must not claim memory use.
governed_empty="$work/governed-empty.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-governed-empty','message':'Find a Black-owned vegan restaurant in Philadelphia.'}))
PY
)" "$governed_empty")
require_status "$status" 200 "empty governed discovery"
assert_json "$governed_empty" "not (d.get('memoryUse') or {}).get('applied',False)"

unrelated="$work/unrelated.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-c','message':'How do I organize family photos this weekend?'}))
PY
)" "$unrelated")
require_status "$status" 200 "unrelated request"
assert_json "$unrelated" "not (d.get('memoryUse') or {}).get('applied',False)"

# Pause and revoke remove the preference immediately.
memories="$work/memories.json"
status=$(request GET /api/kinfolk/memories "$token" "" "$memories")
require_status "$status" 200 "memory review"
memory_ids="$work/this-run-memory-ids.txt"
python3 - "$memories" "$baseline_memory_ids" > "$memory_ids" <<'PY'
import json,sys
baseline=set(open(sys.argv[2]).read().splitlines())
created=[]
for memory in json.load(open(sys.argv[1])).get("memories", []):
    value=memory.get("id")
    if isinstance(value, str) and value and value not in baseline:
        created.append(value)
if not created:
    raise SystemExit("this run did not produce any reviewable memory records")
print("\n".join(created))
PY
memory_count=$(wc -l < "$memory_ids")

while IFS= read -r memory_id; do
  pause="$work/pause-$memory_id.json"
  status=$(request PATCH "/api/kinfolk/memories/$memory_id/pause" "$token" '{"paused":true}' "$pause")
  require_status "$status" 200 "memory pause"
done < "$memory_ids"
after_pause="$work/after-pause.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-d','message':'''$relevant_message'''}))
PY
)" "$after_pause")
require_status "$status" 200 "paused preference check"
assert_json "$after_pause" "not (d.get('memoryUse') or {}).get('applied',False)"

while IFS= read -r memory_id; do
  revoke="$work/revoke-$memory_id.json"
  status=$(request DELETE "/api/kinfolk/memories/$memory_id" "$token" "" "$revoke")
  require_status "$status" 200 "memory revoke"
done < "$memory_ids"
after_revoke="$work/after-revoke.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-e','message':'''$relevant_message'''}))
PY
)" "$after_revoke")
require_status "$status" 200 "revoked preference check"
assert_json "$after_revoke" "not (d.get('memoryUse') or {}).get('applied',False)"

# Deliberately omit prompt, reply, token, account, and memory identifiers.
printf '%s\n' "{\"staging_memory_validation\":\"passed\",\"consent\":\"saved\",\"reviewable_memory_count\":${memory_count},\"relevant_recall\":\"applied\",\"governed_empty\":\"not_applied\",\"unrelated\":\"not_applied\",\"pause\":\"not_applied\",\"revoke\":\"not_applied\",\"private_content_logged\":false}"
