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
import { authLimiter, generalLimiter } from "./middleware/rateLimiter";
import { cityRequestMiddleware } from "./lib/cityRequestTracker";
import { pool, getPoolStats, POOL_MAX } from "@workspace/db";
import { getHealthHistory } from "./lib/healthMonitor";
import { registerLivingLibraryRoutes } from "./library/registerLivingLibraryRoutes";
import { registerFoundationTopicRoutes } from "./library/registerFoundationTopicRoutes";
import { FoundationTopicRepository } from "./library/foundationTopicRepository";
import { createPostgresLibraryRepository } from "./library/postgresLibraryRepository";
import { createTavilyResearchProvider } from "./library/tavilyResearchProvider";
import { createOpenAiLibraryWriter } from "./library/openAiLibraryWriter";
import { registerExploreRoutes } from "./explore/registerExploreRoutes";
import {
  createPostgresLocalContextRepository,
  createPostgresMemberContextRepository,
  createPostgresProfessionalDirectoryRepository,
  createPostgresCapabilityTurnStore,
} from "./kinfolk/capabilities/postgresCapabilityStores";
import { registerKinfolkCapabilityRoutes } from "./kinfolk/capabilities/registerCapabilityRoutes";
import { registerKinfolkToneRoute } from "./profile/registerKinfolkToneRoute";
import { registerHairCareRoutes } from "./kinfolk/hairCare/registerHairCareRoutes";
import { createPostgresHairCareRepository, createPostgresMemberLocationRepository } from "./kinfolk/hairCare/postgresHairCareRepository";
import { registerVoiceTranscriptionRoute } from "./kinfolk/voice/registerVoiceTranscriptionRoute";
import { createOpenAiTranscriptionProvider } from "./kinfolk/voice/openAiTranscriptionProvider";
import { createPostgresVoiceDiagnostics } from "./kinfolk/voice/postgresVoiceDiagnostics";
import { registerReleaseStatusRoutes } from "./ops/registerReleaseStatusRoutes";
import { CommunityVibesRepository } from "./communityVibes/communityVibesRepository";
import { registerCommunityVibesRoutes } from "./communityVibes/registerCommunityVibesRoutes";
import { registerLocationResolutionRoutes } from "./location/registerLocationResolutionRoutes";
import { LocalBusinessSearch } from "./map/localBusinessSearch";
import { registerLocalBusinessSearchRoute } from "./map/registerLocalBusinessSearchRoute";
import { registerUniversalMapEntityRoutes } from "./map/registerUniversalMapEntityRoutes";
import {
  requestCorrelationLogging,
  structuredErrorHandler,
} from "./ops/structuredProductionLogging";
import { registerLocationFirstDiscoveryRoutes } from "./discovery/registerLocationFirstDiscoveryRoutes";
import { createPostgresFlywheelRepository } from "./discovery/postgresFlywheelRepository";
import { findExactRecords, findNearestAvailableLocation } from "./discovery/postgresLocationFirstRepository";
import { registerSubmissionRoutes } from "./businessIntake/registerSubmissionRoutes";
import { registerMediaRoutes } from "./media/registerMediaRoutes";
import { registerAdminPublishAndClaimRoutes } from "./businesses/registerAdminPublishAndClaimRoutes";

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
// Also verifies the web bundle is present and non-empty (#103).
app.get("/api/healthz", (_req: Request, res: Response) => {
  const bundleOk = spaHtml && spaHtml.length > 500;
  if (!bundleOk) {
    res.status(503).json({ status: "degraded", detail: "Web bundle missing or empty — deploy may be corrupt" });
    return;
  }
  res.json({ status: "ok", bundleBytes: spaHtml.length });
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
      pool: { ...preStats, max: POOL_MAX },
      detail: `Pool at capacity (total=${preStats.total}/${POOL_MAX}, idle=0, waiting=${preStats.waiting}); not queuing probe.`,
    });
    return;
  }
  // ── SAFE PATTERN: pool.query() — auto-releases the connection ───────────────
  // Switched from pool.connect()+safeRelease to pool.query() (July 29 2026).
  // pool.query() returns the connection to the pool automatically on every
  // code path (success, error, timeout) — no forceTimer, no safeRelease, no
  // possibility of a missed client.release().  The server-side statement_timeout
  // (set on every connection via the pool config) kills hung queries after 10 s
  // without any client-side guard needed.
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok", pool: { ...getPoolStats(), max: POOL_MAX } });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "unknown error";
    res.status(503).json({ status: "degraded", db: "error", pool: { ...getPoolStats(), max: POOL_MAX }, detail });
  }
});

