#!/usr/bin/env python3
"""MWM pre-tour production health gate. No writes; no token/body output."""
import concurrent.futures
import json
import os
import statistics
import sys
import time
import requests

BASE = os.environ.get("BASE_URL", "https://api-server-production-a991.up.railway.app").rstrip("/")
EMAIL = os.environ.get("MWM_MONITOR_EMAIL")
PASSWORD = os.environ.get("MWM_MONITOR_PASSWORD")
if not EMAIL or not PASSWORD:
    print("FAIL: set MWM_MONITOR_EMAIL and MWM_MONITOR_PASSWORD in the environment", file=sys.stderr)
    sys.exit(2)

READ_PATHS = [
    "/api/healthz",
    "/api/businesses?limit=1",
    "/api/businesses/map-pins",
    "/api/library/topics?limit=1",
    "/api/library/collections",
    "/api/events?limit=1",
    "/api/cultural-sites?limit=1",
]
CHAT_QUESTIONS = [
    ("food", "What are some Black-owned restaurants in Atlanta?"),
    ("pop_culture", "Tell me about important Black contributions to pop culture."),
    ("library", "What can I learn from the Divine Nine library topic?"),
]

def safe_json(r):
    try: return r.json()
    except Exception: return {}

def request_check(path, headers=None):
    t = time.perf_counter()
    try:
        r = requests.get(BASE + path, headers=headers or {}, timeout=30)
        body = safe_json(r)
        return {"path": path, "status": r.status_code, "ms": round((time.perf_counter()-t)*1000, 1), "json": isinstance(body, (dict, list))}
    except Exception as e:
        return {"path": path, "status": None, "ms": round((time.perf_counter()-t)*1000, 1), "error_type": type(e).__name__}

def main():
    report = {"base_url": BASE, "checks": [], "tokens_redacted": True, "response_bodies_redacted": True}
    # Root and health are intentionally unauthenticated checks.
    for path in ["/", "/api/healthz"]:
        report["checks"].append(request_check(path))
    # Dedicated monitoring login. Token is kept only in memory.
    t = time.perf_counter()
    try:
        login = requests.post(BASE + "/api/auth/login-email", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
        payload = safe_json(login)
        token = payload.get("token") if isinstance(payload, dict) else None
        report["login"] = {"status": login.status_code, "ms": round((time.perf_counter()-t)*1000, 1), "token_received": bool(token)}
    except Exception as e:
        report["login"] = {"status": None, "token_received": False, "error_type": type(e).__name__}
        token = None
    if not token:
        report["result"] = "FAIL"
        print(json.dumps(report, indent=2)); sys.exit(1)
    headers = {"Authorization": f"Bearer {token}"}
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(READ_PATHS)) as pool:
        report["checks"].extend(pool.map(lambda p: request_check(p, headers), READ_PATHS[1:]))
    # Three sequential smoke questions keep this as a health gate, not a load test.
    report["kinfolk"] = []
    for name, question in CHAT_QUESTIONS:
        t = time.perf_counter()
        try:
            r = requests.post(BASE + "/api/kinfolk/chat", headers={**headers, "Content-Type": "application/json"}, json={"message": question}, timeout=90)
            body = safe_json(r)
            reply = body.get("reply") if isinstance(body, dict) else None
            report["kinfolk"].append({"name": name, "status": r.status_code, "ms": round((time.perf_counter()-t)*1000, 1), "has_reply": isinstance(reply, str) and len(reply.strip()) > 20, "degraded": body.get("degraded") if isinstance(body, dict) else None, "has_sources": isinstance(body.get("sources"), list) if isinstance(body, dict) else False})
        except Exception as e:
            report["kinfolk"].append({"name": name, "status": None, "error_type": type(e).__name__})
    all_http_ok = all(x.get("status") == 200 for x in report["checks"] + [report["login"]] + report["kinfolk"])
    all_json = all(x.get("json", True) for x in report["checks"])
    all_replies = all(x.get("has_reply") for x in report["kinfolk"])
    report["result"] = "PASS" if all_http_ok and all_json and all_replies else "FAIL"
    print(json.dumps(report, indent=2))
    sys.exit(0 if report["result"] == "PASS" else 1)

if __name__ == "__main__": main()
