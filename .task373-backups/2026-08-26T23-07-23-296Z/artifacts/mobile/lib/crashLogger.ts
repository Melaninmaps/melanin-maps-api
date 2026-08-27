/**
 * crashLogger.ts — comprehensive mobile crash instrumentation
 *
 * Captures:
 *   • JS exceptions (global error handler)
 *   • Unhandled promise rejections
 *   • Navigation breadcrumbs (current route history, last 20 entries)
 *   • App state changes (foreground / background / inactive)
 *   • Memory warning events (iOS low-memory notifications)
 *   • Last 10 API requests (URL, method, status, duration, timestamp)
 *   • Map / location state (permission status, last coords, loading flag)
 *   • Build metadata (version, build number, platform, commit SHA)
 *
 * Storage:
 *   • AsyncStorage key @__crash_v2__ (persisted across launches)
 *   • POST /api/crash-reports on the MWM API server (visible in Railway logs)
 *
 * Usage:
 *   installCrashLogger()             — call once at module level (replaces old IIFE)
 *   addNavBreadcrumb(route)          — call on every route change
 *   addApiBreadcrumb(req)            — called by the fetch interceptor
 *   setAppStateBreadcrumb(state)     — called by AppState listener
 *   setMapState(state)               — called by map components
 *   checkAndSendSavedCrash()         — call on launch to replay unsent crash
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BreadcrumbType =
  | "navigation"
  | "api"
  | "app_state"
  | "memory"
  | "location"
  | "map";

export interface Breadcrumb {
  type: BreadcrumbType;
  message: string;
  data?: Record<string, unknown>;
  ts: string;
}

export interface ApiRecord {
  url: string;
  method: string;
  status?: number;
  durationMs?: number;
  ts: string;
  error?: string;
}

export interface MapState {
  permissionStatus?: string;
  lastLat?: number;
  lastLng?: number;
  loading?: boolean;
  error?: string;
}

export interface CrashReport {
  id: string;
  ts: string;
  type: "js_exception" | "unhandled_rejection" | "js_fatal" | "error_boundary";
  error: { name?: string; message: string; stack: string };
  context: {
    currentScreen: string;
    appState: string;
    breadcrumbs: Breadcrumb[];
    lastApiRequests: ApiRecord[];
    mapState: MapState;
    platform: string;
    osVersion: string | number;
    buildNumber: string;
    version: string;
    commitSha: string;
  };
  sent: boolean;
}

// ─── Sentry bridge (disabled — native SDK removed from Build 101+) ─────────────
//
// @sentry/react-native was removed because the native KSCrash module caused a
// pre-JS crash on Build 100 before any UI could render. The JS crash logger
// (AsyncStorage + Railway POST) remains fully active.
//
// To re-enable Sentry: add @sentry/react-native back to package.json, restore
// the Expo plugin in app.config.js, and test on a dev/preview build with a
// confirmed SENTRY_DSN before shipping to production.

type SentryCaptureFn = (err: Error, extras?: Record<string, unknown>) => void;
let _sentryCaptureException: SentryCaptureFn | null = null;

/** No-op — Sentry not active. Kept for API compatibility. */
export function injectSentryCaptureException(fn: SentryCaptureFn): void {
  _sentryCaptureException = fn;
}

// ─── In-memory state ──────────────────────────────────────────────────────────

const MAX_BREADCRUMBS = 20;
const MAX_API_RECORDS = 10;
const STORAGE_KEY = "@__crash_v2__";

const _breadcrumbs: Breadcrumb[] = [];
const _apiRecords: ApiRecord[] = [];
let _currentScreen = "unknown";
let _appState = "active";
let _mapState: MapState = {};

// ─── Build metadata (read from Expo constants if available) ───────────────────

