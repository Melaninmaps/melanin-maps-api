# Replit Artifact Router Recovery — Manifest Only

## Authorization boundary

This repair is authorized **only** for:

```text
artifacts/mobile/.replit-artifact/artifact.toml
```

Do not edit preview source, preview route, web workflow, mobile source, API source, app configuration, deployment settings, or any other file. Do not deploy.

The local web workflow already proves that the restored preview is healthy:

```text
http://127.0.0.1:22333/preview → HTTP 200
```

The proxy failure is caused by the router being unable to parse the mobile artifact manifest. The manifest is valid through line 28; accidental non-TOML content begins at line 29.

## Exact recovery

The validator cannot repair this file because it attempts to parse the corrupt file before replacing it. Use the Replit recovery/filesystem path to make a **byte-for-byte copy of lines 1–28 only**, after a backup.

```bash
set -euo pipefail

MANIFEST="artifacts/mobile/.replit-artifact/artifact.toml"
BACKUP="${MANIFEST}.corrupt-backup-$(date +%Y%m%d-%H%M%S)"
TMP="${MANIFEST}.recovered"

# Preserve the corrupt original. Do not overwrite it.
cp -- "$MANIFEST" "$BACKUP"

# Keep the established valid TOML only; delete accidental content beginning at line 29.
sed -n '1,28p' "$MANIFEST" > "$TMP"

# Verify the candidate contains no accidental non-TOML payload.
if grep -nE '^(<<<<<<<|=======|>>>>>>>|```|<html|<!DOCTYPE|[[:space:]]*$)' "$TMP"; then
  echo "Recovery candidate contains unexpected content; stop."
  exit 1
fi

# Atomically replace ONLY the malformed manifest.
mv -- "$TMP" "$MANIFEST"

# Show the exact allowed diff for review.
git diff -- "$MANIFEST"
```

If Replit’s normal file mutation tool still blocks this one replacement, use the platform’s artifact/config recovery function to replace the manifest with the saved 1–28-line candidate. Do **not** bypass the change-control rule by editing other files or recreating the preview.

## Required validation before continuing

```bash
# The manifest must now parse as TOML using Replit's artifact validator.
<run Replit artifact validation for artifacts/mobile/.replit-artifact/artifact.toml>

# Existing local web behavior must remain unchanged.
curl -i http://127.0.0.1:22333/preview
curl -i http://127.0.0.1:22333/
```

Expected: both local requests remain HTTP 200.

After the artifact router reloads its route map, verify the existing workflow proxy—without deployment:

```bash
curl -i 'https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/preview'
```

Expected: HTTP 200, the restored preview document, and no redirect to the mockup sandbox.

## Stop conditions

Stop and report instead of changing anything further if any condition is true:

| Condition | Required action |
|---|---|
| The first 28 lines do not parse after recovery. | Restore the backup and use Replit artifact-config recovery; do not guess a new manifest. |
| Local `:22333/preview` no longer returns 200. | Restore the manifest backup; the web workflow must remain untouched. |
| Proxy still maps `/` to the mockup or `/preview` to 404 after a valid router reload. | Inspect only the existing artifact route-map configuration; do not edit preview source. |
| `git diff --name-only` shows any file beyond `artifact.toml`. | Revert every extra file and stop. |

No deployment occurs in this repair. The owner reviews the restored preview through the working proxy before any future deployment decision.
