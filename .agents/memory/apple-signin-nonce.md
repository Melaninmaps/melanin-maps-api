---
name: Apple Sign-In nonce requirement
description: Correct nonce flow for expo-apple-authentication — you MUST pre-hash with SHA256 before passing to Apple. Apple embeds it as-is in the JWT.
---

## The correct contract (verified July 19, 2026)

```
rawNonce  = 32 random bytes, hex-encoded
hashedNonce = SHA256(rawNonce)   ← computed by the CLIENT using expo-crypto

signInAsync({ nonce: hashedNonce })   ← HASHED value goes to Apple
                                         Apple embeds hashedNonce in JWT as payload.nonce (no further hashing)

POST /api/auth/apple  body: { nonce: rawNonce }   ← RAW value goes to server

Server: SHA256(rawNonce) === payload.nonce   ← recomputes hash, must match
```

**Why pre-hash:** Apple requires the nonce you pass to signInAsync to be a SHA-256 hash.
Apple embeds it as-is in the identity token. The server then independently hashes the rawNonce to verify.
Apple's docs say: "Apple sends the nonce back in the identity token, encoded as a SHA256 hash" —
meaning YOU must supply a SHA256 hash. Apple does not do additional hashing.

**iOS 26+ enforcement:** iOS 26 strictly enforces this requirement. Passing rawNonce
directly to signInAsync (not pre-hashed) was silently accepted on older iOS versions
but fails on iOS 26+.

## The previous memory entry was completely wrong

The old entry said "pass rawNonce directly to signInAsync" and "Apple embeds SHA256(nonce)."
Both statements are incorrect. The old entry also said "do NOT pre-hash" — also wrong.
That entry led to the broken login.tsx implementation.

## Status in codebase (July 19, 2026)

signup.tsx: CORRECT — has always passed hashedNonce
login.tsx: FIXED — was passing rawNonce; now passes hashedNonce (Wave 1-B)

Server (POST /api/auth/apple): CORRECT — has always verified SHA256(rawNonce) === payload.nonce

Not yet deployed. Requires EAS build + TestFlight distribution + founder device verification.

**Why:** SHA256(rawNonce) passed to Apple → Apple stores it as-is → server recomputes SHA256(rawNonce) → matches.
**How to apply:** Always: rawNonce → expo-crypto SHA256 → hashedNonce → signInAsync. rawNonce → server.
