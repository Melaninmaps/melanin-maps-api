# Owner Authorization — Deploy Only the ATL Music Panel 7 Preview Revision

## Confirmed production gap

A fresh cache-bypassed public check confirms that production is still serving the prior public artifact:

```text
Production URL: https://www.mappingwithmelanin.com/preview
Production static artifact: https://www.mappingwithmelanin.com/approved-preview-8-5.html
HTTP status: 200 for both
Current artifact SHA-256: acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f
ATL music markers: 0
```

The verified Panel 7 ATL-music artifact is ready in the workspace but has not been released to production.

## Owner approval and exact scope

I authorize the **isolated production deployment of the verified ATL music Panel 7 preview revision only**.

Start from the exact revision currently serving production. Do **not** publish the full current workspace. The release must include only this source change:

```text
artifacts/web/public/approved-preview-8-5.html
```

Within that file, only the existing additive Kinfolk panel (`#card-kinfolk`, Panel 7) may differ. It replaces the hair-care example with the approved ATL-music Community Intelligence demonstration.

The resulting source artifact must have this exact SHA-256:

```text
8aed162ca668a2889a69e68705f1912bbd9736e9ba311f64b9a0786887eb5b7a
```

The only additional output permitted is ordinary web deployment output produced directly by the standard web build/deployment process. Do not commit, promote, or package unrelated generated artifacts. Do not include any mobile/iOS/Android artifact, API, database, public-art work, Kinfolk server/prompt work, map/directory work, preview route/wrapper change, QR/waitlist change, configuration change, or any other pending workspace change.

## Required pre-deployment proof

Before initiating the Railway web deployment, return:

```bash
# from the clean isolated release branch/worktree
git diff --name-only <live-production-revision>
git diff --stat <live-production-revision>
git diff -- artifacts/web/public/approved-preview-8-5.html
sha256sum artifacts/web/public/approved-preview-8-5.html
grep -c 'class="preview-card"' artifacts/web/public/approved-preview-8-5.html
grep -c 'class="preview-slide"' artifacts/web/public/approved-preview-8-5.html
grep -n 'CYCLE_INTERVAL_MS = 3500' artifacts/web/public/approved-preview-8-5.html
grep -nE 'What rappers are from ATL\?|Local music events|Music venues &amp; underground clubs|Learn about these artists|Not right now|Community Intelligence makes the answer richer' artifacts/web/public/approved-preview-8-5.html
```

Required values:

| Check | Required result |
|---|---|
| Changed source files | Exactly one: `artifacts/web/public/approved-preview-8-5.html` |
| Changed source region | Existing `#card-kinfolk` Panel 7 only |
| Artifact SHA-256 | `8aed162ca668a2889a69e68705f1912bbd9736e9ba311f64b9a0786887eb5b7a` |
| Preview card count | `7` |
| Preview slide count | `21` |
| Cycle engine | Existing `CYCLE_INTERVAL_MS = 3500` remains unchanged |
| ATL markers | All six required strings appear exactly |
| Other panels | Original five protected panels and Living Library panel have no diff |

If any result differs, stop. Do not rewrite, improvise, absorb a workspace change, or deploy.

## Deployment boundary

Deploy **only** the web service/revision that serves `www.mappingwithmelanin.com`. Do not deploy mobile. Do not start or publish mobile workflows. Do not submit to Apple or Google. Do not deploy or migrate API/database services. Do not alter the existing QR destination.

The existing QR URL must remain unchanged:

```text
https://www.mappingwithmelanin.com/preview
```

## Required post-deployment verification

Immediately after the isolated production release, verify publicly using cache-bypass requests and return the raw outputs:

```bash
curl -sS -D /tmp/preview.headers --max-time 60 \
  'https://www.mappingwithmelanin.com/preview?atl_release_verify=<unique-value>' \
  -o /tmp/preview.html

curl -sS -D /tmp/artifact.headers --max-time 90 \
  'https://www.mappingwithmelanin.com/approved-preview-8-5.html?atl_release_verify=<unique-value>' \
  -o /tmp/approved-preview-8-5.html

head -1 /tmp/preview.headers
head -1 /tmp/artifact.headers
sha256sum /tmp/approved-preview-8-5.html
grep -nE 'What rappers are from ATL\?|Local music events|Music venues &amp; underground clubs|Learn about these artists|Not right now|Community Intelligence makes the answer richer' /tmp/approved-preview-8-5.html
grep -c 'class="preview-card"' /tmp/approved-preview-8-5.html
grep -c 'class="preview-slide"' /tmp/approved-preview-8-5.html
grep -n 'CYCLE_INTERVAL_MS = 3500' /tmp/approved-preview-8-5.html
```

Also return:

1. The deployed revision/commit identifier.
2. The complete changed-file list for the isolated release.
3. Desktop and mobile public captures of Panel 7-A, Panel 7-B, and Panel 7-C at `https://www.mappingwithmelanin.com/preview`.
4. Confirmation that the existing QR destination still reaches `/preview`.
5. Confirmation that the public page shows no older `My hair has been thinning` Panel 7 content.

## Rollback

If any public response is not HTTP 200, the public artifact hash is not the required ATL hash, any required ATL marker is absent, any protected panel changed, a non-preview file entered the release, or the QR destination behavior changed, immediately roll the web service back to the prior production revision and report the exact failure. Do not investigate by changing more files.

## Completion statement

Only after every post-deployment check passes may the release be described as complete. Include this statement:

> “Only the verified Panel 7 ATL music preview revision was deployed. The public QR destination remains `https://www.mappingwithmelanin.com/preview`. No mobile, API, database, public-art, map, Kinfolk server, route/wrapper, configuration, or unrelated workspace change was included.”
