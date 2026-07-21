import app from "./app";
import { logger } from "./lib/logger";
import { setDbLogger, pool } from "@workspace/db";
import { getStripeSync } from "./stripeClient";
import { startNudgeCronScheduler } from "./lib/nudgeScheduler";

// Route pool events through the structured pino logger so they appear in
// Railway's log stream in the same JSON format as request logs.
setDbLogger(logger);

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
  const warnings: string[] = [];

  if (!process.env.RESEND_API_KEY) {
    warnings.push("RESEND_API_KEY — All transactional emails (trial reminders, membership, welcome) are disabled.");
  }
  if (!process.env.ADMIN_EMAILS) {
    warnings.push("ADMIN_EMAILS — No admin email configured. After your first login, call POST /api/admin/bootstrap to promote yourself. Then set ADMIN_EMAILS=your@email.com for future server restarts.");
  }
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    warnings.push("GOOGLE_MAPS_API_KEY — Map embeds on business profiles will show 'Maps not configured'.");
  }
  if (!process.env.WMATA_API_KEY) {
    warnings.push("WMATA_API_KEY — DC Metro transit data will be unavailable.");
  }

  if (warnings.length > 0) {
    logger.warn("⚠️  Missing environment configuration:");
    for (const w of warnings) {
      logger.warn(`   • ${w}`);
    }
  }
})();

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  initStripe().catch((err) => logger.error({ err }, "Background Stripe init failed"));

  startNudgeCronScheduler();
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

  logger.info({ signal }, "Received shutdown signal — draining…");

  server.close(async () => {
    logger.info("HTTP server closed. Draining DB pool…");
    try {
      await pool.end();
      logger.info("DB pool drained. Exiting cleanly.");
    } catch (err) {
      logger.error({ err }, "Error draining DB pool during shutdown");
    }
    process.exit(0);
  });

  // Safety net: if server.close() takes > 25 s, force-exit so Railway's
  // SIGKILL at 30 s doesn't catch us mid-drain.
  setTimeout(() => {
    logger.warn("Graceful shutdown timed out after 25 s — force exiting");
    process.exit(1);
  }, 25_000).unref();
}

process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.once("SIGINT", () => gracefulShutdown("SIGINT"));
