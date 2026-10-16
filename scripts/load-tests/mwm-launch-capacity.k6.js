import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import exec from "k6/execution";
import secrets from "k6/secrets";

/**
 * Core MWM capacity test for Grafana Cloud k6.
 *
 * This script is intentionally read-only from the product perspective. Its only
 * stateful transport is login/session issuance for accounts whose DB rows must
 * be marked `is_load_test=true`. Business-profile view writes are safe only
 * after the accompanying profile-view test-account safeguard is deployed.
 */
const BASE_URL = (__ENV.MWM_BASE_URL || "https://www.mappingwithmelanin.com").replace(/\/$/, "");
const TARGET_VUS = Number(__ENV.MWM_TARGET_VUS || "50");
const AUDIT_SESSION = __ENV.MWM_AUDIT_SESSION || `mwm-capacity-${Date.now()}`;
const DURATION = __ENV.MWM_CORE_DURATION || "10m";
const ALLOWED_VUS = [50, 100, 150, 200];

if (!ALLOWED_VUS.includes(TARGET_VUS)) {
  throw new Error(`MWM_TARGET_VUS must be one of ${ALLOWED_VUS.join(", ")}.`);
}
if (TARGET_VUS > 50 && __ENV.MWM_DISTRIBUTED_LOAD_ZONES !== "4") {
  throw new Error("The 100–200 VU stages require four distributed load zones (set MWM_DISTRIBUTED_LOAD_ZONES=4 only after configuring them in Grafana Cloud). ");
}
if (__ENV.MWM_PROFILE_VIEW_GUARD !== "deployed") {
  throw new Error("Refusing to load real business profiles until the is_load_test profile-view safeguard is deployed.");
}

export const options = {
  scenarios: {
    member_core_journey: {
      executor: "constant-vus",
      vus: TARGET_VUS,
      duration: DURATION,
      gracefulStop: "30s",
    },
  },
  thresholds: {
    "http_req_failed{suite:mwm_core}": [
      { threshold: "rate<0.01", abortOnFail: true, delayAbortEval: "2m" },
    ],
    "core_journey_complete": [
      { threshold: "rate>0.99", abortOnFail: true, delayAbortEval: "3m" },
    ],
    "member_auth_complete": [
      { threshold: "rate>0.99", abortOnFail: true, delayAbortEval: "2m" },
    ],
    "business_profile_complete": ["rate>0.99"],
    "mwm_unexpected_5xx": [
      { threshold: "count<3", abortOnFail: true, delayAbortEval: "2m" },
    ],
    "mwm_transport_timeout": [
      { threshold: "count<3", abortOnFail: true, delayAbortEval: "2m" },
    ],
    "http_req_duration{step:login}": ["p(95)<8000", "p(99)<12000"],
    "http_req_duration{step:directory}": ["p(95)<4000", "p(99)<8000"],
    "http_req_duration{step:profile}": ["p(95)<4000", "p(99)<8000"],
    "http_req_duration{step:map}": ["p(95)<5000", "p(99)<10000"],
  },
};

const coreJourneyComplete = new Rate("core_journey_complete");
const memberAuthComplete = new Rate("member_auth_complete");
const businessProfileComplete = new Rate("business_profile_complete");
const unexpected5xx = new Counter("mwm_unexpected_5xx");
const transportTimeout = new Counter("mwm_transport_timeout");
const loginLatency = new Trend("mwm_login_latency_ms");
const profileLatency = new Trend("mwm_profile_latency_ms");

const state = {
  authenticated: false,
  businessId: null,
  cycle: 0,
};

function accountEmail(vu) {
  return `mwm-capacity-${String(vu).padStart(3, "0")}@capacity.mwm.internal`;
}

function requestParams(step) {
  return {
    headers: {
      Accept: "application/json",
      "X-Audit-Session": AUDIT_SESSION,
    },
    tags: {
      suite: "mwm_core",
      step,
    },
    timeout: "20s",
  };
}

