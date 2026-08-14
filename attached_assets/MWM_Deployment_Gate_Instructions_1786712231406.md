# MWM Deployment Gate Instructions

## Run

Save `mwm_deployment_gate.py` in the Replit project or run it from a machine with Python 3 and `requests` installed:

```bash
python3 mwm_deployment_gate.py \
  --url 'https://YOUR-ACTUAL-REPLIT-APP.replit.dev' \
  --password 'THE-DISPOSABLE-TESTER-PASSWORD' \
  --run-30-logins \
  > deployment-gate-result.json
```

Do not pass `/api` as the URL. Pass the application origin; the script adds `/api` itself.

## Required result

The script must print:

```text
DEPLOYMENT GATE: PASS
```

and the JSON output must show all of these checks as passed:

- `root_is_application_not_mockup`
- `health_endpoint`
- `tester_login_returns_token`
- `authenticated_user_is_tester`
- `business_search_is_real_json_route`
- `thirty_tester_logins`

## Automatic failure conditions

The gate fails if the root redirects to `/__mockup`, the body identifies a Component Preview Server, the health endpoint returns 404, the login route returns 404/HTML instead of JSON, no tester token is returned, `/api/auth/user` does not return a tester, the business search route is not a JSON application endpoint, or any of the 30 logins fails.

A URL that loads a page is not sufficient. A valid deployment must expose the real application API and must authenticate a tester before the feature audit begins.

## What Replit must return

Replit must return the complete `deployment-gate-result.json`, the exact deployed commit SHA, the deployment timestamp, and the URL tested. If the gate fails, Replit must provide a new URL and rerun the unchanged script. They must not edit the script to weaken a failed check.

## Important distinction

This gate validates deployment identity and basic reachability only. It does not prove that map search, Library, KinfolkAI, flywheel signals, business-owner access, claiming, or visual updates work. Those tests begin only after this deployment gate passes.
