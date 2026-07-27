import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const envSecretKey = process.env.STRIPE_SECRET_KEY;
  const envWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (envSecretKey) {
    return { secretKey: envSecretKey, webhookSecret: envWebhookSecret };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Missing Stripe credentials. Set STRIPE_SECRET_KEY environment variable, " +
      "or connect Stripe via the Integrations tab.",
    );
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!resp.ok) {
    throw new Error(`Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`);
  }

  const data = (await resp.json()) as {
    items?: Array<{ settings?: { secret_key?: string; secret?: string; webhook_secret?: string } }>
  };
  const settings = data.items?.[0]?.settings;
  const secretKey = settings?.secret_key ?? settings?.secret;

  if (!secretKey) {
    throw new Error(
      "Stripe integration not connected or missing secret key. " +
      "Connect Stripe via the Integrations tab first.",
    );
  }

  return {
    secretKey,
    webhookSecret: settings?.webhook_secret,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

// ── StripeSync singleton ──────────────────────────────────────────────────────
//
// ROOT CAUSE FIX (Build 97 — July 27 2026)
// ─────────────────────────────────────────
// stripe-replit-sync creates a new pg.Pool(max:10) in its constructor:
//   this.pool = new pg.Pool(config.poolConfig)   [package/dist/index.js:37]
//
// The prior implementation called `new StripeSync({ poolConfig })` on every
// Stripe webhook event (webhookHandlers.ts:133 called `getStripeSync()`).
// Each call created a new pg.Pool(max:10) against Railway's Postgres that was
// NEVER closed. After 2–3 webhook events the Railway Postgres connection limit
// was exceeded, causing the app's own pool (max:5) to fail on every new
// connection request with a 10-second timeout.
//
// Fix: The StripeSync instance (and its pool) is created once per process.
// The promise is assigned synchronously before any await so concurrent callers
// racing through this function all receive the same promise — no double-init.
//
// Pool size is reduced from the stripe-replit-sync default of 10 to 2.
// Combined live connections: app pool (5) + stripe pool (2) = 7 max.
// ──────────────────────────────────────────────────────────────────────────────

let _stripeSyncPromise: Promise<StripeSync> | null = null;

async function _createStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: {
      connectionString: databaseUrl,
      max: 2,
      idleTimeoutMillis: 30_000,
      keepAlive: true,
    },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}

/**
 * Returns the shared StripeSync instance, creating it on first call.
 * Subsequent calls (including concurrent webhook handlers) return the same
 * promise, so only one pg.Pool is ever created per API process.
 */
export function getStripeSync(): Promise<StripeSync> {
  if (!_stripeSyncPromise) {
    _stripeSyncPromise = _createStripeSync();
  }
  return _stripeSyncPromise;
}

/**
 * Drain the StripeSync internal pg pool on graceful shutdown.
 * Safe to call if StripeSync was never initialized — returns immediately.
 */
export async function endStripeSyncPool(): Promise<void> {
  if (!_stripeSyncPromise) return;
  try {
    const sync = await _stripeSyncPromise;
    const internalPool = (sync as any).pool as import("pg").Pool | undefined;
    if (internalPool && typeof internalPool.end === "function") {
      await internalPool.end();
    }
  } catch {
    // If the sync never initialized cleanly, nothing to drain.
  }
}