function getBuildMeta() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    return {
      version: Constants.expoConfig?.version ?? "unknown",
      buildNumber:
        (Platform.OS === "ios"
          ? Constants.expoConfig?.ios?.buildNumber
          : String(Constants.expoConfig?.android?.versionCode)) ?? "unknown",
      commitSha: Constants.expoConfig?.extra?.commitSha ?? "unknown",
    };
  } catch {
    return { version: "unknown", buildNumber: "unknown", commitSha: "unknown" };
  }
}

// ─── Breadcrumb helpers ───────────────────────────────────────────────────────

function pushBreadcrumb(bc: Breadcrumb): void {
  _breadcrumbs.push(bc);
  if (_breadcrumbs.length > MAX_BREADCRUMBS) _breadcrumbs.shift();
}

export function addNavBreadcrumb(route: string): void {
  _currentScreen = route;
  pushBreadcrumb({ type: "navigation", message: `→ ${route}`, ts: new Date().toISOString() });
}

export function setAppStateBreadcrumb(state: string): void {
  _appState = state;
  pushBreadcrumb({ type: "app_state", message: `app_state: ${state}`, ts: new Date().toISOString() });
}

export function addMemoryWarningBreadcrumb(): void {
  pushBreadcrumb({ type: "memory", message: "⚠️ memory warning received", ts: new Date().toISOString() });
}

export function setMapState(state: Partial<MapState>): void {
  _mapState = { ..._mapState, ...state };
  pushBreadcrumb({
    type: "map",
    message: `map: ${JSON.stringify(state)}`,
    ts: new Date().toISOString(),
  });
}

// ─── API fetch interceptor ────────────────────────────────────────────────────
// Wraps global fetch to record the last MAX_API_RECORDS requests.
// Does NOT alter request or response behaviour.

function installFetchInterceptor(): void {
  const origFetch = global.fetch;
  if (!origFetch || (global.fetch as any).__mwm_instrumented) return;

  global.fetch = async function instrumentedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const start = Date.now();
    const rec: ApiRecord = { url, method, ts: new Date().toISOString() };

    try {
      const resp = await origFetch(input, init);
      rec.status = resp.status;
      rec.durationMs = Date.now() - start;
      pushApiRecord(rec);
      return resp;
    } catch (err: unknown) {
      rec.durationMs = Date.now() - start;
      rec.error = err instanceof Error ? err.message : String(err);
      pushApiRecord(rec);
      throw err;
    }
  };

  (global.fetch as any).__mwm_instrumented = true;
}

function pushApiRecord(rec: ApiRecord): void {
  _apiRecords.push(rec);
  if (_apiRecords.length > MAX_API_RECORDS) _apiRecords.shift();
}

// ─── Crash report builder ─────────────────────────────────────────────────────

function buildReport(
  type: CrashReport["type"],
  err: Error,
): CrashReport {
  const meta = getBuildMeta();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    type,
    error: {
      name: err.name,
      message: err.message ?? String(err),
      stack: err.stack ?? "(no stack)",
    },
    context: {
      currentScreen: _currentScreen,
      appState: _appState,
      breadcrumbs: [..._breadcrumbs],
      lastApiRequests: [..._apiRecords],
      mapState: { ..._mapState },
      platform: Platform.OS,
      osVersion: Platform.Version,
      buildNumber: meta.buildNumber,
      version: meta.version,
      commitSha: meta.commitSha,
    },
    sent: false,
  };
}

// ─── Persistence & transmission ───────────────────────────────────────────────

async function saveAndSend(report: CrashReport): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(report));
  } catch {}

  // Also keep the legacy key so the existing AlertCrashReader in _layout.tsx
  // still shows the quick alert on next launch if the debug screen isn't open.
  try {
    await AsyncStorage.setItem(
      "@__crash__",
      JSON.stringify({ msg: report.error.message, stack: report.error.stack.slice(0, 800), fatal: report.type === "js_fatal", ts: report.ts }),
    );
  } catch {}

  sendToServer(report).then(async (sent) => {
    if (sent) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...report, sent: true }));
      } catch {}
    }
  }).catch(() => {});
}

