import concurrent.futures
import json
import os
import time
import requests

BASE = os.environ.get("BASE_URL", "https://api-server-production-a991.up.railway.app").rstrip("/")
PASSWORD = os.environ.get("TEST_PASSWORD", "ManusAudit@2026!")
EMAILS = [f"manus.tester.{i:02d}@mwm.audit" for i in range(1, 31)]

def request_with_retry(method, url, **kwargs):
    for attempt in range(4):
        response = requests.request(method, url, **kwargs)
        if response.status_code != 429:
            return response
        time.sleep(2.0 * (attempt + 1))
    return response

def check(email):
    expected = email.split("@")[0]
    try:
        r = request_with_retry("POST", f"{BASE}/api/auth/login-email", json={"email": email, "password": PASSWORD}, timeout=25)
        p = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        token = p.get("token")
        if r.status_code != 200 or not token:
            return {"account": expected, "ok": False, "stage": "login", "status": r.status_code}
        u = request_with_retry("GET", f"{BASE}/api/auth/user", headers={"Authorization": f"Bearer {token}"}, timeout=25)
        up = u.json() if u.headers.get("content-type", "").startswith("application/json") else {}
        returned_email = str((up.get("user") or {}).get("email", ""))
        returned = returned_email.split("@")[0]
        return {"account": expected, "ok": u.status_code == 200 and returned == expected, "status": u.status_code}
    except Exception as e:
        return {"account": expected, "ok": False, "stage": type(e).__name__}

# Five workers avoids turning the identity check itself into a rate-limit test.
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
    rows = list(ex.map(check, EMAILS))
print(json.dumps({
    "users": 30,
    "identity_matches": sum(1 for r in rows if r.get("ok")),
    "failures": [r for r in rows if not r.get("ok")],
    "tokens_redacted": True,
    "result": "PASS" if all(r.get("ok") for r in rows) else "FAIL",
}, indent=2))
