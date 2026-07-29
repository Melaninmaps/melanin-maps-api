import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
// SPA html bundled at build time — guaranteed present regardless of Railway filesystem layout
import { SPA_HTML as BUNDLED_SPA_HTML } from "./generated/spaHtml";
import router from "./routes";
import webSsrRouter from "./routes/web-ssr";
import privacyRouter from "./routes/privacy";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { WebhookHandlers } from "./webhookHandlers";
import { generalLimiter } from "./middleware/rateLimiter";
import { pool, getPoolStats, POOL_MAX } from "@workspace/db";
import { getHealthHistory } from "./lib/healthMonitor";

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const webPublicDir = path.join(_dirname, "public");

// Read SPA html once at startup — avoids sendFile path-resolution issues.
// Try every plausible path in order; the first one with index.html wins.
// Covers: freshly-built dist/public/, committed web-static/, and all
// cwd-relative equivalents for any Railway working-directory scenario.
const cwd = process.cwd();
const SPA_SEARCH_DIRS = [
  path.join(_dirname, "public"),                                        // <apiServerDir>/dist/public
  path.join(_dirname, "..", "web-static"),                              // <apiServerDir>/web-static
  path.join(_dirname, "..", "dist", "public"),                          // edge case
  path.join(cwd, "dist", "public"),                                     // cwd/dist/public
  path.join(cwd, "web-static"),                                         // cwd/web-static (legacy root)
  path.join(cwd, "artifacts", "api-server", "dist", "public"),         // cwd/artifacts/…/dist/public
  path.join(cwd, "artifacts", "api-server", "web-static"),             // cwd/artifacts/…/web-static
];

// Use bundled HTML (embedded at build time) as primary; file-system read as a
// refresh mechanism (picks up hot-reloaded assets in dev without a rebuild).
let spaHtml: string = BUNDLED_SPA_HTML;
let spaServeDir = webPublicDir;
for (const dir of SPA_SEARCH_DIRS) {
  try {
    spaHtml = readFileSync(path.join(dir, "index.html"), "utf8");
    spaServeDir = dir;
    break;
  } catch { /* try next */ }
}
// spaHtml is always set — worst case it's the bundled build-time snapshot

const app: Express = express();

// Trust the proxy in front of us (Replit's reverse proxy sets X-Forwarded-For)
app.set("trust proxy", 1);

// Health/readiness endpoints registered BEFORE all middleware so startup
// probes always get an immediate response — nothing (auth, rate-limit,
// pino, etc.) can block them.

// Process-only liveness: confirms the Node process is alive.
app.get("/api/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// DB-aware readiness: confirms the pg pool can execute a query.
// Used by Railway's deployment startup health check so traffic is only
// routed to the new instance once the pool is functional.
// Returns pool stats in every response for observability.
// Returns HTTP 503 if the pool is exhausted or the DB is unreachable.
app.get("/api/readyz", async (_req: Request, res: Response) => {
  const preStats = getPoolStats();
  // Fast-fail only when the pool is TRULY exhausted: all slots in use AND
  // requests are already queued waiting for a connection.
  // idle===0 alone is not sufficient — connections may be transiently in use
  // by concurrent queries while new connections can still be created (total<max).
  // Requiring waiting>0 as a third condition means we only fast-fail when
  // callers are genuinely being delayed, not just when connections are busy.
  if (preStats.idle === 0 && preStats.total >= POOL_MAX && preStats.waiting > 0) {
    res.status(503).json({
      status: "degraded",
      db: "pool_exhausted",
      pool: preStats,
      detail: `Pool at capacity (total=${preStats.total}/${POOL_MAX}, idle=0, waiting=${preStats.waiting}); not queuing probe.`,
    });
    return;
  }
  // ── SAFE PATTERN: pool.connect() with finally { client.release() } ─────────
  // Promise.race(pool.query, timeout) abandons the pg PoolClient on timeout,
  // leaking it until maxLifetimeSeconds recycles it. With POOL_MAX=8 this
  // exhausted all connections within hours (P0 incident, July 28 2026).
  // pool.connect() + finally guarantees the client is always returned.
  let client: import("pg").PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    res.json({ status: "ok", db: "ok", pool: getPoolStats() });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "unknown error";
    res.status(503).json({ status: "degraded", db: "error", pool: getPoolStats(), detail });
  } finally {
    client?.release();
  }
});