async function sendToServer(report: CrashReport): Promise<boolean> {
  try {
    const base = (await import("./api")).getApiBase();
    if (!base) return false;
    const resp = await fetch(`${base}/api/crash-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      // Bypass our own interceptor to avoid infinite recursion
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * On launch: if there is a saved crash from the previous session that was not
 * successfully sent to the server, retry sending it now.
 */
export async function checkAndSendSavedCrash(): Promise<CrashReport | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const report: CrashReport = JSON.parse(raw);
    if (!report.sent) {
      const sent = await sendToServer(report);
      if (sent) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...report, sent: true }));
      }
    }
    return report;
  } catch {
    return null;
  }
}

/**
 * Read the saved crash report (for the debug screen).
 */
export async function getSavedCrashReport(): Promise<CrashReport | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearSavedCrashReport(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem("@__crash__");
  } catch {}
}

/**
 * reportErrorBoundary — called by ErrorBoundary.onError
 *
 * Builds and sends a crash report typed "error_boundary" so React render-tree
 * errors (component exceptions that don't bubble to the global error handler)
 * are captured in the same pipeline as JS exceptions and unhandled rejections.
 */
export function reportErrorBoundary(error: Error, componentStack: string): void {
  // Append componentStack to the error stack so it's visible in Railway logs.
  const enriched = new Error(error.message);
  enriched.name = error.name ?? "ErrorBoundary";
  enriched.stack = `${error.stack ?? error.message}\n\nComponent Stack:${componentStack}`;
  // Forward to Sentry first (if wired) so the event includes the full
  // component stack in the Sentry UI before the process potentially terminates.
  try {
    _sentryCaptureException?.(enriched, { type: "error_boundary", componentStack });
  } catch { /* never block the crash logger */ }
  const report = buildReport("error_boundary", enriched);
  saveAndSend(report).catch(() => {});
}

// ─── Global error handler installation ───────────────────────────────────────

let _installed = false;

export function installCrashLogger(): void {
  if (_installed) return;
  _installed = true;

  // ── 1. JS exception handler (catches fatal + non-fatal JS errors) ──────────
  try {
    const prev = (global as any).ErrorUtils?.getGlobalHandler?.();
    (global as any).ErrorUtils?.setGlobalHandler?.((err: Error, isFatal?: boolean) => {
      const type: CrashReport["type"] = isFatal ? "js_fatal" : "js_exception";
      const asErr = err instanceof Error ? err : new Error(String(err));
      // Forward to Sentry before saving locally — ensures the event is captured
      // even if the process terminates before AsyncStorage write completes.
      try { _sentryCaptureException?.(asErr, { type, isFatal }); } catch {}
      const report = buildReport(type, asErr);
      saveAndSend(report).catch(() => {});
      if (prev) prev(err, isFatal);
    });
  } catch {}

  // ── 2. Unhandled promise rejection handler ─────────────────────────────────
  try {
    const nativeHPR = (global as any).HermesInternal?.hasPromise
      ? (global as any).Promise
      : null;
    if (nativeHPR && typeof (global as any).HermesInternal?.enablePromiseRejectionTracker === "function") {
      // Hermes runtime — use the rejection tracker API
      (global as any).HermesInternal.enablePromiseRejectionTracker({
        allRejections: true,
        onUnhandled: (_id: number, err: unknown) => {
          const asErr = err instanceof Error ? err : new Error(String(err));
          try { _sentryCaptureException?.(asErr, { type: "unhandled_rejection" }); } catch {}
          const report = buildReport("unhandled_rejection", asErr);
          saveAndSend(report).catch(() => {});
        },
      });
    }
  } catch {}

  // ── 3. Fetch interceptor ───────────────────────────────────────────────────
  try {
    installFetchInterceptor();
  } catch {}
}
