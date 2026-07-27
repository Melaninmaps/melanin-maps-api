# Android versionCode 72 — Google Play Credential Fix

**EAS Build ID:** `7a1964ed`
**Source commit:** `0eb346ef` (versionCode bumped 71→72)
**versionName:** 1.1.5
**Build status:** FINISHED (completed ~22:20 UTC July 27, 2026)
**Submission status:** FAILED — Google Service Account JWT invalid

---

## Root Cause

EAS Submit returned `invalid_grant / Invalid JWT Signature` when attempting to
submit VC72 to Google Play. This indicates the private key in
`artifacts/mobile/google-service-account.json` has been revoked, expired, or
replaced since it was created.

Service account: `play-store-submissions@peerless-rock-499419-v5.iam.gserviceaccount.com`
Key ID (stale): `a140c29d`

**This is a credential issue only. The VC72 build is correct and does not need to be rebuilt.**

---

## Fix — Founder Steps

### Step 1 — Create a new JSON key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: IAM & Admin → Service Accounts
3. Find: `play-store-submissions@peerless-rock-499419-v5.iam.gserviceaccount.com`
4. Click the service account → Keys tab
5. Click **Add Key → Create new key → JSON**
6. Download the JSON file

### Step 2 — Replace the credential file

**Do NOT commit the JSON file to git.**

Place the downloaded JSON at `artifacts/mobile/google-service-account.json`.

Verify `artifacts/mobile/.gitignore` includes `google-service-account.json` —
it already does, but confirm before any `git add`.

### Step 3 — Re-run EAS Submit

```bash
cd artifacts/mobile
npx eas-cli@latest submit --platform android --id 7a1964ed --non-interactive
```

This resubmits the already-built VC72 AAB without triggering a new build.

### Step 4 — Confirm Google Play track

The `eas.json` production submit config uses `track: "internal"`.
After submission succeeds, check Google Play Console → Internal testing
to confirm the build appears and is available for promotion.

### Step 5 — Confirm no rebuild needed

- VC72 AAB artifact: available at the EAS build dashboard for build `7a1964ed`
- No mobile code changes occurred after the VC72 build
- versionCode 72 is correct (71 was already used July 24)
- **Do not create VC73 unless a confirmed mobile-code change requires it**

---

## AAB Artifact Location

EAS build `7a1964ed` — retrieve AAB artifact URL from:
https://expo.dev/accounts/tlindsay428/projects/mobile/builds/7a1964ed

---

*This file documents the credential fix for Android VC72. The build itself is correct.*
