#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"
cd "$ROOT"

if [[ ! -f pnpm-workspace.yaml && ! -f package.json ]]; then
  echo "TASK373 ERROR: run from the Replit workspace root" >&2
  exit 1
fi

mapfile -t SUPERTEST_IMPORTS < <(
  grep -RIl --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
    -E "from ['\"]supertest['\"]|require\(['\"]supertest['\"]\)" artifacts packages apps 2>/dev/null || true
)

if (( ${#SUPERTEST_IMPORTS[@]} == 0 )); then
  echo "TASK373: no source file imports supertest; no dependency change made."
  exit 0
fi

PACKAGE_DIRS=()
for source_file in "${SUPERTEST_IMPORTS[@]}"; do
  current="$(dirname "$source_file")"
  found=""
  while [[ "$current" != "." && "$current" != "/" ]]; do
    if [[ -f "$current/package.json" ]]; then
      found="$current"
      break
    fi
    current="$(dirname "$current")"
  done
  if [[ -z "$found" ]]; then
    echo "TASK373 ERROR: could not find package.json owning $source_file" >&2
    exit 1
  fi
  PACKAGE_DIRS+=("$found")
done

mapfile -t UNIQUE_PACKAGE_DIRS < <(printf '%s\n' "${PACKAGE_DIRS[@]}" | sort -u)

for package_dir in "${UNIQUE_PACKAGE_DIRS[@]}"; do
  package_name="$(node -e 'const p=require("./'"$package_dir"'/package.json"); process.stdout.write(p.name || "")')"
  if [[ -z "$package_name" ]]; then
    echo "TASK373 ERROR: $package_dir/package.json has no package name" >&2
    exit 1
  fi

  has_supertest="$(node -e 'const p=require("./'"$package_dir"'/package.json"); process.stdout.write(String(Boolean((p.devDependencies&&p.devDependencies.supertest)||(p.dependencies&&p.dependencies.supertest))))')"
  has_types="$(node -e 'const p=require("./'"$package_dir"'/package.json"); process.stdout.write(String(Boolean((p.devDependencies&&p.devDependencies["@types/supertest"])||(p.dependencies&&p.dependencies["@types/supertest"]))))')"

  if [[ "$has_supertest" == "true" && "$has_types" == "true" ]]; then
    echo "TASK373: $package_name already declares supertest and @types/supertest."
    continue
  fi

  echo "TASK373: adding missing API test dependencies to $package_name ($package_dir)"
  pnpm --filter "$package_name" add -D supertest @types/supertest

done

pnpm install --lockfile-only

echo "TASK373: dependency restoration complete. Review package.json and pnpm-lock.yaml before committing."
