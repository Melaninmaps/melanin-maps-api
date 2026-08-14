#!/usr/bin/env python3
"""MWM deployment gate.

Usage:
  python3 mwm_deployment_gate.py \
    --url https://your-replit-domain.replit.dev \
    --password 'YOUR_TEST_PASSWORD' \
    --run-30-logins

Exit codes:
  0 = deployment passed the application-server gate
  1 = deployment failed the gate
  2 = invalid command-line input
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import sys
import time
from dataclasses import asdict, dataclass
from typing import Any
from urllib.parse import urljoin, urlparse

import requests


@dataclass
class Check:
    name: str
    passed: bool
    status: int | None
    detail: str
    url: str
    elapsed_ms: float | None = None


def clean_base(value: str) -> str:
    value = value.strip().rstrip("/")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("--url must be a complete http(s) URL")
    return value


def request(session: requests.Session, method: str, url: str, **kwargs: Any):
    started = time.perf_counter()
    try:
        response = session.request(method, url, timeout=20, allow_redirects=False, **kwargs)
        elapsed = round((time.perf_counter() - started) * 1000, 1)
        return response, elapsed, None
    except requests.RequestException as exc:
        elapsed = round((time.perf_counter() - started) * 1000, 1)
        return None, elapsed, str(exc)


def body_text(response: requests.Response | None) -> str:
    if response is None:
        return ""
    return response.text[:1000].replace("\n", " ")


def body_json(response: requests.Response | None) -> dict[str, Any] | list[Any] | None:
    if response is None:
        return None
    try:
        return response.json()
    except ValueError:
        return None


def add(checks: list[Check], name: str, passed: bool, response: requests.Response | None,
        elapsed: float | None, detail: str, url: str) -> None:
    checks.append(Check(name, passed, response.status_code if response else None, detail, url, elapsed))


def run(args: argparse.Namespace) -> int:
    base = clean_base(args.url)
    api = base + "/api"
    checks: list[Check] = []
    session = requests.Session()
    session.headers.update({"User-Agent": "MWM-Deployment-Gate/1.0"})

    # 1. Root must be the application, not a component/mockup server.
    root_url = base + "/"
    response, elapsed, error = request(session, "GET", root_url)
    location = response.headers.get("Location", "") if response else ""
    root_body = body_text(response)
    mockup_signature = (
        "/__mockup" in location
        or "Component Preview Server" in root_body
        or "public base URL of /__mockup" in root_body
    )
    add(
        checks,
        "root_is_application_not_mockup",
        bool(response and response.status_code in {200, 304} and not mockup_signature),
        response,
        elapsed,
        f"status={response.status_code if response else None}; location={location!r}; "
        f"mockup_signature={mockup_signature}; error={error}",
        root_url,
    )

    # 2. Health endpoint must exist and return a JSON success signal.
    health_candidates = [api + "/healthz", api + "/health", base + "/healthz"]
    health_passed = False
    health_details: list[str] = []
    for health_url in health_candidates:
        response, elapsed, error = request(session, "GET", health_url)
        payload = body_json(response)
        ok = bool(response and response.status_code == 200 and isinstance(payload, dict)
                  and payload.get("status") in {"ok", "healthy", "UP"})
        health_details.append(f"{health_url}: status={response.status_code if response else None}, body={body_text(response)[:180]!r}")
        if ok:
            health_passed = True
            break
    add(checks, "health_endpoint", health_passed, response, elapsed,
        "; ".join(health_details), health_url)

    # 3. Login must be a real API route and return a session token.
    email = args.email
    password = args.password
    login_url = api + "/auth/login-email"
    response, elapsed, error = request(
        session,
        "POST",
        login_url,
        headers={"Content-Type": "application/json"},
        json={"email": email, "password": password},
    )
    login_payload = body_json(response)
    token = login_payload.get("token") if isinstance(login_payload, dict) else None
    add(
        checks,
        "tester_login_returns_token",
        bool(response and response.status_code == 200 and token),
        response,
        elapsed,
        f"body={body_text(response)!r}; error={error}",
        login_url,
    )

    # 4. Authenticated user endpoint must return a tester identity.
    user_url = api + "/auth/user"
    response_user = None
    if token:
        response_user, elapsed_user, error_user = request(
            session, "GET", user_url, headers={"Authorization": f"Bearer {token}"}
        )
        payload_user = body_json(response_user)
        user_passed = bool(
            response_user and response_user.status_code == 200 and isinstance(payload_user, dict)
            and payload_user.get("role") == "tester"
        )
        detail_user = f"body={body_text(response_user)!r}; error={error_user}"
    else:
        elapsed_user = None
        user_passed = False
        detail_user = "Skipped because login returned no token"
    add(checks, "authenticated_user_is_tester", user_passed, response_user, elapsed_user, detail_user, user_url)

    # 5. At least one core business API endpoint must be a real JSON application route.
    businesses_url = api + "/businesses?search=restaurant&city=Atlanta"
    response_businesses, elapsed_businesses, error_businesses = request(
        session, "GET", businesses_url,
        headers={"Authorization": f"Bearer {token}"} if token else {},
    )
    payload_businesses = body_json(response_businesses)
    business_passed = bool(
        response_businesses and response_businesses.status_code == 200
        and isinstance(payload_businesses, (list, dict))
        and not isinstance(payload_businesses, str)
    )
    add(checks, "business_search_is_real_json_route", business_passed, response_businesses,
        elapsed_businesses, f"body={body_text(response_businesses)!r}; error={error_businesses}", businesses_url)

    # 6. Optional 30-login check. This is deliberately read-only apart from session creation.
    if args.run_30_logins:
        def one_login(number: int) -> dict[str, Any]:
            email_n = f"manus.tester.{number:02d}@mwm.audit"
            response_n, elapsed_n, error_n = request(
                requests.Session(), "POST", login_url,
                headers={"Content-Type": "application/json"},
                json={"email": email_n, "password": password},
            )
            payload_n = body_json(response_n)
            return {
                "account": number,
                "status": response_n.status_code if response_n else None,
                "token": bool(isinstance(payload_n, dict) and payload_n.get("token")),
                "elapsed_ms": elapsed_n,
                "error": error_n,
                "body": body_text(response_n)[:180],
            }

        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
            login_results = list(executor.map(one_login, range(1, 31)))
        passed_30 = sum(1 for item in login_results if item["status"] == 200 and item["token"])
        checks.append(Check(
            "thirty_tester_logins",
            passed_30 == 30,
            200 if passed_30 == 30 else None,
            f"passed={passed_30}/30; results={json.dumps(login_results)}",
            login_url,
            None,
        ))

    failed = [item for item in checks if not item.passed]
    result = {
        "deployment": base,
        "passed": not failed,
        "failed_checks": [item.name for item in failed],
        "checks": [asdict(item) for item in checks],
    }
    print(json.dumps(result, indent=2))
    if failed:
        print("\nDEPLOYMENT GATE: FAIL", file=sys.stderr)
        print("Reason(s): " + ", ".join(item.name for item in failed), file=sys.stderr)
        return 1
    print("\nDEPLOYMENT GATE: PASS", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an MWM deployment before functional testing")
    parser.add_argument("--url", required=True, help="Application origin, for example https://your-app.replit.dev")
    parser.add_argument("--email", default="manus.tester.01@mwm.audit")
    parser.add_argument("--password", required=True, help="Disposable tester password")
    parser.add_argument("--run-30-logins", action="store_true")
    args = parser.parse_args()
    try:
        return run(args)
    except ValueError as exc:
        print(f"INPUT ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
