import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

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

// Startup configuration checks — warn loudly about missing secrets before first request
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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run Stripe init in the background — must not block server startup
  // or the health check will time out before the server starts listening.
  initStripe().catch((err) => logger.error({ err }, "Background Stripe init failed"));
});
