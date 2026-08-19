# Complete Patch Package — Panel 7-Only ATL Music Preview Demonstration

## Why this replacement package exists

The previous archive must not be used. Replit correctly stopped because it believed the unified diff was incomplete. This replacement archive provides:

1. a complete raw unified diff;
2. the expected full post-patch artifact for independent comparison only;
3. separate baseline, post-patch, and patch-file checksums; and
4. a mandatory dry-run procedure before any workspace file is edited.

The patch has been verified against the required baseline in an isolated copy. It applies cleanly, produces the required post-patch SHA-256, preserves seven panels and 21 slides, and leaves the existing 3.5-second cycle declaration unchanged.

## Package contents

| File | Purpose |
|---|---|
| `atl_music_panel7.complete.patch` | The only patch to apply. It is 9,151 bytes and 119 lines. |
| `approved-preview-8-5.expected-after.html` | Complete expected result, for checksum/diff validation only. Do not copy it over the workspace file. |
| `BASELINE_SHA256.txt` | Required pre-application artifact checksum. |
| `EXPECTED_AFTER_SHA256.txt` | Required checksum after a successful patch application. |
| `PATCH_SHA256.txt` | Checksum for the unified diff itself. |
| `README.md` | This instruction. |

## Absolute scope lock

The only source file authorized to change is:

```text
artifacts/web/public/approved-preview-8-5.html
```

Within that file, the patch changes only the existing additive Kinfolk Panel 7 markup/copy (`#card-kinfolk`). It replaces the hair-care example with the watch-only ATL-music Community Intelligence example.

Do not change any CSS, JavaScript, the cycle engine, the five protected original panels, the Living Library panel, `ApprovedAnimatedPreview.tsx`, `preview.tsx`, `App.tsx`, routes, iframe behavior, QR destination, waitlist, live Kinfolk code, mobile, API, database, configuration, build artifacts, or deployment settings.

Do not deploy in this stage.

## Mandatory preflight — do not edit before all checks pass

From the repository root, run:

```bash
# 1. Confirm the artifact is the exact required baseline.
sha256sum artifacts/web/public/approved-preview-8-5.html
# Required:
# acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f

# 2. Confirm the existing preview structure.
grep -c 'class="preview-card"' artifacts/web/public/approved-preview-8-5.html
# Required: 7

grep -c 'class="preview-slide"' artifacts/web/public/approved-preview-8-5.html
# Required: 21

# 3. Confirm the archive's patch is exactly the supplied complete file.
sha256sum atl_music_panel7.complete.patch
# Required:
# 06633f71efdbd8fdbc0f8d495fe4b6f920ff747e2dd1e435a27fbfc1d532b672

# 4. Reject a truncated/placeholder patch.
grep -nE '^\.\.\.$|\[\.\.\.|truncated|placeholder' atl_music_panel7.complete.patch
# Required: no output

# 5. Prove the patch applies before editing any file.
patch --dry-run -p1 < atl_music_panel7.complete.patch
# Required: checking file artifacts/web/public/approved-preview-8-5.html
# Required: exit code 0
```

If any value differs, or the dry run does not exit successfully, stop and report the full command output. Do not edit manually, reconstruct missing lines, alter the patch, or use the full expected-after HTML as a replacement.

## Authorized application

Only after every preflight check passes:

```bash
patch -p1 < atl_music_panel7.complete.patch
```

## Required post-application proof — still no deployment

Return all of the following without truncating the actual file content or diff:

```bash
git diff --name-only
git diff --stat
git diff -- artifacts/web/public/approved-preview-8-5.html
sha256sum artifacts/web/public/approved-preview-8-5.html
grep -c 'class="preview-card"' artifacts/web/public/approved-preview-8-5.html
grep -c 'class="preview-slide"' artifacts/web/public/approved-preview-8-5.html
grep -n 'CYCLE_INTERVAL_MS = 3500' artifacts/web/public/approved-preview-8-5.html
```

Required results:

| Verification | Required result |
|---|---|
| Changed source files | Exactly `artifacts/web/public/approved-preview-8-5.html` |
| Changed preview region | Panel 7 (`#card-kinfolk`) only |
| First five protected panels | No change |
| Living Library panel | No change |
| Post-patch artifact SHA-256 | `8aed162ca668a2889a69e68705f1912bbd9736e9ba311f64b9a0786887eb5b7a` |
| Preview card count | `7` |
| Preview slide count | `21` |
| Cycle declaration | Existing `CYCLE_INTERVAL_MS = 3500` line is unchanged |

A successful patch application is **not** authorization to build or deploy. Wait for the owner to review the proof and issue a separate release approval.
