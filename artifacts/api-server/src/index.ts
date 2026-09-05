import app from "./app";
import { logger } from "./lib/logger";
import { setDbLogger, pool, getPool, getPoolStats, initPoolInstrumentation } from "@workspace/db";
import { getStripeSync, endStripeSyncPool } from "./stripeClient";
import { startHealthMonitor, setMonitorLogger, stopHealthMonitor } from "./lib/healthMonitor";
import { startBuild97Monitor, stopBuild97Monitor } from "./lib/build97Monitor";
import { startNudgeCronScheduler } from "./lib/nudgeScheduler";
import { startCityHealthAlertScheduler } from "./lib/cityHealthAlertScheduler";
import { ensureRequiredPublicationSchema, runStartupMigrations } from "./lib/startup-migrations";
import { assertDirectoryReviewLocalStaging } from "./directoryImport/localStagingGuard";
import { ensureRequiredSafetyReportSchema } from "./safety/ensureSafetyReportSchema";

// Route pool events through the structured pino logger so they appear in
// Railway's log stream in the same JSON format as request logs.
setDbLogger(logger);
import { startCityRequestFlush, stopCityRequestFlush } from "./lib/cityRequestTracker";
import { startLibraryGrowthWorker, stopLibraryGrowthWorker, setGrowthWorkerLogger } from "./lib/library-growth-worker";

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }
  try {
    logger.info("Initializing Stripe schema…");
    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    // Guard: verify stripe.accounts actually exists before using the sync client.
    // stripe-replit-sync migrations sometimes complete without creating the table
    // (e.g. ledger thinks it already ran; table was dropped between deploys).
    // The stripe_accounts_recovery_v1 startup migration creates the table as a
    // fallback, so this check should only fail in edge-case dev environments.
    const { rows: [stripeCheck] } = await pool.query<{ exists: boolean }>(
      `SELECT to_regclass('stripe.accounts') IS NOT NULL AS exists`,
    );
    if (!stripeCheck?.exists) {
      logger.warn("stripe.accounts not present after runMigrations — Stripe sync disabled for this boot");
      return;
    }

    const stripeSync = await getStripeSync();

    const webhookBase = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBase}/api/stripe/webhook`);
    logger.info("Stripe webhook configured");

    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe backfill complete"))
      .catch((err) => logger.error({ err }, "Stripe backfill error"));
  } catch (err) {
    logger.error({ err }, "Stripe init failed");
  }
}

(function checkRequiredConfig() {
  // ── CRITICAL — blocks core functionality or causes crashes ────────────────
  const critical: string[] = [];

  if (!process.env.ADMIN_EMAILS) {
    critical.push("ADMIN_EMAILS — No admin email configured. After your first login, call POST /api/admin/bootstrap to promote yourself. Then set ADMIN_EMAILS=your@email.com for future server restarts.");
  }
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    critical.push("GOOGLE_MAPS_API_KEY — Map embeds and business enrichment will be unavailable.");
  }

  // Apple Sign-In requires four env vars. If any is missing, new Apple
  // registrations return HTTP 500 — an instant App Store rejection.
  const appleVars = ["APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY", "APPLE_TOKEN_ENCRYPTION_KEY"];
  const missingApple = appleVars.filter((v) => !process.env[v]);
  if (missingApple.length > 0) {
    critical.push(`Apple Sign-In INCOMPLETE — missing: ${missingApple.join(", ")}. New Apple registrations will fail with HTTP 500.`);
  }

  if (critical.length > 0) {
    logger.warn("⚠️  Missing critical configuration:");
    for (const w of critical) logger.warn(`   • ${w}`);
  }

  // ── OPTIONAL — degrades specific features, does not break core ────────────
  const optional: string[] = [];
  if (!process.env.RESEND_API_KEY) optional.push("RESEND_API_KEY (emails disabled)");
  if (!process.env.WMATA_API_KEY) optional.push("WMATA_API_KEY (DC transit disabled)");

  if (optional.length > 0) {
    logger.info(`[config] Optional features not configured: ${optional.join(", ")}`);
  }
})();

try {
  await ensureRequiredSafetyReportSchema(pool);
  logger.info("Required safety report schema ready");
} catch (error) {
  logger.fatal({ error }, "Required safety report schema failed — server will not accept traffic");
  await pool.end().catch(() => undefined);
  process.exit(1);
}

try {
  const directoryReviewEnabled = assertDirectoryReviewLocalStaging(process.env);
  if (directoryReviewEnabled && (process.env.DIRECTORY_REVIEW_SIGNING_SECRET?.length ?? 0) < 32) {
    throw new Error("DIRECTORY_REVIEW_SIGNING_SECRET must contain at least 32 characters when directory review is enabled.");
  }
  await ensureRequiredPublicationSchema(
    directoryReviewEnabled,
    logger,
  );
  logger.info("Required publication schema ready before traffic acceptance");
} catch (error) {
  logger.fatal({ error }, "Required publication schema failed — server will not accept traffic");
  await pool.end().catch(() => undefined);
  process.exit(1);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  logger.info({ pool: getPoolStats() }, "server ready — initial pool state");

  // Attach connection lifecycle instrumentation to the pg Pool.
  // Records every connect/remove/query event to a 500-entry ring buffer.
  // Accessible at GET /api/pool-audit (x-cron-secret auth).
  // Emits SLOW_QUERY and POOL_GROWTH_DETECTED warnings to Railway logs.
  initPoolInstrumentation(pool, getPool);

  // Route monitor log events through pino so they appear in Railway's log stream.
  setMonitorLogger(logger);
  setGrowthWorkerLogger((msg, data) => logger.info(data ?? {}, `[library-growth-worker] ${msg}`));
  // 5-minute synthetic DB health checks — maintains 12-hour evidence ring buffer.
  // Results visible at GET /api/readyz/history.
  startHealthMonitor();
  // build97Monitor DISABLED (July 28 2026) — it fired 11 parallel HTTP requests
  // to DB-backed endpoints every 5 minutes, each consuming a pool connection via
  // the shared pg.Pool. Combined with the 2 direct pool.connect() probes and
  // Railway healthchecks, peak demand exceeded POOL_MAX causing recurring P0
  // pool exhaustion. Monitoring is now handled by the external monitoring-service
  // (separate Railway service). Re-enable only after external monitor is deployed.
  // startBuild97Monitor();

  initStripe().catch((err) => logger.error({ err }, "Background Stripe init failed"));

  // Apply optional and backfill migrations after the required request-path
  // schema has already been verified above.
  //
  // startCityHealthAlertScheduler is called inside the resolved callback so the
  // alert_claim_token and alert_lease_expires_at columns are guaranteed present
  // before the first cron tick fires.
  runStartupMigrations(logger)
    .then(() => {
      // startCityHealthAlertScheduler is async: it probes information_schema to
      // confirm the three lease columns actually exist before registering the cron
      // job. This guards against runStartupMigrations resolving despite an
      // individual ADD COLUMN failure (it catches per-migration errors internally).
      startCityHealthAlertScheduler().catch((err) =>
        logger.error({ err }, "City health alert scheduler startup failed"),
      );
    })
    .catch((err) => {
      // Top-level migration runner rejected — lease columns may be absent.
      // Do NOT start the scheduler; it will self-verify and refuse on any column gap.
      logger.error({ err }, "Startup migrations failed — city health alert scheduler NOT started");
    });

  startNudgeCronScheduler();

  // Library Growth Worker — aggregates sanitized Kinfolk signals into
  // curator-reviewed Library candidates every hour. Disabled by LIBRARY_GROWTH_ENABLED=false.
  startLibraryGrowthWorker();

  // Flush per-city request metrics to city_request_log every 5 minutes.
  startCityRequestFlush();
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Railway sends SIGTERM before replacing a deployment. Without this handler,
// in-flight connections are leaked and the next deployment inherits an
// exhausted pool — causing every Drizzle write to timeout for ~10 seconds
// until the new process finally drains.
//
// This handler:
//   1. Stops accepting new connections immediately (server.close)
//   2. Drains the pg connection pool (pool.end) — releases all sockets cleanly
//   3. Exits with code 0 so Railway marks the deployment as cleanly replaced
//
// RAILWAY_DEPLOYMENT_DRAINING_SECONDS=60 gives up to 60 s for in-flight
// requests to finish before the container is killed anyway.
//
// isShuttingDown guard + process.once ensure shutdown runs at most once
// even if SIGTERM is somehow delivered more than once.
let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // Log pool state at the moment shutdown fires — key diagnostic data
  // if this deployment event later shows pool exhaustion in the next process.
  logger.info({ signal, pool: getPoolStats() }, "Received shutdown signal — pool state at drain start");

  // 1. Stop accepting new connections and wait for in-flight requests to finish.
  server.close(async () => {
    logger.info("HTTP server closed. Draining DB pools…");
    stopHealthMonitor();
    stopBuild97Monitor();
    stopCityRequestFlush();
    stopLibraryGrowthWorker();
    try {
      // Drain the app's own pool (max:8) first.
      await pool.end();
      logger.info({ pool: getPoolStats() }, "App DB pool drained.");
      // Drain the StripeSync internal pool (max:2) — previously leaked on every
      // webhook call before the singleton fix.
      await endStripeSyncPool();
      logger.info("StripeSync pool drained. Exiting cleanly.");
    } catch (err) {
      logger.error({ err }, "Error draining DB pools during shutdown");
    }
    process.exit(0);
  });

  // 2. Immediately close idle keep-alive connections so the server.close()
  // callback fires promptly. Does NOT affect active in-flight requests.
  server.closeIdleConnections();

  // 3. Last resort: at T=22s, close any remaining active connections so
  // pool.end() has time to complete before the T=25s force-exit.
  // Requests still open at this point have already had 22s to complete.
  setTimeout(() => {
    logger.warn({ pool: getPoolStats() }, "approaching force-exit deadline — closing remaining active connections");
    server.closeAllConnections();
  }, 22_000);

  // 4. Absolute safety net — force-exit before Railway's SIGKILL at 30s.
  setTimeout(() => {
    logger.warn("Graceful shutdown timed out after 25 s — force exiting");
    process.exit(1);
  }, 25_000).unref();
}

process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.once("SIGINT", () => gracefulShutdown("SIGINT"));
