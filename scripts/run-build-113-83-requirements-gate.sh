#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' 'REQUIREMENTS_GATE_DEPRECATED: build identifiers 114/84 are already consumed EAS artifacts and must not be reused.' >&2
printf '%s\n' 'Use scripts/run-build-115-85-requirements-gate.sh for the current native release.' >&2
exit 64
