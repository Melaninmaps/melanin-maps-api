---
name: Apple Sign-In nonce requirement
description: Correct nonce flow for expo-apple-authentication — pass rawNonce to Apple, not a pre-hashed value.
---

## The rule

Pass `rawNonce` (the raw random hex string) directly to `AppleAuthentication.signInAsync({ nonce: rawNonce })`.
Do NOT pre-hash it before passing to Apple.

**Why:** Apple embeds `SHA256(nonce)` in the identity token. If you pre-hash (`hashedNonce = SHA256(rawNonce)`) and pass that, Apple embeds `SHA256(SHA256(rawNonce))`. The server then verifies `SHA256(rawNonce) === payload.nonce` — which fails because `SHA256(rawNonce) ≠ SHA256(SHA256(rawNonce))`. Double-hashing = silent mismatch = "Apple Sign-In failed" error every time.

**How to apply:**
1. Client: `rawNonce` = 32 random bytes as hex → pass directly as `nonce: rawNonce` to `signInAsync`
2. Client: send `nonce: rawNonce` in the POST body to the server
3. Server: compute `SHA256(rawNonce)` and compare to `payload.nonce` from the Apple JWT ✅

No pre-hashing on the client side at all. The `expo-crypto` `digestStringAsync` call is not needed.
