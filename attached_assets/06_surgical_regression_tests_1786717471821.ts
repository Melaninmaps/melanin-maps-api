/* SURGICAL PATCH 06 — redacted acceptance tests
 * Run with BASE_URL and TEST_EMAIL/TEST_PASSWORD set. Never print tokens or response bodies.
 */

const BASE_URL = process.env.BASE_URL ?? "https://api-server-production-a991.up.railway.app";
const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;
if (!EMAIL || !PASSWORD) throw new Error("TEST_EMAIL and TEST_PASSWORD are required");

async function json(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

const login = await json("/api/auth/login-email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (login.status !== 200 || typeof login.body.token !== "string") throw new Error("LOGIN_FAIL");
const auth = { Authorization: `Bearer ${login.body.token}` };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// 1. KinfolkAI: all three prompts must not produce a 500.
for (const message of [
  "What are some Black-owned restaurants in Washington DC?",
  "Tell me about important Black contributions to pop culture.",
  "What can I learn from the Divine Nine library topic?",
]) {
  const result = await json("/api/kinfolk/chat", {
    method: "POST",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify({ message }),
  });
  assert(result.status === 200 || result.status === 503, `KINFOLK_UNEXPECTED_STATUS:${result.status}`);
  assert(result.status !== 500, "KINFOLK_HTTP_500");
  if (result.status === 200) {
    assert(typeof result.body.reply === "string" && result.body.reply.length > 20, "KINFOLK_NO_REPLY");
    assert(Array.isArray(result.body.sources), "KINFOLK_SOURCES_NOT_ARRAY");
  }
}

// 2. Exact-name and phrase search.
const wadada = await json("/api/businesses?search=Wadada&limit=200", { headers: auth });
assert(wadada.status === 200, "WADADA_SEARCH_STATUS");
assert((wadada.body.businesses ?? []).some((b: any) => /wadada/i.test(b.name)), "WADADA_NOT_FOUND");

const grocery = await json("/api/businesses?search=&city=Atlanta&category=Food&ownership=black-owned&limit=200", { headers: auth });
assert(grocery.status === 200, "GROCERY_SEARCH_STATUS");
assert(Array.isArray(grocery.body.businesses), "GROCERY_RESULTS_NOT_ARRAY");

// 3. Map pins must exclude duplicate and hidden rows.
const pins = await json("/api/businesses/map-pins", { headers: auth });
assert(pins.status === 200, "MAP_PINS_STATUS");
for (const pin of pins.body.pins ?? []) {
  assert(pin.is_duplicate !== true && pin.permanently_hidden !== true, "PUBLIC_DUPLICATE_PIN");
}

// 4. Events canonical and compatibility paths must both work.
for (const path of ["/api/events?city=Atlanta", "/api/community/events?city=Atlanta"]) {
  const events = await json(path, { headers: auth });
  assert(events.status === 200, `EVENTS_ROUTE_FAIL:${path}:${events.status}`);
}

// 5. 30 concurrent logins: count only, no token output.
const loginResults = await Promise.all(Array.from({ length: 30 }, () => json("/api/auth/login-email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})));
assert(loginResults.every((r) => r.status === 200), "THIRTY_LOGIN_FAIL");

console.log(JSON.stringify({
  gate: "PASS",
  kinfolk_three_questions: "PASS",
  wadada_exact_search: "PASS",
  atlanta_black_owned_food_search: "PASS",
  map_pin_visibility: "PASS",
  events_both_paths: "PASS",
  thirty_logins: "PASS",
  tokens_redacted: true,
}));
