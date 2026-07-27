import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import webSsrRouter from "./routes/web-ssr";
import privacyRouter from "./routes/privacy";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { WebhookHandlers } from "./webhookHandlers";
import { generalLimiter } from "./middleware/rateLimiter";
import { pool, getPoolStats } from "@workspace/db";

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const webPublicDir = path.join(_dirname, "public");

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
  if (preStats.idle === 0 && preStats.total >= 8 && preStats.waiting > 0) {
    res.status(503).json({
      status: "degraded",
      db: "pool_exhausted",
      pool: preStats,
      detail: `Pool at capacity (total=${preStats.total}/8, idle=0, waiting=${preStats.waiting}); not queuing probe.`,
    });
    return;
  }
  try {
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SELECT 1 timed out after 2000ms")), 2000),
      ),
    ]);
    res.json({ status: "ok", db: "ok", pool: getPoolStats() });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "unknown error";
    res.status(503).json({ status: "degraded", db: "error", pool: getPoolStats(), detail });
  }
});

// 12-hour health history — evidence for Part 5 (Apple rejection-prevention review).
// Returns the in-memory ring buffer of all health check results since last startup.
app.get("/api/readyz/history", (_req: Request, res: Response) => {
  const { getHealthHistory } = require("./lib/healthMonitor") as typeof import("./lib/healthMonitor");
  res.json(getHealthHistory());
});
app.get("/api/dl", (_req: Request, res: Response) => {
  res.download(path.join(_dirname, "../dist/index.mjs"), "index.mjs");
});
app.get("/api/dl/review-package", (_req: Request, res: Response) => {
  res.download(
    "/home/runner/workspace/docs/product/releases/MWM_Build97_ReviewPackage.zip",
    "MWM_Build97_ReviewPackage.zip",
    (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: String(err) });
      }
    }
  );
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

app.use("/api", router);
app.use(webSsrRouter);
app.use(privacyRouter);

// Serve the web app static files (built by build.mjs and copied to dist/public/)
app.use(express.static(webPublicDir));
// SPA fallback — any non-API route serves index.html so React Router works
app.get("/{*path}", (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api/")) return next();
  const indexPath = path.join(webPublicDir, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
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
