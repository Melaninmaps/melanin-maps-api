# Manus Audit — Tester Account Credentials
**Created:** August 14, 2026  
**Platform:** Mapping With Melanin (MWM)

## Shared Password for All 30 Accounts
```
ManusAudit@2026!
```

## Login Endpoint
```
POST /api/auth/login-email
Content-Type: application/json

{ "email": "<email>", "password": "ManusAudit@2026!" }
```

Response:
```json
{ "token": "<session-id>", "mustChangePassword": false }
```

Use session ID as `Authorization: Bearer <token>` OR as cookie `mwm_sid=<token>`

## All 30 Accounts

| Account | Email | Username |
|---------|-------|----------|
| 01 | manus.tester.01@mwm.audit | @manustester01 |
| 02 | manus.tester.02@mwm.audit | @manustester02 |
| 03 | manus.tester.03@mwm.audit | @manustester03 |
| 04 | manus.tester.04@mwm.audit | @manustester04 |
| 05 | manus.tester.05@mwm.audit | @manustester05 |
| 06 | manus.tester.06@mwm.audit | @manustester06 |
| 07 | manus.tester.07@mwm.audit | @manustester07 |
| 08 | manus.tester.08@mwm.audit | @manustester08 |
| 09 | manus.tester.09@mwm.audit | @manustester09 |
| 10 | manus.tester.10@mwm.audit | @manustester10 |
| 11 | manus.tester.11@mwm.audit | @manustester11 |
| 12 | manus.tester.12@mwm.audit | @manustester12 |
| 13 | manus.tester.13@mwm.audit | @manustester13 |
| 14 | manus.tester.14@mwm.audit | @manustester14 |
| 15 | manus.tester.15@mwm.audit | @manustester15 |
| 16 | manus.tester.16@mwm.audit | @manustester16 |
| 17 | manus.tester.17@mwm.audit | @manustester17 |
| 18 | manus.tester.18@mwm.audit | @manustester18 |
| 19 | manus.tester.19@mwm.audit | @manustester19 |
| 20 | manus.tester.20@mwm.audit | @manustester20 |
| 21 | manus.tester.21@mwm.audit | @manustester21 |
| 22 | manus.tester.22@mwm.audit | @manustester22 |
| 23 | manus.tester.23@mwm.audit | @manustester23 |
| 24 | manus.tester.24@mwm.audit | @manustester24 |
| 25 | manus.tester.25@mwm.audit | @manustester25 |
| 26 | manus.tester.26@mwm.audit | @manustester26 |
| 27 | manus.tester.27@mwm.audit | @manustester27 |
| 28 | manus.tester.28@mwm.audit | @manustester28 |
| 29 | manus.tester.29@mwm.audit | @manustester29 |
| 30 | manus.tester.30@mwm.audit | @manustester30 |

## Account Properties
- Role: `tester`
- Tester status: `active`
- Approved: `true`
- Email verified: `true`
- Must change password: `false`
- Profile setup complete: `true`
- Membership: tester bypass (full platform access, no paywall)
- Access source: `admin_invite` (founder-granted)

## Referral Codes (for referral flow testing)
Accounts 01–30 have codes `MANUS001` through `MANUS030`

## Notes
- These accounts are NOT real Apple Sign-In accounts — they use email/password only
- For mobile app testing: use the web login endpoint to get a session token, then pass it as Bearer
- Do not use these accounts for load testing — they are not `is_load_test` accounts
- Accounts persist across Railway deploys (seeded via startup migration `manus audit accounts v1`)
