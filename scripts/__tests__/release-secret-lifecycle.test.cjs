"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const releaseScript = readFileSync(path.resolve(__dirname, "../release-build-106.sh"), "utf8");

test("release script contains every required secret lifecycle boundary", () => {
  for (const fragment of [
    "unset MWM_RELEASE_TEST_DATABASE_URL MWM_PRODUCTION_DATABASE_FINGERPRINT MWM_RELEASE_TESTER_EMAIL MWM_RELEASE_TESTER_PASSWORD",
    "export -n TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET",
    "unset TOKEN",
    "export -n TOKEN",
    ': > "$login_json"',
    "unset TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET",
    "unset TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET",
    ': > "$auth_header"',
  ]) assert.ok(releaseScript.includes(fragment), `missing lifecycle boundary: ${fragment}`);
});

test("captured inherited holders and session token do not reach a child or survive in the login file", () => {
  const fixture = String.raw`
set -euo pipefail
login_json="$(mktemp)"
trap 'rm -f "$login_json"' EXIT
printf '%s' "$MWM_RELEASE_TESTER_PASSWORD" > "$login_json"
TEST_DB_SECRET="\${MWM_RELEASE_TEST_DATABASE_URL:-}"
PRODUCTION_DB_FINGERPRINT_SECRET="\${MWM_PRODUCTION_DATABASE_FINGERPRINT:-}"
TESTER_EMAIL_SECRET="\${MWM_RELEASE_TESTER_EMAIL:-}"
TESTER_PASSWORD_SECRET="\${MWM_RELEASE_TESTER_PASSWORD:-}"
unset MWM_RELEASE_TEST_DATABASE_URL MWM_PRODUCTION_DATABASE_FINGERPRINT MWM_RELEASE_TESTER_EMAIL MWM_RELEASE_TESTER_PASSWORD
export -n TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET
unset TOKEN
TOKEN=session-secret
export -n TOKEN
: > "$login_json"
unset TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET TOKEN
if env | grep -Eq '^(TEST_DB_SECRET|PRODUCTION_DB_FINGERPRINT_SECRET|TESTER_EMAIL_SECRET|TESTER_PASSWORD_SECRET|TOKEN|MWM_RELEASE_TEST_)='; then exit 71; fi
[[ ! -s "$login_json" ]]
`;
  assert.doesNotThrow(() => execFileSync("bash", ["-c", fixture], {
    env: {
      ...process.env,
      MWM_RELEASE_TEST_DATABASE_URL: "postgresql://user:database-secret@127.0.0.1/mwm_directory_staging_release",
      MWM_PRODUCTION_DATABASE_FINGERPRINT: "f".repeat(64),
      MWM_RELEASE_TESTER_EMAIL: "tester@example.invalid",
      MWM_RELEASE_TESTER_PASSWORD: "tester-secret",
      TEST_DB_SECRET: "inherited-holder-secret",
      PRODUCTION_DB_FINGERPRINT_SECRET: "inherited-fingerprint",
      TESTER_EMAIL_SECRET: "inherited-email",
      TESTER_PASSWORD_SECRET: "inherited-password",
      TOKEN: "inherited-token",
    },
    stdio: "ignore",
  }));
});
