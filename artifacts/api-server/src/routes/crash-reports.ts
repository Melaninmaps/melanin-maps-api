/**
 * POST /api/crash-reports
 *
 * Receives crash reports from the mobile app and logs them as structured
 * JSON to Railway's log stream. No authentication required — crashes can
 * happen before or during login, and the data is diagnostic, not sensitive.
 *
 * Rate-limited to 10 reports per IP per 5 minutes to prevent log flooding.
 *
 * Each report is logged at ERROR level so Railway's alert threshold catches
 * it immediately. Also stored in a 50-report in-memory ring buffer accessible
 * via GET /api/crash-reports/recent (x-cron-secret auth).
 */

import { Router, type Request, type Response } from "express";
import pino from "pino";

const router = Router();
const logger = pino({ name: "crash-reports" });

// ── In-memory ring buffer ─────────────────────────────────────────────────────
const MAX_STORED = 50;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _recent: any[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pushRecent(report: any): void {
  _recent.push(report);
  if (_recent.length > MAX_STORED) _recent.shift();
}

// ── Lightweight per-IP rate limiter ──────────────────────────────────────────
const _ipCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const LIMIT = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = _ipCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    _ipCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > LIMIT;
}

// Periodically clean expired entries to avoid memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of _ipCounts.entries()) {
    if (now > entry.resetAt) _ipCounts.delete(ip);
  }
}, WINDOW_MS).unref();

// ── POST /api/crash-reports ───────────────────────────────────────────────────
router.post("/crash-reports", (req: Request, res: Response) => {
  const ip = req.ip ?? "unknown";

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  try {
    const body = req.body ?? {};

    // Validate minimum shape
    if (!body.type || !body.error?.message) {
      res.status(400).json({ error: "Invalid crash report shape" });
      return;
    }

    const report = {
      ...body,
      receivedAt: new Date().toISOString(),
      sourceIp: ip,
    };

    // Log at ERROR level — this appears prominently in Railway and any log
    // alerting configured on the account.
    logger.error(
      {
        event: "MOBILE_CRASH_REPORT",
        crashType: report.type,
        errorName: report.error?.name,
        errorMessage: report.error?.message,
        currentScreen: report.context?.currentScreen,
        appState: report.context?.appState,
        platform: report.context?.platform,
        osVersion: report.context?.osVersion,
        buildNumber: report.context?.buildNumber,
        version: report.context?.version,
        commitSha: report.context?.commitSha,
        lastApiRequests: report.context?.lastApiRequests,
        breadcrumbCount: report.context?.breadcrumbs?.length,
        mapState: report.context?.mapState,
        stack: report.error?.stack?.slice(0, 2000),
      },
      "MOBILE_CRASH_REPORT",
    );

    pushRecent(report);

    res.status(201).json({ received: true, id: report.id });
  } catch (err) {
    logger.error({ err }, "crash-reports: failed to process report");
    res.status(500).json({ error: "Failed to process crash report" });
  }
});

// ── GET /api/crash-reports/recent ────────────────────────────────────────────
// Returns the last 50 crash reports received since server startup.
// Auth: x-cron-secret (same pattern as /api/pool-stats).
router.get("/crash-reports/recent", (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) { res.status(503).json({ error: "Not configured" }); return; }
  if (req.headers["x-cron-secret"] !== secret) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json({ count: _recent.length, reports: [..._recent].reverse() });
});

export default router;
