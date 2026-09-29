#!/usr/bin/env bash
# Historical Build 106 entrypoint — intentionally non-executable.
#
# This file is retained so old documentation and saved shell history fail
# safely. It must never request a build, upload to TestFlight, or invoke a
# submission profile.

set -euo pipefail

printf '%s\n' 'BUILD_106_RETIRED: This historical automatic-submission path is disabled.' >&2
printf '%s\n' 'Use docs/RELEASE_STAGE_POLICY.md and scripts/release-state.mjs. A native build request is blocked until the exact candidate has validated CODED, AUTOMATED_TESTED, and INTEGRATION_TESTED evidence.' >&2
exit 64
