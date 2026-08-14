import concurrent.futures
import json
import os
import statistics
import time
from typing import Any
import requests

BASE = os.environ.get("BASE_URL", "https://api-server-production-a991.up.railway.app").rstrip("/")
PASSWORD = os.environ.get("TEST_PASSWORD", "ManusAudit@2026!")
EMAILS = [f"manus.tester.{i:02d}@mwm.audit" for i in range(1, 31)]

READ_PATHS = [
    "/api/auth/user",
    "/api/businesses?limit=20",
    "/api/businesses/map-pins",
    "/api/library/topics?limit=20",
    "/api/library/collections",
    "/api/events?limit=20",
    "/api/cultural-sites?limit=20",
]

def safe_json(resp: requests.Response) -> Any:
    try:
        return resp.json()
    except Exception:
        return None

def one_user(email: str) -> dict[str, Any]:
    result: dict[str, Any] = {"account": email.split("@")[0], "login_status": None, "requests": []}
    session = requests.Session()
    started = time.perf_counter()
    try:
        resp = session.post(
            f"{BASE}/api/auth/login-email",
            json={"email": email, "password": PASSWORD},
            timeout=25,
        )
        result["login_ms"] = round((time.perf_counter() - started) * 1000, 1)
        result["login_status"] = resp.status_code
        payload = safe_json(resp) or {}
        token = payload.get("token")
        if resp.status_code != 200 or not isinstance(token, str) or not token:
            result["login_ok"] = False
            return result
        # Deliberately do not record the token. Use a per-user session only in memory.
        session.headers.update({"Authorization": f"Bearer {token}"})
        result["login_ok"] = True
        for path in READ_PATHS:
            t0 = time.perf_counter()
            try:
                r = session.get(f"{BASE}{path}", timeout=25)
                body = safe_json(r)
                item: dict[str, Any] = {
                    "path": path,
                    "status": r.status_code,
                    "ms": round((time.perf_counter() - t0) * 1000, 1),
                    "json": isinstance(body, (dict, list)),
                }
                if isinstance(body, dict):
                    if path.endswith("/businesses?limit=20"):
                        item["business_count"] = len(body.get("businesses", [])) if isinstance(body.get("businesses"), list) else None
                    elif path.endswith("/map-pins"):
                        item["pin_count"] = len(body.get("pins", [])) if isinstance(body.get("pins"), list) else None
                    elif "library/topics" in path:
                        item["topic_count"] = len(body.get("topics", [])) if isinstance(body.get("topics"), list) else None
                    elif "collections" in path:
                        item["collection_count"] = len(body.get("collections", [])) if isinstance(body.get("collections"), list) else None
                result["requests"].append(item)
            except Exception as exc:
                result["requests"].append({"path": path, "error_type": type(exc).__name__})
    except Exception as exc:
        result["login_ok"] = False
        result["login_error_type"] = type(exc).__name__
    return result

def main() -> None:
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as pool:
        results = list(pool.map(one_user, EMAILS))
    elapsed = round((time.perf_counter() - started) * 1000, 1)
    login_ok = sum(1 for r in results if r.get("login_ok"))
    all_request_items = [item for r in results for item in r.get("requests", [])]
    status_counts: dict[str, int] = {}
    for item in all_request_items:
        key = str(item.get("status", "ERROR"))
        status_counts[key] = status_counts.get(key, 0) + 1
    by_path: dict[str, dict[str, Any]] = {}
    for path in READ_PATHS:
        items = [i for i in all_request_items if i.get("path") == path]
        statuses: dict[str, int] = {}
        latencies = []
        for i in items:
            status = str(i.get("status", "ERROR"))
            statuses[status] = statuses.get(status, 0) + 1
            if isinstance(i.get("ms"), (int, float)):
                latencies.append(i["ms"])
        by_path[path] = {
            "completed": len(items),
            "status_counts": statuses,
            "median_ms": statistics.median(latencies) if latencies else None,
            "max_ms": max(latencies) if latencies else None,
        }
    print(json.dumps({
        "base_url": BASE,
        "users_attempted": 30,
        "login_ok": login_ok,
        "login_failed": 30 - login_ok,
        "total_elapsed_ms": elapsed,
        "request_status_counts": status_counts,
        "by_path": by_path,
        "tokens_redacted": True,
        "writes_performed": False,
        "result": "PASS" if login_ok == 30 and all(v["status_counts"].get("200", 0) == 30 for v in by_path.values()) else "FAIL",
    }, indent=2))

if __name__ == "__main__":
    main()
