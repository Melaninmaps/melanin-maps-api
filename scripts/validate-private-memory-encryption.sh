#!/usr/bin/env bash
# SAFE SOURCE VALIDATION ONLY. No DB client, app startup, migration, deploy, config or secret operations.
set -euo pipefail
umask 077
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
command -v pnpm >/dev/null || { printf 'pnpm is required; this script does not install dependencies.\n' >&2; exit 1; }
AVAILABLE="$(df --output=avail -B1 "$ROOT" | tail -n 1 | tr -d ' ')"
MINIMUM=$((10 * 1024 * 1024 * 1024))
(( AVAILABLE >= MINIMUM )) || { printf 'STOP: at least 10 GiB free storage is required.\n' >&2; exit 1; }
printf 'SAFE source-only private-memory gate; free bytes: %s\n' "$AVAILABLE"
git diff --check
node --input-type=module - "$ROOT" <<'NODE'
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = process.argv[2];
const read = (path) => readFileSync(join(root, path), "utf8");
const route = read("artifacts/api-server/src/routes/kinfolk.ts");
assert.equal((route.match(/encryptOrdinaryMemoryContent\(/g) ?? []).length, 4, "Every ordinary write/correction, including preferred name, must encrypt");
assert.equal((route.match(/ordinaryMemoriesForPrompt\(/g) ?? []).length, 2, "Both Kinfolk selection paths must fail closed");
assert(!/content:\s*formatPreferredNameMemory\(name\)/.test(route));
assert(!/sensitiveMemoryStoragePlaceholder\(\)\s*:\s*(?:content|item\.content)\s*,/.test(route));
const crypto = read("artifacts/api-server/src/kinfolk/private-memory-encryption.ts");
assert(crypto.includes('const PLACEHOLDER = "[Encrypted private memory]"'));
assert(crypto.includes("contentFingerprint: _fingerprint"));
assert(!/console\.|\.log\.|\.update\(|\.insert\(/.test(crypto), "Crypto adapter must not log or write rows");
const migration = read("artifacts/api-server/src/lib/startup-migrations.ts");
const start = migration.indexOf('name: "kinfolk_private_memories_ordinary_encryption_v5"');
const guard = migration.slice(start, migration.indexOf("// Personal Memory V1 adds only control metadata", start));
assert(start >= 0 && guard.includes("BEFORE INSERT OR UPDATE ON kinfolk_private_memories"));
assert(!/UPDATE\s+kinfolk_private_memories\s+SET|DELETE\s+FROM/i.test(guard), "No legacy backfill or deletion");
for (const file of ["maps.ts", "businesses.ts", "cultural-journeys.ts", "library-suggest.ts", "library-growth-admin.ts"]) {
  assert(!/kinfolkPrivateMemoriesTable|private-memory-encryption|kinfolk_private_memories/.test(read(`artifacts/api-server/src/routes/${file}`)), `${file} remains a no-memory surface`);
}
console.log("Source assertions PASS; no DB/app/startup module was imported.");
NODE
# Remove inherited DB/crypto credentials only in the test child process. Tests use synthetic in-process keys.
env -u DATABASE_URL -u KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY -u KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID \
  pnpm --filter @workspace/api-server exec vitest run \
  src/kinfolk/__tests__/private-memory-encryption.test.ts \
  src/kinfolk/__tests__/private-memory-encryption-contract.test.ts \
  src/kinfolk/__tests__/private-memory-encryption-routes.test.ts \
  src/kinfolk/__tests__/sensitive-memory-encryption.test.ts \
  src/kinfolk/__tests__/sensitive-memory-vault-contract.test.ts \
  src/kinfolk/__tests__/memory-consent-sensitive-guard.test.ts \
  src/kinfolk/__tests__/personal-memory-v1-contract.test.ts \
  src/kinfolk/__tests__/continuity-memory-boundaries.test.ts \
  src/kinfolk/__tests__/private-memory-relevance-selector.test.ts \
  src/kinfolk/__tests__/private-memory-policy.test.ts \
  src/kinfolk/__tests__/preferred-name-lifecycle.test.ts \
  src/kinfolk/__tests__/preferred-name-memory.test.ts \
  --maxWorkers=2
# The standard API project references tracked generated DB declarations, which may be stale after a
# schema-only source edit. Check the SAME API sources/options against current dependency source,
# without rebuilding/overwriting tracked dist or emitting .tsbuildinfo. Compiler overrides exist
# only in memory; no configuration file (including a temporary one) is created or changed.
node --input-type=module - "$ROOT" <<'NODE'
import ts from "typescript";
import { dirname, join } from "node:path";
const root = process.argv[2];
const configPath = join(root, "artifacts/api-server/tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config ?? {}, ts.sys, dirname(configPath), {
  rootDir: root,
  incremental: false,
  noEmit: true,
  typeRoots: [join(root, "artifacts/api-server/node_modules/@types")],
}, configPath);
// Deliberately omit projectReferences to resolve workspace exports to current source, not stale dist.
const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
const diagnostics = [...(config.error ? [config.error] : []), ...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  }));
  process.exitCode = 1;
} else {
  console.log(`API source typecheck PASS (TypeScript ${ts.version}; no emit; current dependency source).`);
}
NODE
git diff --check
printf 'SAFE source gate PASS. No deployment, migration execution, configuration change or runtime acceptance is implied.\n'
