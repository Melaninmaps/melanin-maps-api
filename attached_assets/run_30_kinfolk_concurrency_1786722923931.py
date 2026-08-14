import concurrent.futures
import json
import os
import statistics
import time
import requests

BASE = os.environ.get("BASE_URL", "https://api-server-production-a991.up.railway.app").rstrip("/")
PASSWORD = os.environ.get("TEST_PASSWORD", "ManusAudit@2026!")
EMAILS = [f"manus.tester.{i:02d}@mwm.audit" for i in range(1, 31)]
QUESTIONS = [
    "What are some Black-owned restaurants in Atlanta?",
    "Tell me about important Black contributions to pop culture.",
    "What can I learn from the Divine Nine library topic?",
]

def login(email):
    t0 = time.perf_counter()
    try:
        r = requests.post(f"{BASE}/api/auth/login-email", json={"email": email, "password": PASSWORD}, timeout=30)
        p = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        return {"email": email, "status": r.status_code, "ms": round((time.perf_counter()-t0)*1000,1), "token": p.get("token") if r.status_code == 200 else None}
    except Exception as e:
        return {"email": email, "status": None, "ms": round((time.perf_counter()-t0)*1000,1), "error_type": type(e).__name__, "token": None}

def chat(item):
    t0 = time.perf_counter()
    email, token, question = item
    try:
        r = requests.post(
            f"{BASE}/api/kinfolk/chat",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"message": question},
            timeout=90,
        )
        try:
            body = r.json()
        except Exception:
            body = {}
        reply = body.get("reply") if isinstance(body, dict) else None
        return {
            "account": email.split("@")[0],
            "status": r.status_code,
            "ms": round((time.perf_counter()-t0)*1000,1),
            "has_reply": isinstance(reply, str) and len(reply.strip()) > 20,
            "reply_len": len(reply) if isinstance(reply, str) else 0,
            "has_sources": isinstance(body.get("sources"), list) if isinstance(body, dict) else False,
            "degraded": body.get("degraded") if isinstance(body, dict) else None,
            "error_code": body.get("code") if isinstance(body, dict) and r.status_code >= 400 else None,
        }
    except Exception as e:
        return {"account": email.split("@")[0], "status": None, "ms": round((time.perf_counter()-t0)*1000,1), "has_reply": False, "error_type": type(e).__name__}

def summarize(rows):
    status_counts = {}
    latencies = []
    for row in rows:
        key = str(row.get("status", "ERROR"))
        status_counts[key] = status_counts.get(key, 0) + 1
        if isinstance(row.get("ms"), (int, float)): latencies.append(row["ms"])
    return {
        "count": len(rows),
        "status_counts": status_counts,
        "usable_replies": sum(1 for r in rows if r.get("has_reply")),
        "with_sources_array": sum(1 for r in rows if r.get("has_sources")),
        "degraded_count": sum(1 for r in rows if r.get("degraded") is True),
        "median_ms": statistics.median(latencies) if latencies else None,
        "max_ms": max(latencies) if latencies else None,
        "error_types": sorted(set(r.get("error_type") for r in rows if r.get("error_type"))),
    }

with concurrent.futures.ThreadPoolExecutor(max_workers=30) as pool:
    logins = list(pool.map(login, EMAILS))
valid = [r for r in logins if r.get("status") == 200 and r.get("token")]
chat_inputs = [(r["email"], r["token"], QUESTIONS[i % len(QUESTIONS)]) for i, r in enumerate(valid)]
started = time.perf_counter()
with concurrent.futures.ThreadPoolExecutor(max_workers=30) as pool:
    chats = list(pool.map(chat, chat_inputs))
wall_ms = round((time.perf_counter() - started) * 1000, 1)

print(json.dumps({
    "base_url": BASE,
    "users_requested": 30,
    "login_summary": summarize(logins),
    "chat_summary": summarize(chats),
    "chat_wall_clock_ms": wall_ms,
    "questions_distributed": {"food": 10, "pop_culture": 10, "library": 10},
    "tokens_redacted": True,
    "response_bodies_redacted": True,
    "writes_performed": False,
    "result": "PASS" if len(valid) == 30 and all(r.get("status") == 200 and r.get("has_reply") for r in chats) else "FAIL",
}, indent=2))