// 12-hour health history — evidence ring buffer for operational review.
// Returns results since last process startup.
app.get("/api/readyz/history", (_req: Request, res: Response) => {
  res.json(getHealthHistory());
});

// Version / build identity — used to confirm Railway is running the expected artifact.
// Returns only public build metadata; never exposes secrets, paths, or config.
app.get("/api/version", (_req: Request, res: Response) => {
  res.json({
    sha: process.env.RAILWAY_GIT_COMMIT_SHA ?? "dev",
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? "dev",
    release: "Build-97",
    env: process.env.NODE_ENV ?? "unknown",
  });
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Stripe webhook MUST be registered before express.json() parses the body.
// It needs the raw Buffer to verify the Stripe signature.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

const allowedOrigins = [
  "http://localhost",
  "http://localhost:80",
  ...(process.env.REPLIT_DOMAINS
    ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`)
    : []),
];
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // No origin = same-origin or mobile app — allow
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.some((o) => origin === o || origin.startsWith(o))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);
app.use("/api", generalLimiter);

// ── Pool pressure guard ──────────────────────────────────────────────────────
// Rejects API requests immediately with 503 when the connection pool is
// critically saturated: all slots in use, none idle, requests already queued.
//
// Without this guard, new requests queue behind pool.connect() and wait up to
// connectionTimeoutMillis (10 s) before failing — which makes exhaustion worse
// because each waiting request holds an HTTP connection open and a JS closure
// in memory. A clean 503 sent here lets clients retry immediately and prevents
// the cascade that turns a momentary traffic spike into a 7-hour outage.
//
// Threshold: total >= POOL_MAX AND idle === 0 AND waiting >= 2.
// "waiting >= 2" (not 1) avoids false positives from a single in-flight probe.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api/")) return next();
  const stats = getPoolStats();
  if (stats.total >= POOL_MAX && stats.idle === 0 && stats.waiting >= 2) {
    logger.warn({ pool: stats, url: req.url, method: req.method }, "pool-pressure-guard: 503");
    res.status(503).json({
      error: "Service temporarily unavailable. Please retry in a moment.",
      retryAfter: 5,
    });
    return;
  }
  next();
});

app.use("/api", router);
app.use(webSsrRouter);
app.use(privacyRouter);

// Serve the web app static files from whichever dir has index.html
app.use(express.static(spaServeDir));

// SPA fallback handler — reused for explicit routes and catch-all.
// spaHtml is always a non-empty string: either a file-system read or the
// HTML embedded in the bundle by build.mjs. Guard against empty string.
const serveSpa = (_req: Request, res: Response, next: NextFunction): void => {
  const html = spaHtml && spaHtml.length > 100 ? spaHtml : BUNDLED_SPA_HTML;
  if (html && html.length > 100) {
    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } else {
    next();
  }
};

// Explicit routes for common SPA paths registered BEFORE the catch-all —
// belt-and-suspenders in case the wildcard doesn't fire in this Express 5 build.
const SPA_EXPLICIT = [
  "/login", "/signup", "/admin", "/forgot-password", "/reset-password",
  "/membership", "/map", "/discover", "/community", "/profile",
  "/settings", "/onboarding", "/business", "/privacy-policy", "/about",
];
for (const p of SPA_EXPLICIT) {
  app.get(p, serveSpa);
  app.get(`${p}/*path`, serveSpa);
}

// JSON 404 for unknown /api/* routes — must come before the SPA catch-all
app.use("/api/*path", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Catch-all: any remaining non-API route serves the SPA
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api/")) return next();
  serveSpa(req, res, next);
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = (err as any)?.message ?? "Internal server error";

  // Pool connection timeout → 503 so clients get a bounded error rather than
  // an indefinite spinner. This fires when connectionTimeoutMillis expires
  // (pool is saturated) or when a route explicitly passes the error to next().
  if (isPoolTimeoutError(err)) {
    logger.warn({ url: req.url, method: req.method, pool: getPoolStats() }, "db-pool connection timeout — 503");
    res.status(503).json({ error: "Service temporarily unavailable. Please try again in a moment." });
    return;
  }

  const statusCode = (err as any)?.status ?? (err as any)?.statusCode ?? 500;
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(statusCode).json({ error: message });
});

function isPoolTimeoutError(err: unknown): boolean {
  const msg = ((err as Error)?.message ?? "").toLowerCase();
  return (
    msg.includes("timeout exceeded when trying to connect") ||
    msg.includes("connection timeout") ||
    msg.includes("acquire timeout")
  );
}

export default app;
