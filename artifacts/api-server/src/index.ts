import app from "./app";
import { logger } from "./lib/logger";
import { setDbLogger } from "@workspace/db";
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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  initStripe().catch((err) => logger.error({ err }, "Background Stripe init failed"));

  startNudgeCronScheduler();
});
