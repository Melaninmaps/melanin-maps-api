/**
 * City Request Tracker
 *
 * Lightweight in-process middleware that:
 *   1. Detects which city a request is scoped to (from ?city=, ?slug=, body.home_city,
 *      or path segments like /city-launches/:slug).
 *   2. Records per-request timing and HTTP status into an in-memory ring buffer.
 *   3. Flushes aggregated 5-minute windows to the `city_request_log` DB table
 *      via an upsert — safe to run on every cycle, idempotent.
 *
 * Design constraints:
 *   - Zero DB round-trips on the hot path (recording is purely in-memory).
 *   - Flush is fire-and-forget; failures are logged but do not crash the server.
 *   - Uses pool.query() (not pool.connect()) so no connections are leaked.
 */

import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";

// ── In-memory accumulator ────────────────────────────────────────────────────

type Bucket = {
  requestCount: number;
  errorCount: number;
  totalMs: number;
};

/** Keyed by slug. One bucket per city, reset after every flush. */
const buckets = new Map<string, Bucket>();

function getOrCreate(slug: string): Bucket {
  let b = buckets.get(slug);
  if (!b) {
    b = { requestCount: 0, errorCount: 0, totalMs: 0 };
    buckets.set(slug, b);
  }
  return b;
}

// ── City slug extraction ─────────────────────────────────────────────────────

const CITY_SLUG_RE = /\/city-launches\/([a-z0-9-]+)/i;

function extractCitySlug(req: Request): string | null {
  // 1. Path contains /city-launches/:slug
  const pathMatch = req.path.match(CITY_SLUG_RE);
  if (pathMatch?.[1]) return pathMatch[1].toLowerCase();

  // 2. Query string ?city= or ?slug=
  const qCity = req.query["city"] ?? req.query["slug"];
  if (typeof qCity === "string" && qCity) return qCity.toLowerCase().replace(/\s+/g, "-");

  // 3. Parsed JSON body (only present after express.json() ran)
  const body = req.body as Record<string, unknown> | undefined;
  if (body) {
    const bodyCity = body["city"] ?? body["home_city"] ?? body["citySlug"];
    if (typeof bodyCity === "string" && bodyCity) {
      return bodyCity.toLowerCase().replace(/\s+/g, "-");
    }
  }

  return null;
}

// ── Express middleware ───────────────────────────────────────────────────────

export function cityRequestMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const slug = extractCitySlug(req);
    if (!slug) return;

    const ms = Date.now() - start;
    const isError = res.statusCode >= 400;

    const b = getOrCreate(slug);
    b.requestCount += 1;
    if (isError) b.errorCount += 1;
    b.totalMs += ms;
  });

  next();
}

// ── DB flush ─────────────────────────────────────────────────────────────────

/** Truncates to the nearest 5-minute boundary (UTC). */
function currentPeriodStart(): Date {
  const now = new Date();
  const ms = now.getTime();
  const fiveMin = 5 * 60 * 1000;
  return new Date(Math.floor(ms / fiveMin) * fiveMin);
}

let flushInterval: ReturnType<typeof setInterval> | null = null;

export function startCityRequestFlush(): void {
  if (flushInterval) return; // already running

  // Flush every 5 minutes
  flushInterval = setInterval(
    () => { void flushBuckets(); },
    5 * 60 * 1000,
  );
}

export function stopCityRequestFlush(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

async function flushBuckets(): Promise<void> {
  if (buckets.size === 0) return;

  // Snapshot and reset atomically
  const snapshot = new Map(buckets);
  buckets.clear();

  const periodStart = currentPeriodStart();

  for (const [slug, b] of snapshot) {
    if (b.requestCount === 0) continue;
    const avgMs = b.requestCount > 0 ? b.totalMs / b.requestCount : 0;

    try {
      await pool.query(
        `INSERT INTO city_request_log (slug, period_start, request_count, error_count, avg_ms)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug, period_start) DO UPDATE SET
           request_count = city_request_log.request_count + EXCLUDED.request_count,
           error_count   = city_request_log.error_count   + EXCLUDED.error_count,
           avg_ms        = ROUND(((city_request_log.avg_ms * city_request_log.request_count)
                            + (EXCLUDED.avg_ms * EXCLUDED.request_count))
                           / NULLIF(city_request_log.request_count + EXCLUDED.request_count, 0)::numeric, 2)`,
        [slug, periodStart.toISOString(), b.requestCount, b.errorCount, Math.round(avgMs)],
      );
    } catch {
      // Non-critical — silently ignore; data is lost for this period only.
    }
  }
}
