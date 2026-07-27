# Test Account Instructions — Template
## Mapping With Melanin™ — Build 97
**Classification:** TEMPLATE ONLY — credentials are NOT included. Credentials must be shared via a separate secure channel approved by the founder.

---

## Account Status Summary

| Account Type | Implemented | Visible in Build 97 | Notes |
|-------------|-------------|---------------------|-------|
| Community Member | ✅ Yes | ✅ Yes | Default account type on registration |
| Business Owner | ✅ Yes | ✅ Yes | Separate dashboard tab appears after business claim/submission |
| Cultural Ambassador | ❌ Not a distinct account type | ❌ No | Role concept exists in vision docs but is not an implemented account type or role in the current DB schema |
| Community Organization | ❌ Not a distinct account type | ❌ No | Not implemented as a separate account type |
| Admin | ✅ Yes | ✅ Yes (admin-only routes) | `role: "admin"` in users table; admin console accessible at `/admin` on web |
| Founding Member | ✅ Yes | ✅ Yes | `memberType: "founding"` — special tier, may have historical accounts |

**Note on Cultural Ambassador and Community Organization:** These roles appear in the product vision and some UI copy, but in the current codebase, the DB `users.role` column only has values `["user", "tester", "admin"]`. "Cultural Ambassador" is NOT a distinct programmatic role. Do not create misleading demo access for these types.

---

## Apple Review Account

| Field | Value |
|-------|-------|
| Email | `appstorereview@mappingwithmelanin.com` |
| Password | **[NOT INCLUDED — provide separately via secure channel]** |
| Account type | Community Member |
| Email verified | **[TBD — account not yet created as of July 27, 2026]** |
| Waitlist/approval required | Depends on current `approved` field — check after creation |
| Special login instructions | Email + password login. Apple Sign-In also available but may require reviewer's own Apple ID. |
| What this account can access | All Community Member features — business discovery, map, community feed, events, KinfolkAI (free tier limits), profile, settings, account deletion |

⚠️ **This account has not been created yet.** Railway is currently running the pre-fix server code. The account should be created only after Railway is restarted with the Build 97 fix and the 12-hour stability window has passed.

---

## Android Test Account

| Field | Value |
|-------|-------|
| Email | **[TBD — to be created for Android tester distribution]** |
| Password | **[NOT INCLUDED — provide separately]** |
| Account type | Community Member |
| Email verified | Must be verified |
| Notes | Same account can be used across iOS, Android, and web |

---

## Business Owner Test Account

| Field | Value |
|-------|-------|
| Email | **[TBD]** |
| Password | **[NOT INCLUDED — provide separately]** |
| Account type | Community Member + business claim |
| What this account can access | Community Member features + business dashboard, analytics, promotions, owner response to reviews |
| Special setup | A test business must be associated with this account via `POST /api/businesses/:id/claim` or direct DB assignment |

---

## Admin Test Account

| Field | Value |
|-------|-------|
| Access | **Admin access should only be granted to Manus if strictly required for specific review tasks** |
| Setup | `POST /api/admin/bootstrap` promotes the first admin after login, or set `ADMIN_EMAILS` env var |
| What admin can access | User management, business approval, content moderation, admin console, CSV export |
| Risk | Admin routes can modify user data, approve/reject businesses, export data |

**Recommendation:** Do not provide admin access to Manus unless a specific review task requires it. Community Member access is sufficient for most functional review.

---

## Special Login Instructions

### Email Registration Flow
1. Open the app
2. Tap "Create Account"
3. Enter name, email, password
4. Accept Terms of Service
5. Complete 4-step profile setup (`/profile-setup`)
6. Account becomes active

### Email Login Flow
1. Open the app
2. Tap "Sign In"
3. Enter email + password
4. If session expired: re-enter credentials

### Apple Sign-In Flow
1. Open the app
2. Tap "Continue with Apple"
3. Authenticate with reviewer's Apple ID (Face ID / Touch ID)
4. Server receives credential via `POST /api/auth/apple`
5. On first use: redirects to profile setup

### Password Reset Flow
6-digit code sent to email. Codes expire after 15 minutes.

---

## What Each Account Type Can Access

### Community Member (Default)
- Business discovery (map, search, categories, filters)
- Heritage places and cultural sites
- Community feed (posts, comments, likes, reposts)
- Events (browse, RSVP)
- KinfolkAI (free tier: limited monthly queries)
- Safety reporting
- Saved places
- Profile, followers, following
- Membership/upgrade flow
- Settings, Privacy, Account deletion

### Navigator / Trailblazer (Paid tiers)
- All Community Member features
- Expanded KinfolkAI monthly query limits
- Additional personalization depth

### Business Owner (Additional)
- Business dashboard
- Business analytics
- Owner response to reviews
- Business promotions / growth tools
- Verification submission

### Admin (Restricted)
- All above
- Admin console (`/admin` on web)
- User management, business approval, moderation
- CSV export of business leads
- Content reports dashboard
- Broadcast messages

---

## How to Provide Credentials Securely

The founder should provide actual account credentials to Manus via one of:
1. Signal encrypted message
2. A password-manager-based secure share link (1Password, Bitwarden)
3. A temporary, expiring secure note service

**Do NOT include credentials in email, Slack, GitHub issues, or any repository file.**
