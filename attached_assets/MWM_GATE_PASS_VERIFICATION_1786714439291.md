# MWM Gate-Pass Verification

## Decision

**The gate pass is valid only for the local server at `http://localhost:8080`. It is not proof that the external Replit deployment is reachable.**

## Evidence reviewed

The submitted JSON reports all required checks passing locally:

- Root application route: HTTP 200.
- Health endpoint: HTTP 200 with `status: ok`.
- Tester login: HTTP 200 with a token.
- Authenticated tester profile: HTTP 200.
- Business search: HTTP 200 JSON.
- Thirty concurrent tester logins: 30/30 successful.

## External cross-check

The documented Replit URL was tested separately. At the time of verification:

- `GET /api/healthz` returned HTTP 502 with `Replit-Proxy-Error: repl unreachable`.
- `GET /` returned HTTP 502 with the same proxy error.

Therefore the full feature audit cannot yet be run against the external URL. The local gate proves that the application server works in the environment where Replit ran the script; it does not prove that testers can reach that server through the Replit URL.

## Security issue

The submitted `deployment-gate-result.json` contains live session tokens for all 30 tester accounts. Those tokens must be treated as compromised: revoke all sessions or rotate the session secret, then regenerate the tester sessions. Do not commit or redistribute the raw JSON. Future evidence must redact tokens and include only booleans, status codes, latency, account numbers, and short non-sensitive response fields.

## Required next action

Replit must provide a reachable external application URL, rerun the unchanged gate script against that URL, and return a redacted result with no session tokens. Only then should the map, search, Library, KinfolkAI, flywheel, business-owner, and visual audits begin.
