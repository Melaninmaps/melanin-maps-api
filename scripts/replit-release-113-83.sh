#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' 'RELEASE_WRAPPER_DEPRECATED: build identifiers 114/84 are already consumed EAS artifacts and must not be reused.' >&2
printf '%s\n' 'Use scripts/replit-release-115-85.sh with the current controlling GitHub SHA after exact-source deployment proof.' >&2
exit 64
