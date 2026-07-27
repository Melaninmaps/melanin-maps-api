---
name: Apple Sign-In revocation (TN3194)
description: Full implementation of Apple token revocation for account deletion compliance — where the code lives, the data flow, and the 4 Railway secrets required before it can function.
---

## What was built

Apple TN3194 requires apps that support Sign in with Apple to revoke the user's Apple token when they delete their account.

## Data flow

1. **Sign-in (auth.ts POST /auth/apple)** — client sends `authorizationCode` alongside `identityToken`. Server exchanges the code with Apple's `/auth/token` endpoint via `exchangeAuthCode()`, encrypts the returned refresh token with AES-256-GCM, stores it in `users.apple_refresh_token`.

2. **Account deletion (users.ts DELETE /users/me)** — server decrypts the stored token, calls Apple's `/auth/revoke` endpoint via `revokeAppleToken()`. If revocation fails, deletion still proceeds per TN3194 ("non-blocking"). Response includes `appleRevocationStatus` field.

3. **App-foreground credential check (mobile/lib/auth.tsx)** — `AppState.addEventListener("change")` fires on every foreground event. If `apple_user_id` is in SecureStore, `getCredentialStateAsync()` is checked; REVOKED or NOT_FOUND triggers immediate local logout.

## Files

- `artifacts/api-server/src/lib/apple.ts` — `encryptToken`, `decryptToken`, `generateClientSecret`, `exchangeAuthCode`, `revokeAppleToken`
- `lib/db/src/schema/auth.ts` — `appleRefreshToken: text("apple_refresh_token")` column
- `artifacts/api-server/src/routes/auth.ts` — POST /auth/apple: exchange + encrypt + store
- `artifacts/api-server/src/routes/users.ts` — DELETE /users/me: decrypt + revoke + atomic transaction
- `artifacts/mobile/app/login.tsx` — sends `authorizationCode`, stores `apple_user_id` in SecureStore
- `artifacts/mobile/app/signup.tsx` — same as login.tsx
- `artifacts/mobile/app/settings.tsx` — handles `appleRevocationStatus` in delete response; shows Alert for manual_revocation_required
- `artifacts/mobile/lib/auth.tsx` — AppState credential check + `apple_user_id` cleanup on logout

## appleRevocationStatus response values

- `"revoked"` — Apple confirmed revocation
- `"revocation_failed"` — Apple API failed; local deletion still completed; client shows manual instruction
- `"manual_revocation_required"` — legacy user (signed in before this feature was deployed, no stored token); client shows manual instruction

## 4 Railway environment variables required (set before deploying)

| Variable | Source |
|---|---|
| `APPLE_TEAM_ID` | Apple Developer → Membership → Team ID (10-char) |
| `APPLE_KEY_ID` | Apple Developer → Certificates → Keys → key ID (10-char) |
| `APPLE_PRIVATE_KEY` | Full .p8 file content including `-----BEGIN PRIVATE KEY-----` header/footer; newlines as literal `\n` in Railway |
| `APPLE_TOKEN_ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` (64-char hex, 32 bytes) |

**Why:** `generateClientSecret` needs TEAM_ID + KEY_ID + PRIVATE_KEY for ES256 JWT signing. `encryptToken`/`decryptToken` need ENCRYPTION_KEY for AES-256-GCM. Without all 4, new Apple Sign-In accounts are blocked (server returns 500) and deletion revocation fails gracefully.

## Behavior without secrets configured

- **New Apple Sign-In users**: blocked with HTTP 500 (cannot create account without revocation capability)
- **Existing Apple Sign-In users**: sign-in succeeds (legacy fallback), deletion proceeds without revocation, `appleRevocationStatus: "revocation_failed"` returned

## DB migration

Schema pushed to dev DB via `pnpm --filter @workspace/db run push`. Railway production DB (Neon) needs the `apple_refresh_token` column added — run the push command against the production DATABASE_URL, or apply manually: `ALTER TABLE users ADD COLUMN apple_refresh_token text;`