function jsonResponse(response, step) {
  const received = response && response.status >= 200 && response.status < 300;
  if (!response || response.status === 0) transportTimeout.add(1);
  if (response && response.status >= 500) unexpected5xx.add(1);
  const checks = check(response, {
    [`${step} returns a complete 2xx JSON response`]: (r) => received && String(r.body || "").length > 2,
  }, { step });
  let body = null;
  if (received) {
    try {
      body = response.json();
    } catch (_) {
      body = null;
    }
  }
  return { ok: received && body !== null && checks, body };
}

function authenticate(password) {
  const response = http.post(
    `${BASE_URL}/api/auth/login-email`,
    JSON.stringify({ email: accountEmail(exec.vu.idInTest), password }),
    {
      ...requestParams("login"),
      headers: {
        ...requestParams("login").headers,
        "Content-Type": "application/json",
      },
    },
  );
  loginLatency.add(response.timings.duration);
  const result = jsonResponse(response, "login");
  const valid = result.ok && typeof result.body?.token === "string";
  memberAuthComplete.add(valid);
  return valid;
}

function getJson(path, step) {
  return jsonResponse(http.get(`${BASE_URL}${path}`, requestParams(step)), step);
}

function initialCoreJourney(password) {
  const loginOk = authenticate(password);
  if (!loginOk) {
    coreJourneyComplete.add(false);
    return;
  }
  state.authenticated = true;

  const identity = getJson("/api/auth/user", "identity");
  const directory = getJson("/api/businesses?city=Philadelphia&limit=10", "directory");
  const map = getJson(
    "/api/businesses/map-pins?south=39.82&north=40.10&west=-75.34&east=-74.88&limit=100",
    "map",
  );
  const community = getJson("/api/community/posts?limit=10", "community");
  const events = getJson("/api/events?city=Philadelphia", "events");
  const library = getJson("/api/knowledge/articles?limit=10", "library");

  const directoryBusinesses = Array.isArray(directory.body?.businesses)
    ? directory.body.businesses
    : [];
  const firstBusiness = directoryBusinesses.find((business) => typeof business?.id === "string");
  state.businessId = firstBusiness?.id || null;

  let profile = { ok: false };
  if (state.businessId) {
    const response = http.get(`${BASE_URL}/api/businesses/${state.businessId}`, requestParams("profile"));
    profileLatency.add(response.timings.duration);
    profile = jsonResponse(response, "profile");
  }
  businessProfileComplete.add(profile.ok);

  const complete = identity.ok
    && directory.ok
    && map.ok
    && community.ok
    && events.ok
    && library.ok
    && profile.ok;
  coreJourneyComplete.add(complete);
}

function continueCoreJourney() {
  const route = (state.cycle++ + exec.vu.idInTest) % 6;
  if (route === 0) return getJson("/api/businesses?city=Philadelphia&limit=10", "directory");
  if (route === 1) return getJson("/api/businesses/map-pins?south=39.82&north=40.10&west=-75.34&east=-74.88&limit=100", "map");
  if (route === 2) return getJson("/api/community/posts?limit=10", "community");
  if (route === 3) return getJson("/api/events?city=Philadelphia", "events");
  if (route === 4) return getJson("/api/knowledge/articles?limit=10", "library");
  if (state.businessId) {
    const response = http.get(`${BASE_URL}/api/businesses/${state.businessId}`, requestParams("profile"));
    profileLatency.add(response.timings.duration);
    return jsonResponse(response, "profile");
  }
  return getJson("/api/businesses?city=Philadelphia&limit=10", "directory");
}

export async function setup() {
  const password = await secrets.get("mwm_capacity_200_password");
  if (!password || password.length < 16) {
    throw new Error("Grafana Cloud secret mwm_capacity_200_password is missing or too short.");
  }
  const ready = http.get(`${BASE_URL}/api/readyz`, requestParams("readyz"));
  if (ready.status !== 200) {
    throw new Error(`Production readiness preflight failed with status ${ready.status}.`);
  }
  return { password };
}

export default function (data) {
  if (!state.authenticated) {
    initialCoreJourney(data.password);
  } else {
    continueCoreJourney();
  }
  // 6–10 seconds keeps each member under ordinary per-user rate limits while
  // preserving 200 concurrent active sessions during the steady state.
  sleep(6 + (exec.vu.idInTest % 5));
}