// 12-hour health history — evidence ring buffer for operational review.
// Returns results since last process startup.
app.get("/api/readyz/history", (_req: Request, res: Response) => {
  res.json(getHealthHistory());
});

// ── Build identity: auto-generated TypeScript module bundled by esbuild ──────
// build.mjs generates src/generated/buildIdentity.ts before esbuild runs,
// so BUILT_FROM_SHA and BUILD_AT are compiled into dist/index.mjs as bundled
// TypeScript exports — not env vars, not file reads, not esbuild define.
// This is the same pattern as spaHtml.ts and cannot be bypassed by Railway
// using a committed dist/ instead of rebuilding from source.
import { BUILT_FROM_SHA, BUILD_AT } from "./generated/buildIdentity";

// Version / build identity — used to confirm Railway is running the expected artifact.
// Returns only public build metadata; never exposes secrets, paths, or config.
//
// Provenance verification (three independent proof points):
//   1. built_from_sha — compiled into the bundle from src/generated/buildIdentity.ts;
//      cannot be faked by changing an env var after the build.
//   2. bundle_sha256_self — the process hashes ITS OWN entry bundle at startup
//      (process.argv[1]) with no env-var or sidecar-file dependency. This is the
//      value that can never be "not-embedded": if the process runs, it hashes.
//   3. bundle_sha256 — the hash recorded by build.mjs in dist/BUILD_IDENTITY and
//      passed through static-server.mjs. When present it must equal
//      bundle_sha256_self; a mismatch means the artifact on disk was swapped
//      after the build wrote its identity.
//   stale_bundle — true when built_from_sha and railway_sha are both known and
//   differ: Railway deployed a newer commit but the compiled code is older.
//   This single boolean is the one-probe stale-deployment detector.
import { createHash } from "node:crypto";
const BUNDLE_SHA256_SELF: string = (() => {
  try {
    const entry = process.argv[1];
    if (!entry) return "unknown-entry";
    return createHash("sha256").update(readFileSync(entry)).digest("hex");
  } catch (e) {
    return `unhashable:${(e as Error).message.slice(0, 40)}`;
  }
})();

app.get("/api/version", (_req: Request, res: Response) => {
  const railwaySha = process.env.RAILWAY_GIT_COMMIT_SHA ?? "dev";
  // Widen the generated literal type — buildIdentity.ts exports a string
  // literal whose value changes every build; comparisons must be string-wide.
  const builtFromSha: string = BUILT_FROM_SHA;
  // stale_bundle: true means the binary on disk doesn't match what build.mjs
  // recorded at compile time — i.e. someone swapped the file after the build.
  // This is the real safety signal: SHA-version gap (built_from_sha vs
  // railway_sha) is architectural and always present by design; the hash match
  // is the proof that the correct binary is actually running.
  const recordedBundleSha = process.env.BUILD_BUNDLE_SHA256 || "not-embedded";
  const stale = recordedBundleSha !== "not-embedded" && BUNDLE_SHA256_SELF !== recordedBundleSha;
  res.json({
    // runtime Railway env var — set at deploy-trigger time, reflects the git tip
    railway_sha: railwaySha,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? "dev",
    release: "Build-98.2",
    env: process.env.NODE_ENV ?? "unknown",
    // compile-time values — bundled TypeScript exports generated by build.mjs
    built_from_sha: BUILT_FROM_SHA,
    built_at: BUILD_AT,
    // proof-of-compile fingerprint — always 64-char hex, never "not-embedded"
    bundle_sha256_self: BUNDLE_SHA256_SELF,
    // recorded by build.mjs, relayed by static-server.mjs; must match _self
    bundle_sha256: process.env.BUILD_BUNDLE_SHA256 || "not-embedded",
    // one-probe stale-deployment detector
    stale_bundle: stale,
  });
});

