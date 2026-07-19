---
name: Registration API contract
description: Exact required fields for POST /api/auth/register — discovered via live simulation.
---

## POST /api/auth/register required fields

All six fields are required — missing any one returns a 400 with a descriptive error:

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "username": "string",
  "agreeToTerms": true
}
```

**Common mistakes:**
- Sending `agreedToTerms` (past tense) instead of `agreeToTerms` → silent 400
- Omitting `username` → "First name, last name, email, password, and username are required"
- Omitting `agreeToTerms` or sending `false` → "You must agree to the Terms of Service"

**On success:** Returns `{ token, user: { id, firstName, username } }` — token is the Bearer auth token.

**Business search param:** The correct query parameter is `?search=BBQ`, NOT `?q=BBQ`. Using `q` returns all 106 results unfiltered.

**Safety surveys:** Route is `POST /api/surveys` (not `/api/safety`). New accounts (< 24h old) are blocked by anti-spam guard — expected behavior.

**Why:** These were discovered during a full live simulation and caused wasted debugging time. Document them here so future tests get them right on the first try.
