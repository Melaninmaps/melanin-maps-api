import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import webSsrRouter from "./routes/web-ssr";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { WebhookHandlers } from "./webhookHandlers";
import { generalLimiter } from "./middleware/rateLimiter";

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const webPublicDir = path.join(_dirname, "public");

const app: Express = express();

// Trust the proxy in front of us (Replit's reverse proxy sets X-Forwarded-For)
app.set("trust proxy", 1);

// Health check registered BEFORE all middleware so the startup probe
// always gets an immediate 200 — nothing (auth, rate-limit, pino, etc.) can block it.
// Multiple paths to cover different proxy/direct-port health check strategies.
app.get("/api/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
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

// Serve the web app static files (built by build.mjs and copied to dist/public/)
app.use(express.static(webPublicDir));
// SPA fallback — any non-API route serves index.html so React Router works
app.get("*", (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api/")) return next();
  const indexPath = path.join(webPublicDir, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = (err as any)?.status ?? (err as any)?.statusCode ?? 500;
  const message = (err as any)?.message ?? "Internal server error";
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(statusCode).json({ error: message });
});

export default app;