app.use(
  pinoHttp({
    logger,
    // Suppress successful 2xx/3xx request logs in production — only errors and
    // warnings matter in Railway's log viewer. This removes the "request completed"
    // noise that was burying real errors.
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return process.env.NODE_ENV === "production" ? "silent" : "info";
    },
    // Guarantee a non-empty msg field so Railway never shows a blank [err]/[wrn] line.
    customErrorMessage: (req, _res, err) =>
      `${(req as any).method} ${String((req as any).url ?? "").split("?")[0]} — ${err?.message ?? "request error"}`,
    customSuccessMessage: (req, res) =>
      `${(req as any).method} ${String((req as any).url ?? "").split("?")[0]} ${res.statusCode}`,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          // Include route path so errors are traceable without a stack trace.
          route: (req as any).route?.path ?? undefined,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
      err(err) {
        // Supplement the logger-level err serializer with status code so
        // HTTP errors (e.g. 400 validation failures) are distinguishable
        // from 500 infrastructure errors in Railway log queries.
        if (!err || typeof err !== "object") return err;
        const e = err as Record<string, unknown>;
        return {
          type: (err as any)?.constructor?.name ?? "Error",
          message: e.message,
          status: e.status ?? e.statusCode,
          stack: typeof e.stack === "string" ? e.stack.slice(0, 600) : undefined,
          code: e.code,
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
// Structured request correlation — attaches x-request-id header to every
// response and logs method + route + statusCode + responseTimeMs on finish.
// Must come before routes so every request gets an ID.
app.use(requestCorrelationLogging(logger));
// City request tracker — runs after body parsing so home_city is available.
// Records per-city request counts, error counts, and timing for health metrics.
app.use(cityRequestMiddleware);
app.use(authMiddleware);
// Authentication remains protected by one IP-based limiter.  The general
// API limiter below is member-keyed after authMiddleware attaches req.user.
app.use("/api/auth", authLimiter);
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

// ── Intake, media, and claim routes (registered BEFORE aggregate router) ──────
// IMPORTANT: These must come before app.use("/api", router) because the aggregate
// router has router.use(requireAuth) at line ~220 of routes/index.ts which returns
// HTTP 401 for any unauthenticated request — including the PUBLIC community
// submission endpoint. Registering here ensures Express matches these routes first.
//
// POST /api/community/business-submissions — public (no auth required)
// GET|POST /api/founder/business-submissions[/:id/decision] — admin only (auth checked in handler)
// POST /api/media/upload — authenticated (auth checked in handler)
// POST /api/admin/businesses — admin only (auth checked in handler)
// POST /api/businesses/:id/claim — authenticated (auth checked in handler)
// POST /api/admin/business-claims/:id/decision — admin only (auth checked in handler)
registerSubmissionRoutes(app);
registerMediaRoutes(app);
registerAdminPublishAndClaimRoutes(app);

// ── Living Library public read routes ──────────────────────────────────────
// Register before the aggregate /api router: its global requireAuth middleware
// would otherwise block the public Library home and topic-book GET requests.
// Follow/research mutations still enforce authentication in their own handlers.
registerLivingLibraryRoutes(app, {
  repository: createPostgresLibraryRepository(pool),
  researchProvider: createTavilyResearchProvider(process.env.TAVILY_API_KEY ?? ""),
  writer: createOpenAiLibraryWriter({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "",
    baseUrl: (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.LIBRARY_RESEARCH_MODEL ?? "gpt-4o-mini",
  }),
});

// 28 durable foundations shown on the public Library home.
registerFoundationTopicRoutes(app, new FoundationTopicRepository(pool));

// ── Universal non-business map entities ─────────────────────────────────────
// Public read-only routes are registered before the aggregate /api router so a
// map pin's list record and canonical detail URL remain directly resolvable.
registerUniversalMapEntityRoutes(app, pool);

app.use("/api", router);
app.use(webSsrRouter);
app.use(privacyRouter);

// ── Purposeful Explore routes ────────────────────────────────────────────────
registerExploreRoutes(app);

// ── Kinfolk capability-turn and consent routes ───────────────────────────────
registerKinfolkCapabilityRoutes(app, {
  localContext: createPostgresLocalContextRepository(pool),
  memberContext: createPostgresMemberContextRepository(pool),
  professionalDirectory: createPostgresProfessionalDirectoryRepository(pool),
  capabilityTurnStore: createPostgresCapabilityTurnStore(pool),
});

// ── Kinfolk tone preference route ────────────────────────────────────────────
registerKinfolkToneRoute(app, pool);

// ── Kinfolk hair-care intelligence routes ────────────────────────────────────
registerHairCareRoutes(app, {
  hairCareRepository: createPostgresHairCareRepository(pool),
  memberLocationRepository: createPostgresMemberLocationRepository(pool),
});

// ── Kinfolk voice transcription route ────────────────────────────────────────
registerVoiceTranscriptionRoute(app, {
  transcriptionProvider: createOpenAiTranscriptionProvider({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "",
    baseUrl: (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.VOICE_TRANSCRIPTION_MODEL ?? "whisper-1",
  }),
  diagnostics: createPostgresVoiceDiagnostics(pool),
});

// ── Location-First Discovery — single endpoint for Map, Businesses, Explore, Events ─
// Replaces independent category-global queries with one typed, location-scoped endpoint.
// Returns exact local records or a coverage gap with next-action options — never
// a silent national fallback.
registerLocationFirstDiscoveryRoutes(
  app,
  createPostgresFlywheelRepository(
    { query: (...args) => pool.query(...args) },
    {
      findExact: (q) => findExactRecords(pool, q),
      findNearestAvailableLocation: (q) => findNearestAvailableLocation(pool, q),
    },
  ),
);

// ── Local business search — scoped map results (≤ 2 within 5 mi, no national fallback) ─
// GET /api/map/local-business-search?q=&lat=&lng=&radius=5&expand=0
// Constrained by Haversine radius server-side; pins == results (no independent source).
registerLocalBusinessSearchRoute(app, new LocalBusinessSearch(pool));

// ── Location resolution — backs LocationSearchBar on Businesses, Explore, Events ──
// GET /api/locations/resolve?q=  — text → nearest community_locations row
// GET /api/locations/reverse?lat=&lng=  — coords → nearest area within 80 km
// Both are public; neither reveals individual user location data.
registerLocationResolutionRoutes(app, pool);

// ── Community Vibes — evidence-backed member signals ─────────────────────────
// Public GET returns aggregate approved vibes (never contributor identity).
// Authenticated POST writes pending evidence; moderation promotes to approved.
registerCommunityVibesRoutes(app, new CommunityVibesRepository(pool));

// ── Release status + schema-status verification endpoints ─────────────────────
registerReleaseStatusRoutes(app, pool);

// ── Legacy cultural-site slug redirect ────────────────────────────────────────
// Before static serving: /cultural-sites/:slug (old-format single-segment URL)
// tries to resolve to the canonical /cultural-sites/:id/:slug.
// UUID segments are passed through to the SPA. Unknown slugs fall through too.
app.get("/cultural-sites/:legacySlug", async (req: Request, res: Response, next: NextFunction) => {
  const seg = req.params["legacySlug"] ?? "";
  // If it looks like a UUID, the SPA handles /cultural-sites/:id or /cultural-sites/:id/:slug
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_RE.test(seg)) { next(); return; }
  try {
    const { rows } = await pool.query<{ id: string; slug: string }>(
      "SELECT id, slug FROM cultural_sites WHERE slug = $1 LIMIT 1",
      [seg],
    );
    if (rows[0]) {
      res.redirect(301, `/cultural-sites/${encodeURIComponent(rows[0].id)}/${encodeURIComponent(rows[0].slug)}`);
      return;
    }
  } catch { /* fall through to SPA */ }
  next();
});

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
  "/cultural-sites", "/hbcus", "/places",
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

// Pool-timeout handler — must come before structuredErrorHandler so that
// 503 responses are returned with the right status before the generic handler fires.
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (isPoolTimeoutError(err)) {
    logger.warn({ url: req.url, method: req.method, pool: getPoolStats() }, "db-pool connection timeout — 503");
    if (!res.headersSent) {
      res.status(503).json({ error: "Service temporarily unavailable. Please try again in a moment." });
    }
    return;
  }
  next(err);
});

// Structured error handler — replaces the old inline handler.
// Logs requestId + method + route + statusCode + serialized error on every
// unhandled exception, and returns a safe JSON error to the client.
// Never leaks stack traces or member data to the response.
app.use(structuredErrorHandler(logger));

function isPoolTimeoutError(err: unknown): boolean {
  const msg = ((err as Error)?.message ?? "").toLowerCase();
  return (
    msg.includes("timeout exceeded when trying to connect") ||
    msg.includes("connection timeout") ||
    msg.includes("acquire timeout")
  );
}

export default app;
