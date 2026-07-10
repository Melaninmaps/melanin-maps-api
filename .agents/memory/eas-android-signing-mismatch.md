---
name: EAS/Play Store Android upload key mismatch
description: How to resolve "Play Console expects a different upload key SHA1 than the one EAS has" — root cause and fix procedure.
---

## Root cause
If Play Console's "Upload key certificate" SHA-1 doesn't match the SHA-1 of the keystore EAS has on file, all uploads will be rejected. This happens when a previous upload-key-reset request was submitted with a certificate for a keystore/private key nobody actually possesses (a dead end — Play will never accept builds signed with a key that can't be used to sign).

## Fix procedure (self-service only — Google support cannot do this for you)
1. Generate a NEW local keystore with `keytool` (do not reuse old/unknown-password keystores).
2. Configure the app's build tool (e.g. `eas.json` credentialsSource: "local", `credentials.json` android section) to sign with this new local keystore going forward.
3. Export the new keystore's public certificate as PEM: `keytool -export -rfc -keystore <ks>.jks -alias <alias> -file cert.pem`.
4. In Play Console: app → Protected with Play → Play App Signing → App signing → "Upload key certificate" section → "Request upload key reset" → pick a reason (e.g. "I forgot the password to my keystore") → upload the PEM → Request.
5. Google takes up to ~48 hours to approve the new upload key (stated policy, confirmed via Play Developer Support case). No further action possible until approval email arrives.
6. Once approved, run a fresh production build — any build made before approval was signed with the old/wrong key and is not usable.

**Why:** Play App Signing separates the "app signing key" (Google holds this, immutable) from the "upload key" (developer holds this, resettable via this exact self-service flow). Support tickets asking Google to just "accept" an existing wrong key get closed — the reset must be done through the UI with a real possessed key.
