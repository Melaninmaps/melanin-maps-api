#!/usr/bin/env bash
# Staging-only authenticated Kinfolk memory workflow using a disposable member.
# This script writes only to the dedicated Railway staging database.
set -euo pipefail

base="${KINFOLK_STAGING_BASE:?set KINFOLK_STAGING_BASE}"
email="${KINFOLK_STAGING_TEST_EMAIL:-kinfolk-memory-validation-20261010@example.test}"
password="${KINFOLK_STAGING_TEST_PASSWORD:-MemoryValidation!2026}"
run_id="${KINFOLK_STAGING_RUN_ID:-$(date +%s)}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

request() {
  local method="$1" path="$2" token="$3" data="$4" output="$5"
  local -a args=(-sS -X "$method" "$base$path" -H 'Content-Type: application/json' -o "$output" -w '%{http_code}')
  if [[ -n "$token" ]]; then args+=(-H "Authorization: Bearer $token"); fi
  if [[ -n "$data" ]]; then args+=(--data "$data"); fi
  curl "${args[@]}"
}
require_status() {
  local actual="$1" expected="$2" file="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected HTTP $expected; got $actual" >&2
    cat "$file" >&2
    exit 1
  fi
}
require_one_of() {
  local actual="$1" file="$2"; shift 2
  for expected in "$@"; do [[ "$actual" == "$expected" ]] && return 0; done
  echo "Expected one of [$*]; got $actual" >&2
  cat "$file" >&2
  exit 1
}
read_json() { python3 - "$1" "$2" <<'PY'
import json, sys
with open(sys.argv[1]) as f: value=json.load(f)
for key in sys.argv[2].split('.'):
    value=value[int(key)] if key.isdigit() else value[key]
print(value if isinstance(value,str) else json.dumps(value))
PY
}
assert_json() { python3 - "$1" "$2" <<'PY'
import json, sys
with open(sys.argv[1]) as f: data=json.load(f)
expr=sys.argv[2]
if not eval(expr, {'__builtins__': {'len': len}}, {'d':data}):
    raise SystemExit(f'assertion failed: {expr}; response={json.dumps(data)[:2500]}')
PY
}

# 1. Register a disposable staging member through the actual server flow.
register="$work/register.json"
status=$(request POST /api/auth/register "" "$(python3 - <<PY
import json
print(json.dumps({
  'firstName':'Kinfolk', 'lastName':'Validation', 'email':'$email',
  'password':'$password', 'username':'kinfolk_memory_validation',
  'dateOfBirth':'1990-01-01', 'agreeToTerms':True
}))
PY
)" "$register")
if [[ "$status" == "409" ]]; then
  status=$(request POST /api/auth/login-email "" "$(python3 - <<PY
import json
print(json.dumps({'email':'$email','password':'$password'}))
PY
)" "$register")
fi
require_one_of "$status" "$register" 200 201
token=$(read_json "$register" token)

# 2. An explicit preference creates a selectable consent plan but saves nothing.
plan="$work/plan.json"
message="Remember that I prefer affordable vegan restaurants with quiet seating and wheelchair access."
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-a','message':'''$message'''}))
PY
)" "$plan")
require_status "$status" 200 "$plan"
assert_json "$plan" "d.get('memoryConsentPlan') is not None and len(d['memoryConsentPlan'].get('ordinary', [])) > 0"
selected=$(python3 - "$plan" <<'PY'
import json,sys
p=json.load(open(sys.argv[1]))['memoryConsentPlan']
print(json.dumps([x['id'] for x in p.get('ordinary', [])]))
PY
)

# 3. Member explicitly confirms exactly the proposed non-sensitive preference(s).
consent="$work/consent.json"
status=$(request POST /api/kinfolk/memory-consent "$token" "$(python3 - <<PY
import json
print(json.dumps({'consent':True,'message':'''$message''','selectedIds':json.loads('''$selected'''),'sessionId':'staging-memory-$run_id-a'}))
PY
)" "$consent")
require_status "$status" 201 "$consent"
assert_json "$consent" "d.get('saved',0) >= 1 and d.get('enabled') is True"

# 4. A new conversation uses only the relevant approved preference and returns
# a generic member-facing notice, never private content or an eligibility claim.
recall="$work/recall.json"
relevant_message="Rewrite this dinner invitation for a vegan-friendly, wheelchair-accessible gathering on a modest budget."
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-b','message':'''$relevant_message'''}))
PY
)" "$recall")
require_status "$status" 200 "$recall"
assert_json "$recall" "d.get('memoryUse',{}).get('applied') is True"

# 5. An empty governed catalog must not claim that a preference changed an
# answer merely because the preference was relevant to the request.
governed_empty="$work/governed-empty.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-governed-empty','message':'Find a Black-owned vegan restaurant in Philadelphia.'}))
PY
)" "$governed_empty")
require_status "$status" 200 "$governed_empty"
assert_json "$governed_empty" "not d.get('memoryUse',{}).get('applied',False)"

# 6. Unrelated turns do not apply the dining/accessibility preference.
unrelated="$work/unrelated.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-c','message':'How do I organize family photos this weekend?'}))
PY
)" "$unrelated")
require_status "$status" 200 "$unrelated"
assert_json "$unrelated" "not d.get('memoryUse',{}).get('applied',False)"

# 7. Pause disables recall immediately.
memories="$work/memories.json"
status=$(request GET /api/kinfolk/memories "$token" "" "$memories")
require_status "$status" 200 "$memories"
memory_id=$(read_json "$memories" memories.0.id)
pause="$work/pause.json"
status=$(request PATCH "/api/kinfolk/memories/$memory_id/pause" "$token" '{"paused":true}' "$pause")
require_status "$status" 200 "$pause"
after_pause="$work/after-pause.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-d','message':'''$relevant_message'''}))
PY
)" "$after_pause")
require_status "$status" 200 "$after_pause"
assert_json "$after_pause" "not d.get('memoryUse',{}).get('applied',False)"

# 8. Revoke removes the preference from future retrieval and active review.
revoke="$work/revoke.json"
status=$(request DELETE "/api/kinfolk/memories/$memory_id" "$token" "" "$revoke")
require_status "$status" 200 "$revoke"
after_revoke="$work/after-revoke.json"
status=$(request POST /api/kinfolk/chat "$token" "$(python3 - <<PY
import json
print(json.dumps({'sessionId':'staging-memory-$run_id-e','message':'''$relevant_message'''}))
PY
)" "$after_revoke")
require_status "$status" 200 "$after_revoke"
assert_json "$after_revoke" "not d.get('memoryUse',{}).get('applied',False)"

# Store only sanitized decision metadata as evidence.
python3 - "$work" <<'PY'
import json, os, sys
w=sys.argv[1]
def load(n): return json.load(open(os.path.join(w,n)))
summary={
 'registration': 'passed',
 'consent_saved': load('consent.json').get('saved'),
 'relevant_recall_memory_use': load('recall.json').get('memoryUse'),
 'governed_empty_catalog_memory_use': load('governed-empty.json').get('memoryUse'),
 'unrelated_memory_use': load('unrelated.json').get('memoryUse'),
 'paused_memory_use': load('after-pause.json').get('memoryUse'),
 'revoked_memory_use': load('after-revoke.json').get('memoryUse'),
 'private_content_logged': False,
}
print(json.dumps(summary, indent=2))
PY
